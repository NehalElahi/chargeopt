import {
  userProfiles, UserProfile, InsertUserProfile,
  evCarModels, EvCarModel, InsertEvCarModel,
  optimizationRuns, OptimizationRun, InsertOptimizationRun
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, gte } from "drizzle-orm";

export interface IStorage {
  getProfile(userId: string): Promise<UserProfile | undefined>;
  upsertProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile>;

  getCarModels(): Promise<EvCarModel[]>;
  getCarModel(id: number): Promise<EvCarModel | undefined>;
  createCarModel(model: InsertEvCarModel): Promise<EvCarModel>;

  createOptimizationRun(run: InsertOptimizationRun): Promise<OptimizationRun>;
  getOptimizationRuns(userId: string, limit?: number): Promise<OptimizationRun[]>;
  getWeeklySavings(userId: string): Promise<{ week: string; savings: number; runs: number }[]>;
  deleteAllOptimizationRuns(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [result] = await db
      .insert(userProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: profile,
      })
      .returning();
    return result;
  }

  async updateProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [result] = await db
      .update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result;
  }

  async getCarModels(): Promise<EvCarModel[]> {
    return await db.select().from(evCarModels);
  }

  async getCarModel(id: number): Promise<EvCarModel | undefined> {
    const [model] = await db.select().from(evCarModels).where(eq(evCarModels.id, id));
    return model;
  }

  async createCarModel(model: InsertEvCarModel): Promise<EvCarModel> {
    const [result] = await db.insert(evCarModels).values(model).returning();
    return result;
  }

  async createOptimizationRun(run: InsertOptimizationRun): Promise<OptimizationRun> {
    const [result] = await db.insert(optimizationRuns).values(run).returning();
    return result;
  }

  async getOptimizationRuns(userId: string, limit: number = 50): Promise<OptimizationRun[]> {
    return await db
      .select()
      .from(optimizationRuns)
      .where(eq(optimizationRuns.userId, userId))
      .orderBy(desc(optimizationRuns.runAt))
      .limit(limit);
  }

  async getWeeklySavings(userId: string): Promise<{ week: string; savings: number; runs: number }[]> {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const runs = await db
      .select()
      .from(optimizationRuns)
      .where(eq(optimizationRuns.userId, userId))
      .orderBy(desc(optimizationRuns.runAt));

    const weekMap = new Map<string, { savings: number; runs: number }>();
    for (const run of runs) {
      if (!run.runAt) continue;
      const d = new Date(run.runAt);
      if (d < eightWeeksAgo) continue;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      const existing = weekMap.get(key) || { savings: 0, runs: 0 };
      existing.savings += run.savingsVsAllGrid;
      existing.runs += 1;
      weekMap.set(key, existing);
    }

    return Array.from(weekMap.entries())
      .map(([week, data]) => ({ week, savings: Number(data.savings.toFixed(2)), runs: data.runs }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  async deleteAllOptimizationRuns(userId: string): Promise<number> {
    const deleted = await db
      .delete(optimizationRuns)
      .where(eq(optimizationRuns.userId, userId))
      .returning();
    return deleted.length;
  }
}

export const storage = new DatabaseStorage();
