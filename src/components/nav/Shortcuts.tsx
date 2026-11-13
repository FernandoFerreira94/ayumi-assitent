// src/components/nav/Shortcuts.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { openNewAppointment } from "@/features/appointments/QuickBook";
import { isDateStr, todayStr } from "@/lib/dates";
import { shiftDay, shortcutFor } from "@/lib/shortcuts";

/** Atalhos das pranchas: N novo agendamento, / busca, ← → dia anterior/seguinte e T hoje no Painel. */
export function Shortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = shortcutFor(e);
      if (!s) return;
      // Com folha ou diálogo aberto, as teclas são dele
      if (document.querySelector("dialog[open], [data-vaul-drawer][data-state='open']")) return;
      if (s === "novo") {
        e.preventDefault();
        openNewAppointment();
        return;
      }
      if (s === "buscar") {
        const box = document.querySelector<HTMLElement>("[data-search]");
        if (box) {
          e.preventDefault();
          box.focus();
        }
        return;
      }
      if (pathname !== "/agenda") return;
      e.preventDefault();
      const today = todayStr();
      const d = params.get("d");
      const current = d && isDateStr(d) ? d : today;
      const next = s === "hoje" ? today : shiftDay(current, s === "anterior" ? -1 : 1);
      router.push(next === today ? "/agenda" : `/agenda?d=${next}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname, params]);

  return null;
}
