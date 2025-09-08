"use client";

import React, { useState } from "react";
import { updatePoll, type UpdatePollResult } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClientUserHidden } from "@/components/polls/ClientUserHidden";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export interface UpdatePollFormProps {
  pollId: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOptionsText: string;
}

export default function UpdatePollForm({
  pollId,
  defaultTitle,
  defaultDescription,
  defaultOptionsText,
}: UpdatePollFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<UpdatePollResult>({});
  const { user, session } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setState({});
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim();
    const optionsRaw = formData.get("options")?.toString() || "";
    const options = optionsRaw.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    const userId = user?.id || "";

    const result = await updatePoll(
      { pollId, title, description, options, userId },
      session?.access_token
    );
    setState(result);
    setSubmitting(false);

    if (result.success) {
      setTimeout(() => router.push(`/polls/${pollId}`), 800);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="pollId" value={pollId} />
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <Input id="title" name="title" defaultValue={defaultTitle} required />
      </div>
      <div className="grid gap-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <Textarea id="description" name="description" rows={3} defaultValue={defaultDescription} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="options" className="text-sm font-medium">Options</label>
        <Textarea id="options" name="options" rows={5} defaultValue={defaultOptionsText} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.error ? null : state && "success" in state ? <p className="text-sm text-green-600">Changes saved</p> : null}
      <ClientUserHidden />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}