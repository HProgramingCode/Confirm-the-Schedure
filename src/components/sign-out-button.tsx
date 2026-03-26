"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="min-h-10 rounded-md border border-zinc-400 px-3 text-sm text-zinc-800"
    >
      ログアウト
    </button>
  );
}
