import type { PickerOption } from "@/components/ui/LetterPicker";
import { formatBRL } from "@/lib/dates";
import type { Day } from "@/features/hours/slots";
import { maskPhone } from "@/lib/phone";

/** Serviço no seletor, com valor e duração para a folha mostrar o total antes de agendar. */
export type ServiceOption = PickerOption & { priceCents: number; durationMin: number };
export type BookingOptions = {
  clients: PickerOption[];
  services: ServiceOption[];
  /** Expediente da semana (só na folha do "Novo"), para avisar horário fora dele. */
  week?: Day[];
};

/** Clientes e serviços no formato do seletor da folha "Novo agendamento". */
export function bookingOptions(
  clients: { id: string; name: string; phoneE164: string }[],
  services: { id: string; name: string; priceCents: number; durationMin: number }[],
): BookingOptions {
  return {
    clients: clients.map((c) => ({ id: c.id, label: c.name, hint: maskPhone(c.phoneE164.replace(/^\+55/, "")) })),
    services: services.map((s) => ({
      id: s.id,
      label: s.name,
      hint: formatBRL(s.priceCents),
      priceCents: s.priceCents,
      durationMin: s.durationMin,
    })),
  };
}
