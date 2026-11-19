"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { TileTitle } from "@/components/ui/Icon";
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "@/features/appointments/payment";
import { fieldToCents } from "@/features/appointments/PaymentFields";
import { formatBRL } from "@/lib/dates";
import { messageFor, type ErrorCode } from "@/lib/errors";
import {
  archivePackageTemplateAction,
  createPackageTemplateAction,
  loadPackageTemplates,
  sellPackageAction,
  type TemplateView,
} from "./actions";
import { packagePreview, type PackageKind } from "./rules";

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
          Nenhum ainda. Ex.: &quot;Pague 3 esmaltações, leve 4&quot;. A cliente paga adiantado e as sessões são usadas
          sozinhas ao agendar.
        </p>
      ) : (
        <ul className="grid gap-2">
          {templates.map((t) => (
            <li key={t.id} className="flex items-start gap-3 rounded-2xl bg-soft px-4 py-3">
              <p className="min-w-0 flex-1">
                <span className="block font-bold">
                  {t.name} <span className="tabular-nums text-primary-text">· {formatBRL(t.pricedCents)}</span>
                </span>
                <span className="block text-sm font-semibold text-muted first-letter:uppercase">{t.preview}</span>
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
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [paid, setPaid] = useState("3");
  const [total, setTotal] = useState("4");
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [bad, setBad] = useState<string | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, start] = useTransition();

  const svc = services.find((s) => s.id === serviceId);
  const draft = {
    kind,
    sessionsPaid: Number(paid) || 0,
    sessionsTotal: Number(total) || 0,
    priceCents: fieldToCents(price) ?? 0,
  };
  const ok = svc && draft.sessionsTotal > 0 && (kind === "sessions" || draft.sessionsPaid < draft.sessionsTotal);
  const preview = ok ? packagePreview(draft, svc, validDays, formatBRL) : null;
  const autoName = svc
    ? kind === "pay_x"
      ? `Pague ${paid} leve ${total} ${svc.name}`
      : `${total} sessões de ${svc.name}`
    : "";

  function save() {
    setBad(null);
    setError(null);
    start(async () => {
      const r = await createPackageTemplateAction({
        kind,
        name: name.trim() || autoName,
        serviceId,
        sessionsPaid: paid,
        sessionsTotal: total,
        price,
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
              A cliente paga adiantado; cada agendamento do serviço usa uma sessão sozinho.
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
              <label className="grid gap-1.5">
                <span className="text-sm font-bold">Serviço</span>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  aria-invalid={bad === "serviceId"}
                  className={field}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {formatBRL(s.priceCents)}
                    </option>
                  ))}
                </select>
              </label>
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
                <p className="rounded-2xl bg-soft px-4 py-3 text-sm font-bold first-letter:uppercase">{preview}</p>
              ) : null}
              {bad ? (
                <p role="alert" className="text-sm font-semibold text-fail">
                  {bad === "sessionsPaid"
                    ? "A cliente paga menos sessões do que leva."
                    : bad === "priceCents"
                      ? "Digite o preço do pacote (ex.: 400,00)."
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
          setList(r.data.templates);
          setPick((p) => p ?? r.data.templates[0]?.id ?? null);
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
                Nenhum pacote criado.{" "}
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
