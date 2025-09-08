"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPoll } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";


export default function PollForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { user, session } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setSuccess(undefined);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim();
    const optionsRaw = formData.get("options")?.toString() || "";
    const options = optionsRaw.split("\n").map(s => s.trim()).filter(s => s.length > 0);
    const userId = user?.id || "";

    const result = await createPoll({ title, description, options, userId }, session?.access_token);


    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.success || "Poll created!");
      setTimeout(() => router.push("/polls"), 800);
    }
    setSubmitting(false);
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Create a new poll</CardTitle>
        <CardDescription>Enter a title, optional description, and options (one per line).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
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
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating..." : "Create poll"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 