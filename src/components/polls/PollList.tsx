import { PollCard, type PollCardProps } from "@/components/polls/PollCard";

export interface PollListProps {
  polls: Array<PollCardProps>;
}

export function PollList({ polls }: PollListProps) {
  if (!polls?.length) {
    return <p className="text-sm text-gray-500">No polls yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {polls.map((poll) => (
        <PollCard key={poll.id} {...poll} />
      ))}
    </div>
  );
} 