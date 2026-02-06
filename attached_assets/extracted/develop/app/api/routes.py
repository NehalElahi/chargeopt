from fastapi import APIRouter, HTTPException, Query
from app.services.external_api import ExternalAPIService
from app.models.schemas import ExternalData
# from app.models.schemas import CurrentWeather

router = APIRouter()
service = ExternalAPIService()

@router.get("/weather", response_model=ExternalData)
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    data = await service.get_weather(lat, lon)

    if "current_weather" not in data:
        raise HTTPException(
            status_code=502,
            detail="Weather data unavailable from external API"
        )

    current = data["current_weather"]

    return {
        "temperature": current["temperature"],
        "windspeed": current["windspeed"],
        "winddirection": current["winddirection"],
        "weathercode": current["weathercode"],

    }
