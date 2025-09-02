"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b py-3 px-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="font-semibold text-lg">
          Polling App
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}