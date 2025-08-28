export function PollSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
    </div>
  );
}


