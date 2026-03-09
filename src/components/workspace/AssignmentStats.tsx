import { Card, CardContent } from "@/components/ui/card";
import type { ScoutingAssignment } from "@/hooks/useAssignments";
import { ClipboardList, Clock, CheckCircle2, Send } from "lucide-react";

interface AssignmentStatsProps {
  assignments: ScoutingAssignment[];
}

const AssignmentStats = ({ assignments }: AssignmentStatsProps) => {
  const assigned = assignments.filter(a => a.status === "assigned").length;
  const inProgress = assignments.filter(a => a.status === "in_progress").length;
  const submitted = assignments.filter(a => a.status === "submitted").length;
  const reviewed = assignments.filter(a => a.status === "reviewed").length;
  const total = assignments.length;

  const stats = [
    { label: "Total", value: total, icon: ClipboardList, color: "text-foreground" },
    { label: "Pending", value: assigned, icon: Clock, color: "text-blue-500" },
    { label: "Active", value: inProgress, icon: ClipboardList, color: "text-amber-500" },
    { label: "Submitted", value: submitted, icon: Send, color: "text-purple-500" },
    { label: "Reviewed", value: reviewed, icon: CheckCircle2, color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="p-3 text-center">
            <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AssignmentStats;
