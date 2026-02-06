from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    EXTERNAL_API_BASE_URL = os.getenv("EXTERNAL_API_BASE_URL")
    EXTERNAL_API_KEY = os.getenv("EXTERNAL_API_KEY")
    SOLAR_API_BASE_URL = os.getenv("SOLAR_API_BASE_URL")
    SOLAR_API_KEY = os.getenv("SOLAR_API_KEY")
    GRID_API_BASE_URL = os.getenv("GRID_API_BASE_URL")
    GRID_API_KEY = os.getenv("GRID_API_KEY")
    DEFAULT_GRID_RATE = float(os.getenv("DEFAULT_GRID_RATE", 0.15))
    FEED_IN_TARIFF = float(os.getenv("FEED_IN_TARIFF", 0.05))
    PANEL_DERATE = float(os.getenv("PANEL_DERATE", 0.82))

settings = Settings()
