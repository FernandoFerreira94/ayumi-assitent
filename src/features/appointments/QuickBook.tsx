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

/** `clientId` abre a folha já com a cliente escolhida. */
export function openNewAppointment(clientId?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(OPEN_NEW_APPOINTMENT, { detail: clientId }));
}

/** Folha "Novo agendamento" de qualquer tela. Busca clientes e serviços a cada abertura para vir quem acabou de entrar. */
export function QuickBook() {
  const pathname = usePathname();
  const d = useSearchParams().get("d");
  const [openKey, setOpenKey] = useState(0);
  const [clientId, setClientId] = useState<string>();
  const [options, setOptions] = useState<BookingOptions | null>(null);

  useEffect(() => {
    async function onOpen(e?: Event) {
      setClientId((e as CustomEvent<string | undefined> | undefined)?.detail);
      setOpenKey((k) => k + 1);
      const res = await loadBookingOptions();
      if (res.ok) setOptions(res.data);
      else notify.error(res.code, () => void onOpen(e));
    }
    window.addEventListener(OPEN_NEW_APPOINTMENT, onOpen);
    return () => window.removeEventListener(OPEN_NEW_APPOINTMENT, onOpen);
  }, []);

  // Na Agenda, agenda no dia que está na tela
  const date = (pathname === "/calendario" || pathname === "/agenda") && d && isDateStr(d) ? d : todayStr();
  return (
    <NewAppointmentSheet
      date={date}
      openKey={openKey}
      clientId={clientId}
      clients={options?.clients ?? null}
      services={options?.services ?? null}
    />
  );
}
