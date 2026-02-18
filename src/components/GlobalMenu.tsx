import { useNavigate } from "react-router-dom";
import { Menu, Inbox, Trophy, Users, ListPlus, LogOut, CalendarDays, LayoutDashboard, GitCompareArrows, Shield, Settings, MessageSquare, Crown, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import FeedbackDialog from "@/components/FeedbackDialog";
import { useIsAdmin } from "@/hooks/useSubscription";

const GlobalMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = useIsAdmin();

  const handleLogout = async () => {
    setOpen(false);
    // Always sign out and redirect, even if the session is already invalid
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth", { replace: true });
  };

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
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start h-12 text-base hover:bg-accent"
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
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
                onClick={() => {
                  navigate("/admin");
                  setOpen(false);
                }}
              >
                <Crown className="h-5 w-5 mr-3 text-amber-500" />
                Admin Panel
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base hover:bg-accent"
              onClick={() => {
                navigate("/profile");
                setOpen(false);
              }}
            >
              <Settings className="h-5 w-5 mr-3 text-muted-foreground" />
              Account Settings
            </Button>
            <FeedbackDialog 
              trigger={
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-base hover:bg-accent"
                >
                  <MessageSquare className="h-5 w-5 mr-3 text-muted-foreground" />
                  Send Feedback
                </Button>
              }
              onClose={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  );
};

export default GlobalMenu;
