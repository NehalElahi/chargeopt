from __future__ import annotations

import math
from typing import Optional, List

import httpx

from app.config import settings
from app.models.schemas import SolarForecast, SolarForecastSeries, SolarPoint


class SolarService:
    """
    Minimal wrapper to fetch daily solar irradiance and estimate production.
    Uses whatever SOLAR_API_BASE_URL points to. Falls back to a heuristic
    average if no API response is available.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or settings.SOLAR_API_BASE_URL
        self.api_key = api_key or settings.SOLAR_API_KEY

    async def get_daily_production(
        self,
        latitude: float,
        longitude: float,
        system_kw: float,
        derate: float | None = None,
        use_mock: bool = False,
    ) -> SolarForecast:
        derate_factor = derate if derate is not None else settings.PANEL_DERATE

        if use_mock or not self.base_url:
            # Quick heuristic: 4.5 kWh/m2/day average U.S. insolation
            irradiance = 4.5
            production = irradiance * system_kw * derate_factor
            return SolarForecast(
                irradiance_kwh_m2=irradiance, expected_production_kwh=production
            )

        params = {
            "lat": latitude,
            "lon": longitude,
            "api_key": self.api_key,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self.base_url, params=params)

        response.raise_for_status()
        data = response.json()

        # Expecting a field named "ghi" (global horizontal irradiance) in kWh/m2/day.
        # Adjust if your chosen API uses a different shape.
        irradiance = float(data.get("ghi") or data.get("daily_ghi") or 0)
        if irradiance <= 0:
            # Fallback heuristic if API is missing data
            irradiance = 4.0

        production = irradiance * system_kw * derate_factor

        return SolarForecast(
            irradiance_kwh_m2=irradiance, expected_production_kwh=production
        )

    async def get_hourly_forecast(
        self,
        latitude: float,
        longitude: float,
        system_kw: float,
        derate: float | None = None,
        horizon_hours: int = 24,
        use_mock: bool = False,
    ) -> SolarForecastSeries:
        """
        Returns an hourly energy forecast (kWh produced each hour) for the next horizon.
        If no API is configured or use_mock=True, generates a smooth bell curve centered at noon.
        """
        derate_factor = derate if derate is not None else settings.PANEL_DERATE

        if use_mock or not self.base_url:
            points: List[SolarPoint] = []
            for h in range(horizon_hours):
                # crude bell curve peaking at hour 12 (noon) with zero at night
                hour_of_day = (h % 24)
                solar_fraction = max(
                    0.0,
                    math.exp(-0.5 * ((hour_of_day - 12) / 3) ** 2) - 0.02
                )
                energy = solar_fraction * system_kw * derate_factor
                points.append(SolarPoint(hour=h, energy_kwh=round(energy, 3)))
            return SolarForecastSeries(points=points)

        # For real API, reuse daily estimate to distribute energy across daylight hours.
        daily = await self.get_daily_production(
            latitude=latitude,
            longitude=longitude,
            system_kw=system_kw,
            derate=derate_factor,
            use_mock=False,
        )
        daylight_hours = 10
        per_hour = daily.expected_production_kwh / daylight_hours
        points = [
            SolarPoint(hour=h, energy_kwh=round(per_hour if 7 <= (h % 24) <= 18 else 0, 3))
            for h in range(horizon_hours)
        ]
        return SolarForecastSeries(points=points)
