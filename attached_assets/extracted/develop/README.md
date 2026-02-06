# Capstone-EV-Charging
Code for our EV charging capstone project


This is the high level breakdown of our capstone project

    develop/
    │
    ├── app/
    │   ├── main.py              # FastAPI entry point
    │   ├── config.py            # env + settings
    │   │
    │   ├── api/
    │   │   ├── routes.py        # your exposed endpoints
    │   │
    │   ├── services/
    │   │   ├── external_api.py  # API call logic (IMPORTANT)
    │   │
    │   ├── models/
    │   │   ├── schemas.py       # Pydantic models
    │   │
    │   └── utils/
    │       └── exceptions.py
    │
    ├── .env
    ├── requirements.txt
    └── README.md


## Environment setup ##

Make sure you have your virtual environment set up, to test if it is up enter command:

    which python3

and result should be 

    /Users/felipevillegas/Projects/CAPSTONE_EV_CHARGER/Capstone-EV-Charging/develop/venv/bin/python3

If it is not this, then set up the venv deploy it using 

    source venv/bin/activate


## App Deployement ##
Run the following command in the terminal to deploy

    uvicorn app.main:app --reload  

Navigate to this URL:

    http://127.0.0.1:8000/docs

## CLI EV Charge Optimizer (Time-of-Use) ##

Examples:

```
python -m app.cli --lat 37.77 --lon -122.42 --ev-capacity 60 --ev-soc 18 --target-soc 0.9 --deadline-hours 12 --system-kw 7 --mock
python -m app.cli --lat 40.71 --lon -74.0 --ev-capacity 75 --ev-soc 30 --target-soc 0.8 --home-capacity 13.5 --home-soc 6 --mock
```

Key flags:
- `--lat/--lon` (required): location for solar + grid data
- `--system-kw`: PV system size (default 6 kW)
- `--derate`: overall loss factor (default from `PANEL_DERATE`)
- `--deadline-hours`: hours from now to reach target SoC (default 12h)
- `--ev-capacity`: EV battery capacity kWh (default 60)
- `--ev-soc`: current EV energy kWh (default 20)
- `--target-soc`: goal SoC as fraction (default 0.8)
- `--ev-charge-kw`: max EV charge power kW (default 7.2)
- `--home-capacity`, `--home-soc`, `--home-charge-kw`, `--home-discharge-kw`: optional home battery
- `--mock`: use heuristic forecasts instead of real APIs
- `--no-export`: disable selling solar back to grid

Environment variables:
- `SOLAR_API_BASE_URL`, `SOLAR_API_KEY`: hourly solar/irradiance source (expects `ghi`/`daily_ghi`)
- `GRID_API_BASE_URL`, `GRID_API_KEY`: price source (expects `price_per_kwh`)
- `DEFAULT_GRID_RATE`: fallback price (USD/kWh, default 0.15)
- `FEED_IN_TARIFF`: export rate (USD/kWh, default 0.05)
- `PANEL_DERATE`: system derate (default 0.82)
