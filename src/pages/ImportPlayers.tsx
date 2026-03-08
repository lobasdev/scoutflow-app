import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import FileUploadStep from "@/components/import/FileUploadStep";
import ColumnMappingStep from "@/components/import/ColumnMappingStep";
import ReviewImportStep from "@/components/import/ReviewImportStep";
import { autoMapColumns, type MappingResult } from "@/utils/columnMapper";
import { ArrowLeft, ArrowRight, Upload, Columns, CheckSquare } from "lucide-react";

const STEPS = [
  { label: "Upload", icon: Upload },
  { label: "Map Columns", icon: Columns },
  { label: "Review & Import", icon: CheckSquare },
];

const ImportPlayers = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, MappingResult>>({});

  const handleDataParsed = useCallback((h: string[], r: string[][]) => {
    setHeaders(h);
    setRows(r);
    setMappings(autoMapColumns(h));
  }, []);

  const handleMappingChange = useCallback((header: string, field: string) => {
    setMappings(prev => ({
      ...prev,
      [header]: { field, confidence: field === 'skip' ? 'none' : 'high' },
    }));
  }, []);

  const nameIsMapped = useMemo(
    () => Object.values(mappings).some(m => m.field === 'name'),
    [mappings]
  );

  const hasDuplicates = useMemo(() => {
    const fieldCounts: Record<string, number> = {};
    Object.values(mappings).forEach(m => {
      if (m.field !== 'skip') {
        fieldCounts[m.field] = (fieldCounts[m.field] || 0) + 1;
      }
    });
    return Object.values(fieldCounts).some(c => c > 1);
  }, [mappings]);

  const canProceedToMap = headers.length > 0 && rows.length > 0;
  const canProceedToReview = nameIsMapped && !hasDuplicates;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Import Players" />

      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-px ${isDone ? 'bg-primary' : 'bg-border'}`} />}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isDone ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card>
          <CardContent className="pt-6">
            {step === 0 && (
              <FileUploadStep onDataParsed={handleDataParsed} />
            )}
            {step === 1 && (
              <ColumnMappingStep
                headers={headers}
                sampleRow={rows[0] || []}
                mappings={mappings}
                onMappingChange={handleMappingChange}
              />
            )}
            {step === 2 && (
              <ReviewImportStep
                headers={headers}
                rows={rows}
                mappings={mappings}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {step < 2 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => step === 0 ? navigate('/players') : setStep(step - 1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 ? !canProceedToMap : !canProceedToReview}
              className="rounded-full"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
        {step === 2 && (
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mapping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPlayers;
