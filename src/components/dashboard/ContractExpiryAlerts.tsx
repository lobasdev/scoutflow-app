import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, FileWarning } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface ExpiringPlayer {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  team: string | null;
  contract_expires: string;
  daysUntilExpiry: number;
}

const ContractExpiryAlerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: expiringPlayers = [], isLoading } = useQuery({
    queryKey: ["expiring-contracts", user?.id],
    queryFn: async () => {
      const today = new Date();
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      const { data, error } = await supabase
        .from("players")
        .select("id, name, position, photo_url, team, contract_expires")
        .eq("scout_id", user!.id)
        .not("contract_expires", "is", null)
        .lte("contract_expires", sixMonthsFromNow.toISOString().split("T")[0])
        .gte("contract_expires", today.toISOString().split("T")[0])
        .order("contract_expires", { ascending: true })
        .limit(5);

      if (error) throw error;

      return (data || []).map((player) => ({
        ...player,
        contract_expires: player.contract_expires!,
        daysUntilExpiry: differenceInDays(parseISO(player.contract_expires!), today),
      })) as ExpiringPlayer[];
    },
    enabled: !!user,
  });

  const getUrgencyBadge = (days: number) => {
    if (days <= 30) {
      return <Badge variant="destructive" className="text-xs">Expires in {days}d</Badge>;
    }
    if (days <= 90) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs">Expires in {Math.round(days / 30)}mo</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Expires in {Math.round(days / 30)}mo</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-500" />
            Contract Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expiringPlayers.length === 0) {
    return null; // Don't show the widget if no expiring contracts
  }

  return (
    <Card className="border-border border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Contract Alerts
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {expiringPlayers.length} player{expiringPlayers.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Players with contracts expiring within 6 months
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {expiringPlayers.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            onClick={() => navigate(`/player/${player.id}`)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={player.photo_url || ""} alt={player.name} />
                <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
                  {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{player.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {player.position && <span>{player.position}</span>}
                  {player.team && (
                    <>
                      <span>•</span>
                      <span>{player.team}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getUrgencyBadge(player.daysUntilExpiry)}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ContractExpiryAlerts;
