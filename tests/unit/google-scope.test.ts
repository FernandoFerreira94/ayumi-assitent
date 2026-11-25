import { describe, expect, it } from "vitest";
import { CALENDAR_SCOPE, LEGACY_CALENDAR_SCOPE, hasCalendarScope } from "@/features/google/scope";

describe("hasCalendarScope", () => {
  it("aceita o escopo da agenda separado por espaço ou vírgula", () => {
    expect(hasCalendarScope(`openid email ${CALENDAR_SCOPE}`)).toBe(true);
    expect(hasCalendarScope(`email,profile,${CALENDAR_SCOPE},https://www.googleapis.com/auth/contacts.readonly`)).toBe(
      true,
    );
  });

  it("recusa quando a pessoa desmarcou a agenda na tela do Google", () => {
    expect(hasCalendarScope("openid email profile https://www.googleapis.com/auth/contacts.readonly")).toBe(false);
  });

  it("pede só calendar.events", () => {
    expect(CALENDAR_SCOPE).toBe("https://www.googleapis.com/auth/calendar.events");
  });

  it("quem autorizou com o escopo total (calendar) continua conectado", () => {
    expect(hasCalendarScope(`openid email ${LEGACY_CALENDAR_SCOPE}`)).toBe(true);
    expect(hasCalendarScope(`${LEGACY_CALENDAR_SCOPE},${CALENDAR_SCOPE}`)).toBe(true);
  });

  it("não confunde escopos parecidos (somente leitura) com os da agenda", () => {
    expect(hasCalendarScope(`${LEGACY_CALENDAR_SCOPE}.readonly`)).toBe(false);
    expect(hasCalendarScope(`${CALENDAR_SCOPE}.readonly`)).toBe(false);
    expect(hasCalendarScope(`${CALENDAR_SCOPE}.owned`)).toBe(false);
  });

  it("sem escopo registrado (conta antiga) mantém o comportamento de antes", () => {
    expect(hasCalendarScope(null)).toBe(true);
    expect(hasCalendarScope(undefined)).toBe(true);
    expect(hasCalendarScope("  ")).toBe(true);
  });
});
