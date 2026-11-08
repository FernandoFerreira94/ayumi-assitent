"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Sai da conta e volta ao login. Fica ao lado do sino, no mesmo vidro. */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      aria-label="Sair da conta"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="btn-glass grid size-11 shrink-0 place-content-center rounded-full disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 4.5h3a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5h-3" />
        <path d="M10 8l-4 4 4 4M6 12h9" />
      </svg>
    </button>
  );
}
