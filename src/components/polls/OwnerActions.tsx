"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { deletePoll} from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  const handleDelete = async () => {
    setPending(true);
    setError(undefined);
    const result = await deletePoll({ pollId, userId });
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/polls");
    }
    setPending(false);
  };

  return (
    <form onSubmit={handleDelete} className="inline">
      <input type="hidden" name="pollId" value={pollId} />
      <input type="hidden" name="userId" value={userId} />
      {error ? <span className="text-xs text-red-600 mr-2">{error}</span> : null}
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Deleting..." : "Delete"}
      </Button>
    </form>
  );
}