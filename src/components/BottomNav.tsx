import { useLocation, useNavigate } from "react-router-dom";
import { Users, ClipboardList, LayoutDashboard, Eye, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/hooks/useTeam";
import { useUnreadFeedbackCount } from "@/hooks/useTeamFeedback";
import { Badge } from "@/components/ui/badge";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { team, isChiefScout } = useTeam();
  const unreadCount = useUnreadFeedbackCount();

  const tabs = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/players", label: "Players", icon: Users },
    { path: "/shortlists", label: "Shortlists", icon: ClipboardList },
    ...(team
      ? [{ path: "/team/feedback", label: "Feedback", icon: MessageSquare, badge: unreadCount }]
      : []),
    ...(team && isChiefScout
      ? [{ path: "/team/oversight", label: "Oversight", icon: Eye }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 touch-none pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const badgeCount = (tab as any).badge || 0;
          
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                "active:scale-95 transition-transform"
              )}
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
