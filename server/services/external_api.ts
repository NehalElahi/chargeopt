import { ExternalData } from "@shared/schema";

export class ExternalAPIService {
  private static BASE_URL = "https://api.open-meteo.com/v1/forecast";

  async getWeather(latitude: number, longitude: number): Promise<ExternalData> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current_weather: "true"
    });

    const response = await fetch(`${ExternalAPIService.BASE_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.current_weather) {
      throw new Error("Weather data unavailable from external API");
    }

    const current = data.current_weather;
    
    return {
      temperature: current.temperature,
      windspeed: current.windspeed,
      winddirection: current.winddirection,
      weathercode: current.weathercode,
    };
  }
}

export const externalService = new ExternalAPIService();
