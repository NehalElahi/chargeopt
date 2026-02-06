import { GridRate, PriceForecast, PricePoint } from "@shared/schema";

export class GridService {
  private static DEFAULT_GRID_RATE = 0.22;

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
        currency: "USD"
      });
    }

    return { points };
  }
}

export const gridService = new GridService();
