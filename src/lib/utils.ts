import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export type CreatePollPayload = {
  title: string;
  description?: string;
  options: string[];
  userId: string;
};

export type CreatePollResult = {
  success?: string;
  error?: string;
  poll?: { id: string };
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function createPoll(payload: CreatePollPayload, accessToken?: string): Promise<CreatePollResult> {
  const res = await fetch("/api/polls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export type UpdatePollPayload = {
  pollId: string;
  title: string;
  description?: string;
  options: string[];
  userId: string;
};

export type UpdatePollResult = {
  success?: string;
  error?: string;
};

export async function updatePoll(payload: UpdatePollPayload): Promise<UpdatePollResult> {
  const res = await fetch(`/api/polls/${payload.pollId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export type DeletePollPayload = {
  pollId: string;
  userId: string;
};

export type DeletePollResult = {
  error?: string;
};

export async function deletePoll(payload: DeletePollPayload): Promise<DeletePollResult> {
  const res = await fetch(`/api/polls/${payload.pollId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: payload.userId }),
  });
  return res.json();
}

export type SubmitVotePayload = {
  pollId: string;
  optionId: string;
  userId?: string;
  fingerprint?: string;
};

export type SubmitVoteResult = {
  success?: string;
  error?: string;
};

export async function submitVote(payload: SubmitVotePayload, accessToken?: string): Promise<SubmitVoteResult> {
  const res = await fetch(`/api/polls/${payload.pollId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}