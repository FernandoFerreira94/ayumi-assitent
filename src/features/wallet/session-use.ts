import { sessionValue } from "./rules";

/**
 * Uso do pacote no atendimento (puro, roda no navegador e no servidor): qual pacote a cliente vai usar ao agendar,
 * qual sessão é esta ("3 de 6") e quantas restam. A tela de agendar, o cartão do atendimento e as mensagens de
 * WhatsApp leem daqui, para os três dizerem a mesma coisa.
 */

/** Pacote da cliente com as sessões que restam (o que `packages.clientPackageList` devolve). */
export type PackageOnHand = {
  id: string;
  name: string;
  serviceIds: string[];
  sessionsTotal: number;
  priceCents: number;
  expiresOn: string | null;
  left: number;
};

export type PickedSession = {
  clientPackageId: string;
  name: string;
  /** serviços em que a sessão vale */
  serviceIds: string[];
  valueCents: number;
  /** sessões que restam depois desta */
  left: number;
  total: number;
};

/**
 * Pacote valendo no dia para um dos serviços (o primeiro da lista, que já vem ordenada pelo que vence antes) e o
 * valor da próxima sessão (preço ÷ sessões; a sobra dos centavos vai na última). null = sem pacote para usar.
 */
export function chooseSession(
  pkgs: readonly PackageOnHand[],
  serviceIds: readonly string[],
  day: string,
): PickedSession | null {
  const pkg = pkgs.find(
    (p) =>
      (p.expiresOn === null || p.expiresOn >= day) && p.left > 0 && p.serviceIds.some((id) => serviceIds.includes(id)),
  );
  if (!pkg) return null;
  const used = pkg.sessionsTotal - pkg.left;
  return {
    clientPackageId: pkg.id,
    name: pkg.name,
    serviceIds: pkg.serviceIds,
    valueCents: sessionValue(pkg.priceCents, pkg.sessionsTotal, Math.min(used, pkg.sessionsTotal - 1)),
    left: pkg.left - 1,
    total: pkg.sessionsTotal,
  };
}

/**
 * Total do atendimento com a sessão do pacote: a sessão cobre 1 serviço do pacote (o mais caro entre os agendados)
 * e entra pelo valor da sessão, já pago. `owed` = o que a cliente ainda paga.
 */
export function totalWithSession(
  pricedTotal: number,
  booked: readonly { id: string; priceCents: number }[],
  pick: PickedSession | null,
): { totalCents: number; owedCents: number } {
  if (!pick) return { totalCents: pricedTotal, owedCents: pricedTotal };
  const covered = Math.max(0, ...booked.filter((x) => pick.serviceIds.includes(x.id)).map((x) => x.priceCents));
  const totalCents = Math.max(0, pricedTotal - covered + pick.valueCents);
  return { totalCents, owedCents: totalCents - pick.valueCents };
}

/** Sessão de pacote usada num atendimento: "sessão 3 de 6", com quantas restam no pacote hoje. */
export type SessionUse = { name: string; n: number; total: number; left: number };

/** Lê o JSON que `packages.sessionUseSql` devolve; null quando o atendimento não segura sessão de pacote. */
export function parseSessionUse(raw: unknown): SessionUse | null {
  const v = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown> | null;
  if (!v || !v.held) return null;
  const total = Number(v.total);
  const n = Number(v.n);
  if (!Number.isFinite(total) || !Number.isFinite(n) || total < 1 || n < 1) return null;
  return { name: String(v.name ?? ""), n: Math.min(n, total), total, left: Math.max(0, Number(v.left) || 0) };
}

/** Linha sutil na mensagem de WhatsApp (sem valores nem nome do pacote): "✨ Sessão 3 de 6 do seu pacote". */
export const sessionMessageLine = (u: Pick<SessionUse, "n" | "total">) =>
  u.total > 1 && u.n === u.total ? "✨ Última sessão do seu pacote" : `✨ Sessão ${u.n} de ${u.total} do seu pacote`;

/** "Sessão 3 de 6 · restam 3" (cartão e agendar). */
export const sessionUseText = (u: Pick<SessionUse, "n" | "total" | "left">) =>
  `Sessão ${u.n} de ${u.total} · ${u.left === 0 ? "não restam mais" : `resta${u.left === 1 ? "" : "m"} ${u.left}`}`;
