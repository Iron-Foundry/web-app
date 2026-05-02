import { Skeleton } from "@/components/ui/skeleton";

export function MemberDashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <div className="col-span-12 md:col-span-4 space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="col-span-12 md:col-span-8 space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
