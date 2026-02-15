import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Today's Focus skeleton */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="p-4 border-t border-border flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Overview skeleton */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <Skeleton className="h-3 w-20 mb-3" />
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
          {/* Activity graph skeleton */}
          <div className="mt-3 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-5 w-8 ml-auto" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Summary skeleton */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teams skeleton */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-lg border border-border">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSkeleton;
