import { describe, expect, it } from "vitest";
import { isQuietHour } from "@/features/reminders/nudge";

describe("horário silencioso do WhatsApp", () => {
  it("vale das 21h às 6h de Brasília", () => {
    expect(isQuietHour(new Date("2026-11-10T00:00:00Z"))).toBe(true); // 21h
    expect(isQuietHour(new Date("2026-11-10T08:59:00Z"))).toBe(true); // 05:59
    expect(isQuietHour(new Date("2026-11-10T09:00:00Z"))).toBe(false); // 06h
    expect(isQuietHour(new Date("2026-11-10T23:59:00Z"))).toBe(false); // 20:59
  });
});
