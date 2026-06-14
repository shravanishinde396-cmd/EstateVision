class AreaAnalyzer:
    def __init__(self):
        pass

    def analyze(self, city: str, area: str) -> dict:
        city_norm = city.lower()
        area_norm = area.lower()
        
        # Mocks area analytics data based on input
        avg_rent = 25000
        avg_sale = 8500000
        growth_rate = 5.4
        
        if city_norm == "mumbai":
            avg_rent = 65000
            avg_sale = 22000000
            growth_rate = 8.2
        elif city_norm == "bangalore":
            avg_rent = 35000
            avg_sale = 12000000
            growth_rate = 7.5
        elif city_norm == "delhi":
            avg_rent = 40000
            avg_sale = 15000000
            growth_rate = 6.1

        demand_score = 82 if growth_rate > 7 else 65
        supply_score = 55 if growth_rate > 7 else 72
        
        return {
            "city": city,
            "area": area,
            "avg_rent_price": avg_rent,
            "avg_sale_price": avg_sale,
            "growth_rate_percentage": growth_rate,
            "demand_score": demand_score,
            "supply_score": supply_score,
            "investment_score": round((demand_score * 0.6) + (growth_rate * 4)),
            "infrastructure_score": 78,
            "occupancy_rate": 92.5,
            "historical_trends": [
                {"year": 2021, "avg_rent": round(avg_rent * 0.82), "avg_sale": round(avg_sale * 0.80)},
                {"year": 2022, "avg_rent": round(avg_rent * 0.88), "avg_sale": round(avg_sale * 0.87)},
                {"year": 2023, "avg_rent": round(avg_rent * 0.94), "avg_sale": round(avg_sale * 0.93)},
                {"year": 2024, "avg_rent": avg_rent, "avg_sale": avg_sale},
            ]
        }
