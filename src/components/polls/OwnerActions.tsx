"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import React from "react";
import { deletePollAction, type DeletePollFormState } from "@/lib/actions";
import { useFormState, useFormStatus } from "react-dom";

export function OwnerActions({ pollId, createdBy }: { pollId: string; createdBy: string | null }) {
  const { user } = useAuth();
  if (!user || !createdBy || user.id !== createdBy) return null;
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/polls/${pollId}/edit`}>Edit</Link>
      </Button>
      <DeleteButton pollId={pollId} userId={user.id} />
    </div>
  );
}

function DeleteButton({ pollId, userId }: { pollId: string; userId: string }) {
  const [state, formAction] = useFormState<DeletePollFormState, FormData>(deletePollAction, {});
  const { pending } = useFormStatus();
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="userId" value={userId} />
      {state?.error ? <span className="text-xs text-red-600 mr-2">{state.error}</span> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting..." : "Delete"}
      </Button>
    </form>
  );
}


