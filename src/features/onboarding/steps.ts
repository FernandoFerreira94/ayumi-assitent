/**
 * Entrada de primeiro acesso: Horários → Avisos → Agenda → Localização → Tudo pronto.
 * Só funções puras (ordem, pulo de tela, progresso): a tela e as permissões ficam em EntryFlow.
 */
export type EntryStep = "hours" | "push" | "calendar" | "location" | "done";

export const ENTRY_ORDER: readonly EntryStep[] = ["hours", "push", "calendar", "location", "done"];

/** Telas que ganham um pontinho de progresso (o resumo final não). */
export const DOT_STEPS = ["hours", "push", "calendar", "location"] as const;

/**
 * Avisos neste aparelho: `on` já ligado · `ask` dá para pedir · `denied` bloqueado antes ·
 * `install` iPhone no Safari, onde o aviso só chega com o app instalado · `none` aparelho sem aviso.
 */
export type PushFact = "checking" | "on" | "ask" | "denied" | "install" | "none";

export type EntryFacts = {
  push: PushFact;
  /** Google ligado com a permissão da agenda aceita. */
  googleConnected: boolean;
  /** Localização do celular já ligada para o estúdio. */
  locationOn: boolean;
};

/** Tela que não precisa aparecer porque o que ela pede já está resolvido (ou não existe neste aparelho). */
export function isSkipped(step: EntryStep, facts: EntryFacts): boolean {
  switch (step) {
    case "push":
      return facts.push === "on" || facts.push === "none";
    case "calendar":
      return facts.googleConnected;
    case "location":
      return facts.locationOn;
    default:
      return false;
  }
}

/** Primeira tela, a partir de `from` (inclusive), que ainda precisa aparecer. O resumo final nunca é pulado. */
export function resolveStep(from: EntryStep, facts: EntryFacts): EntryStep {
  for (const step of ENTRY_ORDER.slice(ENTRY_ORDER.indexOf(from))) if (!isSkipped(step, facts)) return step;
  return "done";
}

/** Tela seguinte a `step`, já descontando as que se pulam. */
export function nextStep(step: EntryStep, facts: EntryFacts): EntryStep {
  const next = ENTRY_ORDER[ENTRY_ORDER.indexOf(step) + 1];
  return next ? resolveStep(next, facts) : "done";
}

/** Horários não tem "Pular": a agenda depende deles. O resumo final também não. */
export function canSkip(step: EntryStep): boolean {
  return step === "push" || step === "calendar" || step === "location";
}

export type DotState = "now" | "done" | "next";

/** Estado de cada um dos 4 pontinhos para a tela atual (telas puladas contam como feitas). */
export function dotStates(step: EntryStep): DotState[] {
  const at = DOT_STEPS.indexOf(step as (typeof DOT_STEPS)[number]);
  return DOT_STEPS.map((_, i) => (at < 0 || i < at ? "done" : i === at ? "now" : "next"));
}

/** Resultado de cada tela, para o resumo final. */
export type EntryResults = {
  push: "on" | "denied" | "skipped";
  calendar: "google" | "iphone" | "skipped";
  location: "on" | "denied" | "skipped";
};

export type SummaryRow = { key: "push" | "calendar" | "location"; label: string; status: string; ok: boolean };

export function summaryRows(results: EntryResults, facts: EntryFacts): SummaryRow[] {
  const push =
    facts.push === "on" || results.push === "on" ? "Ligados" : results.push === "denied" ? "Bloqueados" : "Pulados";
  const googleOn = facts.googleConnected || results.calendar === "google";
  const calendar = googleOn ? "Conectado" : results.calendar === "iphone" ? "Calendário do iPhone" : "Pulada";
  const locationOn = facts.locationOn || results.location === "on";
  return [
    { key: "push", label: "Avisos", status: push, ok: push === "Ligados" },
    {
      key: "calendar",
      label: googleOn ? "Google Agenda" : "Agenda",
      status: calendar,
      ok: googleOn || results.calendar === "iphone",
    },
    {
      key: "location",
      label: "Localização",
      status: locationOn ? "Ligada" : results.location === "denied" ? "Bloqueada" : "Pulada",
      ok: locationOn,
    },
  ];
}
