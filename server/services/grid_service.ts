import { GridRate, PriceForecast, PricePoint } from "@shared/schema";
import { iesoClient } from "./ieso_client";

export class GridService {
  private static DEFAULT_GRID_RATE = 0.22;
  private cache: { forecast: PriceForecast; fetchedAt: number } | null = null;
  private static CACHE_MS = 10 * 60 * 1000; // 10 minutes

  async getRate(latitude: number, longitude: number): Promise<GridRate> {
    // Mock implementation fallback
    return {
      price_per_kwh: GridService.DEFAULT_GRID_RATE,
      currency: "USD"
    };
  }

  async getPriceForecast(
    latitude: number,
    longitude: number,
    horizonHours: number = 24
  ): Promise<PriceForecast> {
    // Use cached forecast when fresh
    if (this.cache && Date.now() - this.cache.fetchedAt < GridService.CACHE_MS) {
      return this.cache.forecast;
    }

    try {
      const forecast = await iesoClient.fetchDayAhead(horizonHours);
      this.cache = { forecast, fetchedAt: Date.now() };
      return forecast;
    } catch (err) {
      console.error("IESO price fetch failed, falling back to static curve:", err);
      return this.syntheticFallback(horizonHours);
    }
  }

  private syntheticFallback(horizonHours: number): PriceForecast {
    const points: PricePoint[] = [];
    for (let h = 0; h < horizonHours; h++) {
      const hourOfDay = h % 24;
      let price: number;
      let label: "peak" | "shoulder" | "off-peak";

      if (hourOfDay >= 16 && hourOfDay <= 21) {
        price = 0.40;
        label = "peak";
      } else if ((hourOfDay >= 7 && hourOfDay < 16) || (hourOfDay > 21 && hourOfDay <= 23)) {
        price = 0.22;
        label = "shoulder";
      } else {
        price = 0.12;
        label = "off-peak";
      }

      points.push({
        hour: h,
        price_per_kwh: price,
        label,
        currency: "CAD"
      });
    }
    return { points };
  }
}

export const gridService = new GridService();
