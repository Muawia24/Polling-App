"use client";

import React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPollAction, type CreatePollFormState } from "@/lib/actions";
import { useAuth } from "@/context/AuthContext";

export default function PollForm() {
  const initialState: CreatePollFormState = {};
  const [state, formAction] = useFormState(createPollAction, initialState);
  const { user } = useAuth();

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Create a new poll</CardTitle>
        <CardDescription>Enter a title, optional description, and options (one per line).</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="userId" value={user?.id || ""} />
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="options">Options</Label>
            <Textarea id="options" name="options" rows={5} placeholder={"Option A\nOption B\nOption C"} />
          </div>
          {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
} 

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating..." : "Create poll"}
    </Button>
  );
}