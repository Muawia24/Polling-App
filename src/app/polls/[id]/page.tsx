import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerActions } from "../../../components/polls/OwnerActions";
import VotingForm from "../../../components/polls/VotingForm";
import SharePollButton from "../../../components/polls/SharePollButton";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Share2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PollDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  if (!supabase) notFound();

  // Get the current user (if authenticated)
  const { data: { user } } = await supabase.auth.getUser();

  // Get poll details including public status
  const { data: poll, error: pollErr } = await supabase
    .from("polls")
    .select("id, title, description, owner_id, is_public, expires_at")
    .eq("id", id)
    .single();
  if (pollErr || !poll) notFound();

  // Check if user has permission to view this poll
  const isOwner = user && poll.owner_id === user.id;
  const isPublic = poll.is_public;
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  // If not public and not the owner, show not found
  if (!isPublic && !isOwner) notFound();

  // Get poll options and vote counts
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

  // Generate share URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/polls/${id}` 
    : `/polls/${id}`;

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{poll.title}</CardTitle>
            {isOwner && <OwnerActions pollId={poll.id} createdBy={poll.owner_id ?? null} />}
          </div>
          {isPublic && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Share2 className="h-4 w-4" /> Public poll - Share with anyone
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.description && <p className="text-sm text-gray-600">{poll.description}</p>}
          
          {isExpired ? (
            <div className="bg-amber-50 p-4 rounded-md text-amber-800 text-sm">
              This poll has expired and is no longer accepting votes.
            </div>
          ) : (
            <VotingForm pollId={poll.id} options={options} />
          )}
          
          {isPublic && <SharePollButton shareUrl={shareUrl} />}
          
          {!user && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mb-2">Want to create your own polls?</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}