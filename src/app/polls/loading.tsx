import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PollSkeleton } from "@/components/polls/PollSkeleton";

export default function LoadingPolls() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Polls</h1>
        <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PollSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}


