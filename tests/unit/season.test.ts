import { describe, expect, it } from "vitest";
import { seasonOn } from "@/components/brand/season";

describe("Bolha nas datas comemorativas", () => {
  it.each([
    ["2026-11-10", null],
    ["2026-12-01", "natal"],
    ["2026-12-25", "natal"],
    ["2026-12-26", "anonovo"],
    ["2027-01-01", "anonovo"],
    ["2027-01-02", null],
    ["2027-02-05", "carnaval"], // sexta antes do carnaval (Páscoa 28/03/2027)
    ["2027-02-10", "carnaval"], // Quarta de Cinzas
    ["2027-02-11", null],
    ["2027-03-08", "mulher"],
    ["2027-03-21", "pascoa"], // Domingo de Ramos
    ["2027-03-28", "pascoa"],
    ["2027-05-03", "maes"], // 2º domingo de maio de 2027 = 09/05
    ["2027-05-09", "maes"],
    ["2027-05-10", null],
    ["2027-06-12", "namorados"],
    ["2027-06-13", "junina"],
    ["2027-06-29", "junina"],
    ["2027-10-12", "criancas"],
    ["2027-10-31", "halloween"],
    ["2027-11-01", null],
  ])("%s → %s", (date, season) => {
    expect(seasonOn(date)).toBe(season);
  });
  it("Carnaval sobre o 8 de março: vale a data mais curta", () => {
    // 2011: Páscoa 24/04, carnaval de 04/03 a 09/03
    expect(seasonOn("2011-03-07")).toBe("carnaval");
    expect(seasonOn("2011-03-08")).toBe("mulher");
  });
});
