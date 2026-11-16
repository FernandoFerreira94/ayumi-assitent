import { Icon } from "@/components/ui/Icon";
import type { HealthLevel } from "../metrics";
import type { BillingHealth } from "../types";

const LOOK: Record<HealthLevel, { cls: string; title: string }> = {
  ok: { cls: "bg-ok-bg text-ok", title: "Cobrança funcionando" },
  warn: { cls: "bg-wait-bg text-wait", title: "Cobrança pede atenção" },
  fail: { cls: "bg-fail-bg text-fail", title: "Cobrança com problema" },
};

const ago = (d: Date | null, now: Date) => {
  if (!d) return "nenhum aviso do Mercado Pago ainda";
  const min = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60_000));
  if (min < 60) return `último aviso do Mercado Pago há ${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `último aviso do Mercado Pago há ${h} h` : `último aviso do Mercado Pago há ${Math.round(h / 24)} dias`;
};

/** Faixa de saúde dos webhooks: verde, laranja ou vermelho, sempre com texto e ícone. */
export function HealthBar({ health, level, now }: { health: BillingHealth; level: HealthLevel; now: Date }) {
  const look = LOOK[level];
  const extra = [
    health.pendingCount ? `${health.pendingCount} na fila` : null,
    health.failed24h ? `${health.failed24h} com falha em 24 h` : null,
  ].filter(Boolean);
  return (
    <p role="status" className={`mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl px-4 py-3 text-sm font-semibold ${look.cls}`}>
      <Icon name={level === "ok" ? "checkCircle" : "alert"} size={18} />
      <strong>{look.title}</strong>
      <span className="opacity-90">· {ago(health.lastEventAt, now)}</span>
      {extra.length ? <span className="opacity-90">· {extra.join(" · ")}</span> : null}
    </p>
  );
}
