import dns from "node:dns";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Supabase direct host often has IPv6; Railway may not reach it (ENETUNREACH). Prefer IPv4.
dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase requires TLS from external hosts (e.g. Railway). `sslmode=require` in the URL
// is not always enough for node-pg; enabling ssl here matches common Supabase + Node setups.
const connectionString = process.env.DATABASE_URL;
const useSsl = /supabase\.co/i.test(connectionString);

export const pool = new Pool({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });
