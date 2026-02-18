import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface InjuryHistorySectionProps {
  playerId: string;
}

interface Injury {
  id: string;
  injury_type: string;
  body_part: string | null;
  severity: string | null;
  injury_date: string;
  return_date: string | null;
  days_missed: number | null;
  surgery_required: boolean;
  notes: string | null;
}

const severityColors: Record<string, string> = {
  minor: "bg-green-500/10 text-green-500 border-green-500/20",
  moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  severe: "bg-red-500/10 text-red-500 border-red-500/20",
  "career-threatening": "bg-red-900/10 text-red-400 border-red-900/20",
};

const InjuryHistorySection = ({ playerId }: InjuryHistorySectionProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    injury_type: "",
    body_part: "",
    severity: "moderate",
    injury_date: format(new Date(), "yyyy-MM-dd"),
    return_date: "",
    days_missed: "",
    surgery_required: false,
    notes: "",
  });

  const { data: injuries = [] } = useQuery({
    queryKey: ["player-injuries", playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_injuries")
        .select("*")
        .eq("player_id", playerId)
        .order("injury_date", { ascending: false });
      if (error) throw error;
      return data as Injury[];
    },
  });

  const handleAdd = async () => {
    try {
      const { error } = await supabase.from("player_injuries").insert({
        player_id: playerId,
        injury_type: form.injury_type,
        body_part: form.body_part || null,
        severity: form.severity || null,
        injury_date: form.injury_date,
        return_date: form.return_date || null,
        days_missed: form.days_missed ? parseInt(form.days_missed) : null,
        surgery_required: form.surgery_required,
        notes: form.notes || null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["player-injuries", playerId] });
      setDialogOpen(false);
      setForm({ injury_type: "", body_part: "", severity: "moderate", injury_date: format(new Date(), "yyyy-MM-dd"), return_date: "", days_missed: "", surgery_required: false, notes: "" });
      toast.success("Injury record added");
    } catch {
      toast.error("Failed to add injury record");
    }
  };

  const handleDelete = async (injuryId: string) => {
    try {
      const { error } = await supabase.from("player_injuries").delete().eq("id", injuryId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["player-injuries", playerId] });
      toast.success("Injury record deleted");
    } catch {
      toast.error("Failed to delete injury record");
    }
  };

  return (
    <>
      <Card className="mb-6">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500" />
                  Injury History
                  {injuries.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{injuries.length}</Badge>
                  )}
                </CardTitle>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {injuries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No injury records</p>
              ) : (
                injuries.map((injury) => (
                  <div key={injury.id} className="p-3 bg-muted/30 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{injury.injury_type}</span>
                        {injury.severity && (
                          <Badge variant="outline" className={`text-xs ${severityColors[injury.severity] || ""}`}>
                            {injury.severity}
                          </Badge>
                        )}
                        {injury.surgery_required && (
                          <Badge variant="destructive" className="text-xs">Surgery</Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(injury.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      {injury.body_part && <span>📍 {injury.body_part}</span>}
                      <span>📅 {format(new Date(injury.injury_date), "MMM d, yyyy")}</span>
                      {injury.return_date && <span>↩ {format(new Date(injury.return_date), "MMM d, yyyy")}</span>}
                      {injury.days_missed && <span>⏱ {injury.days_missed} days missed</span>}
                    </div>
                    {injury.notes && <p className="text-xs text-muted-foreground mt-1">{injury.notes}</p>}
                  </div>
                ))
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Injury
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Injury Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Injury type (e.g., ACL Tear)" value={form.injury_type} onChange={(e) => setForm({ ...form, injury_type: e.target.value })} />
            <Input placeholder="Body part (e.g., Right Knee)" value={form.body_part} onChange={(e) => setForm({ ...form, body_part: e.target.value })} />
            <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
              <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
                <SelectItem value="career-threatening">Career-threatening</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Injury Date</label>
                <Input type="date" value={form.injury_date} onChange={(e) => setForm({ ...form, injury_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Return Date</label>
                <Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
              </div>
            </div>
            <Input type="number" placeholder="Days missed" value={form.days_missed} onChange={(e) => setForm({ ...form, days_missed: e.target.value })} />
            <div className="flex items-center gap-2">
              <Checkbox checked={form.surgery_required} onCheckedChange={(v) => setForm({ ...form, surgery_required: !!v })} />
              <label className="text-sm">Surgery required</label>
            </div>
            <Textarea placeholder="Notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={!form.injury_type || !form.injury_date}>Add Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InjuryHistorySection;
