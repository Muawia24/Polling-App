import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { updatePollAction, type UpdatePollFormState } from "@/lib/actions";
import { ClientUserHidden } from "@/components/polls/ClientUserHidden";

interface PageProps {
  params: { id: string };
}

export default async function EditPollPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return <div className="p-6">Server not configured.</div> as any;
  const { id } = params;
  const { data: poll } = await supabase.from("polls").select("id, title, description, created_by").eq("id", id).single();
  const { data: options } = await supabase.from("poll_options").select("text").eq("poll_id", id).order("id", { ascending: true });
  if (!poll) return <div className="p-6">Poll not found.</div> as any;

  const optionsText = (options || []).map((o) => o.text).join("\n");

  return (
    <div className="p-6 flex items-start justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Edit poll</CardTitle>
          <CardDescription>Update the title, description, or options.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePollAction} className="grid gap-4">
            <input type="hidden" name="pollId" value={poll.id} />
            <TitleInput defaultValue={poll.title} />
            <DescriptionInput defaultValue={poll.description ?? ""} />
            <OptionsInput defaultValue={optionsText} />
            <ClientUserHidden />
            <SubmitButton />
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

function ClientUserHidden() {
  // Render a client subcomponent to read current user id and set a hidden input
  // to satisfy ownership checks in the server action.
  return <ClientUserHiddenInner /> as any;
}

"use client";
import React from "react";
import { useAuth as useAuthClient } from "@/context/AuthContext";
import { useFormStatus } from "react-dom";

function ClientUserHiddenInner() {
  const { user } = useAuthClient();
  return <input type="hidden" name="userId" value={user?.id || ""} />;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}


