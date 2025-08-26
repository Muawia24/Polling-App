"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PollForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // TODO: integrate with backend/Supabase - placeholder only
      await new Promise((r) => setTimeout(r, 600));
      router.push("/polls");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Create a new poll</CardTitle>
        <CardDescription>Enter a title, optional description, and options (one per line).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="options">Options</Label>
            <Textarea id="options" value={options} onChange={(e) => setOptions(e.target.value)} rows={5} placeholder={"Option A\nOption B\nOption C"} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating..." : "Create poll"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 