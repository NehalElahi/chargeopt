import dns from "node:dns";
import type { PoolConfig } from "pg";
import parse from "pg-connection-string";

dns.setDefaultResultOrder("ipv4first");

/**
 * Railway often cannot reach Supabase over IPv6 (ENETUNREACH). Build a pg Pool
 * config with host set to an IPv4 literal so node-pg never opens IPv6 sockets.
 * connect-pg-simple should use the same Pool (see session.ts).
 */
export function poolConfigFromDatabaseUrl(url: string): PoolConfig {
  if (!url) {
    throw new Error("DATABASE_URL is missing");
  }
  if (!/supabase/i.test(url)) {
    return { connectionString: url };
  }
  try {
    const cfg = parse.parseIntoClientConfig(url);
    const host = cfg.host;
    if (!host || typeof host !== "string") {
      return { connectionString: url };
    }
    const result = dns.lookupSync(host, { family: 4 });
    const ipv4 = typeof result === "string" ? result : result.address;
    return {
      ...cfg,
      host: ipv4,
      ssl: { rejectUnauthorized: false },
    };
  } catch {
    return { connectionString: url };
  }
}
