from __future__ import annotations

import math
from datetime import datetime
from typing import Optional, List

from app.models.schemas import (
    PriceForecast,
    SolarForecastSeries,
    BatteryState,
    PlanStep,
    DecisionOutcome,
)


class DecisionEngine:
    """
    Deterministic, explainable planner that weighs hourly solar and grid prices,
    EV/home battery constraints, and a target deadline.
    """

    def __init__(self, feed_in_tariff: float, export_allowed: bool = True):
        self.feed_in_tariff = feed_in_tariff
        self.export_allowed = export_allowed

    def _future_prices(self, prices: List[float], start: int) -> List[float]:
        return prices[start:] if start < len(prices) else []

    def plan(
        self,
        now: datetime,
        price_forecast: PriceForecast,
        solar_forecast: SolarForecastSeries,
        ev_battery: BatteryState,
        target_soc: float,
        deadline_hours: int,
        home_battery: Optional[BatteryState] = None,
    ) -> DecisionOutcome:
        price_points = price_forecast.points
        solar_points = solar_forecast.points
        horizon = min(deadline_hours, len(price_points))

        ev_target_kwh = ev_battery.capacity_kwh * target_soc
        ev_needed = max(0.0, ev_target_kwh - ev_battery.soc_kwh)
        ev_start_needed = ev_needed

        net_cost = 0.0
        total_grid = 0.0
        total_solar_used = 0.0
        total_export = 0.0
        steps: List[PlanStep] = []

        price_list = [p.price_per_kwh for p in price_points]
        avg_grid_price = sum(price_list[:horizon]) / horizon if horizon else 0.0
        baseline_all_grid = ev_needed * avg_grid_price

        for h in range(horizon):
            price = price_points[min(h, len(price_points) - 1)].price_per_kwh
            solar = solar_points[min(h, len(solar_points) - 1)].energy_kwh
            action_notes: List[str] = []

            # 1) Use solar for EV within charge limit
            solar_to_ev = min(
                solar, ev_needed, ev_battery.max_charge_kw
            )
            if solar_to_ev > 0:
                ev_battery.soc_kwh += solar_to_ev
                ev_needed -= solar_to_ev
                solar -= solar_to_ev
                total_solar_used += solar_to_ev
                action_notes.append(f"Used {solar_to_ev:.2f} kWh solar for EV")

            # 2) Store solar into home battery if future prices are higher
            home_to_store = 0.0
            if home_battery and solar > 0:
                future_prices = self._future_prices(price_list, h)
                future_max = max(future_prices) if future_prices else price
                if future_max > price + 0.05:
                    capacity_left = home_battery.capacity_kwh - home_battery.soc_kwh
                    if capacity_left > 0:
                        home_to_store = min(
                            solar, capacity_left, home_battery.max_charge_kw
                        )
                        home_battery.soc_kwh += home_to_store
                        solar -= home_to_store
                        action_notes.append(
                            f"Stored {home_to_store:.2f} kWh solar in home battery for later high prices"
                        )

            # 3) Export remaining solar
            exported = 0.0
            if self.export_allowed and solar > 0:
                exported = solar
                net_cost -= exported * self.feed_in_tariff
                total_export += exported
                action_notes.append(
                    f"Exported {exported:.2f} kWh at ${self.feed_in_tariff:.2f}/kWh"
                )
                solar = 0.0

            # 4) Use home battery to avoid expensive grid during peaks
            home_to_ev = 0.0
            if home_battery and ev_needed > 0 and home_battery.soc_kwh > 0:
                future_prices = self._future_prices(price_list, h)
                cheapest_future = min(future_prices) if future_prices else price
                if price >= cheapest_future + 0.08 or price >= 0.30:
                    home_to_ev = min(
                        ev_needed, home_battery.soc_kwh, home_battery.max_discharge_kw
                    )
                    home_battery.soc_kwh -= home_to_ev
                    ev_needed -= home_to_ev
                    total_solar_used += home_to_ev
                    action_notes.append(
                        f"Shifted {home_to_ev:.2f} kWh from home battery to EV to avoid high price"
                    )

            # 5) Decide grid charging for this hour
            grid_to_ev = 0.0
            if ev_needed > 0:
                hours_left = max(0, deadline_hours - h - 1)
                required_hours_min = (
                    math.ceil(ev_needed / ev_battery.max_charge_kw)
                    if ev_battery.max_charge_kw > 0
                    else 0
                )
                future_prices = self._future_prices(price_list, h)
                cheapest_future = min(future_prices) if future_prices else price
                should_charge_now = price <= cheapest_future + 0.01 or hours_left < required_hours_min

                if should_charge_now:
                    grid_to_ev = min(ev_needed, ev_battery.max_charge_kw)
                    ev_battery.soc_kwh += grid_to_ev
                    ev_needed -= grid_to_ev
                    cost = grid_to_ev * price
                    net_cost += cost
                    total_grid += grid_to_ev
                    action_notes.append(
                        f"Bought {grid_to_ev:.2f} kWh from grid at ${price:.2f}/kWh"
                    )
                else:
                    action_notes.append("Deferred grid charging awaiting cheaper window")

            steps.append(
                PlanStep(
                    hour=h,
                    grid_price=price,
                    solar_used_kwh=round(solar_to_ev, 3),
                    grid_used_kwh=round(grid_to_ev, 3),
                    home_used_kwh=round(home_to_ev, 3),
                    exported_kwh=round(exported, 3),
                    ev_soc_kwh=round(ev_battery.soc_kwh, 3),
                    home_soc_kwh=round(home_battery.soc_kwh, 3) if home_battery else None,
                    action=", ".join(action_notes) if action_notes else "No action",
                    note=f"Price window: ${price:.2f}/kWh",
                )
            )

            if ev_needed <= 0:
                break

        recommendation = "wait" if ev_needed > 0 else "charge_optimized"
        if ev_needed > 0:
            steps.append(
                PlanStep(
                    hour=horizon,
                    grid_price=price_list[min(horizon - 1, len(price_list) - 1)],
                    solar_used_kwh=0,
                    grid_used_kwh=0,
                    home_used_kwh=0,
                    exported_kwh=0,
                    ev_soc_kwh=round(ev_battery.soc_kwh, 3),
                    home_soc_kwh=round(home_battery.soc_kwh, 3) if home_battery else None,
                    action="Incomplete target",
                    note=f"Still need {ev_needed:.2f} kWh by deadline",
                )
            )

        savings = baseline_all_grid - net_cost
        explanation = (
            f"Target: {ev_target_kwh:.2f} kWh by +{deadline_hours}h. "
            f"Used {total_solar_used:.2f} kWh solar, {total_grid:.2f} kWh grid. "
            f"Exported {total_export:.2f} kWh. "
            f"Savings vs all-grid plan: ${savings:.2f}."
        )

        return DecisionOutcome(
            recommendation=recommendation,
            net_cost=round(net_cost, 2),
            total_grid_kwh=round(total_grid, 2),
            total_solar_used_kwh=round(total_solar_used, 2),
            total_export_kwh=round(total_export, 2),
            savings_vs_all_grid=round(savings, 2),
            steps=steps,
            explanation=explanation,
        )
