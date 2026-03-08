import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, SkipForward } from "lucide-react";
import { PLAYER_FIELDS, type MappingResult } from "@/utils/columnMapper";

interface ColumnMappingStepProps {
  headers: string[];
  sampleRow: string[];
  mappings: Record<string, MappingResult>;
  onMappingChange: (header: string, field: string) => void;
}

const ColumnMappingStep = ({ headers, sampleRow, mappings, onMappingChange }: ColumnMappingStepProps) => {
  const nameIsMapped = useMemo(
    () => Object.values(mappings).some(m => m.field === 'name'),
    [mappings]
  );

  const mappedCount = useMemo(
    () => Object.values(mappings).filter(m => m.field !== 'skip').length,
    [mappings]
  );

  const skippedCount = headers.length - mappedCount;

  // Detect duplicate mappings
  const duplicates = useMemo(() => {
    const fieldCounts: Record<string, number> = {};
    Object.values(mappings).forEach(m => {
      if (m.field !== 'skip') {
        fieldCounts[m.field] = (fieldCounts[m.field] || 0) + 1;
      }
    });
    return new Set(Object.entries(fieldCounts).filter(([, c]) => c > 1).map(([f]) => f));
  }, [mappings]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {mappedCount} mapped
        </Badge>
        {skippedCount > 0 && (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <SkipForward className="h-3 w-3" />
            {skippedCount} skipped
          </Badge>
        )}
        {!nameIsMapped && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            "Name" must be mapped
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {headers.map((header, index) => {
          const mapping = mappings[header] || { field: 'skip', confidence: 'none' };
          const isDuplicate = mapping.field !== 'skip' && duplicates.has(mapping.field);

          return (
            <div
              key={header}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              {/* CSV Header */}
              <div className="w-1/4 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" title={header}>
                  "{header}"
                </p>
              </div>

              {/* Arrow */}
              <span className="text-muted-foreground text-sm shrink-0">→</span>

              {/* Dropdown */}
              <div className="w-1/3 min-w-0">
                <Select
                  value={mapping.field}
                  onValueChange={(value) => onMappingChange(header, value)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_FIELDS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Confidence icon */}
              <div className="shrink-0">
                {mapping.field === 'skip' ? (
                  <SkipForward className="h-4 w-4 text-muted-foreground" />
                ) : isDuplicate ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : mapping.confidence === 'high' ? (
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                ) : mapping.confidence === 'medium' ? (
                  <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Sample data */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate" title={sampleRow[index] || ''}>
                  {sampleRow[index] || '—'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {duplicates.size > 0 && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          Duplicate mapping detected — two columns map to the same field
        </p>
      )}
    </div>
  );
};

export default ColumnMappingStep;
