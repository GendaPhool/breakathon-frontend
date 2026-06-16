import { Outlet, Link, useLocation } from "react-router-dom";
import { auth } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Bug, ClipboardList, Trophy, LayoutDashboard, Shield, LogOut, Menu, X, Users, UserCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useParticipantSession } from "@/components/ParticipantSessionProvider";

export default function AppLayout() {
  const { user } = useAuth();
  const { session: pSession } = useParticipantSession();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role || "participant";
  const isMarshal = role === "marshal";

  const participantLinks = [
    { to: "/submit", label: "Submit Bug", icon: Bug },
    { to: "/my-reports", label: "My Reports", icon: ClipboardList },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const marshalLinks = [
    { to: "/marshal/queue", label: "Bug Queue", icon: ClipboardList },
    { to: "/marshal/registrations", label: "Registrations", icon: Users },
    { to: "/marshal/checkin", label: "Check-In", icon: UserCheck },
    { to: "/marshal/stats", label: "Stats", icon: LayoutDashboard },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/marshal/settings", label: "Settings", icon: Settings },
  ];

  const links = isMarshal ? marshalLinks : participantLinks;

  const isActive = (to) => location.pathname === to;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Bug className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:block">Break-A-Thon</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 font-medium whitespace-nowrap",
                    isActive(link.to) && "bg-primary/10 text-primary hover:bg-primary/10"
                  )}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {isMarshal ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium text-xs gap-1">
                <Shield className="w-3 h-3" /> Marshal
              </Badge>
            ) : pSession ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                {pSession.participant_id}
              </Badge>
            ) : null}
            <span className="text-sm text-muted-foreground hidden lg:block">{user?.full_name}</span>
            {isMarshal && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => user?.role?.toLowerCase() === "marshal" ? auth.marshalLogout() : auth.logout()}>
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-card px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive(link.to) && "bg-primary/10 text-primary"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
            {isMarshal && (
              <div className="pt-2 border-t mt-2 space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => user?.role?.toLowerCase() === "marshal" ? auth.marshalLogout() : auth.logout()}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}