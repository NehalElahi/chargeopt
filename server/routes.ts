import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { externalService } from "./services/external_api";
import { solarService } from "./services/solar_service";
import { gridService } from "./services/grid_service";
import { DecisionEngine } from "./services/decision_engine";
import { BatteryState } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

function getUserId(req: any): string {
  return req.user?.claims?.sub;
}

async function seedCarModels() {
  const existing = await storage.getCarModels();
  if (existing.length > 0) return;

  const models = [
    { make: "Tesla", model: "Model 3 Standard Range Plus", year: 2024, batteryCapacityKwh: 60, maxChargeKw: 7.7, rangeKm: 423 },
    { make: "Tesla", model: "Model 3 Long Range", year: 2024, batteryCapacityKwh: 82, maxChargeKw: 11.5, rangeKm: 580 },
    { make: "Tesla", model: "Model Y Long Range", year: 2024, batteryCapacityKwh: 75, maxChargeKw: 11.5, rangeKm: 533 },
    { make: "Tesla", model: "Model S Plaid", year: 2024, batteryCapacityKwh: 100, maxChargeKw: 11.5, rangeKm: 600 },
    { make: "Chevrolet", model: "Bolt EV", year: 2023, batteryCapacityKwh: 65, maxChargeKw: 7.7, rangeKm: 416 },
    { make: "Chevrolet", model: "Bolt EUV", year: 2023, batteryCapacityKwh: 65, maxChargeKw: 7.7, rangeKm: 397 },
    { make: "Ford", model: "Mustang Mach-E Standard", year: 2024, batteryCapacityKwh: 72, maxChargeKw: 10.5, rangeKm: 402 },
    { make: "Ford", model: "Mustang Mach-E Extended", year: 2024, batteryCapacityKwh: 91, maxChargeKw: 10.5, rangeKm: 502 },
    { make: "Ford", model: "F-150 Lightning Standard", year: 2024, batteryCapacityKwh: 98, maxChargeKw: 19.2, rangeKm: 386 },
    { make: "Hyundai", model: "Ioniq 5 Standard", year: 2024, batteryCapacityKwh: 58, maxChargeKw: 11, rangeKm: 354 },
    { make: "Hyundai", model: "Ioniq 5 Long Range", year: 2024, batteryCapacityKwh: 77.4, maxChargeKw: 11, rangeKm: 488 },
    { make: "Hyundai", model: "Ioniq 6 Long Range", year: 2024, batteryCapacityKwh: 77.4, maxChargeKw: 11, rangeKm: 581 },
    { make: "Kia", model: "EV6 Standard", year: 2024, batteryCapacityKwh: 58, maxChargeKw: 11, rangeKm: 373 },
    { make: "Kia", model: "EV6 Long Range", year: 2024, batteryCapacityKwh: 77.4, maxChargeKw: 11, rangeKm: 499 },
    { make: "Nissan", model: "Leaf S", year: 2024, batteryCapacityKwh: 40, maxChargeKw: 6.6, rangeKm: 240 },
    { make: "Nissan", model: "Leaf S Plus", year: 2024, batteryCapacityKwh: 62, maxChargeKw: 6.6, rangeKm: 342 },
    { make: "Rivian", model: "R1T Large Pack", year: 2024, batteryCapacityKwh: 135, maxChargeKw: 11.5, rangeKm: 505 },
    { make: "Rivian", model: "R1S Large Pack", year: 2024, batteryCapacityKwh: 135, maxChargeKw: 11.5, rangeKm: 483 },
    { make: "BMW", model: "iX xDrive50", year: 2024, batteryCapacityKwh: 111.5, maxChargeKw: 11, rangeKm: 502 },
    { make: "BMW", model: "i4 eDrive40", year: 2024, batteryCapacityKwh: 83.9, maxChargeKw: 11, rangeKm: 488 },
    { make: "Volkswagen", model: "ID.4 Standard", year: 2024, batteryCapacityKwh: 62, maxChargeKw: 11, rangeKm: 338 },
    { make: "Volkswagen", model: "ID.4 Pro S Plus", year: 2024, batteryCapacityKwh: 82, maxChargeKw: 11, rangeKm: 443 },
    { make: "Mercedes-Benz", model: "EQS 450+", year: 2024, batteryCapacityKwh: 108.4, maxChargeKw: 9.6, rangeKm: 560 },
    { make: "Polestar", model: "Polestar 2 Standard", year: 2024, batteryCapacityKwh: 69, maxChargeKw: 11, rangeKm: 418 },
  ];

  for (const m of models) {
    await storage.createCarModel(m);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed car models on startup
  try { await seedCarModels(); } catch (e) { console.error("Error seeding car models:", e); }

  // === Car Models (public) ===
  app.get(api.carModels.list.path, async (_req, res) => {
    const models = await storage.getCarModels();
    res.json(models);
  });

  app.get(api.carModels.get.path, async (req, res) => {
    const model = await storage.getCarModel(Number(req.params.id));
    if (!model) return res.status(404).json({ message: "Car model not found" });
    res.json(model);
  });

  // === Profile (auth-protected) ===
  app.get(api.profile.get.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    let profile = await storage.getProfile(userId);
    if (!profile) {
      profile = await storage.upsertProfile({
        userId,
        latitude: 37.7749,
        longitude: -122.4194,
        systemKw: 5.0,
        panelDerate: 0.85,
        evCapacityKwh: 60.0,
        evMaxChargeKw: 7.0,
        hasHomeBattery: false,
      });
    }
    res.json(profile);
  });

  app.put(api.profile.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.profile.update.input.parse(req.body);

      let profile = await storage.getProfile(userId);
      if (!profile) {
        profile = await storage.upsertProfile({ userId, ...input });
      } else {
        profile = await storage.updateProfile(userId, input);
      }
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // === Weather Route ===
  app.get(api.weather.get.path, async (req, res) => {
    try {
      const { lat, lon } = api.weather.get.input.parse(req.query);
      const data = await externalService.getWeather(lat, lon);
      res.json(data);
    } catch (err) {
      console.error("Weather API Error:", err);
      res.status(502).json({ message: "Failed to fetch weather data" });
    }
  });

  // === Forecast Routes ===
  app.get(api.forecast.solar.path, async (req, res) => {
    const { lat, lon, system_kw } = api.forecast.solar.input.parse(req.query);
    const forecast = await solarService.getHourlyForecast(lat, lon, system_kw);
    res.json(forecast);
  });

  app.get(api.forecast.prices.path, async (req, res) => {
    const { lat, lon } = api.forecast.prices.input.parse(req.query);
    const forecast = await gridService.getPriceForecast(lat, lon);
    res.json(forecast);
  });

  // === Optimization Route (auth-protected) ===
  app.post(api.optimize.run.path, isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const input = api.optimize.run.input.parse(req.body);

      const profile = await storage.getProfile(userId);
      const lat = input.latitude ?? profile?.latitude ?? 37.7749;
      const lon = input.longitude ?? profile?.longitude ?? -122.4194;
      const systemKw = input.system_kw ?? profile?.systemKw ?? 5.0;
      const panelDerate = profile?.panelDerate ?? 0.85;

      const [solarForecast, priceForecast] = await Promise.all([
        solarService.getHourlyForecast(lat, lon, systemKw, panelDerate, input.deadline_hours + 12),
        gridService.getPriceForecast(lat, lon, input.deadline_hours + 12)
      ]);

      const evBattery: BatteryState = {
        capacity_kwh: input.ev_capacity_kwh ?? profile?.evCapacityKwh ?? 60.0,
        soc_kwh: input.ev_soc_kwh,
        max_charge_kw: input.ev_max_charge_kw ?? profile?.evMaxChargeKw ?? 7.0,
        max_discharge_kw: 0
      };

      let homeBattery: BatteryState | undefined;
      if (input.has_home_battery || profile?.hasHomeBattery) {
        homeBattery = {
          capacity_kwh: input.home_battery_capacity_kwh ?? profile?.homeBatteryCapacityKwh ?? 13.5,
          soc_kwh: input.home_battery_soc_kwh ?? 0,
          max_charge_kw: profile?.homeBatteryMaxChargeKw ?? 5.0,
          max_discharge_kw: profile?.homeBatteryMaxDischargeKw ?? 5.0
        };
      }

      const engine = new DecisionEngine(0.08);
      const outcome = engine.plan(
        new Date(),
        priceForecast,
        solarForecast,
        evBattery,
        input.target_soc,
        input.deadline_hours,
        homeBattery
      );

      // Save to history
      await storage.createOptimizationRun({
        userId,
        netCost: outcome.net_cost,
        savingsVsAllGrid: outcome.savings_vs_all_grid,
        totalGridKwh: outcome.total_grid_kwh,
        totalSolarUsedKwh: outcome.total_solar_used_kwh,
        totalExportKwh: outcome.total_export_kwh,
        recommendation: outcome.recommendation,
        explanation: outcome.explanation,
      });

      res.json(outcome);
    } catch (err) {
      console.error("Optimization Error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Savings Routes (auth-protected) ===
  app.get(api.savings.weekly.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const savings = await storage.getWeeklySavings(userId);
    res.json(savings);
  });

  app.get(api.savings.history.path, isAuthenticated, async (req, res) => {
    const userId = getUserId(req);
    const history = await storage.getOptimizationRuns(userId);
    res.json(history);
  });

  return httpServer;
}
