from __future__ import annotations

from datetime import datetime
from typing import Literal, List, Optional

from pydantic import BaseModel


class ExternalData(BaseModel):
    temperature: float
    windspeed: float
    winddirection: float
    weathercode: int


class SolarForecast(BaseModel):
    irradiance_kwh_m2: float  # daily global horizontal irradiance
    expected_production_kwh: float


class SolarPoint(BaseModel):
    hour: int  # hours from now
    energy_kwh: float


class SolarForecastSeries(BaseModel):
    points: List[SolarPoint]


class GridRate(BaseModel):
    price_per_kwh: float
    currency: str = "USD"


class PricePoint(BaseModel):
    hour: int  # hours from now
    price_per_kwh: float
    label: Literal["off-peak", "shoulder", "peak"] = "off-peak"
    currency: str = "USD"


class PriceForecast(BaseModel):
    points: List[PricePoint]


class DecisionResult(BaseModel):
    source: Literal["solar", "grid", "mixed", "wait"]
    daily_need_kwh: float
    solar_output_kwh: float
    grid_rate: float
    feed_in_tariff: float
    net_cost: float
    summary: str


class BatteryState(BaseModel):
    capacity_kwh: float
    soc_kwh: float
    max_charge_kw: float
    max_discharge_kw: float


class PlanStep(BaseModel):
    hour: int
    grid_price: float
    solar_used_kwh: float
    grid_used_kwh: float
    home_used_kwh: float
    exported_kwh: float
    ev_soc_kwh: float
    home_soc_kwh: Optional[float] = None
    action: str
    note: str


class DecisionOutcome(BaseModel):
    recommendation: str
    net_cost: float
    total_grid_kwh: float
    total_solar_used_kwh: float
    total_export_kwh: float
    savings_vs_all_grid: float
    steps: List[PlanStep]
    explanation: str
