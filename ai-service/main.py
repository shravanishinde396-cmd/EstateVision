# ai-service/main.py
import os
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
