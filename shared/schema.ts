import { pgTable, text, serial, integer, boolean, real, jsonb, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";

// === EV Car Models (reference table) ===
export const evCarModels = pgTable("ev_car_models", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  batteryCapacityKwh: real("battery_capacity_kwh").notNull(),
  maxChargeKw: real("max_charge_kw").notNull(),
  rangeKm: integer("range_km"),
});

export const insertEvCarModelSchema = createInsertSchema(evCarModels).omit({ id: true });

// === User Profiles (linked to auth users) ===
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  latitude: real("latitude").default(37.7749),
  longitude: real("longitude").default(-122.4194),
  systemKw: real("system_kw").default(5.0),
  panelDerate: real("panel_derate").default(0.85),
  evCarModelId: integer("ev_car_model_id"),
  evCapacityKwh: real("ev_capacity_kwh").default(60.0),
  evMaxChargeKw: real("ev_max_charge_kw").default(7.0),
  hasHomeBattery: boolean("has_home_battery").default(false),
  homeBatteryCapacityKwh: real("home_battery_capacity_kwh").default(13.5),
  homeBatteryMaxChargeKw: real("home_battery_max_charge_kw").default(5.0),
  homeBatteryMaxDischargeKw: real("home_battery_max_discharge_kw").default(5.0),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true });

// === Optimization History (for savings tracking) ===
export const optimizationRuns = pgTable("optimization_runs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  runAt: timestamp("run_at").defaultNow(),
  netCost: real("net_cost").notNull(),
  savingsVsAllGrid: real("savings_vs_all_grid").notNull(),
  totalGridKwh: real("total_grid_kwh").notNull(),
  totalSolarUsedKwh: real("total_solar_used_kwh").notNull(),
  totalExportKwh: real("total_export_kwh").notNull(),
  recommendation: text("recommendation").notNull(),
  explanation: text("explanation"),
});

export const insertOptimizationRunSchema = createInsertSchema(optimizationRuns).omit({ id: true, runAt: true });

// === Relations ===
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  carModel: one(evCarModels, {
    fields: [userProfiles.evCarModelId],
    references: [evCarModels.id],
  }),
}));

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

export const solarForecastSchema = z.object({
  irradiance_kwh_m2: z.number(),
  expected_production_kwh: z.number(),
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
  ev_soc_kwh: z.number(),
  target_soc: z.number(),
  deadline_hours: z.number(),
  system_kw: z.number().optional(),
  ev_capacity_kwh: z.number().optional(),
  ev_max_charge_kw: z.number().optional(),
  has_home_battery: z.boolean().optional(),
  home_battery_capacity_kwh: z.number().optional(),
  home_battery_soc_kwh: z.number().optional(),
});

// === EXPLICIT TYPES ===
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type EvCarModel = typeof evCarModels.$inferSelect;
export type InsertEvCarModel = z.infer<typeof insertEvCarModelSchema>;
export type OptimizationRun = typeof optimizationRuns.$inferSelect;
export type InsertOptimizationRun = z.infer<typeof insertOptimizationRunSchema>;

export type BatteryState = z.infer<typeof batteryStateSchema>;
export type SolarPoint = z.infer<typeof solarPointSchema>;
export type SolarForecast = z.infer<typeof solarForecastSchema>;
export type PricePoint = z.infer<typeof pricePointSchema>;
export type PriceForecast = z.infer<typeof priceForecastSchema>;
export type PlanStep = z.infer<typeof planStepSchema>;
export type DecisionOutcome = z.infer<typeof decisionOutcomeSchema>;
export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>;
export type ExternalData = z.infer<typeof externalDataSchema>;

export type GridRate = {
  price_per_kwh: number;
  currency: string;
};
