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
  packagePrice,
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

const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold";

/** Selos do pacote: sessões, serviços, economia, período e vagas. */
function PackageChips({ t }: { t: TemplateView }) {
  const when = t.endsOn ? `até ${dayMonth(t.endsOn)}` : t.startsOn ? `a partir de ${dayMonth(t.startsOn)}` : null;
  return (
    <span className="flex flex-wrap gap-1.5">
      <span className={`${pill} bg-surface`}>
        <Icon name="ticket" size={13} className="text-primary-text" />
        {t.sessionsTotal} {t.sessionsTotal === 1 ? "sessão" : "sessões"}
      </span>
      <span className={`${pill} bg-surface`}>
        <Icon name="scissors" size={13} className="text-primary-text" />
        {serviceNames(t.services.map((x) => x.name))}
      </span>
      {t.saveCents > 0 ? <span className={`${pill} bg-ok-bg text-ok`}>economiza {formatBRL(t.saveCents)}</span> : null}
      {when ? (
        <span className={`${pill} bg-surface`}>
          <Icon name="calendar" size={13} className="text-primary-text" />
          {when}
        </span>
      ) : null}
      {t.maxClients !== null ? (
        <span className={`${pill} bg-surface`}>
          <Icon name="users" size={13} className="text-primary-text" />
          {t.soldClients}/{t.maxClients} clientes
        </span>
      ) : null}
      {STATUS[t.status] ? <span className={`${pill} ${STATUS[t.status]!.cls}`}>{STATUS[t.status]!.label}</span> : null}
    </span>
  );
}

/** Ajustes > Pagamentos > Pacotes: cartões curtos com selos; criar é um passo a passo de 3 telas. */
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
        <div className="grid gap-2 rounded-2xl bg-soft px-4 py-4 text-center">
          <p className="font-bold">Nenhum pacote ainda</p>
          <p className="text-sm font-semibold text-muted">Ex.: pague 3 esmaltações, leve 4.</p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {templates.map((t) => (
            <li
              key={t.id}
              className={`grid gap-2 rounded-2xl bg-soft px-4 py-3 ${t.status === "ended" || t.status === "sold_out" ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-3">
                <p className="min-w-0 flex-1 font-bold">{t.name}</p>
                <p className="shrink-0 text-lg font-bold tabular-nums text-primary-text">{formatBRL(t.pricedCents)}</p>
              </div>
              <PackageChips t={t} />
              <button
                type="button"
                disabled={pending}
                aria-label={`Tirar ${t.name} da venda`}
                onClick={() =>
                  start(async () => {
                    const r = await archivePackageTemplateAction(t.id).catch(() => null);
                    if (r?.ok) notify.success("Pacote tirado da venda");
                    else notify.error(r && !r.ok ? r.code : "NETWORK");
                  })
                }
                className="-mb-1 justify-self-end px-1 py-1 text-sm font-bold text-fail"
              >
                Tirar da venda
              </button>
            </li>
          ))}
        </ul>
      )}
      <NewTemplateSheet services={services} validDays={validDays} />
    </div>
  );
}

const STEPS = ["Tipo", "Serviços e sessões", "Promoção"] as const;
const STEP_OF: Record<string, number> = {
  kind: 0,
  serviceIds: 1,
  sessionsPaid: 1,
  sessionsTotal: 1,
  priceCents: 1,
  startsOn: 2,
  endsOn: 2,
  maxClients: 2,
  name: 2,
};
const BAD_TEXT: Record<string, string> = {
  serviceIds: "Escolha pelo menos um serviço.",
  sessionsPaid: "A cliente paga menos sessões do que leva.",
  sessionsTotal: "De 1 a 100 sessões.",
  priceCents: "Digite o preço (ex.: 400,00).",
  endsOn: "O fim vem depois do começo.",
  maxClients: "De 1 a 10.000 clientes.",
};

function NewTemplateSheet({ services, validDays }: { services: Svc[]; validDays: number }) {
  const side = useSheetSide();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<PackageKind>("pay_x");
  const [serviceIds, setServiceIds] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [paid, setPaid] = useState("3");
  const [total, setTotal] = useState("4");
  const [price, setPrice] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [cap, setCap] = useState("");
  const [name, setName] = useState("");
  const [bad, setBad] = useState<string | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, start] = useTransition();

  const picked = services.filter((s) => serviceIds.includes(s.id));
  const ref = referenceService(picked);
  const names = serviceNames(picked.map((s) => s.name));
  const draft = {
    kind,
    sessionsPaid: Number(paid) || 0,
    sessionsTotal: Number(total) || 0,
    priceCents: fieldToCents(price) ?? 0,
  };
  const stepOk =
    !!ref &&
    draft.sessionsTotal > 0 &&
    draft.sessionsTotal <= 100 &&
    (kind === "sessions"
      ? fieldToCents(price) !== null
      : draft.sessionsPaid >= 1 && draft.sessionsPaid < draft.sessionsTotal);
  const priced = ref ? packagePrice(draft, ref.priceCents) : 0;
  const save = ref ? Math.max(0, draft.sessionsTotal * ref.priceCents - priced) : 0;
  const promo = promoLine(
    { startsOn: startsOn || null, endsOn: endsOn || null, maxClients: Number(cap) || null },
    null,
    dayMonth,
  );
  const autoName = ref
    ? (kind === "pay_x" ? `Pague ${paid} leve ${total} ${names}` : `${total} sessões de ${names}`).slice(0, 80)
    : "";
  const toggle = (id: string) =>
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setStep(0);
      setBad(null);
      setError(null);
    }
  }

  function save_() {
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
        if (r && !r.ok && r.code === "VALIDATION") {
          setBad(r.field ?? "kind");
          setStep(STEP_OF[r.field ?? "kind"] ?? 0);
        } else setError(r && !r.ok ? r.code : "NETWORK");
        return;
      }
      setOpen(false);
      setName("");
      setStartsOn("");
      setEndsOn("");
      setCap("");
      notify.success("Pacote criado");
    });
  }

  const summary = ref ? (
    <div className="grid gap-1 rounded-2xl bg-soft px-4 py-3">
      <p className="flex items-baseline justify-between gap-3">
        <span className="font-bold">
          {draft.sessionsTotal} {draft.sessionsTotal === 1 ? "sessão" : "sessões"} · {names}
        </span>
        <span className="text-xl font-bold tabular-nums text-primary-text">{formatBRL(priced)}</span>
      </p>
      <p className="flex flex-wrap gap-1.5">
        {save > 0 ? <span className={`${pill} bg-ok-bg text-ok`}>economiza {formatBRL(save)}</span> : null}
        <span className={`${pill} bg-surface`}>vale {validDays} dias</span>
        {promo ? <span className={`${pill} bg-surface text-primary-text`}>{promo}</span> : null}
      </p>
    </div>
  ) : null;

  return (
    <Drawer.Root direction={side} open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Trigger
        disabled={!services.length}
        className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-60"
      >
        Criar pacote
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className={sheet(side)}>
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="text-xl font-bold">Novo pacote</Drawer.Title>
            <Drawer.Description className="pb-3 text-sm font-semibold text-muted">
              Passo {step + 1} de 3 · {STEPS[step]}
            </Drawer.Description>
            <div className="mb-4 grid grid-cols-3 gap-1.5" aria-hidden="true">
              {STEPS.map((s, i) => (
                <span key={s} className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-line"}`} />
              ))}
            </div>

            {step === 0 ? (
              <div className="grid gap-2" role="radiogroup" aria-label="Tipo de pacote">
                {(
                  [
                    ["pay_x", "Pague X, leve Y", "Ex.: paga 3, leva 4"],
                    ["sessions", "Pacote de sessões", "Ex.: 5 sessões por R$ 200"],
                  ] as const
                ).map(([k, title, ex]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={kind === k}
                    onClick={() => setKind(k)}
                    className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 py-4 text-left aria-checked:border-primary aria-checked:bg-soft"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft text-primary-text">
                      <Icon name={k === "pay_x" ? "sparkles" : "ticket"} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{title}</span>
                      <span className="block text-sm font-semibold text-muted">{ex}</span>
                    </span>
                    {kind === k ? <Icon name="checkCircle" size={22} className="text-primary-text" /> : null}
                  </button>
                ))}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <p className="text-sm font-bold">Serviços</p>
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
                  {picked.length > 1 ? (
                    <p className="text-xs font-semibold text-muted">A sessão vale em qualquer um.</p>
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
                          ref ? ((ref.priceCents * (Number(total) || 0) * 0.9) / 100).toFixed(2).replace(".", ",") : ""
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
                {stepOk ? summary : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4">
                <p className="text-sm font-semibold text-muted">
                  Tudo opcional. Fora das datas ou sem vagas, sai da venda.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid min-w-0 gap-1.5">
                    <span className="text-sm font-bold">Começa</span>
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
                    <span className="text-sm font-bold">Termina</span>
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
                  <span className="text-sm font-bold">Vagas (primeiras clientes)</span>
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
                <label className="grid gap-1.5">
                  <span className="text-sm font-bold">Nome</span>
                  <input
                    aria-label="Nome (opcional)"
                    value={name}
                    maxLength={80}
                    placeholder={autoName}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={bad === "name"}
                    className={field}
                  />
                </label>
                {summary}
              </div>
            ) : null}

            {bad && BAD_TEXT[bad] && STEP_OF[bad] === step ? (
              <p role="alert" className="mt-3 text-sm font-semibold text-fail">
                {BAD_TEXT[bad]}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="mt-3 rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
                {messageFor(error)}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-glass min-h-13 rounded-full px-5 font-bold"
                >
                  Voltar
                </button>
              ) : null}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !stepOk}
                  className="btn-tint flex min-h-13 flex-1 items-center justify-center rounded-full px-5 font-bold disabled:opacity-60"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={save_}
                  disabled={pending}
                  className="btn-tint flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
                >
                  {pending ? <span className="spin" aria-hidden="true" /> : null}
                  {pending ? "Criando…" : "Criar pacote"}
                </button>
              )}
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
              Pago agora. As sessões são usadas sozinhas ao agendar.
            </Drawer.Description>
            {list === null && !error ? (
              <div className="grid gap-2" aria-busy="true" aria-label="Carregando pacotes">
                <div className="skel h-16 rounded-2xl" />
                <div className="skel h-16 rounded-2xl" />
              </div>
            ) : list && list.length === 0 ? (
              <p className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                Nenhum pacote à venda hoje.{" "}
                <Link href="/ajustes/pagamentos?aba=pacotes" className="font-bold text-primary-text underline">
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
                      className="grid gap-2 rounded-2xl border-2 border-line bg-surface px-4 py-3 text-left aria-checked:border-primary aria-checked:bg-soft"
                    >
                      <span className="flex items-start gap-3">
                        <span className="min-w-0 flex-1 font-bold">{t.name}</span>
                        <span className="shrink-0 text-lg font-bold tabular-nums text-primary-text">
                          {formatBRL(t.pricedCents)}
                        </span>
                      </span>
                      <PackageChips t={t} />
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
