import { useWeeklySavings, useOptimizationHistory } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function Savings() {
  const { data: weeklySavings, isLoading: savingsLoading } = useWeeklySavings();
  const { data: history, isLoading: historyLoading } = useOptimizationHistory();

  if (savingsLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSavings = (weeklySavings || []).reduce((acc: number, w: any) => acc + w.savings, 0);
  const totalRuns = (weeklySavings || []).reduce((acc: number, w: any) => acc + w.runs, 0);

  const chartData = (weeklySavings || []).map((w: any) => ({
    week: new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    savings: w.savings,
    runs: w.runs,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Savings Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your weekly charging savings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${totalSavings.toFixed(2)}</h3>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Last 8 weeks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Optimizations Run</p>
                <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalRuns}</h3>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Total sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Savings / Run</p>
                <h3 className="text-3xl font-bold text-primary mt-1">
                  ${totalRuns > 0 ? (totalSavings / totalRuns).toFixed(2) : "0.00"}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Per optimization</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Savings</CardTitle>
          <CardDescription>Money saved vs charging entirely from the grid</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Savings"]}
                />
                <Bar dataKey="savings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/30" />
                <p>No savings data yet. Run your first optimization to start tracking.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Optimizations</CardTitle>
          <CardDescription>Your latest charging optimization sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {(history || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" data-testid="table-history">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Date</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Net Cost</th>
                    <th className="px-4 py-3">Savings</th>
                    <th className="px-4 py-3">Solar Used</th>
                    <th className="px-4 py-3 rounded-r-lg">Grid Used</th>
                  </tr>
                </thead>
                <tbody>
                  {(history as any[]).slice(0, 20).map((run: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="px-4 py-3 font-medium">
                        {new Date(run.runAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={run.recommendation === 'charge_optimized' ? 'default' : 'secondary'}>
                          {run.recommendation === 'charge_optimized' ? 'Optimized' : 'Partial'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">${run.netCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">${run.savingsVsAllGrid.toFixed(2)}</td>
                      <td className="px-4 py-3">{run.totalSolarUsedKwh.toFixed(1)} kWh</td>
                      <td className="px-4 py-3">{run.totalGridKwh.toFixed(1)} kWh</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No optimization history yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
