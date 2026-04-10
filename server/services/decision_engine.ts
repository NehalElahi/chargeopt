import { 
  PriceForecast, 
  SolarForecastSeries, 
  BatteryState, 
  PlanStep, 
  DecisionOutcome, 
  PricePoint,
  SolarPoint
} from "@shared/schema";

export class DecisionEngine {
  private feedInTariff: number;
  private exportAllowed: boolean;

  constructor(feedInTariff: number, exportAllowed: boolean = true) {
    this.feedInTariff = feedInTariff;
    this.exportAllowed = exportAllowed;
  }

  private futurePrices(prices: number[], startExclusive: number): number[] {
    const idx = startExclusive + 1;
    return idx < prices.length ? prices.slice(idx) : [];
  }

  public plan(
    now: Date,
    priceForecast: PriceForecast,
    solarForecast: SolarForecastSeries,
    evBattery: BatteryState,
    targetSoc: number,
    deadlineHours: number,
    homeBattery?: BatteryState
  ): DecisionOutcome {
    const pricePoints = priceForecast.points;
    const solarPoints = solarForecast.points;
    const horizon = Math.min(deadlineHours, pricePoints.length);

    const evTargetKwh = evBattery.capacity_kwh * targetSoc;
    let evNeeded = Math.max(0.0, evTargetKwh - evBattery.soc_kwh);
    const evStartNeeded = evNeeded;

    let netCost = 0.0;
    let totalGrid = 0.0;
    let totalSolarUsed = 0.0;
    let totalExport = 0.0;
    const steps: PlanStep[] = [];

    const priceList = pricePoints.map(p => p.price_per_kwh);
    const avgGridPrice = horizon > 0 
      ? priceList.slice(0, horizon).reduce((a, b) => a + b, 0) / horizon 
      : 0.0;
    const baselineAllGrid = evNeeded * avgGridPrice;

    // We modify local copies of battery state to track simulation
    const currentEvSoc = { ...evBattery };
    const currentHomeSoc = homeBattery ? { ...homeBattery } : undefined;

    // --- Pre-plan grid charging on the cheapest hours (Fix #2) ---
    const solarUsable = solarPoints.slice(0, horizon).map(p =>
      Math.min(p.energy_kwh, currentEvSoc.max_charge_kw)
    );
    const expectedSolar = solarUsable.reduce((a, b) => a + b, 0);
    let remainingForGridPlan = Math.max(0, evNeeded - expectedSolar);

    const hourOrderByPrice = [...Array(horizon).keys()].sort(
      (a, b) => priceList[a] - priceList[b]
    );
    const plannedGrid: number[] = Array(horizon).fill(0);
    for (const h of hourOrderByPrice) {
      if (remainingForGridPlan <= 0) break;
      const alloc = Math.min(remainingForGridPlan, currentEvSoc.max_charge_kw);
      plannedGrid[h] = alloc;
      remainingForGridPlan -= alloc;
    }

    for (let h = 0; h < horizon; h++) {
      const priceIndex = Math.min(h, pricePoints.length - 1);
      const solarIndex = Math.min(h, solarPoints.length - 1);
      
      const price = pricePoints[priceIndex].price_per_kwh;
      let solar = solarPoints[solarIndex].energy_kwh;
      const actionNotes: string[] = [];

      // 1) Use solar for EV within charge limit
      const solarToEv = Math.min(
        solar, 
        evNeeded, 
        currentEvSoc.max_charge_kw
      );

      if (solarToEv > 0) {
        currentEvSoc.soc_kwh += solarToEv;
        evNeeded -= solarToEv;
        solar -= solarToEv;
        totalSolarUsed += solarToEv;
        actionNotes.push(`Used ${solarToEv.toFixed(2)} kWh solar for EV`);
      }

      // 2) Store solar into home battery if future prices are higher
      let homeToStore = 0.0;
      if (currentHomeSoc && solar > 0) {
        const futurePricesList = this.futurePrices(priceList, h);
        const futureMax = futurePricesList.length > 0 ? Math.max(...futurePricesList) : price;
        
        if (futureMax > price + 0.05) {
          const capacityLeft = currentHomeSoc.capacity_kwh - currentHomeSoc.soc_kwh;
          if (capacityLeft > 0) {
            homeToStore = Math.min(
              solar,
              capacityLeft,
              currentHomeSoc.max_charge_kw
            );
            currentHomeSoc.soc_kwh += homeToStore;
            solar -= homeToStore;
            actionNotes.push(`Stored ${homeToStore.toFixed(2)} kWh solar in home battery`);
          }
        }
      }

      // 3) Export remaining solar
      let exported = 0.0;
      if (this.exportAllowed && solar > 0) {
        exported = solar;
        netCost -= exported * this.feedInTariff;
        totalExport += exported;
        actionNotes.push(`Exported ${exported.toFixed(2)} kWh at $${this.feedInTariff.toFixed(2)}/kWh`);
        solar = 0.0;
      }

      // 4) Use home battery to avoid expensive grid during peaks
      let homeToEv = 0.0;
      if (currentHomeSoc && evNeeded > 0 && currentHomeSoc.soc_kwh > 0) {
        const futurePricesList = this.futurePrices(priceList, h);
        const cheapestFuture = futurePricesList.length > 0 ? Math.min(...futurePricesList) : price;
        
        if (price >= cheapestFuture + 0.08 || price >= 0.30) {
          homeToEv = Math.min(
            evNeeded,
            currentHomeSoc.soc_kwh,
            currentHomeSoc.max_discharge_kw
          );
          currentHomeSoc.soc_kwh -= homeToEv;
          evNeeded -= homeToEv;
          totalSolarUsed += homeToEv; // Counting stored solar as solar used
          actionNotes.push(`Shifted ${homeToEv.toFixed(2)} kWh from home battery to EV`);
        }
      }

      // 5) Decide grid charging for this hour
      let gridToEv = 0.0;
      if (evNeeded > 0) {
        const hoursLeft = Math.max(0, deadlineHours - h - 1);
        const requiredHoursMin = currentEvSoc.max_charge_kw > 0 
          ? Math.ceil(evNeeded / currentEvSoc.max_charge_kw) 
          : 0;
        
        const futurePricesList = this.futurePrices(priceList, h);
        const cheapestFuture = futurePricesList.length > 0 ? Math.min(...futurePricesList) : price;
        const planned = plannedGrid[h] || 0;
        const shouldChargeNow = planned > 0 || hoursLeft < requiredHoursMin;

        if (shouldChargeNow) {
          const plannedAmount = Math.min(planned, evNeeded, currentEvSoc.max_charge_kw);
          const emergencyAmount =
            hoursLeft < requiredHoursMin ? Math.min(evNeeded, currentEvSoc.max_charge_kw) : 0;
          gridToEv = Math.max(plannedAmount, emergencyAmount);

          currentEvSoc.soc_kwh += gridToEv;
          evNeeded -= gridToEv;
          const cost = gridToEv * price;
          netCost += cost;
          totalGrid += gridToEv;
          actionNotes.push(`Bought ${gridToEv.toFixed(2)} kWh from grid at $${price.toFixed(2)}/kWh`);
        } else {
          actionNotes.push("Deferred grid charging awaiting cheaper window");
        }
      }

      steps.push({
        hour: h,
        grid_price: price,
        solar_used_kwh: Number(solarToEv.toFixed(3)),
        grid_used_kwh: Number(gridToEv.toFixed(3)),
        home_used_kwh: Number(homeToEv.toFixed(3)),
        exported_kwh: Number(exported.toFixed(3)),
        ev_soc_kwh: Number(currentEvSoc.soc_kwh.toFixed(3)),
        home_soc_kwh: currentHomeSoc ? Number(currentHomeSoc.soc_kwh.toFixed(3)) : null,
        action: actionNotes.length > 0 ? actionNotes.join(", ") : "No action",
        note: `Price window: $${price.toFixed(2)}/kWh`
      });

      if (evNeeded <= 0) break; // Fix #1: stop immediately once target met
    }

    const recommendation = evNeeded > 0 ? "wait" : "charge_optimized";
    
    // Add final step if incomplete
    if (evNeeded > 0) {
        const lastPrice = priceList[Math.min(horizon - 1, priceList.length - 1)];
        steps.push({
            hour: horizon,
            grid_price: lastPrice,
            solar_used_kwh: 0,
            grid_used_kwh: 0,
            home_used_kwh: 0,
            exported_kwh: 0,
            ev_soc_kwh: Number(currentEvSoc.soc_kwh.toFixed(3)),
            home_soc_kwh: currentHomeSoc ? Number(currentHomeSoc.soc_kwh.toFixed(3)) : null,
            action: "Incomplete target",
            note: `Still need ${evNeeded.toFixed(2)} kWh by deadline`
        });
    }

    const savings = baselineAllGrid - netCost;
    const explanation = `Target: ${evTargetKwh.toFixed(2)} kWh by +${deadlineHours}h. ` +
      `Used ${totalSolarUsed.toFixed(2)} kWh solar, ${totalGrid.toFixed(2)} kWh grid. ` +
      `Exported ${totalExport.toFixed(2)} kWh. ` +
      `Savings vs all-grid plan: $${savings.toFixed(2)}.`;

    return {
      recommendation,
      net_cost: Number(netCost.toFixed(2)),
      total_grid_kwh: Number(totalGrid.toFixed(2)),
      total_solar_used_kwh: Number(totalSolarUsed.toFixed(2)),
      total_export_kwh: Number(totalExport.toFixed(2)),
      savings_vs_all_grid: Number(savings.toFixed(2)),
      steps,
      explanation
    };
  }
}
