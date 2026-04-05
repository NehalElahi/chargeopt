import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

/**
 * Railway often cannot reach Supabase over IPv6 (ENETUNREACH). Resolve the DB
 * hostname to an IPv4 address so `pg` connects by IP. TLS still works with
 * `rejectUnauthorized: false` for Supabase (see db.ts).
 */
export function resolveDatabaseUrlToIpv4(url: string): string {
  if (!url || !/supabase\.co/i.test(url)) {
    return url;
  }
  try {
    const cfg = parse(url);
    const host = cfg.host;
    if (!host) return url;
    const result = dns.lookupSync(host, { family: 4 });
    const ip = typeof result === "string" ? result : result.address;
    return url.split(host).join(ip);
  } catch {
    return url;
  }
}
