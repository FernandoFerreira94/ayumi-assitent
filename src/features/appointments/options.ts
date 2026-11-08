import type { PickerOption } from "@/components/ui/LetterPicker";
import { formatBRL } from "@/lib/dates";
import { maskPhone } from "@/lib/phone";

export type BookingOptions = { clients: PickerOption[]; services: PickerOption[] };

/** Clientes e serviços no formato do seletor da folha "Novo agendamento". */
export function bookingOptions(
  clients: { id: string; name: string; phoneE164: string }[],
  services: { id: string; name: string; priceCents: number }[],
): BookingOptions {
  return {
    clients: clients.map((c) => ({ id: c.id, label: c.name, hint: maskPhone(c.phoneE164.replace(/^\+55/, "")) })),
    services: services.map((s) => ({ id: s.id, label: s.name, hint: formatBRL(s.priceCents) })),
  };
}
