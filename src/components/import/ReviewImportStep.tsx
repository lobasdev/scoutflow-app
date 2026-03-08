import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { parseDateValue, parseNumericValue, type MappingResult, PLAYER_FIELDS } from "@/utils/columnMapper";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface ReviewImportStepProps {
  headers: string[];
  rows: string[][];
  mappings: Record<string, MappingResult>;
}

const BATCH_SIZE = 50;

const ReviewImportStep = ({ headers, rows, mappings }: ReviewImportStepProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  // Build mapped field list for table preview
  const mappedFields = headers
    .map((h, i) => ({ header: h, index: i, mapping: mappings[h] }))
    .filter(m => m.mapping && m.mapping.field !== 'skip');

  // Validation: rows missing name
  const nameIndex = headers.findIndex(h => mappings[h]?.field === 'name');
  const rowsWithoutName = nameIndex >= 0 ? rows.filter(r => !r[nameIndex]?.trim()).length : rows.length;

  const previewRows = rows.slice(0, 20);

  const buildPlayerRecord = useCallback((row: string[]) => {
    const record: Record<string, unknown> = { scout_id: user?.id };
    const numericFields = ['height', 'weight', 'goals', 'assists', 'appearances', 'minutes_played'];
    const dateFields = ['date_of_birth', 'contract_expires'];

    for (const { header, index, mapping } of mappedFields) {
      const value = row[index]?.trim() || '';
      if (!value) continue;

      const field = mapping.field;
      if (numericFields.includes(field)) {
        const num = parseNumericValue(value);
        if (num !== null) record[field] = Math.round(num);
      } else if (dateFields.includes(field)) {
        const d = parseDateValue(value);
        if (d) record[field] = d;
      } else if (['strengths', 'weaknesses', 'tags'].includes(field)) {
        record[field] = value.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
      } else {
        record[field] = value;
      }
    }
    return record;
  }, [mappedFields, user?.id]);

  const handleImport = async () => {
    if (!user?.id) return;
    setIsImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    // Filter out rows without a name
    const validRows = nameIndex >= 0 ? rows.filter(r => r[nameIndex]?.trim()) : [];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE).map(buildPlayerRecord);
      const { error } = await supabase.from('players').insert(batch as any);
      if (error) {
        failed += batch.length;
      } else {
        success += batch.length;
      }
      setProgress(Math.min(100, Math.round(((i + batch.length) / validRows.length) * 100)));
    }

    setResult({ success, failed });
    setIsImporting(false);

    if (success > 0) {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success(`Successfully imported ${success} players`);
    }
    if (failed > 0) {
      toast.error(`Failed to import ${failed} players`);
    }
  };

  if (result) {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle2 className="h-16 w-16 mx-auto text-secondary" />
        <h3 className="text-xl font-semibold text-foreground">Import Complete</h3>
        <p className="text-muted-foreground">
          {result.success} players imported successfully
          {result.failed > 0 && `, ${result.failed} failed`}
        </p>
        <Button onClick={() => navigate('/players')} className="rounded-full">
          Go to Players
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {rows.length - rowsWithoutName} valid rows
        </Badge>
        {rowsWithoutName > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {rowsWithoutName} rows missing name (will be skipped)
          </Badge>
        )}
        <Badge variant="outline">
          {mappedFields.length} fields mapped
        </Badge>
      </div>

      {/* Preview table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {mappedFields.map(({ mapping }) => {
                const label = PLAYER_FIELDS.find(f => f.value === mapping.field)?.label || mapping.field;
                return <TableHead key={mapping.field} className="whitespace-nowrap text-xs">{label}</TableHead>;
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, ri) => (
              <TableRow key={ri} className={nameIndex >= 0 && !row[nameIndex]?.trim() ? 'opacity-40' : ''}>
                {mappedFields.map(({ index, mapping }) => (
                  <TableCell key={mapping.field} className="whitespace-nowrap text-xs">
                    {row[index] || '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows.length > 20 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing first 20 of {rows.length} rows
        </p>
      )}

      {/* Import action */}
      {isImporting ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing players...
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : (
        <Button
          onClick={handleImport}
          disabled={rows.length - rowsWithoutName === 0}
          className="w-full rounded-full"
          size="lg"
        >
          Import {rows.length - rowsWithoutName} Players
        </Button>
      )}
    </div>
  );
};

export default ReviewImportStep;
