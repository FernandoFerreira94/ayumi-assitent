import { describe, expect, it } from "vitest";
import { unclearPattern } from "@/features/messaging/unclear";
import { groupUnclear, type UnclearRow } from "@/features/messaging/unclear-rules";

const row = (id: string, body: string, over: Partial<UnclearRow> = {}): UnclearRow => ({
  id,
  salon: "Estúdio R",
  body,
  question: "reminder",
  aiIntent: null,
  decision: "alerted",
  label: null,
  createdAt: new Date(`2026-11-0${id}T12:00:00Z`),
  ...over,
});

describe("respostas não entendidas", () => {
  it("padrão ignora acento, caixa, pontuação e números", () => {
    expect(unclearPattern("Confirmo às 14h!")).toBe(unclearPattern("confirmo as 15h"));
    expect(unclearPattern("  Vou   SIM 😊 ")).toBe("vou sim");
  });

  it("agrupa parecidas, sem rótulo primeiro e mais frequentes antes", () => {
    const g = groupUnclear([
      row("1", "Talvez"),
      row("2", "talvez!", { salon: "Salão B" }),
      row("3", "pode ser", { label: "confirm" }),
      row("4", "quem é?"),
    ]);
    expect(g.map((x) => [x.pattern, x.count, x.label])).toEqual([
      ["talvez", 2, null],
      ["quem e", 1, null],
      ["pode ser", 1, "confirm"],
    ]);
    expect(g[0]).toMatchObject({ example: "talvez!", ids: ["2", "1"], salons: ["Salão B", "Estúdio R"] });
  });
});
