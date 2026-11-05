import { z } from "zod";
import { isDateStr } from "@/lib/dates";

export const appointmentInput = z.object({
  clientId: z.string().uuid("Escolha a cliente"),
  serviceId: z.string().uuid("Escolha o serviço"),
  date: z.string().refine(isDateStr, "Data inválida"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
});
export type AppointmentInput = z.infer<typeof appointmentInput>;

export const STATUSES = ["pending_confirmation", "confirmed", "cancelled", "done", "no_show"] as const;
export type Status = (typeof STATUSES)[number];
