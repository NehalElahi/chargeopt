from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(
    title="Capstone Backend API",
    description="Testing external API integration with weather data",
    version="0.1.0"
)

app.include_router(router)

