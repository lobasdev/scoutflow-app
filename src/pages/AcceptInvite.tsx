import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) { setError("Invalid invite link"); setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from("team_invites")
        .select("*, scouting_teams(name)")
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (fetchError || !data) {
        setError("This invite is invalid or has expired.");
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("This invite has expired.");
        setLoading(false);
        return;
      }

      setInvite(data);
      setTeamName((data as any).scouting_teams?.name || "Scouting Team");
      setLoading(false);
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!user || !invite) return;
    setAccepting(true);
    try {
      // Add as team member
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: invite.team_id,
          user_id: user.id,
          role: invite.role,
          status: "active",
          invited_by: invite.invited_by,
        });
      
      if (memberError) {
        if (memberError.code === "23505") {
          toast.info("You're already a member of this team!");
          navigate("/team");
          return;
        }
        throw memberError;
      }

      // Update invite status
      await supabase
        .from("team_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      toast.success(`You've joined ${teamName}!`);
      navigate("/team");
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Team Invite</h2>
            <p className="text-sm text-muted-foreground">
              You've been invited to join <strong>{teamName || "a scouting team"}</strong>. Sign in or create an account to accept.
            </p>
            <Button className="w-full" onClick={() => navigate(`/auth?redirect=/team/invite/${token}`)}>
              Sign In to Accept
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <X className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Invalid Invite</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Join {teamName}</h2>
          <p className="text-sm text-muted-foreground">
            You've been invited to join as a <strong className="text-foreground">Scout</strong>. You'll be able to view shared players, add observations, and collaborate with the team.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
              Decline
            </Button>
            <Button className="flex-1 gap-2" onClick={handleAccept} disabled={accepting}>
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
