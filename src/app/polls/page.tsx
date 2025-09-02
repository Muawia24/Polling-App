import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PollList } from "@/components/polls/PollList";
import { getSupabaseClient } from "@/lib/supabaseClient"; 

export default async function PollsPage() {
  const supabase = getSupabaseClient();

  let polls: Array<{ id: string; title: string; description: string | null; owner_id: string | null }> = [];
  let totalVotesByPollId = new Map<string, number>();

  if (supabase) {
    const { data: pollRows } = await supabase
      .from("polls")
      .select("id, title, description, owner_id")
      .order("created_at", { ascending: false });
    polls = pollRows || [];

    const { data: countsRows } = await supabase
      .from("poll_option_counts")
      .select("poll_id, vote_count");
    if (countsRows) {
      for (const row of countsRows as Array<{ poll_id: string; vote_count: number }>) {
        totalVotesByPollId.set(row.poll_id, (totalVotesByPollId.get(row.poll_id) || 0) + (row.vote_count || 0));
      }
    }
  }

  const listItems = polls.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    totalVotes: totalVotesByPollId.get(p.id) || 0,
    createdBy: p.owner_id ?? null,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Polls</h1>
        <Button asChild>
          <Link href="/polls/new">New poll</Link>
        </Button>
      </div>
      <PollList polls={listItems} />
    </div>
  );
}