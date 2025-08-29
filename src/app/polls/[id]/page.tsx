import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OwnerActions } from "../../../components/polls/OwnerActions";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function PollDetailPage({ params }: PageProps) {
  const { id } = params;
  const supabase = getSupabaseServerClient();
  if (!supabase) notFound();

  const { data: poll, error: pollErr } = await supabase
    .from("polls")
    .select("id, title, description, owner_id")
    .eq("id", id)
    .single();
  if (pollErr || !poll) notFound();

  const { data: optionRows } = await supabase
    .from("poll_options")
    .select("id, option_text")
    .eq("poll_id", id)
    .order("position", { ascending: true });
  const { data: countsRows } = await supabase
    .from("poll_option_counts")
    .select("option_id, vote_count")
    .eq("poll_id", id);
  const countsMap = new Map<string, number>();
  (countsRows || []).forEach((r: any) => countsMap.set(r.option_id, r.vote_count || 0));
  const options = (optionRows || []).map((o: any) => ({ id: o.id as string, text: o.option_text as string, votes: countsMap.get(o.id) || 0 }));

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{poll.title}</CardTitle>
            <OwnerActions pollId={poll.id} createdBy={poll.owner_id ?? null} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{poll.description}</p>
          <ul className="space-y-2">
            {options.map((opt) => (
              <li key={opt.id} className="flex items-center justify-between rounded border p-3">
                <span>{opt.text}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{opt.votes ?? 0} votes</span>
                  <Button size="sm" variant="secondary">Vote</Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 