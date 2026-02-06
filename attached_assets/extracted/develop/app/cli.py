import argparse
import asyncio
from datetime import datetime

from app.services.solar_service import SolarService
from app.services.grid_service import GridService
from app.services.decision_engine import DecisionEngine
from app.models.schemas import BatteryState
from app.config import settings


async def run(args):
    solar_service = SolarService()
    grid_service = GridService()
    decision_engine = DecisionEngine(
        feed_in_tariff=settings.FEED_IN_TARIFF, export_allowed=not args.no_export
    )

    solar_forecast = await solar_service.get_hourly_forecast(
        latitude=args.lat,
        longitude=args.lon,
        system_kw=args.system_kw,
        derate=args.derate,
        horizon_hours=args.deadline_hours,
        use_mock=args.mock,
    )

    price_forecast = await grid_service.get_price_forecast(
        latitude=args.lat,
        longitude=args.lon,
        horizon_hours=args.deadline_hours,
        use_mock=args.mock,
    )

    ev_battery = BatteryState(
        capacity_kwh=args.ev_capacity,
        soc_kwh=args.ev_soc,
        max_charge_kw=args.ev_charge_kw,
        max_discharge_kw=args.ev_charge_kw,
    )

    home_battery = (
        BatteryState(
            capacity_kwh=args.home_capacity,
            soc_kwh=args.home_soc,
            max_charge_kw=args.home_charge_kw,
            max_discharge_kw=args.home_discharge_kw,
        )
        if args.home_capacity > 0
        else None
    )

    decision = decision_engine.plan(
        now=datetime.utcnow(),
        price_forecast=price_forecast,
        solar_forecast=solar_forecast,
        ev_battery=ev_battery,
        target_soc=args.target_soc,
        deadline_hours=args.deadline_hours,
        home_battery=home_battery,
    )

    print("--- EV Charge Optimizer (Time-of-Use) ---")
    print(f"Location: ({args.lat}, {args.lon})  Horizon: {args.deadline_hours}h")
    print(
        f"EV: {args.ev_soc:.2f} -> {args.target_soc*100:.0f}% of {args.ev_capacity} kWh by deadline; "
        f"charge limit {args.ev_charge_kw} kW"
    )
    if home_battery:
        print(
            f"Home battery: {args.home_soc}/{args.home_capacity} kWh; "
            f"limits {args.home_charge_kw}/{args.home_discharge_kw} kW"
        )
    print(f"Feed-in tariff: ${settings.FEED_IN_TARIFF:.2f}/kWh  Export allowed: {not args.no_export}")
    print()
    print(f"Recommendation: {decision.recommendation}")
    print(f"Net cost (negative = profit): ${decision.net_cost:.2f}")
    print(f"Savings vs all-grid baseline: ${decision.savings_vs_all_grid:.2f}")
    print(decision.explanation)
    print("\nKey steps:")
    for step in decision.steps[: min(8, len(decision.steps))]:
        print(
            f"+ t+{step.hour}h | price ${step.grid_price:.2f} | "
            f"grid {step.grid_used_kwh:.2f} kWh | solar {step.solar_used_kwh:.2f} kWh | "
            f"export {step.exported_kwh:.2f} kWh | action: {step.action}"
        )
    if len(decision.steps) > 8:
        print("... (truncated) ...")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Decide whether to charge from solar or the grid."
    )
    parser.add_argument("--lat", type=float, required=True, help="Latitude")
    parser.add_argument("--lon", type=float, required=True, help="Longitude")
    parser.add_argument(
        "--system-kw",
        type=float,
        default=6.0,
        help="PV system size in kW (DC nameplate)",
    )
    parser.add_argument(
        "--derate",
        type=float,
        default=settings.PANEL_DERATE,
        help="Overall system derate factor (0-1)",
    )
    parser.add_argument(
        "--deadline-hours",
        type=int,
        default=12,
        help="Hours from now by which target SoC must be reached",
    )
    parser.add_argument(
        "--ev-capacity", type=float, default=60.0, help="EV battery capacity (kWh)"
    )
    parser.add_argument(
        "--ev-soc",
        type=float,
        default=20.0,
        help="Current EV energy (kWh)",
    )
    parser.add_argument(
        "--target-soc",
        type=float,
        default=0.8,
        help="Target state-of-charge as fraction (0-1)",
    )
    parser.add_argument(
        "--ev-charge-kw",
        type=float,
        default=7.2,
        help="Max EV charge rate (kW)",
    )
    parser.add_argument(
        "--home-capacity",
        type=float,
        default=0.0,
        help="Home battery capacity (kWh). 0 to disable.",
    )
    parser.add_argument(
        "--home-soc", type=float, default=0.0, help="Home battery current energy (kWh)"
    )
    parser.add_argument(
        "--home-charge-kw",
        type=float,
        default=3.6,
        help="Home battery max charge rate (kW)",
    )
    parser.add_argument(
        "--home-discharge-kw",
        type=float,
        default=3.6,
        help="Home battery max discharge rate (kW)",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use heuristic data instead of calling external APIs",
    )
    parser.add_argument(
        "--no-export",
        action="store_true",
        help="Disable selling solar to grid",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
