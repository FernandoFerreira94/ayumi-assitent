"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "@/features/appointments/payment";
import { fieldToCents } from "@/features/appointments/PaymentFields";
import { formatBRL } from "@/lib/dates";
import { messageFor, type ErrorCode } from "@/lib/errors";
import {
  archivePackageTemplateAction,
  createPackageTemplateAction,
  loadPackageTemplates,
  sellPackageAction,
} from "./actions";
import {
  dayMonth,
  packagePreview,
  promoLine,
  referenceService,
  serviceNames,
  type PackageKind,
  type PromoStatus,
} from "./rules";
import type { TemplateView } from "./views";

const chip =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line bg-surface px-3 text-sm font-bold transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";
const field = "min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base";
const sheet = (side: ReturnType<typeof useSheetSide>) =>
  sheetClass(
    side,
    "fixed inset-x-0 bottom-0 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] rounded-t-3xl pt-4 outline-none",
    "sheet z-50 flex flex-col",
  );

type Svc = { id: string; name: string; priceCents: number };

const STATUS: Record<PromoStatus, { label: string; cls: string } | null> = {
  running: null,
  scheduled: { label: "Agendada", cls: "bg-soft text-primary-text" },
  ended: { label: "Encerrada", cls: "bg-fail-bg text-fail" },
  sold_out: { label: "Esgotada", cls: "bg-fail-bg text-fail" },
};

/**
 * Ajustes > Pagamentos > Pacotes: modelos que o salão vende ("Pague X, leve Y" e "Pacote de sessões"),
 * cada um com a frase pronta. Criar abre uma folha com no máximo 3 campos e a prévia.
 */
export function PackageTemplates({
  templates,
  services,
  validDays,
}: {
  templates: TemplateView[];
  services: Svc[];
  validDays: number;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="glass grid gap-3 rounded-[1.75rem] p-5">
      <TileTitle as="h2" icon="ticket" tint="lavender">
        Pacotes à venda
      </TileTitle>
      {templates.length === 0 ? (
        <p className="text-sm font-semibold text-muted">
          Nenhum ainda. Ex.: &quot;Pague 3 esmaltações, leve 4&quot;, só em dezembro e para as 30 primeiras clientes. A
          cliente paga adiantado e as sessões são usadas sozinhas ao agendar.
        </p>
      ) : (
        <ul className="grid gap-2">
          {templates.map((t) => (
            <li key={t.id} className="flex items-start gap-3 rounded-2xl bg-soft px-4 py-3">
              <p className="min-w-0 flex-1">
                <span className="block font-bold">
                  {t.name} <span className="tabular-nums text-primary-text">· {formatBRL(t.pricedCents)}</span>
                  {STATUS[t.status] ? (
                    <span
                      className={`ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-xs font-bold ${STATUS[t.status]!.cls}`}
                    >
                      {STATUS[t.status]!.label}
                    </span>
                  ) : null}
                </span>
                <span className="block text-sm font-semibold text-muted first-letter:uppercase">{t.preview}</span>
                {t.promo ? (
                  <span className="mt-0.5 flex items-center gap-1 text-sm font-bold text-primary-text">
                    <Icon name="calendar" size={14} />
                    {t.promo}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await archivePackageTemplateAction(t.id).catch(() => null);
                    if (r?.ok) notify.success("Pacote tirado da venda");
                    else notify.error(r && !r.ok ? r.code : "NETWORK");
                  })
                }
                className="min-h-11 shrink-0 px-2 text-sm font-bold text-fail"
              >
                Tirar
              </button>
            </li>
          ))}
        </ul>
      )}
      <NewTemplateSheet services={services} validDays={validDays} />
    </div>
  );
}

function NewTemplateSheet({ services, validDays }: { services: Svc[]; validDays: number }) {
  const side = useSheetSide();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PackageKind>("pay_x");
  const [serviceIds, setServiceIds] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [cap, setCap] = useState("");
  const [paid, setPaid] = useState("3");
  const [total, setTotal] = useState("4");
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [bad, setBad] = useState<string | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, start] = useTransition();

  const picked = services.filter((s) => serviceIds.includes(s.id));
  const svc = referenceService(picked);
  const names = serviceNames(picked.map((s) => s.name));
  const promo = promoLine(
    { startsOn: startsOn || null, endsOn: endsOn || null, maxClients: Number(cap) || null },
    null,
    dayMonth,
  );
  const toggle = (id: string) =>
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const draft = {
    kind,
    sessionsPaid: Number(paid) || 0,
    sessionsTotal: Number(total) || 0,
    priceCents: fieldToCents(price) ?? 0,
  };
  const ok = svc && draft.sessionsTotal > 0 && (kind === "sessions" || draft.sessionsPaid < draft.sessionsTotal);
  const preview = ok ? packagePreview(draft, picked, validDays, formatBRL) : null;
  const autoName = svc
    ? (kind === "pay_x" ? `Pague ${paid} leve ${total} ${names}` : `${total} sessões de ${names}`).slice(0, 80)
    : "";

  function save() {
    setBad(null);
    setError(null);
    start(async () => {
      const r = await createPackageTemplateAction({
        kind,
        name: name.trim() || autoName,
        serviceIds,
        sessionsPaid: paid,
        sessionsTotal: total,
        price,
        startsOn,
        endsOn,
        maxClients: cap,
      }).catch(() => null);
      if (!r?.ok) {
        if (r && !r.ok && r.code === "VALIDATION") setBad(r.field ?? "kind");
        else setError(r && !r.ok ? r.code : "NETWORK");
        return;
      }
      setOpen(false);
      setName("");
      notify.success("Pacote criado");
    });
  }

  return (
    <Drawer.Root direction={side} open={open} onOpenChange={setOpen} repositionInputs={false}>
      <Drawer.Trigger
        disabled={!services.length}
        className="btn-tint flex min-h-12 items-center justify-center rounded-full px-5 font-bold disabled:opacity-60"
      >
        Criar pacote
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className={sheet(side)}>
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="pb-1 text-xl font-bold">Novo pacote</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              A cliente paga adiantado; cada agendamento de um dos serviços usa uma sessão sozinho.
            </Drawer.Description>
            <div className="grid gap-3">
              <div className="flex gap-2" role="group" aria-label="Modelo">
                <button type="button" aria-pressed={kind === "pay_x"} onClick={() => setKind("pay_x")} className={chip}>
                  Pague X, leve Y
                </button>
                <button
                  type="button"
                  aria-pressed={kind === "sessions"}
                  onClick={() => setKind("sessions")}
                  className={chip}
                >
                  Pacote de sessões
                </button>
              </div>
              <div className="grid gap-1.5">
                <p className="text-sm font-bold">
                  Serviços <span className="font-semibold text-muted">· a sessão vale em qualquer um</span>
                </p>
                <div
                  className={`flex flex-wrap gap-2 rounded-2xl ${bad === "serviceIds" ? "ring-2 ring-fail" : ""}`}
                  role="group"
                  aria-label="Serviços do pacote"
                >
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={serviceIds.includes(s.id)}
                      onClick={() => toggle(s.id)}
                      className={`${chip} flex-none`}
                    >
                      {s.name} · {formatBRL(s.priceCents)}
                    </button>
                  ))}
                </div>
                {kind === "pay_x" && picked.length > 1 && svc ? (
                  <p className="text-xs font-semibold text-muted">
                    O preço usa o serviço mais caro ({svc.name}, {formatBRL(svc.priceCents)}).
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {kind === "pay_x" ? (
                  <label className="grid gap-1.5">
                    <span className="text-sm font-bold">Paga</span>
                    <input
                      inputMode="numeric"
                      aria-label="Sessões pagas"
                      value={paid}
                      onChange={(e) => setPaid(e.target.value.replace(/\D/g, ""))}
                      aria-invalid={bad === "sessionsPaid"}
                      className={field}
                    />
                  </label>
                ) : (
                  <label className="grid gap-1.5">
                    <span className="text-sm font-bold">Preço</span>
                    <input
                      inputMode="decimal"
                      aria-label="Preço do pacote"
                      placeholder={
                        svc ? ((svc.priceCents * (Number(total) || 0) * 0.9) / 100).toFixed(2).replace(".", ",") : ""
                      }
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      aria-invalid={bad === "priceCents"}
                      className={field}
                    />
                  </label>
                )}
                <label className="grid gap-1.5">
                  <span className="text-sm font-bold">{kind === "pay_x" ? "Leva" : "Sessões"}</span>
                  <input
                    inputMode="numeric"
                    aria-label="Sessões no pacote"
                    value={total}
                    onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))}
                    aria-invalid={bad === "sessionsTotal"}
                    className={field}
                  />
                </label>
              </div>
              <fieldset className="grid gap-2 rounded-2xl border border-line p-3">
                <legend className="px-1 text-sm font-bold">Promoção (opcional)</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid min-w-0 gap-1.5">
                    <span className="text-xs font-bold text-muted">Começa</span>
                    <input
                      type="date"
                      aria-label="Início da promoção"
                      value={startsOn}
                      onChange={(e) => setStartsOn(e.target.value)}
                      aria-invalid={bad === "startsOn"}
                      className={`${field} min-w-0 px-3`}
                    />
                  </label>
                  <label className="grid min-w-0 gap-1.5">
                    <span className="text-xs font-bold text-muted">Termina</span>
                    <input
                      type="date"
                      aria-label="Fim da promoção"
                      value={endsOn}
                      min={startsOn || undefined}
                      onChange={(e) => setEndsOn(e.target.value)}
                      aria-invalid={bad === "endsOn"}
                      className={`${field} min-w-0 px-3`}
                    />
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold text-muted">Só para as primeiras (clientes)</span>
                  <input
                    inputMode="numeric"
                    aria-label="Limite de clientes"
                    placeholder="Sem limite"
                    value={cap}
                    onChange={(e) => setCap(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    aria-invalid={bad === "maxClients"}
                    className={field}
                  />
                </label>
                <p className="text-xs font-semibold text-muted">
                  Fora das datas ou ao chegar no limite, sai da venda sozinho. Com limite, cada cliente compra 1 vez.
                </p>
              </fieldset>
              <label className="grid gap-1.5">
                <span className="text-sm font-bold">Nome (opcional)</span>
                <input
                  value={name}
                  maxLength={80}
                  placeholder={autoName}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={bad === "name"}
                  className={field}
                />
              </label>
              {preview ? (
                <p className="rounded-2xl bg-soft px-4 py-3 text-sm font-bold first-letter:uppercase">
                  {preview}
                  {promo ? <span className="block text-primary-text">{promo}</span> : null}
                </p>
              ) : null}
              {bad ? (
                <p role="alert" className="text-sm font-semibold text-fail">
                  {bad === "sessionsPaid"
                    ? "A cliente paga menos sessões do que leva."
                    : bad === "priceCents"
                      ? "Digite o preço do pacote (ex.: 400,00)."
                      : bad === "serviceIds"
                        ? "Escolha pelo menos um serviço."
                        : bad === "endsOn"
                          ? "O fim da promoção vem depois do começo."
                          : bad === "maxClients"
                            ? "Limite de 1 a 10.000 clientes."
                            : "Confira o campo destacado."}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
                  {messageFor(error)}
                </p>
              ) : null}
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="btn-tint mt-1 flex min-h-13 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
              >
                {pending ? <span className="spin" aria-hidden="true" /> : null}
                {pending ? "Criando…" : "Criar pacote"}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Ficha da cliente: escolher o pacote, a forma e vender (pago na hora). */
export function SellPackageSheet({
  clientId,
  clientName,
  nested,
  onSold,
}: {
  clientId: string;
  clientName: string;
  nested: boolean;
  onSold: () => void;
}) {
  const side = useSheetSide();
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<TemplateView[] | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>("pix");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, start] = useTransition();
  const first = clientName.split(/\s+/)[0];

  useEffect(() => {
    if (!open) return;
    let alive = true;
    loadPackageTemplates()
      .catch(() => null)
      .then((r) => {
        if (!alive) return;
        if (r?.ok) {
          const running = r.data.templates.filter((t) => t.status === "running");
          setList(running);
          setPick((p) => p ?? running[0]?.id ?? null);
        } else setError("NETWORK");
      });
    return () => {
      alive = false;
    };
  }, [open]);

  function sell() {
    if (!pick) return;
    setError(null);
    start(async () => {
      const r = await sellPackageAction({ clientId, templateId: pick, method }).catch(() => null);
      if (!r?.ok) {
        setError(r && !r.ok ? r.code : "NETWORK");
        return;
      }
      setOpen(false);
      notify.success(`Pacote vendido para ${first}: ${r.data.sessions} sessões até ${r.data.expiresOn}`);
      onSold();
    });
  }

  return (
    <Root direction={side} open={open} onOpenChange={setOpen} repositionInputs={false}>
      <Drawer.Trigger className="btn-glass min-h-11 shrink-0 rounded-full px-4 text-sm font-bold">
        Vender pacote
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className={sheet(side)}>
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="pb-1 text-xl font-bold">Vender pacote para {first}</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              Pago agora: entra no caixa de hoje. As sessões são usadas sozinhas ao agendar o serviço.
            </Drawer.Description>
            {list === null && !error ? (
              <div className="grid gap-2" aria-busy="true" aria-label="Carregando pacotes">
                <div className="skel h-16 rounded-2xl" />
                <div className="skel h-16 rounded-2xl" />
              </div>
            ) : list && list.length === 0 ? (
              <p className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                Nenhum pacote à venda hoje.{" "}
                <Link href="/ajustes/pagamentos" className="font-bold text-primary-text underline">
                  Criar em Ajustes &gt; Pagamentos
                </Link>
              </p>
            ) : list ? (
              <div className="grid gap-3">
                <div className="grid gap-2" role="radiogroup" aria-label="Pacote">
                  {list.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={pick === t.id}
                      onClick={() => setPick(t.id)}
                      className="grid gap-0.5 rounded-2xl border border-line bg-surface px-4 py-3 text-left aria-checked:border-primary aria-checked:bg-soft"
                    >
                      <span className="font-bold">
                        {t.name} <span className="tabular-nums text-primary-text">· {formatBRL(t.pricedCents)}</span>
                      </span>
                      <span className="text-sm font-semibold text-muted first-letter:uppercase">{t.preview}</span>
                      {t.promo ? <span className="text-sm font-bold text-primary-text">{t.promo}</span> : null}
                    </button>
                  ))}
                </div>
                <div className="grid gap-1">
                  <p className="text-xs font-bold text-muted">Forma</p>
                  <div className="flex gap-2" role="group" aria-label="Forma de pagamento do pacote">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={method === m}
                        onClick={() => setMethod(method === m ? null : m)}
                        className={chip}
                      >
                        {METHOD_LABEL[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={sell}
                  disabled={pending || !pick}
                  className="btn-tint mt-1 flex min-h-13 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
                >
                  {pending ? <span className="spin" aria-hidden="true" /> : null}
                  {pending ? "Vendendo…" : "Vender"}
                </button>
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="mt-3 rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
                {messageFor(error)}
              </p>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}
