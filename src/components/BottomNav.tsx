import { useLocation, useNavigate } from "react-router-dom";
import { Users, ClipboardList, LayoutDashboard, Eye, MessageSquare, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeam } from "@/hooks/useTeam";
import { useUnreadFeedbackCount } from "@/hooks/useTeamFeedback";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import MenuSheetContent from "@/components/MenuSheetContent";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { team, isChiefScout } = useTeam();
  const unreadCount = useUnreadFeedbackCount();
  const [menuOpen, setMenuOpen] = useState(false);

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

  // "More" stands in for everything that didn't fit in the bar, so it lights up
  // whenever the current screen isn't one of the tabs above.
  const isOnPrimaryTab = tabs.some((tab) => location.pathname === tab.path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 touch-none pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const badgeCount = (tab as any).badge || 0;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 transition-colors relative",
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
                  "font-medium transition-colors truncate max-w-full px-0.5",
                  tabs.length >= 5 ? "text-[10px]" : "text-xs",
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

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 transition-colors relative",
                "active:scale-95 transition-transform"
              )}
            >
              <div className="relative">
                <MoreHorizontal
                  className={cn(
                    "h-6 w-6 transition-colors",
                    !isOnPrimaryTab ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {unreadCount > 0 && !team && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-medium transition-colors truncate max-w-full px-0.5",
                  tabs.length >= 5 ? "text-[10px]" : "text-xs",
                  !isOnPrimaryTab ? "text-primary" : "text-muted-foreground"
                )}
              >
                More
              </span>
              {!isOnPrimaryTab && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="flex max-h-[75vh] flex-col overflow-hidden rounded-t-2xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <SheetHeader>
              <SheetTitle className="text-left">More</SheetTitle>
            </SheetHeader>
            <MenuSheetContent
              onNavigate={(path) => {
                navigate(path);
                setMenuOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default BottomNav;
