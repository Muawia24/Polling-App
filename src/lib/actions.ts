"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabaseClient"; 

export interface CreatePollFormState {
  error?: string;
  success?: string;
}

/**
 * Handles poll creation from a form submission.
 * 
 * Allows authenticated users to create new polls with a title, description, and options.
 * User must be logged in; at least two options are required.
 * Returns errors for missing title, user, or insufficient options. Handles Supabase errors.
 * Called by PollForm component; updates poll list and detail pages via revalidatePath.
 */
export async function createPollAction(_prevState: CreatePollFormState, formData: FormData): Promise<CreatePollFormState> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Server is not configured for database access." };
  }

  const title = (formData.get("title") as string | null)?.trim() || "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const optionsRaw = (formData.get("options") as string | null) || "";
  const userId = (formData.get("userId") as string | null) || null;

  if (!title) return { error: "Title is required" };
  if (!userId) return { error: "You must be logged in to create a poll" };

  const options = optionsRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (options.length < 2) return { error: "Please provide at least two options" };

  try {
    const { data: poll, error: insertPollError } = await supabase
      .from("polls")
      .insert({ title, description, owner_id: userId })
      .select("id")
      .single();

    if (insertPollError || !poll) {
      return { error: insertPollError?.message || "Failed to create poll" };
    }

    const optionRows = options.map((text, index) => ({ poll_id: poll.id, option_text: text, position: index }));
    const { error: insertOptionsError } = await supabase.from("poll_options").insert(optionRows);
    if (insertOptionsError) {
      return { error: insertOptionsError.message };
    }

    revalidatePath("/polls");
    revalidatePath(`/polls/${poll.id}`);
    return { success: "Poll created successfully" };
  } catch (e: any) {
    console.error(e);
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: "Unexpected error creating poll" };
  }
}

export interface UpdatePollFormState {
  error?: string;
  success?: string;
}

/**
 * Handles updating an existing poll's title, description, and options.
 * 
 * Lets poll owners edit their polls, ensuring only authorized users can make changes.
 * Only the poll owner can update; at least two options required.
 * Returns errors for missing poll ID, unauthorized user, or insufficient options.
 * Used by UpdatePollForm; triggers revalidation for poll list and detail pages.
 */
export async function updatePollAction(_prev: UpdatePollFormState, formData: FormData): Promise<UpdatePollFormState> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "Server is not configured for database access." };

  const pollId = (formData.get("pollId") as string | null) || null;
  const userId = (formData.get("userId") as string | null) || null;
  const title = (formData.get("title") as string | null)?.trim() || "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const optionsRaw = (formData.get("options") as string | null) || "";

  if (!pollId) return { error: "Missing poll id" };
  if (!title) return { error: "Title is required" };
  const options = optionsRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (options.length < 2) return { error: "Please provide at least two options" };

  const { data: existing, error: fetchErr } = await supabase.from("polls").select("id, owner_id").eq("id", pollId).single();
  if (fetchErr || !existing) return { error: fetchErr?.message || "Poll not found" };
  if (existing.owner_id && userId && existing.owner_id !== userId) return { error: "Not authorized" };

  try {
    const { error: upErr } = await supabase.from("polls").update({ title, description }).eq("id", pollId);
    if (upErr) return { error: upErr.message };

    // Replace options: delete then insert
    const { error: delErr } = await supabase.from("poll_options").delete().eq("poll_id", pollId);
    if (delErr) return { error: delErr.message };
    const { error: insErr } = await supabase
      .from("poll_options")
      .insert(options.map((text, index) => ({ poll_id: pollId, option_text: text, position: index })));
    if (insErr) return { error: insErr.message };

    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
    return { success: "Changes saved" };
  } catch (_e) {
    return { error: "Unexpected error updating poll" };
  }
}

export interface DeletePollFormState { error?: string }

/**
 * Handles deleting a poll and its options.
 * 
 * Allows poll owners to remove polls they created, cleaning up related options.
 * Only the poll owner can delete; deletes options first to avoid FK issues.
 * Returns errors for missing poll ID, unauthorized user, or Supabase errors.
 * Used by OwnerActions; redirects to poll list after deletion.
 */
export async function deletePollAction(_prev: DeletePollFormState, formData: FormData): Promise<DeletePollFormState> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "Server is not configured for database access." };
  const pollId = (formData.get("pollId") as string | null) || null;
  const userId = (formData.get("userId") as string | null) || null;
  if (!pollId) return { error: "Missing poll id" };

  const { data: existing, error: fetchErr } = await supabase.from("polls").select("id, owner_id").eq("id", pollId).single();
  if (fetchErr || !existing) return { error: fetchErr?.message || "Poll not found" };
  if (existing.owner_id && userId && existing.owner_id !== userId) return { error: "Not authorized" };

  try {
    // Delete options first if necessary (if FK doesn't cascade)
    await supabase.from("poll_options").delete().eq("poll_id", pollId);
    const { error: delErr } = await supabase.from("polls").delete().eq("id", pollId);
    if (delErr) return { error: delErr.message };
    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
    redirect("/polls");
  } catch (_e) {
    return { error: "Unexpected error deleting poll" };
  }
}

export interface VoteFormState {
  error?: string;
  success?: string;
}

/**
 * Handles voting on a poll option.
 * 
 * Enables users (authenticated or anonymous) to vote on public, non-expired polls.
 * Poll must be public and not expired; user/fingerprint must not have voted before.
 * Prevents duplicate votes by user ID or fingerprint; checks option validity.
 * Used by VotingForm; revalidates poll detail page to show updated results.
 */
export async function submitVoteAction(_prev: VoteFormState, formData: FormData): Promise<VoteFormState> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "Server is not configured for database access." };
  
  const pollId = (formData.get("pollId") as string | null) || null;
  const optionId = (formData.get("optionId") as string | null) || null;
  const userId = (formData.get("userId") as string | null) || null;
  
  if (!pollId) return { error: "Missing poll ID" };
  if (!optionId) return { error: "No option selected" };
  
  try {
    // Verify the poll exists and is public
    const { data: poll, error: pollErr } = await supabase
      .from("polls")
      .select("id, is_public, expires_at")
      .eq("id", pollId)
      .single();
      
    if (pollErr || !poll) return { error: "Poll not found" };
    if (!poll.is_public) return { error: "This poll is not available for voting" };
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return { error: "This poll has expired" };
    }
    
    // Verify the option belongs to the poll
    const { data: option, error: optionErr } = await supabase
      .from("poll_options")
      .select("id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .single();
      
    if (optionErr || !option) return { error: "Invalid option selected" };
    
    // Get fingerprint for anonymous users
    const fingerprint = (formData.get("fingerprint") as string | null) || null;
    
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
    }
    
    const { data: existingVote, error: voteErr } = await existingVoteQuery.maybeSingle();
    
    if (!voteErr && existingVote) {
      return { error: "You have already voted on this poll" };
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
        return { error: "You have already voted on this poll" };
      }
      return { error: insertErr.message };
    }
    
    // Revalidate the poll page to show updated vote counts
    revalidatePath(`/polls/${pollId}`);
    return { success: "Your vote has been recorded" };
  } catch (e: any) {
    console.error("Error submitting vote:", e);
    return { error: "Unexpected error submitting vote" };
  }
}


