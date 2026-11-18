"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { filterSubscribers, sortSubscribers, TABS, type SortKey, type Tab } from "../filters";
import type { OverviewRow, PaymentMethod, PlanKind } from "../types";
import { fmtShort, formatBRL, METHOD_LABEL } from "./format";
import { StatusBadge } from "./StatusBadge";
import { adminFigure, adminInput } from "./styles";

const select =
  "min-h-11 rounded-2xl border-[1.5px] border-line bg-surface px-3 text-base font-semibold focus:border-primary focus:outline-none";
const href = (id: string) => `/admin/assinantes?salao=${encodeURIComponent(id)}`;

function dueText(r: OverviewRow) {
  if (r.status === "past_due") return `${r.daysPastDue} dias de atraso`;
  if (r.status === "trialing") return `Teste até ${fmtShort(r.trialEndsAt)}`;
  if (r.nextDueAt) return `Vence ${fmtShort(r.nextDueAt)}`;
  return "—";
}

/** Vencimento com desenho: alerta vermelho no atraso, brilho no teste, calendário no resto. */
function Due({ r }: { r: OverviewRow }) {
  const late = r.status === "past_due";
  return (
    <span className={`inline-flex items-center gap-1.5 ${late ? "font-bold text-fail" : "font-semibold text-muted"}`}>
      {r.status === "past_due" || r.status === "trialing" || r.nextDueAt ? (
        <Icon name={late ? "alert" : r.status === "trialing" ? "sparkles" : "calendar"} size={15} />
      ) : null}
      {dueText(r)}
    </span>
  );
}

/** Lista de salões: abas por situação, filtros, busca local e ordem. Tocar num salão abre o detalhe (?salao=). */
export function SubscribersView({ rows }: { rows: OverviewRow[] }) {
  const [tab, setTab] = useState<Tab>("todos");
  const [kind, setKind] = useState<PlanKind | "">("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("salao");

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, filterSubscribers(rows, { tab: t.id }).length])), [rows]);
  const list = useMemo(
    () => sortSubscribers(filterSubscribers(rows, { tab, kind: kind || undefined, method: method || undefined, q }), sort),
    [rows, tab, kind, method, q, sort],
  );

  return (
    <div className="grid gap-4">
      <div role="tablist" aria-label="Situação" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-muted aria-selected:bg-soft aria-selected:text-primary-text"
          >
            {t.label}
            <span className="rounded-full bg-bg px-2 text-xs font-bold text-fg tabular-nums">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Buscar salão ou dona</span>
          <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar salão ou dona"
            className={`${adminInput} min-h-11 pl-11`}
          />
        </label>
        <label>
          <span className="sr-only">Tipo de plano</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as PlanKind | "")} className={`${select} w-full`}>
            <option value="">Todos os planos</option>
            <option value="individual">Individual</option>
            <option value="empresa">Empresa</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Forma de pagamento</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | "")} className={`${select} w-full`}>
            <option value="">Cartão e Pix</option>
            <option value="card">Cartão</option>
            <option value="pix">Pix</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Ordenar por</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${select} w-full`}>
            <option value="salao">Ordem: salão</option>
            <option value="valor">Ordem: maior valor</option>
            <option value="vencimento">Ordem: vencimento</option>
            <option value="atraso">Ordem: mais atrasado</option>
          </select>
        </label>
      </div>

      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? "salão" : "salões"}
      </p>

      {!list.length ? (
        <EmptyState icon="search" title="Nenhum salão aqui" description="Mude a aba, os filtros ou a busca." />
      ) : (
        <>
          <ul className="grid gap-2 lg:hidden">
            {list.map((r) => (
              <li key={r.tenantId}>
                <Link
                  href={href(r.tenantId)}
                  scroll={false}
                  className="grid gap-1 rounded-2xl border border-line bg-surface p-4 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold">{r.salonName}</span>
                    <StatusBadge status={r.status} />
                  </span>
                  <span className="text-sm font-semibold text-muted">
                    {r.planName} · {r.paymentMethod ? METHOD_LABEL[r.paymentMethod] : "sem pagamento"}
                  </span>
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <Due r={r} />
                    <span className="text-muted">
                      <strong className={`${adminFigure} text-lg ${r.mrrCents ? "text-primary-text" : "text-muted"}`}>{formatBRL(r.mrrCents)}</strong>/mês
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-3xl border border-line bg-surface lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-bg text-xs font-bold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Salão</th>
                  <th scope="col" className="px-4 py-3">Plano</th>
                  <th scope="col" className="px-4 py-3">Situação</th>
                  <th scope="col" className="px-4 py-3">Pagamento</th>
                  <th scope="col" className="px-4 py-3">Vencimento</th>
                  <th scope="col" className="px-4 py-3 text-right">MRR</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.tenantId} className="border-b border-line last:border-0 hover:bg-soft/60">
                    <td className="px-4 py-2">
                      <Link href={href(r.tenantId)} scroll={false} className="grid min-h-11 content-center font-bold hover:text-primary-text focus-visible:outline-2 focus-visible:outline-primary">
                        {r.salonName}
                        <span className="text-xs font-semibold text-muted">{r.ownerName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      {r.planName}
                      {r.planKind === "empresa" ? <span className="block text-xs text-muted">{r.seats} profissionais</span> : null}
                    </td>
                    <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2 font-semibold">{r.paymentMethod ? METHOD_LABEL[r.paymentMethod] : "—"}</td>
                    <td className="px-4 py-2">
                      <Due r={r} />
                    </td>
                    <td className={`px-4 py-2 text-right text-base ${adminFigure} ${r.mrrCents ? "text-primary-text" : "text-muted"}`}>
                      {formatBRL(r.mrrCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
