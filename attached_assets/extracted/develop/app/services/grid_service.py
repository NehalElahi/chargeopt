from __future__ import annotations

import httpx
from typing import Optional, List

from app.config import settings
from app.models.schemas import GridRate, PriceForecast, PricePoint


class GridService:
    """
    Fetches local grid pricing. Falls back to DEFAULT_GRID_RATE when API is unavailable.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or settings.GRID_API_BASE_URL
        self.api_key = api_key or settings.GRID_API_KEY

    async def get_rate(
        self, latitude: float, longitude: float, use_mock: bool = False
    ) -> GridRate:
        if use_mock or not self.base_url:
            return GridRate(price_per_kwh=settings.DEFAULT_GRID_RATE)

        params = {
            "lat": latitude,
            "lon": longitude,
            "api_key": self.api_key,
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(self.base_url, params=params)

        response.raise_for_status()
        data = response.json()

        # Expect a "price_per_kwh" field in dollars. Adjust to your provider shape.
        price = float(data.get("price_per_kwh") or data.get("price") or 0)
        if price <= 0:
            price = settings.DEFAULT_GRID_RATE

        return GridRate(price_per_kwh=price, currency=data.get("currency", "USD"))

    async def get_price_forecast(
        self,
        latitude: float,
        longitude: float,
        horizon_hours: int = 24,
        use_mock: bool = False,
    ) -> PriceForecast:
        if use_mock or not self.base_url:
            points: List[PricePoint] = []
            for h in range(horizon_hours):
                hour_of_day = h % 24
                if 16 <= hour_of_day <= 21:
                    price = 0.40
                    label = "peak"
                elif 7 <= hour_of_day < 16 or 21 < hour_of_day <= 23:
                    price = 0.22
                    label = "shoulder"
                else:
                    price = 0.12
                    label = "off-peak"
                points.append(
                    PricePoint(hour=h, price_per_kwh=price, label=label, currency="USD")
                )
            return PriceForecast(points=points)

        # If the real API supports forecasting, adjust below. For now, fall back to a flat rate from get_rate.
        base = await self.get_rate(latitude=latitude, longitude=longitude, use_mock=False)
        points = [
            PricePoint(hour=h, price_per_kwh=base.price_per_kwh, label="shoulder", currency=base.currency)
            for h in range(horizon_hours)
        ]
        return PriceForecast(points=points)
