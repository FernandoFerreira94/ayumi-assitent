"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { isDateStr, todayStr } from "@/lib/dates";
import { loadBookingOptions } from "./actions";
import { NewAppointmentSheet } from "./NewAppointmentSheet";
import type { BookingOptions } from "./options";

/** Evento que o "Novo" do nav dispara: abre a folha por cima da tela atual, sem navegar. */
export const OPEN_NEW_APPOINTMENT = "ayumi:novo-agendamento";

export function openNewAppointment() {
  window.dispatchEvent(new Event(OPEN_NEW_APPOINTMENT));
}

/** Folha "Novo agendamento" de qualquer tela. Busca clientes e serviços a cada abertura para vir quem acabou de entrar. */
export function QuickBook() {
  const pathname = usePathname();
  const d = useSearchParams().get("d");
  const [openKey, setOpenKey] = useState(0);
  const [options, setOptions] = useState<BookingOptions | null>(null);

  useEffect(() => {
    async function onOpen() {
      setOpenKey((k) => k + 1);
      const res = await loadBookingOptions();
      if (res.ok) setOptions(res.data);
      else notify.error(res.code, onOpen);
    }
    window.addEventListener(OPEN_NEW_APPOINTMENT, onOpen);
    return () => window.removeEventListener(OPEN_NEW_APPOINTMENT, onOpen);
  }, []);

  // Na Agenda, agenda no dia que está na tela
  const date = pathname === "/calendario" && d && isDateStr(d) ? d : todayStr();
  return (
    <NewAppointmentSheet
      date={date}
      openKey={openKey}
      clients={options?.clients ?? null}
      services={options?.services ?? null}
    />
  );
}
