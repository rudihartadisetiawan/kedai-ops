"use client";

import { signOut, useSession } from "next-auth/react";

export default function LogoutButton() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-warm-500">{session?.user?.username}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-xs px-3 py-1 text-warm-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
      >
        Keluar
      </button>
    </div>
  );
}
