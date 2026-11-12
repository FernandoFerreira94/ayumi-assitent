import { describe, expect, it } from "vitest";
import {
  conflictReason,
  daySpan,
  dragSpan,
  nextFree,
  gridWindow,
  layoutColumns,
  snap,
  weekOf,
  type Occupant,
} from "@/features/appointments/agenda-grid";

const h = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

describe("grade da agenda do dia", () => {
  it("janela é 06–23 e estica em hora cheia para caber atendimento fora dela", () => {
    expect(gridWindow([])).toEqual({ start: h("06:00"), end: h("23:00") });
    expect(
      gridWindow([
        { start: h("05:30"), end: h("06:15") },
        { start: h("23:00"), end: h("23:45") },
      ]),
    ).toEqual({
      start: h("05:00"),
      end: h("24:00"),
    });
  });

  it("semana vai de domingo a sábado, inclusive virando o mês", () => {
    expect(weekOf("2026-11-13")).toEqual([
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    expect(weekOf("2026-12-01")[0]).toBe("2026-11-29");
  });

  it("encaixa de 15 em 15 minutos", () => {
    expect(snap(h("10:07"))).toBe(h("10:00"));
    expect(snap(h("10:08"))).toBe(h("10:15"));
  });

  it("blocos sobrepostos dividem a largura; os que não encostam ficam inteiros", () => {
    const lay = layoutColumns([
      { id: "a", start: h("10:00"), end: h("11:00") },
      { id: "b", start: h("10:30"), end: h("11:30") },
      { id: "c", start: h("11:00"), end: h("12:00") },
      { id: "d", start: h("13:00"), end: h("14:00") },
    ]);
    expect(lay.get("a")).toEqual({ col: 0, cols: 2 });
    expect(lay.get("b")).toEqual({ col: 1, cols: 2 });
    // c começa quando a acaba: reaproveita a primeira coluna do mesmo grupo
    expect(lay.get("c")).toEqual({ col: 0, cols: 2 });
    expect(lay.get("d")).toEqual({ col: 0, cols: 1 });
  });

  it("conflito diz o motivo: fora do expediente, outro atendimento ou bloqueio", () => {
    const hours = { start: h("09:00"), end: h("19:00") };
    const others: Occupant[] = [
      { id: "x", kind: "appointment", label: "Ana Souza", start: h("10:00"), end: h("11:00") },
      { id: "p", kind: "block", label: "Almoço", start: h("12:00"), end: h("13:00") },
    ];
    const at = (s: string, e: string) => ({ id: "me", start: h(s), end: h(e) });
    expect(conflictReason(at("08:30", "09:30"), hours, others)).toBe("Fora do expediente");
    expect(conflictReason(at("18:30", "19:15"), hours, others)).toBe("Fora do expediente");
    expect(conflictReason(at("10:30", "11:30"), hours, others)).toBe("Choca com Ana às 10:00");
    expect(conflictReason(at("11:30", "12:15"), hours, others)).toBe("Choca com almoço");
    expect(conflictReason(at("11:00", "12:00"), hours, others)).toBeNull();
    expect(conflictReason(at("10:00", "11:00"), null, [])).toBe("Fora do expediente");
    // o próprio bloco não conta como conflito
    expect(conflictReason({ id: "x", start: h("10:15"), end: h("11:15") }, hours, others)).toBeNull();
  });

  it("arrastar move inteiro; as bolinhas mudam começo ou fim, com no mínimo 15 min", () => {
    const win = { start: h("08:00"), end: h("20:00") };
    const from = { start: h("10:00"), end: h("11:00") };
    expect(dragSpan("move", from, 40, win)).toEqual({ start: h("10:45"), end: h("11:45") });
    expect(dragSpan("move", from, 1000, win)).toEqual({ start: h("19:00"), end: h("20:00") });
    expect(dragSpan("bottom", from, -120, win)).toEqual({ start: h("10:00"), end: h("10:15") });
    expect(dragSpan("top", from, -30, win)).toEqual({ start: h("09:30"), end: h("11:00") });
    expect(dragSpan("top", from, 90, win)).toEqual({ start: h("10:45"), end: h("11:00") });
  });

  it("expediente vira minutos e o Agendar acha o próximo horário livre", () => {
    expect(daySpan(null)).toBeNull();
    const hours = daySpan({ opens: "09:00", closes: "18:00" });
    expect(hours).toEqual({ start: h("09:00"), end: h("18:00") });
    const others: Occupant[] = [
      { id: "x", kind: "appointment", label: "Ana", start: h("09:00"), end: h("10:15") },
      { id: "p", kind: "block", label: "Almoço", start: h("11:00"), end: h("13:00") },
    ];
    expect(nextFree(0, 60, hours, others)).toBe(h("13:00"));
    expect(nextFree(0, 45, hours, others)).toBe(h("10:15"));
    // hoje, 14:20: começa na próxima meia hora
    expect(nextFree(h("14:20"), 60, hours, others)).toBe(h("14:30"));
    expect(nextFree(h("17:30"), 60, hours, others)).toBeNull();
    expect(nextFree(0, 60, null, [])).toBeNull();
  });
});
