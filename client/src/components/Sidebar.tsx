import { Link, useLocation } from "wouter";
import { LayoutDashboard, Settings, Zap, DollarSign, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/savings", label: "Savings", icon: DollarSign },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 text-primary font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
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
              data-testid={`nav-${link.label.toLowerCase()}`}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover-elevate"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground" data-testid="text-username">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-logout"
              type="button"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/savings", label: "Savings", icon: DollarSign },
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
              ${isActive ? "text-primary" : "text-muted-foreground"}
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
