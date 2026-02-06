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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === User Routes ===
  app.get(api.users.get.path, async (req, res) => {
    // For MVP, assume single user or hardcoded ID 1, as there's no auth yet
    // In a real app, use req.user.id
    const user = await storage.getUser(1);
    if (!user) {
      // Create default user if not exists
      const newUser = await storage.createUser({
        username: "demo_user",
        password: "password", // In real app, hash this
        latitude: 37.7749,
        longitude: -122.4194,
        systemKw: 5.0,
        panelDerate: 0.85,
        evCapacityKwh: 60.0,
        evMaxChargeKw: 7.0,
        hasHomeBattery: false
      });
      return res.json(newUser);
    }
    res.json(user);
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(1, input); // Hardcoded ID 1
      res.json(user);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
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

  // === Optimization Route ===
  app.post(api.optimize.run.path, async (req, res) => {
    try {
      const input = api.optimize.run.input.parse(req.body);
      
      // 1. Get User Settings (fallback if not provided in request)
      const user = await storage.getUser(1);
      if (!user) throw new Error("User not initialized");

      const lat = input.latitude ?? user.latitude ?? 37.7749;
      const lon = input.longitude ?? user.longitude ?? -122.4194;
      const systemKw = input.system_kw ?? user.systemKw ?? 5.0;
      const panelDerate = user.panelDerate ?? 0.85;

      // 2. Fetch Forecasts
      const [solarForecast, priceForecast] = await Promise.all([
        solarService.getHourlyForecast(lat, lon, systemKw, panelDerate, input.deadline_hours + 12), // fetch a bit more
        gridService.getPriceForecast(lat, lon, input.deadline_hours + 12)
      ]);

      // 3. Setup Battery States
      const evBattery: BatteryState = {
        capacity_kwh: input.ev_capacity_kwh ?? user.evCapacityKwh ?? 60.0,
        soc_kwh: input.ev_soc_kwh,
        max_charge_kw: input.ev_max_charge_kw ?? user.evMaxChargeKw ?? 7.0,
        max_discharge_kw: 0 // EV V2G not implemented yet in this model
      };

      let homeBattery: BatteryState | undefined = undefined;
      if (input.has_home_battery || user.hasHomeBattery) {
        homeBattery = {
          capacity_kwh: input.home_battery_capacity_kwh ?? user.homeBatteryCapacityKwh ?? 13.5,
          soc_kwh: input.home_battery_soc_kwh ?? 0, // Default to empty if not provided? Or should ask user?
          max_charge_kw: user.homeBatteryMaxChargeKw ?? 5.0,
          max_discharge_kw: user.homeBatteryMaxDischargeKw ?? 5.0
        };
      }

      // 4. Run Optimization
      const engine = new DecisionEngine(0.08); // Feed in tariff $0.08 default
      const outcome = engine.plan(
        new Date(),
        priceForecast,
        solarForecast,
        evBattery,
        input.target_soc,
        input.deadline_hours,
        homeBattery
      );

      res.json(outcome);

    } catch (err) {
      console.error("Optimization Error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}
