import { pgTable, text, serial, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // Location
  latitude: real("latitude").default(37.7749),
  longitude: real("longitude").default(-122.4194),
  // Solar Config
  systemKw: real("system_kw").default(5.0),
  panelDerate: real("panel_derate").default(0.85),
  // EV Config
  evCapacityKwh: real("ev_capacity_kwh").default(60.0),
  evMaxChargeKw: real("ev_max_charge_kw").default(7.0),
  // Home Battery Config
  hasHomeBattery: boolean("has_home_battery").default(false),
  homeBatteryCapacityKwh: real("home_battery_capacity_kwh").default(13.5),
  homeBatteryMaxChargeKw: real("home_battery_max_charge_kw").default(5.0),
  homeBatteryMaxDischargeKw: real("home_battery_max_discharge_kw").default(5.0),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// === TYPES for Logic (Ported from Python Pydantic models) ===

export const batteryStateSchema = z.object({
  capacity_kwh: z.number(),
  soc_kwh: z.number(),
  max_charge_kw: z.number(),
  max_discharge_kw: z.number(),
});

export const solarPointSchema = z.object({
  hour: z.number(),
  energy_kwh: z.number(),
});

export const solarForecastSeriesSchema = z.object({
  points: z.array(solarPointSchema),
});

export const pricePointSchema = z.object({
  hour: z.number(),
  price_per_kwh: z.number(),
  label: z.enum(["off-peak", "shoulder", "peak"]).default("off-peak"),
  currency: z.string().default("USD"),
});

export const priceForecastSchema = z.object({
  points: z.array(pricePointSchema),
});

export const planStepSchema = z.object({
  hour: z.number(),
  grid_price: z.number(),
  solar_used_kwh: z.number(),
  grid_used_kwh: z.number(),
  home_used_kwh: z.number(),
  exported_kwh: z.number(),
  ev_soc_kwh: z.number(),
  home_soc_kwh: z.number().nullable().optional(),
  action: z.string(),
  note: z.string(),
});

export const decisionOutcomeSchema = z.object({
  recommendation: z.string(),
  net_cost: z.number(),
  total_grid_kwh: z.number(),
  total_solar_used_kwh: z.number(),
  total_export_kwh: z.number(),
  savings_vs_all_grid: z.number(),
  steps: z.array(planStepSchema),
  explanation: z.string(),
});

export const externalDataSchema = z.object({
  temperature: z.number(),
  windspeed: z.number(),
  winddirection: z.number(),
  weathercode: z.number(),
});

// === API INPUT SCHEMAS ===

export const optimizeRequestSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Overrides or current state
  ev_soc_kwh: z.number(),
  target_soc: z.number(), // 0.0 to 1.0
  deadline_hours: z.number(),
  // If not provided, use user settings
  system_kw: z.number().optional(),
  ev_capacity_kwh: z.number().optional(),
  ev_max_charge_kw: z.number().optional(),
  // Home battery optional overrides
  has_home_battery: z.boolean().optional(),
  home_battery_capacity_kwh: z.number().optional(),
  home_battery_soc_kwh: z.number().optional(),
});

// === EXPLICIT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BatteryState = z.infer<typeof batteryStateSchema>;
export type SolarPoint = z.infer<typeof solarPointSchema>;
export type PricePoint = z.infer<typeof pricePointSchema>;
export type PlanStep = z.infer<typeof planStepSchema>;
export type DecisionOutcome = z.infer<typeof decisionOutcomeSchema>;
export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>;
export type ExternalData = z.infer<typeof externalDataSchema>;
