import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Server is not configured for database access." }, { status: 500 });

  const pollId = params.id;
  const { optionId, userId, fingerprint } = await req.json();
  
  if (!pollId) return NextResponse.json({ error: "Missing poll ID" }, { status: 400 });
  if (!optionId) return NextResponse.json({ error: "No option selected" }, { status: 400 });
  
  try {
    // Verify the poll exists and is public
    const { data: poll, error: pollErr } = await supabase
      .from("polls")
      .select("id, is_public, expires_at")
      .eq("id", pollId)
      .single();
      
    if (pollErr || !poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (!poll.is_public) return NextResponse.json({ error: "This poll is not available for voting" }, { status: 403 });
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json({ error: "This poll has expired" }, { status: 410 }); // 410 Gone
    }
    
    // Verify the option belongs to the poll
    const { data: option, error: optionErr } = await supabase
      .from("poll_options")
      .select("id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .single();
      
    if (optionErr || !option) return NextResponse.json({ error: "Invalid option selected" }, { status: 400 });
    
    // Check if user has already voted
    let existingVoteQuery = supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId);
      
    if (userId) {
      // Check by user ID if authenticated
      existingVoteQuery = existingVoteQuery.eq("voter_id", userId);
    } else if (fingerprint) {
      // Check by fingerprint if anonymous
      existingVoteQuery = existingVoteQuery.eq("voter_fingerprint", fingerprint);
    } else {
      // If no user and no fingerprint, we can't check for duplicate votes for anonymous users.
      // Depending on requirements, we might deny the vote or allow it.
      // For this conversion, I'll assume a fingerprint is required for anonymous votes.
      return NextResponse.json({ error: "Cannot vote without being logged in or providing a fingerprint." }, { status: 400 });
    }
    
    const { data: existingVote, error: voteErr } = await existingVoteQuery.maybeSingle();
    
    if (voteErr) {
      console.error("Error checking for existing vote:", voteErr);
      return NextResponse.json({ error: "Error checking for existing vote" }, { status: 500 });
    }

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted on this poll" }, { status: 409 }); // 409 Conflict
    }
    
    // Record the vote
    const { error: insertErr } = await supabase
      .from("votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        voter_id: userId || null,
        voter_ip: null, // We're not tracking IPs in this implementation
        voter_fingerprint: fingerprint // Use fingerprint for anonymous users
      });
      
    if (insertErr) {
      if (insertErr.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: "You have already voted on this poll" }, { status: 409 });
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    
    // Revalidate the poll page to show updated vote counts
    revalidatePath(`/polls/${pollId}`);
    return NextResponse.json({ success: "Your vote has been recorded" }, { status: 201 });
  } catch (e: any) {
    console.error("Error submitting vote:", e);
    return NextResponse.json({ error: "Unexpected error submitting vote" }, { status: 500 });
  }
}
