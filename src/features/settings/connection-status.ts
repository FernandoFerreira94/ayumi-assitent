/**
 * Selo de estado das conexões em Ajustes, para a dona ver de longe o que está ligado sem abrir nada.
 * ok = verde (ligado), warn = âmbar (precisa de ação), off = cinza (opcional e desligado).
 * Funções puras: o servidor resolve WhatsApp, calendários e Siri; a Notificação depende do aparelho e é resolvida
 * no cliente (`notificationsLine`) com o estado do push deste aparelho e a localização do salão.
 */
export type Tone = "ok" | "warn" | "off";
export type Badge = { tone: Tone; label: string };

/** Estado do push neste aparelho (navegador/PWA ou app da loja). */
export type PushState = "checking" | "unsupported" | "denied" | "off" | "on";

export type ResolvedLine = { status: string; badge?: Badge };

export function whatsappLine(state: "open" | "other" | "unavailable"): ResolvedLine {
  if (state === "open") return { status: "Confirmações e avisos saindo", badge: { tone: "ok", label: "Conectado" } };
  if (state === "unavailable")
    return { status: "O WhatsApp não respondeu agora", badge: { tone: "off", label: "Sem resposta" } };
  return { status: "Toque para conectar o número do salão", badge: { tone: "warn", label: "Desconectado" } };
}

export function calendarsLine(google: boolean, iphone: boolean): ResolvedLine {
  const on = [google ? "Google conectado" : null, iphone ? "iPhone ligado" : null].filter(Boolean);
  if (on.length) return { status: on.join(" · "), badge: { tone: "ok", label: "Conectado" } };
  return { status: "Google Agenda e Calendário do iPhone", badge: { tone: "off", label: "Não conectado" } };
}

export function siriLine(on: boolean): ResolvedLine {
  return on
    ? { status: "Pergunte sua agenda para a Siri", badge: { tone: "ok", label: "Ligada" } }
    : { status: "Pergunte sua agenda para a Siri", badge: { tone: "off", label: "Desligada" } };
}

/** Notificação junta os avisos deste aparelho e a localização (previsão do tempo do bom dia). */
export function notificationsLine(push: PushState, locationOn: boolean): ResolvedLine {
  const loc = locationOn ? "localização ligada" : "localização desligada";
  switch (push) {
    case "checking":
      return { status: "Verificando este aparelho…" };
    case "denied":
      return { status: "Libere os avisos nos ajustes do celular", badge: { tone: "warn", label: "Bloqueada" } };
    case "off":
      return { status: `Avisos desligados · ${loc}`, badge: { tone: "warn", label: "Desligada" } };
    case "unsupported":
      return locationOn
        ? { status: "Este aparelho não recebe avisos · localização ligada", badge: { tone: "ok", label: "Ligada" } }
        : { status: "Este aparelho não recebe avisos", badge: { tone: "warn", label: "Sem localização" } };
    case "on":
      return locationOn
        ? { status: "Avisos e localização ligados", badge: { tone: "ok", label: "Ligada" } }
        : { status: "Avisos ligados · falta a localização", badge: { tone: "warn", label: "Sem localização" } };
  }
}

/** Resumo do grupo: "3 de 4 ativas" e quantas pedem ação. Linhas ainda sem selo (verificando) não contam. */
export function connectionsSummary(badges: ReadonlyArray<Badge | undefined>) {
  const known = badges.filter((b): b is Badge => !!b);
  return {
    active: known.filter((b) => b.tone === "ok").length,
    total: badges.length,
    attention: known.filter((b) => b.tone === "warn").length,
  };
}
