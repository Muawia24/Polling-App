"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export interface CreatePollFormState {
  error?: string;
}

export async function createPollAction(_prevState: CreatePollFormState, formData: FormData): Promise<CreatePollFormState> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { error: "Server is not configured for database access." };
  }

  const title = (formData.get("title") as string | null)?.trim() || "";
  const description = (formData.get("description") as string | null)?.trim() || null;
  const optionsRaw = (formData.get("options") as string | null) || "";
  const userId = (formData.get("userId") as string | null) || null;

  if (!title) return { error: "Title is required" };

  const options = optionsRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (options.length < 2) return { error: "Please provide at least two options" };

  try {
    const { data: poll, error: insertPollError } = await supabase
      .from("polls")
      .insert({ title, description, created_by: userId })
      .select("id")
      .single();

    if (insertPollError || !poll) {
      return { error: insertPollError?.message || "Failed to create poll" };
    }

    const optionRows = options.map((text) => ({ poll_id: poll.id, text }));
    const { error: insertOptionsError } = await supabase.from("poll_options").insert(optionRows);
    if (insertOptionsError) {
      return { error: insertOptionsError.message };
    }

    redirect(`/polls/${poll.id}`);
  } catch (e) {
    return { error: "Unexpected error creating poll" };
  }
}

export interface UpdatePollFormState {
  error?: string;
}

export async function updatePollAction(_prev: UpdatePollFormState, formData: FormData): Promise<UpdatePollFormState> {
  const supabase = getSupabaseServerClient();
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

  const { data: existing, error: fetchErr } = await supabase.from("polls").select("id, created_by").eq("id", pollId).single();
  if (fetchErr || !existing) return { error: fetchErr?.message || "Poll not found" };
  if (existing.created_by && userId && existing.created_by !== userId) return { error: "Not authorized" };

  try {
    const { error: upErr } = await supabase.from("polls").update({ title, description }).eq("id", pollId);
    if (upErr) return { error: upErr.message };

    // Replace options: delete then insert
    const { error: delErr } = await supabase.from("poll_options").delete().eq("poll_id", pollId);
    if (delErr) return { error: delErr.message };
    const { error: insErr } = await supabase
      .from("poll_options")
      .insert(options.map((text) => ({ poll_id: pollId, text })));
    if (insErr) return { error: insErr.message };

    redirect(`/polls/${pollId}`);
  } catch (_e) {
    return { error: "Unexpected error updating poll" };
  }
}

export interface DeletePollFormState { error?: string }

export async function deletePollAction(_prev: DeletePollFormState, formData: FormData): Promise<DeletePollFormState> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { error: "Server is not configured for database access." };
  const pollId = (formData.get("pollId") as string | null) || null;
  const userId = (formData.get("userId") as string | null) || null;
  if (!pollId) return { error: "Missing poll id" };

  const { data: existing, error: fetchErr } = await supabase.from("polls").select("id, created_by").eq("id", pollId).single();
  if (fetchErr || !existing) return { error: fetchErr?.message || "Poll not found" };
  if (existing.created_by && userId && existing.created_by !== userId) return { error: "Not authorized" };

  try {
    // Delete options first if necessary (if FK doesn't cascade)
    await supabase.from("poll_options").delete().eq("poll_id", pollId);
    const { error: delErr } = await supabase.from("polls").delete().eq("id", pollId);
    if (delErr) return { error: delErr.message };
    redirect("/polls");
  } catch (_e) {
    return { error: "Unexpected error deleting poll" };
  }
}


