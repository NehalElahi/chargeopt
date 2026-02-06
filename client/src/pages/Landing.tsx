import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Sun, DollarSign, BarChart3, Shield, Leaf } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3 text-primary font-bold text-xl">
            <Zap className="w-7 h-7 fill-current" />
            <span style={{ fontFamily: 'var(--font-display)' }}>ChargeOpt</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login">Sign In</Button>
          </a>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Smart EV Charging,{" "}
                  <span className="text-primary">Maximum Savings</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                  ChargeOpt optimizes your EV charging schedule by analyzing solar production, grid prices, and your battery status to minimize costs and maximize clean energy usage.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="/api/login">
                    <Button size="lg" className="text-lg px-8" data-testid="button-get-started">
                      Get Started
                    </Button>
                  </a>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Free to use
                  </span>
                  <span className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-primary" />
                    Eco-friendly
                  </span>
                </div>
              </div>
              <div className="hidden lg:block relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-3xl blur-3xl" />
                <div className="relative bg-card border border-border rounded-3xl p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center gap-3 text-primary">
                    <Zap className="w-6 h-6 fill-current" />
                    <span className="font-bold text-lg text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Optimization Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
                      <p className="text-sm text-muted-foreground">Savings Today</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$4.82</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30">
                      <p className="text-sm text-muted-foreground">Solar Used</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">12.3 kWh</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                      <p className="text-sm text-muted-foreground">Grid Import</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">8.1 kWh</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30">
                      <p className="text-sm text-muted-foreground">Exported</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">3.7 kWh</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-primary to-emerald-400 rounded-full" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">EV Charge: 75% complete</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-card/50 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>How It Works</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Intelligent algorithms analyze real-time data to find the cheapest, greenest way to charge your EV.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={Sun}
                title="Solar Forecasting"
                description="Predicts your solar panel output hour-by-hour so you can charge with free energy from the sun."
                color="text-amber-500"
                bg="bg-amber-50 dark:bg-amber-950/30"
              />
              <FeatureCard
                icon={DollarSign}
                title="Price Optimization"
                description="Tracks grid electricity prices and schedules charging during off-peak hours to minimize your bill."
                color="text-emerald-500"
                bg="bg-emerald-50 dark:bg-emerald-950/30"
              />
              <FeatureCard
                icon={BarChart3}
                title="Savings Tracking"
                description="See exactly how much you save each week compared to charging from the grid at average rates."
                color="text-blue-500"
                bg="bg-blue-50 dark:bg-blue-950/30"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          ChargeOpt &mdash; Smart EV Charging Optimization
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color, bg }: any) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-8 space-y-4">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
