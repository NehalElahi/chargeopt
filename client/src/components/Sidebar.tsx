import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, Zap } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 text-primary font-display font-bold text-2xl">
          <Zap className="w-8 h-8 fill-current" />
          <span>ChargeOpt</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                ${isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10">
          <p className="text-sm font-medium text-primary mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-around items-center z-50 pb-safe">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location === link.href;
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-lg transition-colors
              ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
            `}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
