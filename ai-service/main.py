# ai-service/main.py
import os
import httpx
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from models.price_predictor import PricePredictor
from models.area_analyzer   import AreaAnalyzer

app = FastAPI(title="EstateVision Service", version="1.0.0", docs_url="/docs")

app.add_middleware(CORSMiddleware,
  allow_origins=[os.getenv("ALLOWED_ORIGIN", "*")],
  allow_methods=["*"], allow_headers=["*"])

predictor = PricePredictor()  # Loads pre-trained models on startup
analyzer  = AreaAnalyzer()

# ── Schemas ───────────────────────────────────────────────────
class PriceInput(BaseModel):
    city:           str
    area:           str
    area_sqft:      float = Field(gt=0, le=100000)
    bedrooms:       int   = Field(ge=0, le=20)
    bathrooms:      int   = Field(ge=1)
    property_type:  str
    furnishing:     str
    age_years:      Optional[int] = 0
    floor:          Optional[int] = 0
    parking:        Optional[bool] = False
    amenities:      Optional[List[str]] = []

class ROIInput(BaseModel):
    purchase_price:       float = Field(gt=0)
    monthly_rent:         float = Field(gt=0)
    maintenance_monthly:  float = Field(ge=0)
    property_tax_annual:  float = Field(ge=0)
    appreciation_rate:    float = Field(ge=0, le=100)
    vacancy_rate:         Optional[float] = 5.0
    loan_amount:          Optional[float] = 0
    interest_rate:        Optional[float] = 8.5
    loan_tenure_years:    Optional[int]   = 20

class AdviceInput(BaseModel):
    title:           str
    city:            str
    area:            str
    rent_amount:     float = Field(gt=0)
    deposit_amount:  float = Field(ge=0)
    area_sqft:       float = Field(gt=0)
    bedrooms:        int   = Field(ge=0)
    bathrooms:       int   = Field(ge=1)
    property_type:   str
    description:     Optional[str] = ""

# ── Price Prediction ──────────────────────────────────────────
@app.post("/predict/price")
async def predict_price(data: PriceInput):
    try:
        result = predictor.predict(data.dict())
        return {
            "predicted_price":  result["price"],
            "confidence_score": result["confidence"],
            "price_range": {
                "min": round(result["price"] * 0.90),
                "max": round(result["price"] * 1.10),
            },
            "market_comparison": {
                "area_average":    result["area_avg"],
                "city_average":    result["city_avg"],
                "percentile":      result["percentile"],
                "vs_area_percent": round(((result["price"] - result["area_avg"]) / result["area_avg"]) * 100, 1),
            },
            "top_factors": result["feature_importance"],
            "model_used":  result["model"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── ROI Calculator ────────────────────────────────────────────
@app.post("/calculate/roi")
async def calculate_roi(data: ROIInput):
    annual_rent   = data.monthly_rent * 12
    vacancy_loss  = annual_rent * (data.vacancy_rate / 100)
    effective_rent = annual_rent - vacancy_loss

    annual_expenses = (data.maintenance_monthly * 12) + data.property_tax_annual

    # EMI calculation (reducing balance)
    emi = 0.0
    if data.loan_amount > 0 and data.interest_rate > 0:
        r = (data.interest_rate / 100) / 12
        n = data.loan_tenure_years * 12
        emi = data.loan_amount * r * (1 + r)**n / ((1 + r)**n - 1)

    annual_emi  = emi * 12
    net_profit  = effective_rent - annual_expenses - annual_emi
    gross_yield = (annual_rent / data.purchase_price) * 100
    net_yield   = (net_profit / data.purchase_price) * 100
    break_even  = data.purchase_price / net_profit if net_profit > 0 else 999

    # 10-year projection
    projection = []
    cumulative_rent = 0
    for y in range(1, 11):
        prop_value = data.purchase_price * (1 + data.appreciation_rate / 100) ** y
        cumulative_rent += effective_rent - annual_expenses
        total_equity = (prop_value - data.loan_amount) if data.loan_amount > 0 else prop_value
        projection.append({
            "year":              y,
            "property_value":    round(prop_value),
            "cumulative_rent":   round(cumulative_rent),
            "total_wealth":      round(total_equity + cumulative_rent),
        })

    # Investment grade scoring (0-100)
    score = min(100, max(0,
        (net_yield * 7) +
        (max(0, 10 - break_even) * 2) +
        (data.appreciation_rate * 3) +
        (20 if data.vacancy_rate < 5 else 0)
    ))

    grade = "A+" if score>=90 else "A" if score>=80 else "B+" if score>=70 else "B" if score>=60 else "C+" if score>=50 else "C" if score>=40 else "D"

    recommendations = {
        "A+": "Exceptional investment — strong cash flow + high appreciation potential",
        "A":  "Excellent investment — above-market returns",
        "B+": "Good investment — solid fundamentals",
        "B":  "Moderate investment — meets inflation + some upside",
        "C+": "Below average — consider negotiating price or finding higher-rent tenant",
        "C":  "Marginal — only viable with significant appreciation",
        "D":  "Not recommended at current purchase price",
    }

    return {
        "annual_gross_rent":    round(annual_rent),
        "effective_rent":       round(effective_rent),
        "annual_expenses":      round(annual_expenses),
        "annual_emi":           round(annual_emi),
        "net_annual_profit":    round(net_profit),
        "monthly_cashflow":     round((net_profit) / 12),
        "gross_yield_percent":  round(gross_yield, 2),
        "net_yield_percent":    round(net_yield, 2),
        "break_even_years":     round(break_even, 1),
        "investment_score":     round(score, 1),
        "grade":                grade,
        "recommendation":       recommendations[grade],
        "ten_year_projection":  projection,
    }

# ── Area Trend Analysis ───────────────────────────────────────
@app.get("/analyze/area")
async def analyze_area(city: str, area: str):
    result = analyzer.analyze(city, area)
    return result

# ── NVIDIA AI Advisor ─────────────────────────────────────────
@app.post("/generate/advice")
async def generate_advice(data: AdviceInput):
    nvidia_api_key = os.getenv("NVIDIA_API_KEY")
    
    # Prompt construction
    prompt = (
        f"Analyze the following Indian real estate property and provide a professional, structured investment advice report in clean markdown format.\n\n"
        f"Property Details:\n"
        f"- Title: {data.title}\n"
        f"- Location: {data.area}, {data.city}\n"
        f"- Size: {data.area_sqft} Sqft\n"
        f"- Configuration: {data.bedrooms} BHK, {data.bathrooms} Bathrooms\n"
        f"- Type: {data.property_type}\n"
        f"- Monthly Rent: ₹{data.rent_amount:,.2f}\n"
        f"- Security Deposit: ₹{data.deposit_amount:,.2f}\n"
        f"- Description: {data.description}\n\n"
        f"Your response should be in markdown and include:\n"
        f"1. **Executive Summary**: A brief verdict on this property.\n"
        f"2. **Market Value & Rent Analysis**: Estimate if the rent is fair for a {data.area_sqft} sqft property in {data.area}.\n"
        f"3. **Investment Potential**: ROI insights and yield prospects.\n"
        f"4. **Pros & Cons**: 3 key strengths and 3 potential risks or drawbacks.\n"
        f"5. **Strategic Advice**: Recommendations for landlords (optimizing rent, tenancy term) or tenants.\n"
        f"Use clean, professional formatting with emojis, bullet points, and sections."
    )
    
    if not nvidia_api_key:
        # Graceful mock fallback if API key is not configured
        mock_response = (
            f"### 📋 NVIDIA AI Investment Analysis: {data.title}\n\n"
            f"> **Status**: *[Demo Mode]* To connect this analysis to a live model, please set the `NVIDIA_API_KEY` environment variable.\n\n"
            f"#### 1. Executive Summary\n"
            f"The property located in **{data.area}, {data.city}** is a highly desirable {data.bedrooms} BHK {data.property_type}. At a monthly rent of **₹{data.rent_amount:,.2f}**, it represents a standard market-rate opportunity with a rental yield of approximately **{((data.rent_amount * 12) / (data.rent_amount * 250)) * 100:.2f}%** based on standard acquisition rules of thumb.\n\n"
            f"#### 2. Market Value & Rent Analysis\n"
            f"- **Estimated Rent per Sqft**: ₹{data.rent_amount / data.area_sqft:.2f}/sqft. This aligns closely with average rates in the {data.area} micro-market.\n"
            f"- **Deposit Multiplier**: {data.deposit_amount / data.rent_amount:.1f}x monthly rent. This is within the standard 2-6x range for {data.city}.\n\n"
            f"#### 3. Investment Potential\n"
            f"- **Rental Yield**: Strong stable cash flow. The configuration ({data.bedrooms} BHK) is highly sought after by young professionals and families.\n"
            f"- **Capital Appreciation**: {data.area} is experiencing a robust 6-8% annual appreciation due to upcoming infrastructure developments.\n\n"
            f"#### 4. Pros & Cons\n"
            f"**Pros:**\n"
            f"* 🏢 **Optimal Layout**: Balanced {data.bedrooms} BHK configuration maximizes target tenant pool.\n"
            f"* 📍 **High-Demand Location**: {data.area} is a prime micro-market in {data.city}.\n"
            f"* 💰 **Fair Deposit**: Deposit terms are competitive and reasonable.\n\n"
            f"**Cons:**\n"
            f"* 🚗 **Potential Parking Issues**: Common in high-density areas of {data.area}.\n"
            f"* 🛠️ **Maintenance Charges**: Need to verify if the maintenance fees are inclusive or exclusive of the monthly rent.\n"
            f"* 📈 **High Competition**: Many similar units are available in the vicinity.\n\n"
            f"#### 5. Strategic Advice\n"
            f"* **For Owners**: Focus on long-term corporate leases (12-24 months) to minimize vacancy risk.\n"
            f"* **For Tenants**: Negotiate to check if the maintenance and club house amenities are covered within the current rent."
        )
        return {"advice": mock_response, "model": "Mock-NVIDIA-Llama-3.1-70b (Fallback)"}
        
    try:
        headers = {
            "Authorization": f"Bearer {nvidia_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "meta/llama-3.1-70b-instruct",
            "messages": [
                {"role": "system", "content": "You are a professional real estate investment analyst specializing in the Indian property market. Provide highly detailed, structured, and insightful real estate advice in Markdown format."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1024
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"NVIDIA API Error: {response.text}")
                
            result = response.json()
            advice_content = result["choices"][0]["message"]["content"]
            return {"advice": advice_content, "model": "NVIDIA Llama 3.1 70B Instruct"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate advice from NVIDIA API: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "Welcome to EstateVision AI Service.",
        "documentation": "/docs",
        "status": "healthy"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "EstateVision"}
