import { describe, expect, it } from "vitest";
import { isQuietHour } from "@/features/reminders/nudge";

describe("horário silencioso do reforço", () => {
  it("vale das 21h às 8h de Brasília", () => {
    expect(isQuietHour(new Date("2026-11-10T00:00:00Z"))).toBe(true); // 21h
    expect(isQuietHour(new Date("2026-11-10T10:59:00Z"))).toBe(true); // 07:59
    expect(isQuietHour(new Date("2026-11-10T11:00:00Z"))).toBe(false); // 08h
    expect(isQuietHour(new Date("2026-11-10T23:59:00Z"))).toBe(false); // 20:59
  });
});
