"use client";

import { useAuth } from "@/context/AuthContext";

export function ClientUserHidden() {
  const { user } = useAuth();
  return <input type="hidden" name="userId" value={user?.id || ""} />;
}


