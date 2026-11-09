"use client";

import { openNewAppointment } from "@/features/appointments/QuickBook";

/** Horário livre em Vagas: tocar abre o agendamento já com dia, horário e serviço. */
export function SlotButton({ date, time, serviceId, dayLabel }: { date: string; time: string; serviceId: string; dayLabel: string }) {
  return (
    <button
      type="button"
      onClick={() => openNewAppointment({ date, time, serviceIds: [serviceId] })}
      aria-label={`Agendar ${dayLabel} às ${time}`}
      className="min-h-11 rounded-full bg-soft px-4 text-sm font-bold text-primary-text active:scale-95"
    >
      {time}
    </button>
  );
}
