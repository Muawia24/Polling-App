import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PollList } from "@/components/polls/PollList";

const mockPolls = [
  { id: "1", title: "Favorite JS framework?", description: "React, Vue, Svelte, Angular?", totalVotes: 12 },
  { id: "2", title: "Tabs vs Spaces?", description: "Choose wisely.", totalVotes: 42 },
  { id: "3", title: "Light or Dark mode?", description: "UX matters.", totalVotes: 7 },
];

export default function PollsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Polls</h1>
        <Button asChild>
          <Link href="/polls/new">New poll</Link>
        </Button>
      </div>
      <PollList polls={mockPolls} />
    </div>
  );
} 