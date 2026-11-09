import { describe, expect, it } from "vitest";
import { ageFrom, salonInput } from "@/features/salon/schema";

describe("ageFrom", () => {
  const now = new Date(2026, 10, 9); // 9/11/2026
  it("conta anos completos", () => {
    expect(ageFrom("1990-11-09", now)).toBe(36);
    expect(ageFrom("1990-11-10", now)).toBe(35);
  });
  it("rejeita data inexistente ou futura", () => {
    expect(ageFrom("2026-02-31", now)).toBeNull();
    expect(ageFrom("2030-01-01", now)).toBeNull();
    expect(ageFrom("", now)).toBeNull();
  });
});

describe("salonInput", () => {
  const base = { name: "Studio", ownerName: "", birthDate: "", profession: "" };
  it("exige ao menos um segmento", () => {
    expect(salonInput.safeParse({ ...base, segments: [] }).success).toBe(false);
    expect(salonInput.safeParse({ ...base, segments: ["nail_designer", "lash_designer"] }).success).toBe(true);
  });
});
