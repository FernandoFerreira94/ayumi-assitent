import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Icon, TileTitle, type IconName, type Tint } from "@/components/ui/Icon";
import type { Bucket } from "../metrics";
import type { OverviewRow, SubscriptionEventRow } from "../types";
import { fmtPct, fmtShort, formatBRL } from "./format";
import { adminCard, adminFigure } from "./styles";

const href = (tenantId: string) => `/admin/assinantes?salao=${encodeURIComponent(tenantId)}`;

function Card({
  id,
  title,
  icon,
  tint,
  count,
  children,
}: {
  id: string;
  title: string;
  icon: IconName;
  tint: Tint;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className={`${adminCard} content-start`} aria-labelledby={id}>
      <div className="flex items-center justify-between gap-2">
        <TileTitle as="h2" id={id} icon={icon} tint={tint} className="text-lg">
          {title}
        </TileTitle>
        {count ? (
          <span className="rounded-full bg-soft px-2.5 py-0.5 text-sm font-bold text-primary-text tabular-nums">{count}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Rows({
  items,
  empty,
  icon,
}: {
  items: { id: string; name: string; right: string; sub?: string; alert?: boolean; strong?: boolean }[];
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
            <span className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className={`grid size-9 shrink-0 place-content-center rounded-full text-sm font-bold ${i.alert ? "bg-fail-bg text-fail" : "bg-soft text-primary-text"}`}
              >
                {i.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="grid min-w-0">
                <span className="truncate font-bold">{i.name}</span>
                {i.sub ? (
                  <span className={`truncate text-xs font-semibold ${i.alert ? "text-fail" : "text-muted"}`}>{i.sub}</span>
                ) : null}
              </span>
            </span>
            <span
              className={`shrink-0 ${i.strong ? `${adminFigure} text-base` : "text-sm font-bold tabular-nums"} ${i.alert ? "text-fail" : i.strong ? "text-primary-text" : ""}`}
            >
              {i.right}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DueSoonCard({ rows }: { rows: OverviewRow[] }) {
  return (
    <Card id="ov-due" title="Vencem em 7 dias" icon="calendar" tint="blue" count={rows.length}>
      <Rows
        icon="calendar"
        empty="Nada vence nesta semana"
        items={rows.map((r) => ({
          id: r.tenantId,
          name: r.salonName,
          sub: `${fmtShort(r.nextDueAt)} · ${r.paymentMethod === "pix" ? "Pix" : "Cartão"}`,
          right: formatBRL(r.mrrCents),
          strong: true,
        }))}
      />
    </Card>
  );
}

export function OverdueCard({ buckets, rows }: { buckets: Bucket[]; rows: OverviewRow[] }) {
  return (
    <Card id="ov-late" title="Em atraso" icon="alert" tint="red" count={rows.length}>
      <dl className="grid grid-cols-3 gap-2">
        {buckets.map((b) => (
          <div key={b.label} className={`grid rounded-2xl px-3 py-2 ${b.count ? "bg-fail-bg" : "bg-bg"}`}>
            <dt className="text-xs font-bold text-muted">{b.label}</dt>
            <dd className={`${adminFigure} text-2xl leading-tight ${b.count ? "text-fail" : "text-fg"}`}>{b.count}</dd>
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
          strong: true,
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
    <Card id="ov-trial" title="Testes acabando (3 dias)" icon="sparkles" tint="pink" count={rows.length}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-soft px-3 py-2.5 text-sm font-semibold">
        <Icon name="arrowUp" size={16} className="text-primary-text" />
        Conversão do teste em 30 dias:
        {conversion.rate === null ? (
          <strong>sem dados</strong>
        ) : (
          <>
            <strong className={`${adminFigure} text-xl text-primary-text`}>{fmtPct(conversion.rate)}</strong>
            <span className="text-muted tabular-nums">
              ({conversion.converted} de {conversion.ended})
            </span>
          </>
        )}
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
    <Card id="ov-cancel" title="Cancelamentos (30 dias)" icon="userX" tint="orange" count={events.length}>
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
