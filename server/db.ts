import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { poolConfigFromDatabaseUrl } from "./resolve-db-url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool(poolConfigFromDatabaseUrl(process.env.DATABASE_URL));
export const db = drizzle(pool, { schema });
