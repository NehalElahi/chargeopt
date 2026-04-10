import { XMLParser } from "fast-xml-parser";
import { PriceForecast, PricePoint } from "@shared/schema";

type PriceEntry = { hour: number; price_per_kwh: number };

/**
 * Lightweight client for IESO public reports (Ontario).
 * - Day-ahead hourly zonal price: public, no auth.
 * - Parses XML that is typically structured as a list of hour/price rows.
 * - Designed to fail gracefully: if fetch or parse fails, callers can fall back.
 */
export class IesoClient {
  private static DA_URL =
    "https://reports-public.ieso.ca/public/DAHourlyOntarioZonalPrice/PUB_DAHourlyOntarioZonalPrice.xml";

  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
  });

  /**
   * Fetch day-ahead hourly prices and return as PriceForecast.
   * Returns prices in $/kWh (HOEP is published in $/MWh).
   */
  async fetchDayAhead(horizonHours: number = 24): Promise<PriceForecast> {
    const xml = await this.fetchText(IesoClient.DA_URL);
    const entries = this.extractHourlyPrices(xml);

    if (entries.length === 0) {
      throw new Error("IESO day-ahead price parse yielded no data");
    }

    // Sort by hour and build forecast up to requested horizon
    const sorted = entries.sort((a, b) => a.hour - b.hour);
    const points: PricePoint[] = [];
    for (let i = 0; i < horizonHours; i++) {
      const entry = sorted[i % sorted.length];
      points.push({
        hour: i,
        price_per_kwh: entry.price_per_kwh,
        label: this.labelFromPrice(entry.price_per_kwh),
        currency: "CAD",
      });
    }

    return { points };
  }

  // === helpers ===

  private async fetchText(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`IESO fetch failed: ${res.status} ${res.statusText}`);
    }
    return await res.text();
  }

  /**
   * Extract hour/price pairs from the XML in a resilient way:
   * - Recursively walks objects looking for an hour-like field and a price-like field.
   * - Converts $/MWh to $/kWh when numbers look like typical HOEP magnitudes (>1).
   */
  private extractHourlyPrices(xml: string): PriceEntry[] {
    const data = this.parser.parse(xml);
    const entries: PriceEntry[] = [];

    const hourKeys = ["Hour", "hour", "hourEnding", "HourEnding"];
    const priceKeys = ["OZP", "ozp", "HOEP", "Hoep", "Price", "price", "OZPrice", "ZonalPrice"];

    const walk = (node: any) => {
      if (node && typeof node === "object") {
        const hourKey = hourKeys.find((k) => k in node);
        const priceKey = priceKeys.find((k) => k in node);
        if (hourKey && priceKey) {
          const rawHour = Number(node[hourKey]);
          const rawPrice = Number(node[priceKey]);
          if (!Number.isNaN(rawHour) && !Number.isNaN(rawPrice)) {
            const price_per_kwh =
              rawPrice > 5 ? rawPrice / 1000 : rawPrice; // assume $/MWh if large
            entries.push({
              hour: rawHour % 24, // normalize
              price_per_kwh,
            });
          }
        }
        for (const val of Object.values(node)) {
          if (typeof val === "object") walk(val);
          if (Array.isArray(val)) val.forEach(walk);
        }
      }
    };

    walk(data);
    return entries;
  }

  private labelFromPrice(price: number): "peak" | "shoulder" | "off-peak" {
    if (price >= 0.25) return "peak";
    if (price >= 0.15) return "shoulder";
    return "off-peak";
  }
}

export const iesoClient = new IesoClient();
