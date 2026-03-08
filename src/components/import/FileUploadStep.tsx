import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, X } from "lucide-react";
import { parseCSV } from "@/utils/columnMapper";

interface FileUploadStepProps {
  onDataParsed: (headers: string[], rows: string[][]) => void;
}

const FileUploadStep = ({ onDataParsed }: FileUploadStepProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError("Please upload a CSV file (.csv or .txt)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || !text.trim()) {
        setError("File is empty");
        return;
      }

      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        setError("No columns found in the file");
        return;
      }
      if (rows.length === 0) {
        setError("No data rows found — only headers detected");
        return;
      }

      setFileName(file.name);
      setPreviewHeaders(headers);
      setPreviewRows(rows.slice(0, 5));
      setTotalRows(rows.length);
      onDataParsed(headers, rows);
    };
    reader.onerror = () => setError("Failed to read the file");
    reader.readAsText(file);
  }, [onDataParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleClear = () => {
    setFileName(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    setTotalRows(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {!fileName ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground mb-2">
            Drop your CSV file here
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>
          <Button variant="outline" size="sm" type="button">
            Choose File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {totalRows} rows · {previewHeaders.length} columns
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              Preview (first {Math.min(5, previewRows.length)} rows):
            </p>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewHeaders.map((h, i) => (
                      <TableHead key={i} className="whitespace-nowrap text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, ri) => (
                    <TableRow key={ri}>
                      {previewHeaders.map((_, ci) => (
                        <TableCell key={ci} className="whitespace-nowrap text-xs">
                          {row[ci] || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
};

export default FileUploadStep;
