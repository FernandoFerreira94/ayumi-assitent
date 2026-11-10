import { describe, expect, it } from "vitest";
import { buildShareText, toRanges } from "@/features/hours/share-text";

describe("texto das vagas", () => {
  it("junta horários seguidos em faixas e separa buracos", () => {
    expect(toRanges(["09:00", "09:30", "10:00", "13:00", "14:00", "14:30"])).toEqual([
      "09:00 às 10:00",
      "13:00",
      "14:00 às 14:30",
    ]);
  });
  it("dia em negrito, período por linha e linha em branco entre dias", () => {
    const text = buildShareText("Unha", [
      { label: "ter, 10/11", slots: ["13:00", "13:30", "14:00"] },
      { label: "qua, 11/11", slots: ["09:00", "09:30", "10:30", "12:00", "12:30"] },
      { label: "qui, 12/11", slots: [] },
    ]);
    expect(text).toBe(
      "Horários disponíveis para Unha:\n\n*ter, 10/11*\nTarde: 13:00 às 14:00\n\n*qua, 11/11*\nManhã: 09:00 às 09:30 e 10:30\nTarde: 12:00 às 12:30\n\nQual prefere?",
    );
  });
  it("sem nenhum dia, devolve vazio", () => {
    expect(buildShareText("Unha", [{ label: "ter, 10/11", slots: [] }])).toBe("");
  });
});
