import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useOptimization } from "@/hooks/use-optimization";
import { WeatherCard } from "@/components/WeatherCard";
import { OptimizationResults } from "@/components/OptimizationResults";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Timer, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useUser();
  const { mutate: runOptimization, isPending, data: results } = useOptimization();

  // Optimization State
  const [evSocPercent, setEvSocPercent] = useState([20]); // Slider uses array
  const [targetSocPercent, setTargetSocPercent] = useState([80]);
  const [deadline, setDeadline] = useState("8"); // hours from now

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleOptimize = () => {
    if (!user) return;
    
    // Convert percentages to kWh
    const evCapacity = user.evCapacityKwh || 60;
    const currentKwh = (evSocPercent[0] / 100) * evCapacity;
    const targetRatio = targetSocPercent[0] / 100;

    runOptimization({
      latitude: user.latitude || undefined,
      longitude: user.longitude || undefined,
      ev_soc_kwh: currentKwh,
      target_soc: targetRatio,
      deadline_hours: parseFloat(deadline) || 8,
      ev_capacity_kwh: evCapacity,
      ev_max_charge_kw: user.evMaxChargeKw || 7,
      has_home_battery: user.hasHomeBattery || false,
      home_battery_capacity_kwh: user.homeBatteryCapacityKwh || 13.5
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Optimize your EV charging schedule</p>
        </div>
        <div className="w-full md:w-auto">
          {user?.latitude && user?.longitude && (
            <WeatherCard lat={user.latitude} lon={user.longitude} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Card */}
        <Card className="lg:col-span-1 border-primary/10 shadow-lg shadow-black/5 h-fit">
          <CardHeader className="bg-secondary/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5 fill-current" />
              Charging Parameters
            </CardTitle>
            <CardDescription>Configure your charging session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            {/* Current SOC */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Current Charge</Label>
                <span className="text-sm font-medium text-primary">{evSocPercent[0]}%</span>
              </div>
              <Slider 
                value={evSocPercent} 
                onValueChange={setEvSocPercent} 
                max={100} 
                step={1} 
                className="py-2"
              />
              <p className="text-xs text-muted-foreground text-right">
                {((evSocPercent[0] / 100) * (user?.evCapacityKwh || 60)).toFixed(1)} kWh
              </p>
            </div>

            {/* Target SOC */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Target Charge</Label>
                <span className="text-sm font-medium text-primary">{targetSocPercent[0]}%</span>
              </div>
              <Slider 
                value={targetSocPercent} 
                onValueChange={setTargetSocPercent} 
                max={100} 
                step={1}
                className="py-2" 
              />
            </div>

            {/* Deadline */}
            <div className="space-y-3">
              <Label htmlFor="deadline">Charge Deadline (Hours)</Label>
              <div className="relative">
                <Input 
                  id="deadline"
                  type="number" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="pl-10"
                />
                <Timer className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-muted-foreground">
                Vehicle needs to be ready by {new Date(Date.now() + parseFloat(deadline || "0") * 3600000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>

            <Button 
              onClick={handleOptimize} 
              disabled={isPending}
              className="w-full text-lg h-12 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : "Run Optimization"}
            </Button>

          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {results ? (
            <OptimizationResults results={results} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-card border border-dashed border-border rounded-2xl text-muted-foreground min-h-[400px]">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Ready to Optimize</h3>
              <p className="max-w-xs mt-2">Adjust the parameters on the left and click "Run Optimization" to generate your charging plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
