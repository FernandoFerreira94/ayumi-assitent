import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TileTitle, type IconName, type Tint } from "@/components/ui/Icon";
import { daysSince } from "../platform-rules";
import type { UsageRow } from "../usage-rules";
import { fmtShort } from "./format";
import { adminCard } from "./styles";

const MAX = 6;
const ago = (n: number) => (n === 0 ? "hoje" : n === 1 ? "ontem" : `há ${n} dias`);

function SalonCard({
  id,
  title,
  icon,
  tint,
  rows,
  empty,
  emptyIcon,
  line,
  alert,
}: {
  id: string;
  title: string;
  icon: IconName;
  tint: Tint;
  rows: UsageRow[];
  empty: string;
  emptyIcon: IconName;
  line: (r: UsageRow) => { sub: string; right: string };
  alert?: boolean;
}) {
  return (
    <section className={`${adminCard} content-start`} aria-labelledby={id}>
      <div className="flex items-center justify-between gap-2">
        <TileTitle as="h2" id={id} icon={icon} tint={tint} className="text-lg">
          {title}
        </TileTitle>
        {rows.length ? (
          <span className="rounded-full bg-soft px-2.5 py-0.5 text-sm font-bold text-primary-text tabular-nums">{rows.length}</span>
        ) : null}
      </div>
      {rows.length ? (
        <ul className="-mx-2 grid">
          {rows.slice(0, MAX).map((r) => {
            const l = line(r);
            return (
              <li key={r.tenantId} className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 py-1.5">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`grid size-9 shrink-0 place-content-center rounded-full text-sm font-bold ${alert ? "bg-wait-bg text-wait" : "bg-soft text-primary-text"}`}
                  >
                    {r.salonName.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="grid min-w-0">
                    <span className="truncate font-bold">{r.salonName}</span>
                    <span className="truncate text-xs font-semibold text-muted">{l.sub}</span>
                  </span>
                </span>
                <span className={`shrink-0 text-sm font-bold tabular-nums ${alert ? "text-wait" : ""}`}>{l.right}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="-my-8">
          <EmptyState icon={emptyIcon} title={empty} />
        </div>
      )}
      {rows.length > MAX ? (
        <Link href="/admin/uso" className="text-sm font-bold text-primary-text underline-offset-4 hover:underline">
          Ver todos em Uso
        </Link>
      ) : null}
    </section>
  );
}

/** Salões que chegaram nos últimos 30 dias (já ligaram o WhatsApp? já agendam?). */
export function NewSalonsCard({ rows }: { rows: UsageRow[] }) {
  return (
    <SalonCard
      id="ov-new"
      title="Chegaram em 30 dias"
      icon="sparkles"
      tint="pink"
      rows={rows}
      empty="Nenhum salão novo no mês"
      emptyIcon="users"
      line={(r) => ({
        sub: `${fmtShort(r.createdAt)} · ${r.whatsapp ? "WhatsApp ligado" : "sem WhatsApp"}`,
        right: `${r.appts30} agend.`,
      })}
    />
  );
}

/** Salões sem uso há mais de 7 dias: risco de cancelar quando a cobrança chegar. */
export function IdleSalonsCard({ rows, now }: { rows: UsageRow[]; now: Date }) {
  return (
    <SalonCard
      id="ov-idle"
      title="Parados há 7+ dias"
      icon="clock"
      tint="orange"
      rows={rows}
      empty="Todos usaram nesta semana"
      emptyIcon="checkCircle"
      alert
      line={(r) => ({
        sub: `Cadastro ${fmtShort(r.createdAt)}`,
        right: r.lastSeenAt ? ago(daysSince(r.lastSeenAt, now)) : "nunca usou",
      })}
    />
  );
}
