import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "");

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server is not configured for database access." }, { status: 500 });
  }

  const { title, description, options: optionsRaw, userId } = await req.json();

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!userId) return NextResponse.json({ error: "You must be logged in to create a poll" }, { status: 401 });

  const options = (Array.isArray(optionsRaw) ? optionsRaw : [])
    .map((s: any) => String(s).trim())
    .filter((s: string) => s.length > 0);

  if (options.length < 2) return NextResponse.json({ error: "Please provide at least two options" }, { status: 400 });

  try {
    const { data: poll, error: insertPollError } = await supabase
      .from("polls")
      .insert({ title, description, owner_id: userId })
      .select("id")
      .single();

    if (insertPollError || !poll) {
      console.log("owner_id", userId);
      
      console.error("Failed to insert poll", insertPollError);
      return NextResponse.json({ error: insertPollError?.message || "Failed to create poll" }, { status: 500 });
    }

    const optionRows = options.map((text, index) => ({ poll_id: poll.id, option_text: text, position: index }));
    const { error: insertOptionsError } = await supabase.from("poll_options").insert(optionRows);
    if (insertOptionsError) {
      // Attempt to clean up the created poll if options fail to insert
      await supabase.from("polls").delete().eq("id", poll.id);
      console.error("Failed to insert poll options, deleted poll", insertOptionsError);
      return NextResponse.json({ error: insertOptionsError.message }, { status: 500 });
    }

    revalidatePath("/polls");
    revalidatePath(`/polls/${poll.id}`);
    return NextResponse.json({ success: "Poll created successfully", poll: { id: poll.id } }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Unexpected error creating poll" }, { status: 500 });
  }
}

