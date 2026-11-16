/** Uso real do produto por salão (não depende da cobrança). Só números: nenhum dado de cliente final. */
export type UsageRow = {
  tenantId: string;
  salonName: string;
  ownerName: string | null;
  createdAt: Date;
  lastSeenAt: Date | null;
  whatsapp: boolean;
  clients: number;
  appts30: number;
  msgsOut30: number;
  msgsIn30: number;
};

export type UsageSummary = {
  salons: number;
  active7: number;
  whatsapp: number;
  appts30: number;
  msgsOut30: number;
  /** Mensagens enviadas por salão ativo no mês (base para medir custo por salão). */
  msgsPerActive: number | null;
};

const DAY = 86_400_000;

/** Totais da tela Uso (puro, testável). */
export function summarizeUsage(rows: UsageRow[], now: Date): UsageSummary {
  const active = rows.filter((r) => r.lastSeenAt && now.getTime() - r.lastSeenAt.getTime() <= 7 * DAY);
  const msgsOut30 = rows.reduce((s, r) => s + r.msgsOut30, 0);
  return {
    salons: rows.length,
    active7: active.length,
    whatsapp: rows.filter((r) => r.whatsapp).length,
    appts30: rows.reduce((s, r) => s + r.appts30, 0),
    msgsOut30,
    msgsPerActive: active.length ? Math.round(active.reduce((s, r) => s + r.msgsOut30, 0) / active.length) : null,
  };
}
