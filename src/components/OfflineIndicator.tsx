import { CloudOff, LoaderCircle, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function OfflineIndicator() {
  const { isOnline, syncing, operations, retry, discard } = useOffline();
  if (isOnline && !syncing && operations.length === 0) return null;
  const failed = operations.filter((item) => item.status === "failed").length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" className="fixed left-1/2 top-2 z-50 h-9 -translate-x-1/2 gap-2 shadow-md" size="sm">
          {syncing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : failed ? <TriangleAlert className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
          {syncing ? "Syncing" : !isOnline ? "Offline" : `${operations.length} pending`}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Offline work</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          {operations.length === 0 ? <p className="text-sm text-muted-foreground">Everything is up to date.</p> : operations.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.type.replace(/-/g, " ")}</p>
                <Badge variant={item.status === "failed" ? "destructive" : "secondary"} className="mt-1">{item.status}</Badge>
                {item.error && <p className="mt-1 truncate text-xs text-muted-foreground">{item.error}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => retry(item.id)} aria-label="Retry sync"><RefreshCw className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => discard(item.id)} aria-label="Discard saved item"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}