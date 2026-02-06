import { ExternalData } from "@shared/schema";

export class ExternalAPIService {
  private static BASE_URL = "https://api.open-meteo.com/v1/forecast";
  private static TIMEOUT_MS = 5000;

  async getWeather(latitude: number, longitude: number): Promise<ExternalData> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current_weather: "true"
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ExternalAPIService.TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${ExternalAPIService.BASE_URL}?${params}`, {
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("Weather API timeout");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
    
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
