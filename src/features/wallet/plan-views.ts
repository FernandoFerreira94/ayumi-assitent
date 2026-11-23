import type { PromoStatus } from "./rules";

/**
 * Página Planos (pura): pacotes vendidos agrupados e os números do topo. Sem banco, para testar e rodar em
 * qualquer lado.
 */

export type SoldPackage = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  sessionsTotal: number;
  expiresOn: string | null;
  left: number;
};

export type SoldState = "active" | "ending" | "finished" | "expired";

/** Usando (sobram sessões e não venceu), Acabando (1 sessão ou vence em até 7 dias), Acabou, Venceu. */
export function soldState(p: Pick<SoldPackage, "left" | "expiresOn">, today: string): SoldState {
  if (p.left <= 0) return "finished";
  if (p.expiresOn !== null && p.expiresOn < today) return "expired";
  if (p.left === 1 || (p.expiresOn !== null && daysBetween(today, p.expiresOn) <= 7)) return "ending";
  return "active";
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

export type SoldGroups<T> = { current: T[]; past: T[] };

/** Em uso primeiro (os que estão acabando no topo); acabados e vencidos ficam em "Encerrados". */
export function groupSold<T extends Pick<SoldPackage, "left" | "expiresOn">>(
  list: readonly T[],
  today: string,
): SoldGroups<T & { state: SoldState }> {
  const withState = list.map((p) => ({ ...p, state: soldState(p, today) }));
  const rank = (s: SoldState) => (s === "ending" ? 0 : 1);
  return {
    current: withState
      .filter((p) => p.state === "active" || p.state === "ending")
      .sort((a, b) => rank(a.state) - rank(b.state)),
    past: withState.filter((p) => p.state === "finished" || p.state === "expired"),
  };
}

/** Números do topo: clientes com pacote em uso, sessões a usar, pacotes e promoções valendo. */
export function planTotals(
  sold: readonly Pick<SoldPackage, "clientId" | "left" | "expiresOn">[],
  templates: readonly { status: PromoStatus }[],
  promotions: readonly { status: string }[],
  today: string,
) {
  const current = sold.filter((p) => {
    const s = soldState(p, today);
    return s === "active" || s === "ending";
  });
  return {
    clients: new Set(current.map((p) => p.clientId)).size,
    sessions: current.reduce((t, p) => t + p.left, 0),
    forSale: templates.filter((t) => t.status === "running").length,
    promotions: promotions.filter((p) => p.status === "running").length,
  };
}
