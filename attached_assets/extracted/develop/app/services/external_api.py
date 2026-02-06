import httpx
from app.config import settings

class ExternalAPIService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    async def get_weather(self, latitude: float, longitude: float):
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current_weather": "true"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self.BASE_URL, params=params)

        response.raise_for_status()
        return response.json()
