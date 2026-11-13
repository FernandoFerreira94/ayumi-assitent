"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { legacyTarget } from "./sections";

/** `/ajustes#google` (link salvo, aviso antigo) abre a seção nova; o hash não chega ao servidor, por isso é aqui. */
export function LegacyHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const to = legacyTarget(window.location.hash);
    if (to) router.replace(to);
  }, [router]);
  return null;
}
