import { describe, expect, it } from "vitest";
import { dayForecast, dayPendencias, upcoming } from "@/features/appointments/day-panel";
import type { Status } from "@/features/appointments/schema";

const at = (hhmm: string) => new Date(`2026-11-08T${hhmm}:00-03:00`);
const now = at("12:00");

const row = (start: string, end: string, status: Status, priceCents = 10000, clientName = "Ana") => ({
  id: `${start}-${status}`,
  startsAt: at(start),
  endsAt: at(end),
  priceCents,
  status,
  clientName,
  serviceName: "Manicure",
});

describe("previsão de ganho do dia", () => {
  it("separa concluído, confirmado e aguardando, sem contar falta", () => {
    const rows = [
      row("09:00", "10:00", "done", 5000),
      row("13:00", "14:00", "confirmed", 7000),
      row("15:00", "16:00", "pending_confirmation", 3000),
      row("16:00", "17:00", "reschedule_requested", 2000),
      row("10:00", "11:00", "no_show", 9000),
    ];
    expect(dayForecast(rows)).toEqual({ doneCents: 5000, confirmedCents: 7000, waitingCents: 5000, totalCents: 17000 });
  });
  it("dia vazio zera tudo", () => {
    expect(dayForecast([])).toEqual({ doneCents: 0, confirmedCents: 0, waitingCents: 0, totalCents: 0 });
  });
});

describe("próximos atendimentos", () => {
  it("lista só os em aberto que ainda vão começar, em ordem, até o limite", () => {
    const rows = [
      row("09:00", "10:00", "confirmed", 1, "Passou"),
      row("13:00", "14:00", "done", 1, "Concluída"),
      row("14:00", "15:00", "confirmed", 1, "Bia"),
      row("15:00", "16:00", "pending_confirmation", 1, "Carla"),
      row("16:00", "17:00", "confirmed", 1, "Dani"),
      row("17:00", "18:00", "confirmed", 1, "Eva"),
    ];
    expect(upcoming(rows, now).map((r) => r.clientName)).toEqual(["Bia", "Carla", "Dani"]);
  });
});

describe("pendências do dia", () => {
  it("conta o que falta fechar, confirmar e remarcar", () => {
    const rows = [
      row("09:00", "10:00", "confirmed"),
      row("10:00", "11:00", "pending_confirmation"),
      row("11:00", "11:30", "done"),
      row("14:00", "15:00", "pending_confirmation"),
      row("15:00", "16:00", "reschedule_requested"),
    ];
    expect(dayPendencias(rows, now)).toEqual({ toClose: 2, toConfirm: 1, toReschedule: 1, total: 4 });
  });
});
