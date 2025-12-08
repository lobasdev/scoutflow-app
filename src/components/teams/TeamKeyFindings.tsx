import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface TeamKeyFindingsProps {
  findings: string;
}

const TeamKeyFindings = ({ findings }: TeamKeyFindingsProps) => {
  if (!findings) return null;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-600">
          <Lightbulb className="h-4 w-4" />
          Key Findings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{findings}</p>
      </CardContent>
    </Card>
  );
};

export default TeamKeyFindings;
