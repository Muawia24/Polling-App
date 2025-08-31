"use client";

import React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updatePollAction, type UpdatePollFormState } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClientUserHidden } from "@/components/polls/ClientUserHidden";

export interface UpdatePollFormProps {
  pollId: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOptionsText: string;
}

export default function UpdatePollForm({ pollId, defaultTitle, defaultDescription, defaultOptionsText }: UpdatePollFormProps) {
  const initialState: UpdatePollFormState = {};
  const [state, formAction] = useFormState(updatePollAction, initialState);
  return (
    <form action={formAction} className="grid gap-4">
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
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}


