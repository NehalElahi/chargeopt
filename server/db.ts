import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { resolveDatabaseUrlToIpv4 } from "./resolve-db-url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = resolveDatabaseUrlToIpv4(process.env.DATABASE_URL);
const useSsl = /supabase\.co/i.test(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });
