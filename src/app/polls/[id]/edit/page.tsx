import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { updatePollAction, type UpdatePollFormState } from "@/lib/actions";
import { ClientUserHidden } from "@/components/polls/ClientUserHidden";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: { id: string };
}

export default async function EditPollPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return <div className="p-6">Server not configured.</div> as any;
  const { id } = params;
  const { data: poll } = await supabase.from("polls").select("id, title, description, owner_id").eq("id", id).single();
  const { data: options } = await supabase
    .from("poll_options")
    .select("option_text, position")
    .eq("poll_id", id)
    .order("position", { ascending: true });
  if (!poll) return <div className="p-6">Poll not found.</div> as any;

  const optionsText = (options || []).map((o) => o.option_text).join("\n");

  async function updateAction(formData: FormData) {
    "use server";
    await updatePollAction({}, formData);
  }

  return (
    <div className="p-6 flex items-start justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Edit poll</CardTitle>
          <CardDescription>Update the title, description, or options.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="grid gap-4">
            <input type="hidden" name="pollId" value={poll.id} />
            <TitleInput defaultValue={poll.title} />
            <DescriptionInput defaultValue={poll.description ?? ""} />
            <OptionsInput defaultValue={optionsText} />
            <ClientUserHidden />
            <Button type="submit" className="w-full">Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TitleInput({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="grid gap-2">
      <label htmlFor="title" className="text-sm font-medium">Title</label>
      <Input id="title" name="title" defaultValue={defaultValue} required />
    </div>
  );
}

function DescriptionInput({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="grid gap-2">
      <label htmlFor="description" className="text-sm font-medium">Description</label>
      <Textarea id="description" name="description" rows={3} defaultValue={defaultValue} />
    </div>
  );
}

function OptionsInput({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="grid gap-2">
      <label htmlFor="options" className="text-sm font-medium">Options</label>
      <Textarea id="options" name="options" rows={5} defaultValue={defaultValue} />
    </div>
  );
}

 
