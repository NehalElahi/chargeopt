import dns from "node:dns";
import parse from "pg-connection-string";

dns.setDefaultResultOrder("ipv4first");

/**
 * Railway often cannot reach Supabase over IPv6 (ENETUNREACH). Resolve the DB
 * hostname to an IPv4 address so `pg` connects by IP. TLS still works with
 * `rejectUnauthorized: false` for Supabase (see db.ts).
 */
export function resolveDatabaseUrlToIpv4(url: string): string {
  if (!url || !/supabase/i.test(url)) {
    return url;
  }
  try {
    const cfg = parse(url);
    const host = cfg.host;
    if (!host) return url;
    const result = dns.lookupSync(host, { family: 4 });
    const ip = typeof result === "string" ? result : result.address;
    // Replace hostname only (first occurrence is the host in standard URIs).
    return url.replace(host, ip);
  } catch {
    return url;
  }
}
