import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Server is not configured for database access." }, { status: 500 });

  const pollId = params.id;
  const { userId, title, description, options: optionsRaw } = await req.json();

  if (!pollId) return NextResponse.json({ error: "Missing poll id" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  
  const options = (Array.isArray(optionsRaw) ? optionsRaw : [])
    .map((s: any) => String(s).trim())
    .filter((s: string) => s.length > 0);
  if (options.length < 2) return NextResponse.json({ error: "Please provide at least two options" }, { status: 400 });

  const { data: existing, error: fetchErr } = await supabase.from("polls").select("id, owner_id").eq("id", pollId).single();
  if (fetchErr || !existing) return NextResponse.json({ error: fetchErr?.message || "Poll not found" }, { status: 404 });
  if (existing.owner_id && userId && existing.owner_id !== userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  try {
    const { error: upErr } = await supabase.from("polls").update({ title, description }).eq("id", pollId);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // Replace options: delete then insert
    const { error: delErr } = await supabase.from("poll_options").delete().eq("poll_id", pollId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
    const { error: insErr } = await supabase
      .from("poll_options")
      .insert(options.map((text, index) => ({ poll_id: pollId, option_text: text, position: index })));
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
    return NextResponse.json({ success: "Changes saved" }, { status: 200 });
  } catch (_e) {
    return NextResponse.json({ error: "Unexpected error updating poll" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const supabase = getSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Server is not configured for database access." }, { status: 500 });
    
    const pollId = params.id;
    const { userId } = await req.json(); // Or get from session

    if (!pollId) return NextResponse.json({ error: "Missing poll id" }, { status: 400 });

    const { data: existing, error: fetchErr } = await supabase.from("polls").select("id, owner_id").eq("id", pollId).single();
    if (fetchErr || !existing) return NextResponse.json({ error: fetchErr?.message || "Poll not found" }, { status: 404 });
    if (existing.owner_id && userId && existing.owner_id !== userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    try {
        // Delete options first if necessary (if FK doesn't cascade)
        await supabase.from("poll_options").delete().eq("poll_id", pollId);
        const { error: delErr } = await supabase.from("polls").delete().eq("id", pollId);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
        
        revalidatePath("/polls");
        revalidatePath(`/polls/${pollId}`);
        
        return new Response(null, { status: 204 });
    } catch (_e) {
        return NextResponse.json({ error: "Unexpected error deleting poll" }, { status: 500 });
    }
}
