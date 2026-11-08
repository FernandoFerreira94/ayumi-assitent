"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Dock } from "./Dock";
import { FanNav } from "./FanNav";

type Kind = "leque" | "barra";
const KEY = "nav";
const isKind = (v: string | null): v is Kind => v === "leque" || v === "barra";
const noSubscribe = () => () => {};

function readSaved(): Kind {
  try {
    const saved = localStorage.getItem(KEY);
    return isKind(saved) ? saved : "leque";
  } catch {
    // Sem storage (aba privada): fica no padrão
    return "leque";
  }
}

/**
 * Prévia para comparar os dois navs: ?nav=barra volta ao dock antigo, ?nav=leque ao novo.
 * A escolha fica no aparelho. Sai quando o Fernando decidir qual fica.
 */
export function NavSwitch() {
  const param = useSearchParams().get(KEY);
  const saved = useSyncExternalStore(noSubscribe, readSaved, () => "leque" as const);

  useEffect(() => {
    try {
      if (isKind(param)) localStorage.setItem(KEY, param);
    } catch {
      // Sem storage: vale só a escolha da URL
    }
  }, [param]);

  const kind = isKind(param) ? param : saved;
  return kind === "barra" ? <Dock /> : <FanNav />;
}
