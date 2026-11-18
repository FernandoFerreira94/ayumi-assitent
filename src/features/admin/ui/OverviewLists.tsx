import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { IconName } from "@/components/ui/Icon";
import type { Bucket } from "../metrics";
import type { OverviewRow, SubscriptionEventRow } from "../types";
import { fmtPct, fmtShort, formatBRL } from "./format";
import { adminCard } from "./styles";

const href = (tenantId: string) => `/admin/assinantes?salao=${encodeURIComponent(tenantId)}`;

function Card({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className={`${adminCard} content-start`} aria-labelledby={id}>
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Rows({
  items,
  empty,
  icon,
}: {
  items: { id: string; name: string; right: string; sub?: string; alert?: boolean }[];
  empty: string;
  icon: IconName;
}) {
  if (!items.length)
    return (
      <div className="-my-8">
        <EmptyState icon={icon} title={empty} />
      </div>
    );
  return (
    <ul className="-mx-2 grid">
      {items.map((i) => (
        <li key={i.id}>
          <Link
            href={href(i.id)}
            className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-soft focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="grid min-w-0">
              <span className="truncate font-semibold">{i.name}</span>
              {i.sub ? <span className="truncate text-xs font-semibold text-muted">{i.sub}</span> : null}
            </span>
            <span className={`shrink-0 text-sm font-bold tabular-nums ${i.alert ? "text-fail" : ""}`}>{i.right}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DueSoonCard({ rows }: { rows: OverviewRow[] }) {
  return (
    <Card id="ov-due" title="Vencem em 7 dias">
      <Rows
        icon="calendar"
        empty="Nada vence nesta semana"
        items={rows.map((r) => ({
          id: r.tenantId,
          name: r.salonName,
          sub: `${fmtShort(r.nextDueAt)} · ${r.paymentMethod === "pix" ? "Pix" : "Cartão"}`,
          right: formatBRL(r.mrrCents),
        }))}
      />
    </Card>
  );
}

export function OverdueCard({ buckets, rows }: { buckets: Bucket[]; rows: OverviewRow[] }) {
  return (
    <Card id="ov-late" title="Em atraso">
      <dl className="grid grid-cols-3 gap-2">
        {buckets.map((b) => (
          <div key={b.label} className="grid rounded-2xl bg-bg px-3 py-2">
            <dt className="text-xs font-bold text-muted">{b.label}</dt>
            <dd className="text-lg font-bold tabular-nums">{b.count}</dd>
            <dd className="text-xs font-semibold text-muted tabular-nums">{formatBRL(b.mrrCents)}</dd>
          </div>
        ))}
      </dl>
      <Rows
        icon="checkCircle"
        empty="Ninguém em atraso"
        items={rows.map((r) => ({
          id: r.tenantId,
          name: r.salonName,
          sub: `${r.daysPastDue} ${r.daysPastDue === 1 ? "dia" : "dias"} de atraso`,
          right: formatBRL(r.mrrCents),
          alert: true,
        }))}
      />
    </Card>
  );
}

export function TrialsCard({
  rows,
  conversion,
}: {
  rows: OverviewRow[];
  conversion: { ended: number; converted: number; rate: number | null };
}) {
  return (
    <Card id="ov-trial" title="Testes acabando (3 dias)">
      <p className="rounded-2xl bg-bg px-3 py-2 text-sm font-semibold">
        Conversão do teste nos últimos 30 dias:{" "}
        <strong className="tabular-nums">
          {conversion.rate === null ? "sem dados" : `${fmtPct(conversion.rate)} (${conversion.converted} de ${conversion.ended})`}
        </strong>
      </p>
      <Rows
        icon="sparkles"
        empty="Nenhum teste acaba nestes dias"
        items={rows.map((r) => ({
          id: r.tenantId,
          name: r.salonName,
          sub: `${r.planName} · ${r.ownerName}`,
          right: fmtShort(r.trialEndsAt),
        }))}
      />
    </Card>
  );
}

export function CancellationsCard({ events }: { events: SubscriptionEventRow[] }) {
  return (
    <Card id="ov-cancel" title="Cancelamentos (30 dias)">
      <Rows
        icon="userX"
        empty="Nenhum cancelamento"
        items={events.map((e) => ({
          id: e.tenantId,
          name: e.salonName,
          sub: e.cancelReason ? `Motivo: ${e.cancelReason}` : "Sem motivo informado",
          right: fmtShort(e.at),
        }))}
      />
    </Card>
  );
}
