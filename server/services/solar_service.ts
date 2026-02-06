import { SolarForecast, SolarForecastSeries, SolarPoint } from "@shared/schema";

export class SolarService {
  async getDailyProduction(
    latitude: number,
    longitude: number,
    systemKw: number,
    derate: number = 0.85
  ): Promise<SolarForecast> {
    // Quick heuristic: 4.5 kWh/m2/day average U.S. insolation
    const irradiance = 4.5;
    const production = irradiance * systemKw * derate;
    return {
      irradiance_kwh_m2: irradiance,
      expected_production_kwh: production
    };
  }

  async getHourlyForecast(
    latitude: number,
    longitude: number,
    systemKw: number,
    derate: number = 0.85,
    horizonHours: number = 24
  ): Promise<SolarForecastSeries> {
    const points: SolarPoint[] = [];
    
    for (let h = 0; h < horizonHours; h++) {
      // crude bell curve peaking at hour 12 (noon) with zero at night
      const hourOfDay = h % 24;
      const solarFraction = Math.max(
        0.0,
        Math.exp(-0.5 * Math.pow((hourOfDay - 12) / 3, 2)) - 0.02
      );
      const energy = solarFraction * systemKw * derate;
      points.push({
        hour: h,
        energy_kwh: Number(energy.toFixed(3))
      });
    }

    return { points };
  }
}

export const solarService = new SolarService();
