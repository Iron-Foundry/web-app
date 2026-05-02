import { Skeleton } from "@/components/ui/skeleton";

export function ContentTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      <Skeleton className="h-9 w-48 mb-4" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}
