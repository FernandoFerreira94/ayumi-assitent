"use client";

import { Icon } from "@/components/ui/Icon";
import { openNewAppointment } from "@/features/appointments/QuickBook";

/** "Agendar" dos atalhos do Painel: abre a mesma folha do + da barra. */
export function NewBookingButton() {
  return (
    <button
      type="button"
      onClick={() => openNewAppointment()}
      className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold"
    >
      <Icon name="plus" size={18} />
      Agendar
    </button>
  );
}
