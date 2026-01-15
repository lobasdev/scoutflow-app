import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Search, 
  Crown, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
  Calendar,
  TrendingUp
} from "lucide-react";
import { format, differenceInDays, addMonths, addDays } from "date-fns";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  subscription?: {
    id: string;
    status: SubscriptionStatus;
    trial_ends_at: string | null;
    current_period_end: string | null;
    cancelled_at: string | null;
  } | null;
  player_count: number;
  observation_count: number;
}

const Admin = () => {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SubscriptionStatus>("active");
  const [extensionMonths, setExtensionMonths] = useState("1");
  const [customTrialDays, setCustomTrialDays] = useState("7");

  // Fetch all users with their stats
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch scouts
      const { data: scouts, error: scoutsError } = await supabase
        .from("scouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (scoutsError) throw scoutsError;

      // Fetch subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("*");

      if (subsError) throw subsError;

      // Fetch player counts
      const { data: playerCounts, error: playersError } = await supabase
        .from("players")
        .select("scout_id");

      if (playersError) throw playersError;

      // Fetch observation counts
      const { data: observations, error: obsError } = await supabase
        .from("observations")
        .select("id, player_id, players!inner(scout_id)");

      if (obsError) throw obsError;

      // Count players per scout
      const playerCountMap = new Map<string, number>();
      playerCounts?.forEach((p) => {
        const count = playerCountMap.get(p.scout_id) || 0;
        playerCountMap.set(p.scout_id, count + 1);
      });

      // Count observations per scout
      const obsCountMap = new Map<string, number>();
      observations?.forEach((o: any) => {
        const scoutId = o.players?.scout_id;
        if (scoutId) {
          const count = obsCountMap.get(scoutId) || 0;
          obsCountMap.set(scoutId, count + 1);
        }
      });

      // Combine data
      const usersWithStats: UserWithStats[] = scouts?.map((scout) => {
        const subscription = subscriptions?.find((s) => s.user_id === scout.id);
        return {
          id: scout.id,
          email: scout.email,
          name: scout.name,
          first_name: scout.first_name,
          last_name: scout.last_name,
          created_at: scout.created_at,
          subscription: subscription ? {
            id: subscription.id,
            status: subscription.status,
            trial_ends_at: subscription.trial_ends_at,
            current_period_end: subscription.current_period_end,
            cancelled_at: subscription.cancelled_at,
          } : null,
          player_count: playerCountMap.get(scout.id) || 0,
          observation_count: obsCountMap.get(scout.id) || 0,
        };
      }) || [];

      return usersWithStats;
    },
    enabled: isAdmin,
  });

  // Mutation to update subscription
  const updateSubscription = useMutation({
    mutationFn: async ({ 
      userId, 
      action, 
      months,
      trialDays,
      status 
    }: { 
      userId: string; 
      action: "extend" | "grant_free" | "set_trial" | "change_status";
      months?: number;
      trialDays?: number;
      status?: SubscriptionStatus;
    }) => {
      const user = users?.find(u => u.id === userId);
      
      if (action === "extend" && months) {
        const currentEnd = user?.subscription?.current_period_end 
          ? new Date(user.subscription.current_period_end) 
          : new Date();
        const newEnd = addMonths(currentEnd, months);
        
        if (user?.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ 
              current_period_end: newEnd.toISOString(),
              status: "active"
            })
            .eq("id", user.subscription.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("subscriptions")
            .insert({
              user_id: userId,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: newEnd.toISOString(),
            });
          if (error) throw error;
        }
      } else if (action === "grant_free") {
        // Grant free access for 100 years (effectively forever)
        const freeEnd = new Date("2099-12-31");
        
        if (user?.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ 
              current_period_end: freeEnd.toISOString(),
              status: "active"
            })
            .eq("id", user.subscription.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("subscriptions")
            .insert({
              user_id: userId,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: freeEnd.toISOString(),
            });
          if (error) throw error;
        }
      } else if (action === "set_trial" && trialDays) {
        const trialEnd = addDays(new Date(), trialDays);
        
        if (user?.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ 
              trial_ends_at: trialEnd.toISOString(),
              status: "trialing"
            })
            .eq("id", user.subscription.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("subscriptions")
            .insert({
              user_id: userId,
              status: "trialing",
              trial_ends_at: trialEnd.toISOString(),
            });
          if (error) throw error;
        }
      } else if (action === "change_status" && status) {
        if (user?.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status })
            .eq("id", user.subscription.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("subscriptions")
            .insert({
              user_id: userId,
              status,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast.success("Subscription updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update subscription: " + error.message);
    },
  });

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (subscription: UserWithStats["subscription"]) => {
    if (!subscription) {
      return <Badge variant="outline" className="bg-muted/50">No subscription</Badge>;
    }

    switch (subscription.status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30"><AlertCircle className="h-3 w-3 mr-1" />Past Due</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-muted/50"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  const getAccessInfo = (subscription: UserWithStats["subscription"]) => {
    if (!subscription) return "No access";
    
    if (subscription.status === "trialing" && subscription.trial_ends_at) {
      const daysLeft = differenceInDays(new Date(subscription.trial_ends_at), new Date());
      return `Trial ends in ${daysLeft} days`;
    }
    
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      if (endDate.getFullYear() >= 2099) {
        return "Free forever";
      }
      return `Until ${format(endDate, "MMM d, yyyy")}`;
    }
    
    return "—";
  };

  // Stats summary
  const stats = {
    total: users?.length || 0,
    active: users?.filter(u => u.subscription?.status === "active").length || 0,
    trialing: users?.filter(u => u.subscription?.status === "trialing").length || 0,
    noSub: users?.filter(u => !u.subscription).length || 0,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Admin Panel" />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.trialing}</p>
                  <p className="text-sm text-muted-foreground">Trialing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.noSub}</p>
                  <p className="text-sm text-muted-foreground">No Sub</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-center">Players</TableHead>
                      <TableHead className="text-center">Obs</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.subscription)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getAccessInfo(user.subscription)}
                        </TableCell>
                        <TableCell className="text-center">{user.player_count}</TableCell>
                        <TableCell className="text-center">{user.observation_count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewStatus(user.subscription?.status || "active");
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Subscription Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Status */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              {getStatusBadge(selectedUser?.subscription)}
              <p className="text-sm mt-1">{getAccessInfo(selectedUser?.subscription)}</p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Label>Quick Actions (Local Only)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSubscription.mutate({ 
                    userId: selectedUser!.id, 
                    action: "grant_free" 
                  })}
                  disabled={updateSubscription.isPending}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Grant Free
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSubscription.mutate({ 
                    userId: selectedUser!.id, 
                    action: "change_status",
                    status: "cancelled"
                  })}
                  disabled={updateSubscription.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel (Local)
                </Button>
              </div>
            </div>

            {/* Paddle Sync Actions */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                Paddle Sync Actions
                <Badge variant="outline" className="text-xs">Syncs with Paddle</Badge>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("paddle-manage", {
                        body: { action: "cancel", userId: selectedUser!.id }
                      });
                      if (error) throw error;
                      toast.success(data.paddleSynced 
                        ? "Subscription cancelled in Paddle" 
                        : "Subscription cancelled locally (no Paddle sub)");
                      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                    } catch (err: any) {
                      toast.error(err.message || "Failed to cancel");
                    }
                  }}
                  disabled={updateSubscription.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("paddle-manage", {
                        body: { action: "pause", userId: selectedUser!.id }
                      });
                      if (error) throw error;
                      toast.success(data.paddleSynced 
                        ? "Subscription paused in Paddle" 
                        : "Subscription paused locally");
                      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                    } catch (err: any) {
                      toast.error(err.message || "Failed to pause");
                    }
                  }}
                  disabled={updateSubscription.isPending}
                >
                  Pause
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("paddle-manage", {
                        body: { action: "resume", userId: selectedUser!.id }
                      });
                      if (error) throw error;
                      toast.success(data.paddleSynced 
                        ? "Subscription resumed in Paddle" 
                        : "Subscription resumed locally");
                      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                    } catch (err: any) {
                      toast.error(err.message || "Failed to resume");
                    }
                  }}
                  disabled={updateSubscription.isPending}
                >
                  Resume
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                These actions sync with Paddle billing. Cancel/pause takes effect at end of billing period.
              </p>
            </div>

            {/* Extend Subscription */}
            <div className="space-y-2">
              <Label>Extend Subscription</Label>
              <div className="flex gap-2">
                <Select value={extensionMonths} onValueChange={setExtensionMonths}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={() => updateSubscription.mutate({ 
                    userId: selectedUser!.id, 
                    action: "extend",
                    months: parseInt(extensionMonths)
                  })}
                  disabled={updateSubscription.isPending}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Extend
                </Button>
              </div>
            </div>

            {/* Set Trial */}
            <div className="space-y-2">
              <Label>Set Trial Period</Label>
              <div className="flex gap-2">
                <Select value={customTrialDays} onValueChange={setCustomTrialDays}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={() => updateSubscription.mutate({ 
                    userId: selectedUser!.id, 
                    action: "set_trial",
                    trialDays: parseInt(customTrialDays)
                  })}
                  disabled={updateSubscription.isPending}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Set Trial
                </Button>
              </div>
            </div>

            {/* Change Status */}
            <div className="space-y-2">
              <Label>Change Status</Label>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as SubscriptionStatus)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={() => updateSubscription.mutate({ 
                    userId: selectedUser!.id, 
                    action: "change_status",
                    status: newStatus
                  })}
                  disabled={updateSubscription.isPending}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Update
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
