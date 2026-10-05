import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { calculateAge } from "@/utils/dateUtils";
import { formatEstimatedValue } from "@/utils/valueFormatter";

interface TablePlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  date_of_birth: string | null;
  foot: string | null;
  nationality: string | null;
  estimated_value: string | null;
  estimated_value_numeric: number | null;
  recommendation: string | null;
}

type SortKey = "name" | "position" | "age" | "team" | "foot" | "value" | "recommendation";

interface Props {
  players: TablePlayer[];
  onRowClick: (id: string) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

const getValue = (p: TablePlayer, key: SortKey): string | number | null => {
  switch (key) {
    case "age": return p.date_of_birth ? calculateAge(p.date_of_birth) : null;
    case "value": return p.estimated_value_numeric;
    case "name": return p.name?.toLowerCase() ?? null;
    case "team": return p.team?.toLowerCase() ?? null;
    default: return (p[key] as string | null)?.toLowerCase() ?? null;
  }
};

export const PlayersTable = ({ players, onRowClick, isSelectionMode, selectedIds, onToggleSelect }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setDir(dir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setDir("asc"); }
  };

  const rows = sortKey
    ? [...players].sort((a, b) => {
        const va = getValue(a, sortKey), vb = getValue(b, sortKey);
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        const c = va < vb ? -1 : va > vb ? 1 : 0;
        return dir === "asc" ? c : -c;
      })
    : players;

  const Head = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <TableHead className={className}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {sortKey === k ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </TableHead>
  );

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {isSelectionMode && <TableHead className="w-10" />}
            <Head k="name" label="Name" />
            <Head k="position" label="Pos" />
            <Head k="age" label="Age" />
            <Head k="team" label="Club" />
            <Head k="foot" label="Foot" className="hidden sm:table-cell" />
            <Head k="value" label="Value" />
            <Head k="recommendation" label="Verdict" className="hidden md:table-cell" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow
              key={p.id}
              className="cursor-pointer"
              data-state={selectedIds.has(p.id) ? "selected" : undefined}
              onClick={() => (isSelectionMode ? onToggleSelect(p.id) : onRowClick(p.id))}
            >
              {isSelectionMode && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => onToggleSelect(p.id)} />
                </TableCell>
              )}
              <TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
              <TableCell>{p.position || "—"}</TableCell>
              <TableCell>{p.date_of_birth ? calculateAge(p.date_of_birth) : "—"}</TableCell>
              <TableCell className="whitespace-nowrap">{p.team || "—"}</TableCell>
              <TableCell className="hidden sm:table-cell capitalize">{p.foot || "—"}</TableCell>
              <TableCell className="whitespace-nowrap">{p.estimated_value ? formatEstimatedValue(p.estimated_value_numeric ?? p.estimated_value) : "—"}</TableCell>
              <TableCell className="hidden md:table-cell">
                {p.recommendation ? <Badge variant="secondary">{p.recommendation}</Badge> : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
