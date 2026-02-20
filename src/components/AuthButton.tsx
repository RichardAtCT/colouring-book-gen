"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        ...
      </Button>
    );
  }

  if (!session) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn("google")}>
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {session.user?.name ?? session.user?.email}
      </span>
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  );
}
