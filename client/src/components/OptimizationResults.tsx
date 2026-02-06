import { type DecisionOutcome } from "@shared/routes";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Sun, Battery, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

interface OptimizationResultsProps {
  results: DecisionOutcome;
}

export function OptimizationResults({ results }: OptimizationResultsProps) {
  const chartData = results.steps.map(step => ({
    hour: `+${step.hour}h`,
    GridPrice: step.grid_price,
    SolarUsed: step.solar_used_kwh,
    GridUsed: step.grid_used_kwh,
    BatteryDischarge: step.home_used_kwh,
    Exported: step.exported_kwh,
    EVSOC: step.ev_soc_kwh
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Recommendation Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Optimization Complete</h3>
          <p className="text-muted-foreground">{results.explanation}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={DollarSign}
          label="Net Cost"
          value={`$${results.net_cost.toFixed(2)}`}
          subtext={`vs $${(results.net_cost + results.savings_vs_all_grid).toFixed(2)} baseline`}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard 
          icon={Sun}
          label="Solar Used"
          value={`${results.total_solar_used_kwh.toFixed(1)} kWh`}
          subtext="Direct to EV/Home"
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <StatCard 
          icon={Zap}
          label="Grid Used"
          value={`${results.total_grid_kwh.toFixed(1)} kWh`}
          subtext="Imported energy"
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <StatCard 
          icon={ArrowRight}
          label="Total Exported"
          value={`${results.total_export_kwh.toFixed(1)} kWh`}
          subtext="Sold to grid"
          color="text-purple-500"
          bg="bg-purple-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Energy Mix</CardTitle>
            <CardDescription>Source of energy per hour</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="SolarUsed" name="Solar" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                <Bar dataKey="GridUsed" name="Grid" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="BatteryDischarge" name="Home Battery" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grid Price vs EV SOC</CardTitle>
            <CardDescription>Cost trends and charging progress</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="GridPrice" name="Price ($/kWh)" stroke="#ef4444" fillOpacity={1} fill="url(#colorPrice)" />
                <Area yAxisId="right" type="step" dataKey="EVSOC" name="EV SOC (kWh)" stroke="#10b981" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Plan Table */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Plan</CardTitle>
          <CardDescription>Hour-by-hour action schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Time</th>
                  <th className="px-4 py-3">Grid Price</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Energy Source</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">EV Level</th>
                </tr>
              </thead>
              <tbody>
                {results.steps.map((step, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">+{step.hour}h</td>
                    <td className="px-4 py-3">${step.grid_price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <ActionBadge action={step.action} />
                      <div className="text-xs text-muted-foreground mt-0.5">{step.note}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {step.solar_used_kwh > 0 && <span className="text-amber-600 mr-2">Solar: {step.solar_used_kwh}</span>}
                      {step.grid_used_kwh > 0 && <span className="text-blue-600 mr-2">Grid: {step.grid_used_kwh}</span>}
                      {step.home_used_kwh > 0 && <span className="text-emerald-600">Batt: {step.home_used_kwh}</span>}
                      {step.solar_used_kwh === 0 && step.grid_used_kwh === 0 && step.home_used_kwh === 0 && "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{step.ev_soc_kwh.toFixed(1)} kWh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color, bg }: any) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h4 className="text-2xl font-bold mt-1 text-foreground">{value}</h4>
        </div>
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{subtext}</p>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  if (action.toLowerCase().includes("charge")) {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent shadow-none">Charging</Badge>;
  }
  if (action.toLowerCase().includes("export")) {
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-transparent shadow-none">Exporting</Badge>;
  }
  if (action.toLowerCase().includes("wait")) {
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent shadow-none">Waiting</Badge>;
  }
  return <Badge variant="outline">{action}</Badge>;
}
