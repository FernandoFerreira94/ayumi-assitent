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

/** O que já vem escolhido ao abrir: cliente (em Clientes) ou dia, horário e serviço (em Vagas). */
export type BookingPreset = { clientId?: string; date?: string; time?: string; serviceIds?: string[] };

export function openNewAppointment(preset: BookingPreset = {}) {
  window.dispatchEvent(new CustomEvent<BookingPreset>(OPEN_NEW_APPOINTMENT, { detail: preset }));
}

/** Folha "Novo agendamento" de qualquer tela. Busca clientes e serviços a cada abertura para vir quem acabou de entrar. */
export function QuickBook() {
  const pathname = usePathname();
  const d = useSearchParams().get("d");
  const [openKey, setOpenKey] = useState(0);
  const [preset, setPreset] = useState<BookingPreset>({});
  const [options, setOptions] = useState<BookingOptions | null>(null);

  useEffect(() => {
    async function onOpen(e?: Event) {
      setPreset((e as CustomEvent<BookingPreset | undefined> | undefined)?.detail ?? {});
      setOpenKey((k) => k + 1);
      const res = await loadBookingOptions();
      if (res.ok) setOptions(res.data);
      else notify.error(res.code, () => void onOpen(e));
    }
    window.addEventListener(OPEN_NEW_APPOINTMENT, onOpen);
    return () => window.removeEventListener(OPEN_NEW_APPOINTMENT, onOpen);
  }, []);

  // Na Agenda, agenda no dia que está na tela; em Vagas, no dia do horário tocado
  const shown = (pathname === "/calendario" || pathname === "/agenda") && d && isDateStr(d) ? d : todayStr();
  const date = preset.date && isDateStr(preset.date) ? preset.date : shown;
  return (
    <NewAppointmentSheet
      date={date}
      openKey={openKey}
      clientId={preset.clientId}
      time={preset.time}
      serviceIds={preset.serviceIds}
      clients={options?.clients ?? null}
      services={options?.services ?? null}
      week={options?.week ?? null}
    />
  );
}
