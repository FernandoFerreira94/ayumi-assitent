import { describe, expect, it } from "vitest";
import {
  canSkip,
  dotStates,
  isSkipped,
  nextStep,
  resolveStep,
  summaryRows,
  type EntryFacts,
} from "@/features/onboarding/steps";

const fresh: EntryFacts = { push: "ask", googleConnected: false, locationOn: false };

describe("ordem da entrada", () => {
  it("segue Horários → Avisos → Agenda → Localização → Tudo pronto", () => {
    expect(nextStep("hours", fresh)).toBe("push");
    expect(nextStep("push", fresh)).toBe("calendar");
    expect(nextStep("calendar", fresh)).toBe("location");
    expect(nextStep("location", fresh)).toBe("done");
    expect(nextStep("done", fresh)).toBe("done");
  });

  it("pula Avisos quando a permissão já está dada ou o aparelho não recebe aviso", () => {
    expect(nextStep("hours", { ...fresh, push: "on" })).toBe("calendar");
    expect(nextStep("hours", { ...fresh, push: "none" })).toBe("calendar");
  });

  it("mantém Avisos quando bloqueado antes ou quando só falta instalar o app", () => {
    expect(nextStep("hours", { ...fresh, push: "denied" })).toBe("push");
    expect(nextStep("hours", { ...fresh, push: "install" })).toBe("push");
  });

  it("pula a Agenda quando o Google já está conectado (quem entrou com Google)", () => {
    expect(nextStep("push", { ...fresh, googleConnected: true })).toBe("location");
  });

  it("pula a Localização já ligada e vai direto ao resumo", () => {
    expect(nextStep("calendar", { ...fresh, locationOn: true })).toBe("done");
  });

  it("com tudo resolvido só Horários e o resumo aparecem", () => {
    const all: EntryFacts = { push: "on", googleConnected: true, locationOn: true };
    expect(resolveStep("push", all)).toBe("done");
    expect(isSkipped("hours", all)).toBe(false);
    expect(isSkipped("done", all)).toBe(false);
  });

  it("voltar do Google: com a agenda concedida segue para a Localização, sem ela fica na Agenda", () => {
    expect(resolveStep("calendar", { ...fresh, googleConnected: true })).toBe("location");
    expect(resolveStep("calendar", fresh)).toBe("calendar");
  });
});

describe("Pular e pontinhos", () => {
  it("só Horários e o resumo não têm Pular", () => {
    expect(canSkip("hours")).toBe(false);
    expect(canSkip("done")).toBe(false);
    expect(canSkip("push")).toBe(true);
    expect(canSkip("calendar")).toBe(true);
    expect(canSkip("location")).toBe(true);
  });

  it("são 4 pontinhos: o da tela atual acende e os de trás contam como feitos", () => {
    expect(dotStates("hours")).toEqual(["now", "next", "next", "next"]);
    expect(dotStates("calendar")).toEqual(["done", "done", "now", "next"]);
    expect(dotStates("done")).toEqual(["done", "done", "done", "done"]);
  });
});

describe("summaryRows", () => {
  it("mostra o que ficou ligado e o que foi pulado", () => {
    const rows = summaryRows(
      { push: "on", calendar: "google", location: "skipped" },
      { push: "on", googleConnected: true, locationOn: false },
    );
    expect(rows.map((r) => [r.label, r.status, r.ok])).toEqual([
      ["Avisos", "Ligados", true],
      ["Google Agenda", "Conectado", true],
      ["Localização", "Pulada", false],
    ]);
  });

  it("avisos bloqueados e calendário do iPhone", () => {
    const rows = summaryRows(
      { push: "denied", calendar: "iphone", location: "denied" },
      { push: "denied", googleConnected: false, locationOn: false },
    );
    expect(rows.map((r) => r.status)).toEqual(["Bloqueados", "Calendário do iPhone", "Bloqueada"]);
  });

  it("telas puladas por já estarem resolvidas contam como ligadas", () => {
    const rows = summaryRows(
      { push: "skipped", calendar: "skipped", location: "skipped" },
      { push: "on", googleConnected: true, locationOn: true },
    );
    expect(rows.every((r) => r.ok)).toBe(true);
  });
});
