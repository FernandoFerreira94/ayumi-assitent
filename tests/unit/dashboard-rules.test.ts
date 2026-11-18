import { describe, expect, it } from "vitest";
import { confirmations, deltaPct, pickNext, sameDayPrevMonth, untilLabel } from "@/features/dashboard/rules";

const at = (h: string) => new Date(`2026-11-18T${h}:00-03:00`);
const row = (s: string, e: string, status: "confirmed" | "done" | "pending_confirmation" | "no_show" | "reschedule_requested" | "cancelled") => ({
  startsAt: at(s),
  endsAt: at(e),
  status,
});

describe("pickNext", () => {
  const rows = [row("08:00", "09:00", "done"), row("10:00", "11:00", "confirmed"), row("11:00", "12:00", "pending_confirmation"), row("13:00", "14:00", "no_show")];
  it("pega quem está sendo atendida agora", () => {
    const r = pickNext(rows, at("10:30"))!;
    expect(r.current).toBe(true);
    expect(r.row.startsAt).toEqual(at("10:00"));
    expect(r.after?.startsAt).toEqual(at("11:00"));
  });
  it("pega a próxima e ignora concluído e falta", () => {
    const r = pickNext(rows, at("09:10"))!;
    expect(r.current).toBe(false);
    expect(r.row.startsAt).toEqual(at("10:00"));
  });
  it("null quando não sobra ninguém", () => {
    expect(pickNext(rows, at("12:30"))).toBeNull();
  });
});

describe("untilLabel", () => {
  it("formata minutos e horas", () => {
    expect(untilLabel(at("10:20"), at("10:00"))).toBe("em 20 min");
    expect(untilLabel(at("12:05"), at("10:00"))).toBe("em 2h05");
    expect(untilLabel(at("12:00"), at("10:00"))).toBe("em 2h");
    expect(untilLabel(at("09:00"), at("10:00"))).toBe("agora");
  });
});

describe("confirmations", () => {
  it("conta confirmados (inclui concluídos) e sem resposta, sem contar falta", () => {
    const c = confirmations([{ status: "confirmed" }, { status: "done" }, { status: "pending_confirmation" }, { status: "reschedule_requested" }, { status: "no_show" }]);
    expect(c).toEqual({ total: 4, confirmed: 2, waiting: 1, reschedule: 1 });
  });
});

describe("deltaPct e sameDayPrevMonth", () => {
  it("compara com o mês anterior", () => {
    expect(deltaPct(112, 100)).toBe(12);
    expect(deltaPct(50, 0)).toBeNull();
  });
  it("limita ao último dia do mês anterior e vira o ano", () => {
    expect(sameDayPrevMonth("2026-03-31")).toBe("2026-02-28");
    expect(sameDayPrevMonth("2026-01-15")).toBe("2025-12-15");
  });
});
