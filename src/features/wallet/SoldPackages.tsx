"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SellPackageSheet } from "./PackageSheets";
import type { SoldState } from "./plan-views";
import { dayMonth } from "./rules";

export type SoldItem = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  sessionsTotal: number;
  expiresOn: string | null;
  left: number;
  /** "qua., 25 de nov. às 10:00" já formatado */
  next: string | null;
  state: SoldState;
};

const STATE: Record<SoldState, { label: string; cls: string }> = {
  active: { label: "Em uso", cls: "bg-ok-bg text-ok" },
  ending: { label: "Acabando", cls: "bg-wait-bg text-wait" },
  finished: { label: "Acabou", cls: "bg-soft text-muted" },
  expired: { label: "Venceu", cls: "bg-fail-bg text-fail" },
};

/** Botão "Vender pacote" da página Planos: pergunta a cliente e vende; recarrega a lista ao vender. */
export function SellFromPlans({ clients }: { clients: { id: string; label: string }[] }) {
  const router = useRouter();
  return (
    <SellPackageSheet
      clients={clients}
      nested={false}
      onSold={() => router.refresh()}
      triggerClassName="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-bold"
    />
  );
}

/** Aba Clientes: pacote de cada cliente com as sessões usadas e as que restam. */
export function SoldPackages({ current, past }: { current: SoldItem[]; past: SoldItem[] }) {
  const [showPast, setShowPast] = useState(false);
  return (
    <section aria-label="Clientes com pacote" className="grid gap-3">
      {current.length === 0 ? (
        <div className="glass grid gap-1 rounded-3xl px-5 py-6 text-center">
          <p className="font-bold">Nenhuma cliente com pacote em uso</p>
          <p className="text-sm font-semibold text-muted">
            Venda pelo botão Vender pacote. As sessões são usadas sozinhas ao agendar.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {current.map((p) => (
            <SoldCard key={p.id} p={p} />
          ))}
        </ul>
      )}
      {past.length ? (
        <div className="grid gap-3">
          <button
            type="button"
            aria-expanded={showPast}
            onClick={() => setShowPast(!showPast)}
            className="min-h-11 justify-self-start rounded-full px-2 text-sm font-bold text-primary-text"
          >
            {showPast ? "Esconder encerrados" : `Encerrados (${past.length})`}
          </button>
          {showPast ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {past.map((p) => (
                <SoldCard key={p.id} p={p} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function SoldCard({ p }: { p: SoldItem }) {
  const used = Math.max(0, p.sessionsTotal - p.left);
  const s = STATE[p.state];
  return (
    <li className="glass grid gap-2 rounded-3xl px-4 py-3" aria-label={`${p.clientName}: ${p.name}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{p.clientName}</p>
          <p className="truncate text-sm font-semibold text-muted">{p.name}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
      </div>
      <p className="flex items-baseline gap-2">
        <b className="text-3xl tabular-nums tracking-tight text-primary-text">{Math.max(0, p.left)}</b>
        <span className="text-sm font-bold">
          {p.left === 1 ? "sessão resta" : "sessões restam"} de {p.sessionsTotal}
        </span>
      </p>
      <div
        className="h-2 overflow-hidden rounded-full bg-soft"
        role="progressbar"
        aria-label="Sessões usadas"
        aria-valuemin={0}
        aria-valuemax={p.sessionsTotal}
        aria-valuenow={used}
        aria-valuetext={`${used} de ${p.sessionsTotal} usadas`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${(used / p.sessionsTotal) * 100}%` }} />
      </div>
      <p className="text-xs font-bold text-muted">
        {used} {used === 1 ? "usada" : "usadas"}
        {p.expiresOn ? ` · vale até ${dayMonth(p.expiresOn)}` : " · sem validade"}
      </p>
      {p.next ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Icon name="calendar" size={16} />
          Próxima: {p.next}
        </p>
      ) : null}
      <Link
        href={`/clientes?q=${encodeURIComponent(p.clientName)}`}
        className="min-h-11 justify-self-start content-center text-sm font-bold text-primary-text"
      >
        Ver ficha de {p.clientName.split(/\s+/)[0]}
      </Link>
    </li>
  );
}
