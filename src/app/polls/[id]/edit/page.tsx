import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import UpdatePollForm from "@/components/polls/UpdatePollForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPollPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return <div className="p-6">Server not configured.</div> as any;
  const { id } = await params;
  const { data: poll } = await supabase.from("polls").select("id, title, description, owner_id").eq("id", id).single();
  const { data: options } = await supabase
    .from("poll_options")
    .select("option_text, position")
    .eq("poll_id", id)
    .order("position", { ascending: true });
  if (!poll) return <div className="p-6">Poll not found.</div> as any;

  const optionsText = (options || []).map((o) => o.option_text).join("\n");

  return (
    <div className="p-6 flex items-start justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Edit poll</CardTitle>
          <CardDescription>Update the title, description, or options.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePollForm
            pollId={poll.id}
            defaultTitle={poll.title}
            defaultDescription={poll.description ?? ""}
            defaultOptionsText={optionsText}
          />
        </CardContent>
      </Card>
    </div>
  );
}
