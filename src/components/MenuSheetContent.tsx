import {
  Inbox,
  Trophy,
  Users,
  ListPlus,
  LogOut,
  CalendarDays,
  LayoutDashboard,
  GitCompareArrows,
  Shield,
  Settings,
  MessageSquare,
  Crown,
  CheckSquare,
  UsersRound,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FeedbackDialog from "@/components/FeedbackDialog";
import { useIsAdmin } from "@/hooks/useSubscription";
import { useTeamPlan } from "@/hooks/useTeam";
import { useAuth } from "@/contexts/AuthContext";
import { clearOfflineUserData } from "@/lib/offlineStore";

const MenuSheetContent = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  const isAdmin = useIsAdmin();
  const isTeamPlan = useTeamPlan();
  const { user } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", color: "text-primary" },
    { icon: Users, label: "My Players", path: "/players", color: "text-primary" },
    { icon: GitCompareArrows, label: "Player Comparison", path: "/comparison", color: "text-violet-500" },
    { icon: ListPlus, label: "Shortlists", path: "/shortlists", color: "text-primary" },
    { icon: Inbox, label: "Player Inbox", path: "/inbox", color: "text-blue-500" },
    { icon: Shield, label: "Teams", path: "/teams", color: "text-cyan-500" },
    { icon: Trophy, label: "Tournaments", path: "/tournaments", color: "text-amber-500" },
    { icon: CalendarDays, label: "Matches", path: "/matches", color: "text-green-500" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks", color: "text-pink-500" },
    ...(isTeamPlan
      ? [
          { icon: UsersRound, label: "Team Workspace", path: "/team", color: "text-emerald-500" },
          { icon: ClipboardList, label: "Assignments", path: "/team/assignments", color: "text-emerald-500" },
        ]
      : []),
  ];

  const handleLogout = async () => {
    if (user) await clearOfflineUserData(user.id);
    // Always sign out and redirect, even if the session is already invalid
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    onNavigate("/auth");
  };

  return (
    <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-6">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.path}
            variant="ghost"
            className="w-full justify-start h-12 text-base hover:bg-accent"
            onClick={() => onNavigate(item.path)}
          >
            <Icon className={`h-5 w-5 mr-3 ${item.color}`} />
            {item.label}
          </Button>
        );
      })}
      <div className="pt-4 mt-4 border-t space-y-1">
        {isAdmin && (
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base hover:bg-accent"
            onClick={() => onNavigate("/admin")}
          >
            <Crown className="h-5 w-5 mr-3 text-amber-500" />
            Admin Panel
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-base hover:bg-accent"
          onClick={() => onNavigate("/profile")}
        >
          <Settings className="h-5 w-5 mr-3 text-muted-foreground" />
          Account Settings
        </Button>
        <FeedbackDialog
          trigger={
            <Button variant="ghost" className="w-full justify-start h-12 text-base hover:bg-accent">
              <MessageSquare className="h-5 w-5 mr-3 text-muted-foreground" />
              Send Feedback
            </Button>
          }
        />
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-base hover:bg-destructive/10 text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default MenuSheetContent;
