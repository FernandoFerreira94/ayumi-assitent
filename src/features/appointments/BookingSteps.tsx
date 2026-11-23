"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import type { PickerOption } from "@/components/ui/LetterPicker";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { groupByLetter } from "@/lib/groupByLetter";
import { addDays, formatBRL, isDateStr, toInstant, todayStr } from "@/lib/dates";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { timeOptions } from "@/lib/time-grid";
import { weekdayOf, type Day } from "@/features/hours/slots";
import { formatDuration } from "@/features/services/catalog";
import { bookingText } from "@/features/reminders/text";
import { suggestedDeposit } from "@/features/wallet/rules";
import { loadClientPackages, loadRunningPromotions, type RunningPromotion } from "@/features/wallet/actions";
import {
  chooseSession,
  sessionUseText,
  totalWithSession,
  type PackageOnHand,
  type PickedSession,
} from "@/features/wallet/session-use";
import { bestPromotion } from "@/features/wallet/promotion-rules";
import { bookingExtras, bookingSlots, type BookingExtras } from "./actions";
import { daySpan, OUTSIDE_HOURS, outsideHours, pauseOverlap, pauseWarning } from "./agenda-grid";
import { PauseConfirm } from "./PauseConfirm";
import { hhmm } from "./timeline";
import type { ServiceOption } from "./options";
import { METHOD_LABEL, PAYMENT_METHODS, type PaymentMethod } from "./payment";
import { centsToField, fieldToCents } from "./PaymentFields";
import { applyDiscount, parseDiscount, type DiscountKind } from "./pricing";

/**
 * Agendar em 4 passos curtos, uma pergunta por vez (prancha aprovada em 23/11): Para quem? → Qual serviço? →
 * Quando? (só horários livres que cabem na duração) → Tudo certo? (resumo com o total; desconto, sinal, "já pagou",
 * observação e prévia do WhatsApp são linhas opcionais que abrem um diálogo). O que já veio escolhido é pulado.
 * Tudo vai num <form> com os mesmos campos de antes (createAppointment não mudou).
 */

const STEPS = ["Cliente", "Serviço", "Quando", "Conferir"] as const;
type StepIx = 0 | 1 | 2 | 3;
const MAX_SERVICES = 5;
const DEPOSIT_PCTS = [20, 30, 50] as const;

const chip =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-bold transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary disabled:opacity-50";
const field = "min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base font-semibold";
const optionRow =
  "flex min-h-13 w-full items-center gap-3 rounded-2xl border px-3 text-left text-sm font-bold transition-colors";

const weekdayShort = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "");
/** "Ter, 24/11" */
export const shortDay = (date: string) => {
  const w = weekdayShort(date);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}, ${date.slice(8)}/${date.slice(5, 7)}`;
};
const firstName = (s: string) => s.trim().split(/\s+/)[0] ?? s;

type Pay = { choice: "none" | "request" | "deposit" | "full"; amount: string; method: PaymentMethod | null };

export type BookingStepsProps = {
  formDomId: string;
  clients: PickerOption[];
  services: ServiceOption[];
  date: string;
  time?: string;
  /** false = horário só sugerido: não pula o "Quando?" */
  timeTapped?: boolean;
  clientId?: string;
  serviceIds?: string[];
  fromBlockId?: string;
  week?: Day[] | null;
  depositPct: number;
  working: boolean;
  /** Erro de validação que voltou do servidor: leva ao passo do campo. */
  fieldErr: { code: ErrorCode; field?: string } | null;
  onSubmit: (fd: FormData) => void;
};

export function BookingSteps(p: BookingStepsProps) {
  const side = useSheetSide();
  const today = todayStr();
  // O que já veio escolhido (cliente da ficha, serviço de Vagas, horário tocado na agenda) é pulado
  const [skip] = useState(
    () =>
      new Set<number>([
        ...(p.clientId ? [0] : []),
        ...(p.serviceIds?.length ? [1] : []),
        ...(p.time && p.timeTapped !== false ? [2] : []),
      ]),
  );
  const nextAfter = (from: number): StepIx => {
    for (let i = from + 1; i < 3; i++) if (!skip.has(i)) return i as StepIx;
    return 3;
  };
  const [step, setStep] = useState<StepIx>(() => nextAfter(-1));
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [clientId, setClientId] = useState(p.clientId ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>(() =>
    (p.serviceIds ?? []).filter((id) => p.services.some((s) => s.id === id)).slice(0, MAX_SERVICES),
  );
  const [date, setDate] = useState(p.date);
  const [time, setTime] = useState(p.time ?? "");
  const [custom, setCustom] = useState(false);
  const [kind, setKind] = useState<DiscountKind | "">("");
  const [raw, setRaw] = useState("");
  const [pay, setPay] = useState<Pay>({ choice: "none", amount: "", method: null });
  const [notes, setNotes] = useState("");
  const [extras, setExtras] = useState<BookingExtras | null>(null);
  const [promos, setPromos] = useState<RunningPromotion[]>([]);
  const [usePromo, setUsePromo] = useState(true);
  /** Pacotes da cliente escolhida (com sessão sobrando) e se esta vez usa o pacote. */
  const [pkgs, setPkgs] = useState<{ clientId: string; list: PackageOnHand[] } | null>(null);
  const [usePkg, setUsePkg] = useState(true);
  /** Dia/horário/duração que a pessoa já confirmou mesmo pegando a pausa. */
  const [pauseOk, setPauseOk] = useState<string | null>(null);
  const [askPause, setAskPause] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Já andou entre passos: a partir daí a pergunta nova desliza e recebe o foco (na abertura, não). */
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    let alive = true;
    void bookingExtras()
      .then((r) => alive && r.ok && setExtras(r.data))
      .catch(() => {});
    void loadRunningPromotions()
      .then((r) => alive && r.ok && setPromos(r.data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    void loadClientPackages(clientId)
      .then((r) => alive && setPkgs({ clientId, list: r.ok ? r.data : [] }))
      .catch(() => alive && setPkgs({ clientId, list: [] }));
    return () => {
      alive = false;
    };
  }, [clientId]);

  // Erro do servidor: volta ao passo do campo
  const errField = p.fieldErr?.field;
  const [seenErr, setSeenErr] = useState(p.fieldErr);
  if (p.fieldErr !== seenErr) {
    setSeenErr(p.fieldErr);
    const to: StepIx | null =
      errField === "clientId"
        ? 0
        : errField === "serviceIds"
          ? 1
          : errField === "time" || errField === "date"
            ? 2
            : p.fieldErr
              ? 3
              : null;
    if (to !== null) {
      setDir("back");
      setStep(to);
    }
  }

  useEffect(() => {
    // Leitor de tela e teclado acompanham a pergunta nova (não na abertura)
    // Cada pergunta começa do topo
    scrollRef.current?.scrollTo({ top: 0 });
    if (moved) headRef.current?.focus({ preventScroll: true });
  }, [step, moved]);

  function go(to: StepIx) {
    setMoved(true);
    setDir(to < step ? "back" : "fwd");
    setStep(to);
  }

  const client = p.clients.find((c) => c.id === clientId) ?? null;
  const picked = serviceIds.map((id) => p.services.find((s) => s.id === id)).filter((s) => s !== undefined);
  const subtotal = picked.reduce((c, s) => c + s.priceCents, 0);
  const minutes = picked.reduce((m, s) => m + s.durationMin, 0);
  const discount = parseDiscount(kind, raw);
  // Promoção valendo: só sem desconto digitado (não somam); o servidor confere a vaga e se a cliente já usou
  // Pacote da cliente que cobre um dos serviços: mesma regra do servidor (session-use.chooseSession)
  const pkgPick =
    pkgs && pkgs.clientId === clientId && isDateStr(date) ? chooseSession(pkgs.list, serviceIds, date) : null;
  const pkgOn = !!pkgPick && usePkg;
  // Promoção não soma com sessão de pacote
  const promo = kind || pkgOn ? null : bestPromotion(promos, picked);
  const promoOn = !!promo && usePromo;
  const priced = applyDiscount(
    subtotal,
    promoOn ? { kind: "brl", value: promo.offCents } : discount === "invalid" ? null : discount,
  );
  const { discountCents } = priced;
  const { totalCents, owedCents } = totalWithSession(priced.totalCents, picked, pkgOn ? pkgPick : null);
  // Pega a pausa (ex.: almoço): aviso e confirmação antes de salvar (não impede)
  const pause = time ? pauseOverlap({ date, time, minutes, week: p.week }) : null;
  const pickKey = `${date}|${time}|${minutes}`;
  const asking = askPause && pause !== null && pauseOk !== pickKey;
  const depositCents = pay.choice === "request" || pay.choice === "deposit" ? fieldToCents(pay.amount) : null;
  const startMin = time ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) : 0;
  const outside =
    !!p.week &&
    !!time &&
    isDateStr(date) &&
    outsideHours({ start: startMin, end: startMin + Math.max(minutes, 1) }, daySpan(p.week[weekdayOf(date)]));

  const paidField =
    pay.choice === "full" ? "1" : pay.choice === "request" ? "request" : pay.choice === "deposit" ? "deposit" : "";
  // Prévia do WhatsApp: mesma função que monta a mensagem de verdade
  const preview = (() => {
    if (!client || !picked.length || !time || !isDateStr(date)) return null;
    return bookingText(
      {
        client: client.label,
        service: picked.map((s) => s.label).join(" + "),
        startsAt: toInstant(date, time),
        priceCents: totalCents,
        session:
          pkgOn && extras?.message.packageLine !== false
            ? { n: pkgPick.total - pkgPick.left, total: pkgPick.total }
            : null,
        deposit:
          pay.choice === "request" && depositCents ? { cents: depositCents, pixKey: extras?.message.pixKey } : null,
      },
      new Date(),
      { template: extras?.message.template, name: extras?.message.name, fullName: extras?.message.fullName },
    );
  })();

  return (
    <form
      ref={formRef}
      id={p.formDomId}
      onSubmit={(e) => {
        e.preventDefault();
        if (p.working) return;
        // Enter no meio dos passos avança em vez de agendar
        if (step < 3) {
          if (canContinue(step)) go(nextAfter(step));
          return;
        }
        if (pause && pauseOk !== pickKey) return setAskPause(true);
        p.onSubmit(new FormData(e.currentTarget));
      }}
      className={
        side === "right" ? "grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_15rem] gap-6" : "flex min-h-0 flex-1 flex-col"
      }
    >
      {p.fromBlockId ? <input type="hidden" name="fromBlockId" value={p.fromBlockId} /> : null}
      <input type="hidden" name="clientId" value={clientId} />
      {serviceIds.map((id) => (
        <input key={id} type="hidden" name="serviceIds" value={id} />
      ))}
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={time} />
      <input type="hidden" name="discountKind" value={kind} />
      <input type="hidden" name="discountValue" value={kind ? raw : ""} />
      <input type="hidden" name="notes" value={notes} />
      {promoOn ? <input type="hidden" name="usePromotion" value="1" /> : null}
      {pkgPick && !usePkg ? <input type="hidden" name="usePackage" value="0" /> : null}
      <input type="hidden" name="paid" value={paidField} />
      <input type="hidden" name="depositAmount" value={depositCents !== null ? pay.amount : ""} />
      <input
        type="hidden"
        name="paymentMethod"
        value={(pay.choice === "full" || pay.choice === "deposit") && pay.method ? pay.method : ""}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-3 md:px-0">
          <div className="flex min-h-11 items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => go((step - 1) as StepIx)}
                aria-label="Voltar"
                className="grid size-11 place-items-center rounded-full bg-soft text-primary-text"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
            ) : null}
            {step > 0 && client ? <span className="truncate text-sm font-bold">{client.label}</span> : null}
            <ol aria-label={`Passo ${step + 1} de 4`} className="ml-auto flex gap-1.5 md:mr-12">
              {STEPS.map((s, i) => (
                <li key={s} aria-current={i === step ? "step" : undefined}>
                  <span className="sr-only">{s}</span>
                  <span
                    aria-hidden="true"
                    className={`block h-1.5 w-6 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-line"}`}
                  />
                </li>
              ))}
            </ol>
          </div>

          <div key={step} className="bk-step" data-in={moved ? dir : undefined}>
            {step === 0 ? (
              <ClientStep
                headRef={headRef}
                clients={p.clients}
                recentIds={extras?.recentClientIds ?? []}
                value={clientId}
                onPick={(id) => {
                  setClientId(id);
                  go(nextAfter(0));
                }}
              />
            ) : step === 1 ? (
              <ServiceStep
                headRef={headRef}
                services={p.services}
                value={serviceIds}
                onChange={(ids) => {
                  setServiceIds(ids);
                  // Só existe um serviço: escolheu, avança
                  if (p.services.length === 1 && ids.length === 1) go(nextAfter(1));
                }}
              />
            ) : step === 2 ? (
              <WhenStep
                headRef={headRef}
                today={today}
                date={date}
                time={time}
                serviceIds={serviceIds}
                minutes={minutes}
                custom={custom}
                outside={outside}
                pauseText={pause ? pauseWarning(pause) : null}
                error={p.fieldErr && (errField === "time" || errField === "date") ? messageFor(p.fieldErr.code) : null}
                onDate={(d) => {
                  setDate(d);
                  if (!custom) setTime("");
                }}
                onTime={(t, fromSlots) => {
                  setTime(t);
                  if (fromSlots) {
                    setCustom(false);
                    go(3);
                  }
                }}
                onCustom={() => {
                  setCustom(true);
                  if (!time) setTime("09:00");
                }}
              />
            ) : (
              <ReviewStep
                headRef={headRef}
                client={client}
                date={date}
                time={time}
                picked={picked}
                subtotal={subtotal}
                discountCents={discountCents}
                discountLabel={
                  promoOn
                    ? `${promo.promo.name ?? "promoção"} −${promo.promo.label}`
                    : kind === "pct" && discount && discount !== "invalid"
                      ? `${discount.value}%`
                      : null
                }
                promo={promo}
                usePromo={usePromo}
                setUsePromo={setUsePromo}
                pauseText={pause ? pauseWarning(pause) : null}
                totalCents={totalCents}
                owedCents={owedCents}
                pkg={pkgPick}
                usePkg={usePkg}
                setUsePkg={setUsePkg}
                outside={outside}
                kind={kind}
                raw={raw}
                discountInvalid={discount === "invalid" || errField === "discountValue"}
                onDiscount={(k, r) => {
                  setKind(k);
                  setRaw(r);
                }}
                pay={pay}
                setPay={setPay}
                depositPct={p.depositPct}
                depositError={errField === "depositAmount"}
                pixKey={extras?.message.pixKey ?? null}
                notes={notes}
                setNotes={setNotes}
                preview={preview}
                onEdit={go}
                fieldErr={p.fieldErr}
              />
            )}
          </div>
        </div>

        <div className="border-t border-line px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] md:px-0 md:pb-0">
          {step === 0 ? (
            <p className="py-2 text-sm font-semibold text-muted">Passo 1 de 4 · toque na cliente</p>
          ) : step === 1 || step === 2 ? (
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 text-xs font-bold leading-tight text-muted" aria-live="polite">
                {step === 1 ? (
                  picked.length ? (
                    <>
                      {picked.length} {picked.length > 1 ? "serviços" : "serviço"} · {formatDuration(minutes)}
                      <b className="block text-lg tabular-nums text-fg">{formatBRL(subtotal)}</b>
                    </>
                  ) : (
                    "Escolha pelo menos um"
                  )
                ) : time ? (
                  <>
                    {shortDay(date)}
                    <b className="block text-lg tabular-nums text-fg">{time}</b>
                  </>
                ) : (
                  "Escolha um horário"
                )}
              </p>
              <button
                type="button"
                disabled={!canContinue(step)}
                onClick={() => go(nextAfter(step))}
                className="btn-tint flex min-h-13 items-center justify-center rounded-full px-7 font-bold disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          ) : asking && pause ? (
            <PauseConfirm
              pause={`${hhmm(pause.start)} às ${hhmm(pause.end)}`}
              onPickAnother={() => {
                setAskPause(false);
                go(2);
              }}
              onConfirm={() => {
                setPauseOk(pickKey);
                setAskPause(false);
                if (formRef.current && !p.working) p.onSubmit(new FormData(formRef.current));
              }}
            />
          ) : (
            <button
              type="submit"
              disabled={p.working || !clientId || !picked.length || !time}
              className="btn-tint flex min-h-13 w-full items-center justify-center rounded-full px-5 font-bold"
            >
              Agendar
            </button>
          )}
        </div>
      </div>

      {side === "right" ? (
        <aside aria-label="Resumo" className="hidden border-l border-line pl-5 md:grid md:content-start md:gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Resumo</p>
          <p className="font-bold">{client?.label ?? "—"}</p>
          {picked.map((s) => (
            <p key={s.id} className="flex justify-between gap-2 text-sm font-semibold">
              <span className="truncate">{s.label}</span>
              <span className="tabular-nums">{formatBRL(s.priceCents)}</span>
            </p>
          ))}
          {time ? (
            <p className="flex justify-between text-sm font-semibold">
              <span>{shortDay(date)}</span>
              <span className="tabular-nums">{time}</span>
            </p>
          ) : null}
          {discountCents ? (
            <p className="flex justify-between text-sm font-semibold text-ok">
              <span>Desconto</span>
              <span className="tabular-nums">−{formatBRL(discountCents)}</span>
            </p>
          ) : null}
          <p className="mt-1 flex items-baseline justify-between border-t border-dashed border-line pt-2">
            <span className="text-sm font-bold">Total</span>
            <b className="text-2xl tabular-nums text-primary-text">{formatBRL(totalCents)}</b>
          </p>
          {step < 3 ? <p className="text-xs font-semibold text-muted">Desconto e sinal no último passo.</p> : null}
        </aside>
      ) : null}
    </form>
  );

  function canContinue(s: StepIx) {
    if (s === 0) return !!clientId;
    if (s === 1) return picked.length > 0;
    if (s === 2) return !!time && isDateStr(date);
    return true;
  }
}

function Heading({
  headRef,
  title,
  hint,
}: {
  headRef: React.RefObject<HTMLHeadingElement | null>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="pt-3 pb-3">
      <h3 ref={headRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
        {title}
      </h3>
      {hint ? <p className="text-sm font-semibold text-muted">{hint}</p> : null}
    </div>
  );
}

/** Passo 1: recentes no topo (1 toque), busca e a lista por letra. Tocou, avança. */
function ClientStep({
  headRef,
  clients,
  recentIds,
  value,
  onPick,
}: {
  headRef: React.RefObject<HTMLHeadingElement | null>;
  clients: PickerOption[];
  recentIds: string[];
  value: string;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("pt-BR");
  const groups = useMemo(
    () => groupByLetter(q ? clients.filter((o) => o.label.toLocaleLowerCase("pt-BR").includes(q)) : clients),
    [clients, q],
  );
  const recents = q
    ? []
    : recentIds
        .map((id) => clients.find((c) => c.id === id))
        .filter((c) => c !== undefined)
        .slice(0, 4);
  const anchor = (l: string) => `bk-cli-${l === "#" ? "num" : l}`;

  return (
    <div>
      <Heading headRef={headRef} title="Para quem?" hint="Toque na cliente ou busque pelo nome" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar cliente"
        aria-label="Buscar cliente"
        className={field}
      />
      {recents.length ? (
        <section aria-label="Recentes" className="pt-4">
          <p className="pb-2 text-xs font-bold uppercase tracking-wide text-muted">Recentes</p>
          <div className="grid grid-cols-4 gap-2">
            {recents.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={value === c.id}
                onClick={() => onPick(c.id)}
                className="grid justify-items-center gap-1.5 rounded-2xl py-1 text-xs font-bold"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-13 place-items-center rounded-full text-lg ${value === c.id ? "bg-primary text-on-primary" : "bg-soft text-primary-text"}`}
                >
                  {c.label.trim().charAt(0).toUpperCase()}
                </span>
                <span className="w-full truncate text-center">{firstName(c.label)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {groups.length > 1 ? (
        <nav aria-label="Índice de letras" className="flex flex-wrap gap-1.5 pt-4">
          {groups.map((g) => (
            <a
              key={g.letter}
              href={`#${anchor(g.letter)}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(anchor(g.letter))?.scrollIntoView({ block: "start", behavior: "smooth" });
              }}
              className="grid size-9 place-items-center rounded-full bg-soft text-sm font-bold text-primary-text"
            >
              {g.letter}
            </a>
          ))}
        </nav>
      ) : null}
      <div className="pt-2">
        {groups.length === 0 ? (
          <p className="py-8 text-center text-sm font-semibold text-muted">Nada encontrado para “{query}”.</p>
        ) : (
          groups.map((g) => (
            <section key={g.letter} id={anchor(g.letter)} aria-label={g.letter} className="scroll-mt-2">
              <h4 className="sticky top-0 z-10 bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] py-1 text-xs font-bold text-primary-text backdrop-blur">
                {g.letter}
              </h4>
              <ul className="divide-y divide-line">
                {g.items.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      aria-pressed={value === o.id}
                      onClick={() => onPick(o.id)}
                      className="flex min-h-13 w-full items-center justify-between gap-3 py-2 text-left"
                    >
                      <span className="grid">
                        <span className="text-base font-semibold">{o.label}</span>
                        {o.hint ? <span className="text-sm font-semibold text-muted">{o.hint}</span> : null}
                      </span>
                      {value === o.id ? <Icon name="checkCircle" size={20} /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

/** Passo 2: serviços em cartões (vários, na ordem do toque), com valor e duração. */
function ServiceStep({
  headRef,
  services,
  value,
  onChange,
}: {
  headRef: React.RefObject<HTMLHeadingElement | null>;
  services: ServiceOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const full = value.length >= MAX_SERVICES;
  return (
    <div>
      <Heading headRef={headRef} title="Qual serviço?" hint={`Pode escolher mais de um (até ${MAX_SERVICES})`} />
      <ul className="grid gap-2">
        {services.map((s) => {
          const on = value.includes(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => onChange(on ? value.filter((x) => x !== s.id) : [...value, s.id])}
                className={`${optionRow} ${on ? "border-primary bg-soft" : "border-line bg-surface"} disabled:opacity-50`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${on ? "border-primary bg-primary text-on-primary" : "border-line"}`}
                >
                  {on ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  ) : null}
                </span>
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-base">{s.label}</span>
                  <span className="text-xs font-semibold text-muted">{formatDuration(s.durationMin)}</span>
                </span>
                <span className="text-base tabular-nums">{formatBRL(s.priceCents)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Passo 3: dia numa faixa e os horários livres que cabem na duração; "Outro horário" abre o seletor livre. */
function WhenStep({
  headRef,
  today,
  date,
  time,
  serviceIds,
  minutes,
  custom,
  outside,
  pauseText,
  error,
  onDate,
  onTime,
  onCustom,
}: {
  headRef: React.RefObject<HTMLHeadingElement | null>;
  today: string;
  date: string;
  time: string;
  serviceIds: string[];
  minutes: number;
  custom: boolean;
  outside: boolean;
  pauseText: string | null;
  /** Erro do servidor no horário (ex.: acabou de ser ocupado) */
  error: string | null;
  onDate: (d: string) => void;
  onTime: (t: string, fromSlots: boolean) => void;
  onCustom: () => void;
}) {
  const start = date < today ? date : today;
  const days = Array.from({ length: 14 }, (_, i) => addDays(start, i));
  const [retry, setRetry] = useState(0);
  const key = `${date}|${serviceIds.join(",")}|${retry}`;
  // Resposta marcada com o pedido: trocar de dia mostra o carregando até chegar a do dia novo
  const [res, setRes] = useState<
    { key: string; list: string[]; closed: boolean } | { key: string; error: true } | null
  >(null);
  useEffect(() => {
    let alive = true;
    bookingSlots(date, serviceIds)
      .then((r) => alive && setRes(r.ok ? { key, list: r.data.slots, closed: r.data.closed } : { key, error: true }))
      .catch(() => alive && setRes({ key, error: true }));
    return () => {
      alive = false;
    };
  }, [key, date, serviceIds]);
  const current = res?.key === key ? res : null;
  const slots = current && "error" in current ? "error" : null;
  const ready = current && !("error" in current) ? current : null;
  const morning = ready?.list.filter((t) => t < "12:00") ?? [];
  const afternoon = ready?.list.filter((t) => t >= "12:00") ?? [];
  const selectedOutside = !!time && !!ready && !ready.list.includes(time);

  return (
    <div>
      {error ? (
        <p role="alert" className="mt-3 rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
          {error}
        </p>
      ) : null}
      <Heading
        headRef={headRef}
        title="Quando?"
        hint={minutes ? `Só aparecem horários com ${formatDuration(minutes)} livres` : undefined}
      />
      <div role="group" aria-label="Dia" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === date}
            aria-label={shortDay(d)}
            onClick={() => onDate(d)}
            className="grid min-h-15 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-surface py-1.5 text-xs font-bold text-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary"
          >
            {d === today ? "Hoje" : weekdayShort(d)}
            <b className="text-lg leading-none text-current">{Number(d.slice(8))}</b>
          </button>
        ))}
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm font-bold text-muted">
        Outro dia
        <input
          type="date"
          aria-label="Dia"
          value={date}
          onChange={(e) => isDateStr(e.target.value) && onDate(e.target.value)}
          className="min-h-11 rounded-full border border-line bg-surface px-3 text-base font-semibold text-fg"
        />
      </label>

      <div className="pt-3" aria-live="polite" aria-busy={!ready && slots !== "error"}>
        {slots === "error" ? (
          <div role="alert" className="grid gap-2 rounded-2xl bg-fail-bg px-4 py-3 text-sm font-semibold text-fail">
            Não deu para ver os horários livres agora.
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="justify-self-start font-bold underline"
            >
              Tentar de novo
            </button>
          </div>
        ) : !ready ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-full" />
            ))}
          </div>
        ) : ready.list.length === 0 ? (
          <p className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold text-primary-text">
            {ready.closed ? "Dia sem expediente." : "Sem horário livre neste dia."} Escolha outro dia ou use “Outro
            horário”.
          </p>
        ) : (
          [
            ["Manhã", morning],
            ["Tarde e noite", afternoon],
          ].map(([label, list]) =>
            (list as string[]).length ? (
              <div key={label as string} role="group" aria-label={label as string} className="pb-3">
                <p className="pb-2 text-xs font-bold uppercase tracking-wide text-muted">{label as string}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(list as string[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={!custom && t === time}
                      onClick={() => onTime(t, true)}
                      className={`${chip} px-0 tabular-nums`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : null,
          )
        )}
      </div>

      {custom || (selectedOutside && time) ? (
        <label className="grid gap-1 pt-1 text-sm font-bold">
          Horário
          <select
            value={time}
            onChange={(e) => onTime(e.target.value, false)}
            aria-describedby={outside ? "fora-expediente" : undefined}
            className={field}
          >
            {timeOptions({ include: time || undefined }).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      ) : (
        <button
          type="button"
          onClick={onCustom}
          className={`${optionRow} border-dashed border-[color-mix(in_srgb,var(--primary)_35%,transparent)] text-primary-text`}
        >
          <Icon name="clock" size={18} />
          Outro horário (fora das vagas)
        </button>
      )}
      {pauseText ? (
        <p
          role="status"
          className="mt-2 flex items-center gap-2 rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait"
        >
          <Icon name="alert" size={18} />
          {pauseText}. Dá para agendar mesmo assim.
        </p>
      ) : null}
      {outside ? (
        <p
          id="fora-expediente"
          role="status"
          className="mt-2 flex items-center gap-2 rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait"
        >
          <Icon name="alert" size={18} />
          {OUTSIDE_HOURS}. Dá para agendar mesmo assim.
        </p>
      ) : null}
    </div>
  );
}

/** Diálogo pequeno por cima do agendar (desconto, sinal, já pagou, prévia). */
function OptionSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const side = useSheetSide();
  return (
    <Drawer.NestedRoot direction={side} open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-h-[86dvh] max-w-[520px] rounded-t-3xl outline-none",
            "sheet z-60 flex flex-col",
          )}
        >
          <SidePanelClose />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 md:px-0">
            <Drawer.Title className="text-xl font-bold">{title}</Drawer.Title>
            <Drawer.Description className="pb-3 text-sm font-semibold text-muted">{description}</Drawer.Description>
            {children}
          </div>
          <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] md:px-0 md:pb-0">{footer}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
}

/** Passo 4: resumo com o total grande; desconto, sinal, "já pagou", observação e prévia são opcionais. */
function ReviewStep(props: {
  headRef: React.RefObject<HTMLHeadingElement | null>;
  client: PickerOption | null;
  date: string;
  time: string;
  picked: ServiceOption[];
  subtotal: number;
  discountCents: number;
  discountLabel: string | null;
  totalCents: number;
  /** O que a cliente ainda paga (total menos a sessão do pacote) */
  owedCents: number;
  pkg: PickedSession | null;
  usePkg: boolean;
  setUsePkg: (v: boolean) => void;
  outside: boolean;
  pauseText: string | null;
  promo: { promo: RunningPromotion; offCents: number } | null;
  usePromo: boolean;
  setUsePromo: (v: boolean) => void;
  kind: DiscountKind | "";
  raw: string;
  discountInvalid: boolean;
  onDiscount: (k: DiscountKind | "", raw: string) => void;
  pay: Pay;
  setPay: (p: Pay) => void;
  depositPct: number;
  depositError: boolean;
  pixKey: string | null;
  notes: string;
  setNotes: (n: string) => void;
  preview: string | null;
  onEdit: (s: StepIx) => void;
  fieldErr: { code: ErrorCode; field?: string } | null;
}) {
  const { pay, totalCents } = props;
  const [sheet, setSheet] = useState<"discount" | "deposit" | "full" | "preview" | null>(
    props.depositError ? "deposit" : props.discountInvalid && props.kind ? "discount" : null,
  );
  const [showNotes, setShowNotes] = useState(!!props.notes);
  const first = props.client ? firstName(props.client.label) : "a cliente";
  const depositCents = pay.choice === "request" || pay.choice === "deposit" ? fieldToCents(pay.amount) : null;

  return (
    <div>
      <Heading
        headRef={props.headRef}
        title="Tudo certo?"
        hint={props.client ? `${props.client.label} · ${shortDay(props.date)} às ${props.time}` : undefined}
      />
      <div className="glass grid gap-1 rounded-2xl px-4 py-3">
        <EditLine label="Cliente" value={props.client?.label ?? "—"} onEdit={() => props.onEdit(0)} />
        <EditLine label="Quando" value={`${shortDay(props.date)} às ${props.time}`} onEdit={() => props.onEdit(2)} />
        <div className="mt-1 border-t border-line pt-2">
          {props.picked.map((s) => (
            <p key={s.id} className="flex justify-between gap-3 py-0.5 text-sm font-semibold">
              <span className="truncate">{s.label}</span>
              <span className="tabular-nums">{formatBRL(s.priceCents)}</span>
            </p>
          ))}
          <button
            type="button"
            onClick={() => props.onEdit(1)}
            className="min-h-11 text-sm font-bold text-primary-text"
          >
            Trocar serviços
          </button>
          {props.discountCents ? (
            <p className="flex justify-between py-0.5 text-sm font-semibold text-ok">
              <span>Desconto{props.discountLabel ? ` ${props.discountLabel}` : ""}</span>
              <span className="tabular-nums">−{formatBRL(props.discountCents)}</span>
            </p>
          ) : null}
        </div>
        <p
          className="mt-1 flex items-baseline justify-between border-t border-dashed border-line pt-2"
          aria-live="polite"
        >
          <span className="font-bold">Total</span>
          <b className="text-3xl tabular-nums tracking-tight text-primary-text">{formatBRL(totalCents)}</b>
        </p>
      </div>
      {props.outside ? (
        <p
          role="status"
          className="mt-2 flex items-center gap-2 rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait"
        >
          <Icon name="alert" size={18} />
          {OUTSIDE_HOURS}. Dá para agendar mesmo assim.
        </p>
      ) : null}
      {props.pauseText ? (
        <p
          role="status"
          className="mt-2 flex items-center gap-2 rounded-2xl bg-wait-bg px-4 py-3 text-sm font-semibold text-wait"
        >
          <Icon name="alert" size={18} />
          {props.pauseText}. Dá para agendar mesmo assim.
        </p>
      ) : null}
      {props.pkg ? (
        <div
          className="mt-3 grid gap-2 rounded-2xl border-2 border-primary/30 bg-soft px-4 py-3"
          role="group"
          aria-label="Pacote da cliente"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-primary-text">
              <Icon name="ticket" size={18} />
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold">
              <span className="block text-muted">Pelo pacote {props.pkg.name}</span>
              <b className="block text-lg text-primary-text">
                {sessionUseText({ n: props.pkg.total - props.pkg.left, total: props.pkg.total, left: props.pkg.left })}
              </b>
              {props.usePkg
                ? `${formatBRL(props.pkg.valueCents)} já pago pelo pacote${
                    props.owedCents > 0 ? ` · falta ${formatBRL(props.owedCents)}` : ""
                  }`
                : "Desligado: cobra o serviço normal e a sessão fica no pacote."}
            </p>
          </div>
          <div className="flex min-h-11 items-center justify-between gap-3 text-sm font-bold">
            Usar sessão do pacote
            <Switch checked={props.usePkg} onChange={props.setUsePkg} label="Usar sessão do pacote" />
          </div>
        </div>
      ) : null}
      {props.promo ? (
        <div
          className="mt-3 grid gap-2 rounded-2xl border-2 border-primary/30 bg-soft px-4 py-3"
          role="group"
          aria-label="Promoção"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-primary-text">
              <Icon name="percent" size={18} />
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold">
              <b className="block text-base">
                {props.promo.promo.name ? `${props.promo.promo.name}: ` : "Promoção: "}−{props.promo.promo.label}
              </b>
              −{formatBRL(props.promo.offCents)} neste agendamento
              {props.promo.promo.left !== null
                ? ` · restam ${props.promo.promo.left} de ${props.promo.promo.maxClients}`
                : ""}
            </p>
          </div>
          <div className="flex min-h-11 items-center justify-between gap-3 text-sm font-bold">
            Usar a promoção
            <Switch checked={props.usePromo} onChange={props.setUsePromo} label="Usar a promoção" />
          </div>
          <p className="text-xs font-semibold text-muted">Vale 1 vez por cliente e não soma com sessão de pacote.</p>
        </div>
      ) : null}

      <div className="grid gap-2 pt-3">
        <OptionButton
          icon="%"
          label="Desconto"
          value={props.discountCents ? `− ${formatBRL(props.discountCents)}` : null}
          onClick={() => setSheet("discount")}
        />
        {pay.choice === "full" || props.owedCents === 0 ? null : (
          <OptionButton
            icon="💜"
            label="Sinal"
            value={
              depositCents
                ? pay.choice === "request"
                  ? `Pedir ${formatBRL(depositCents)}`
                  : `Recebido ${formatBRL(depositCents)}`
                : null
            }
            tone={pay.choice === "request" ? "wait" : "ok"}
            onClick={() => setSheet("deposit")}
          />
        )}
        {pay.choice === "request" || pay.choice === "deposit" || props.owedCents === 0 ? null : (
          <OptionButton
            icon="✓"
            label="Já pagou tudo?"
            value={pay.choice === "full" ? `Pago${pay.method ? ` · ${METHOD_LABEL[pay.method]}` : ""}` : null}
            tone="ok"
            onClick={() => setSheet("full")}
          />
        )}
        {showNotes ? (
          <label className="grid gap-1 text-sm font-bold">
            Observação
            <input
              value={props.notes}
              onChange={(e) => props.setNotes(e.target.value.slice(0, 300))}
              maxLength={300}
              autoComplete="off"
              placeholder="Ex.: desconto de aniversário"
              className={field}
            />
          </label>
        ) : (
          <OptionButton icon="✎" label="Observação" value={null} onClick={() => setShowNotes(true)} />
        )}
        {props.preview ? (
          <button
            type="button"
            onClick={() => setSheet("preview")}
            className="flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-primary-text"
          >
            Ver o que {first} recebe no WhatsApp
          </button>
        ) : null}
      </div>

      {props.fieldErr && !["discountValue", "depositAmount", "time", "date"].includes(props.fieldErr.field ?? "") ? (
        <p role="alert" className="mt-2 rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
          {messageFor(props.fieldErr.code)}
        </p>
      ) : null}

      <DiscountSheet
        open={sheet === "discount"}
        onOpenChange={(o) => setSheet(o ? "discount" : null)}
        subtotal={props.subtotal}
        kind={props.kind}
        raw={props.raw}
        invalid={props.discountInvalid}
        onSave={props.onDiscount}
      />
      <DepositSheet
        open={sheet === "deposit"}
        onOpenChange={(o) => setSheet(o ? "deposit" : null)}
        totalCents={props.owedCents}
        depositPct={props.depositPct}
        pay={pay}
        pixKey={props.pixKey}
        serverError={props.depositError}
        onSave={props.setPay}
      />
      <OptionSheet
        open={sheet === "full"}
        onOpenChange={(o) => setSheet(o ? "full" : null)}
        title="Já pagou tudo?"
        description={`${formatBRL(props.owedCents)} · a forma é opcional`}
        footer={
          <div className="flex gap-2">
            {pay.choice === "full" ? (
              <button
                type="button"
                onClick={() => {
                  props.setPay({ choice: "none", amount: "", method: null });
                  setSheet(null);
                }}
                className="btn-glass min-h-13 flex-1 rounded-full font-bold"
              >
                Ainda não pagou
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                props.setPay({ ...pay, choice: "full" });
                setSheet(null);
              }}
              className="btn-tint min-h-13 flex-1 rounded-full font-bold"
            >
              Marcar como pago
            </button>
          </div>
        }
      >
        <MethodChips value={pay.method} onChange={(m) => props.setPay({ ...pay, method: m })} />
      </OptionSheet>
      <OptionSheet
        open={sheet === "preview"}
        onOpenChange={(o) => setSheet(o ? "preview" : null)}
        title={`O que ${first} recebe`}
        description="Sai pelo WhatsApp do salão assim que agendar."
        footer={
          <button
            type="button"
            onClick={() => setSheet(null)}
            className="btn-glass min-h-13 w-full rounded-full font-bold"
          >
            Voltar ao resumo
          </button>
        }
      >
        <p className="whitespace-pre-line rounded-2xl rounded-bl-md bg-[#e7f8dc] px-4 py-3 text-sm font-semibold leading-relaxed text-[#1f2a1a]">
          {props.preview}
        </p>
        <p className="pt-3 text-xs font-semibold text-muted">
          Sem WhatsApp conectado, você é avisada e o agendamento é feito mesmo assim.
        </p>
      </OptionSheet>
    </div>
  );
}

function EditLine({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`${label}: ${value}. Trocar`}
      className="flex min-h-11 items-center justify-between gap-3 text-left"
    >
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-sm font-bold">
        <span className="truncate">{value}</span>
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

function OptionButton({
  icon,
  label,
  value,
  tone = "primary",
  onClick,
}: {
  icon: string;
  label: string;
  value: string | null;
  tone?: "primary" | "wait" | "ok";
  onClick: () => void;
}) {
  const pill =
    tone === "wait" ? "bg-wait-bg text-wait" : tone === "ok" ? "bg-ok-bg text-ok" : "bg-soft text-primary-text";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${optionRow} ${value ? "border-line bg-surface text-fg" : "border-dashed border-[color-mix(in_srgb,var(--primary)_35%,transparent)] text-primary-text"}`}
    >
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-soft text-sm">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {value ? (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${pill}`}>{value}</span>
      ) : (
        <span className="text-xs font-semibold text-muted">Opcional</span>
      )}
    </button>
  );
}

function MethodChips({
  value,
  onChange,
}: {
  value: PaymentMethod | null;
  onChange: (m: PaymentMethod | null) => void;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-bold text-muted">Forma (opcional)</p>
      <div className="flex gap-2" role="group" aria-label="Forma de pagamento">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={value === m}
            onClick={() => onChange(value === m ? null : m)}
            className={`${chip} flex-1`}
          >
            {METHOD_LABEL[m]}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiscountSheet({
  open,
  onOpenChange,
  subtotal,
  kind: savedKind,
  raw: savedRaw,
  invalid,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subtotal: number;
  kind: DiscountKind | "";
  raw: string;
  invalid: boolean;
  onSave: (k: DiscountKind | "", raw: string) => void;
}) {
  const [kind, setKind] = useState<DiscountKind | "">(savedKind || "pct");
  const [raw, setRaw] = useState(savedRaw);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setKind(savedKind || "pct");
      setRaw(savedRaw);
    }
  }
  const d = parseDiscount(kind, raw);
  const bad = d === "invalid" || (invalid && raw === savedRaw && kind === savedKind && !!kind);
  const { discountCents, totalCents } = applyDiscount(subtotal, d === "invalid" ? null : d);
  return (
    <OptionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Desconto"
      description={`Serviços: ${formatBRL(subtotal)}`}
      footer={
        <div className="flex gap-2">
          {savedKind ? (
            <button
              type="button"
              onClick={() => {
                onSave("", "");
                onOpenChange(false);
              }}
              className="btn-glass min-h-13 flex-1 rounded-full font-bold"
            >
              Sem desconto
            </button>
          ) : null}
          <button
            type="button"
            disabled={bad || !raw}
            onClick={() => {
              onSave(kind, raw);
              onOpenChange(false);
            }}
            className="btn-tint min-h-13 flex-1 rounded-full font-bold disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-soft p-1" role="group" aria-label="Tipo de desconto">
        {(
          [
            ["pct", "Em %"],
            ["brl", "Em R$"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setRaw("");
            }}
            className="min-h-11 rounded-xl text-sm font-bold text-primary-text aria-pressed:bg-surface aria-pressed:text-fg aria-pressed:shadow-sm"
          >
            {label}
          </button>
        ))}
      </div>
      <input
        inputMode={kind === "pct" ? "numeric" : "decimal"}
        autoComplete="off"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={kind === "pct" ? "10" : "15,00"}
        aria-label={kind === "pct" ? "Desconto em porcentagem" : "Desconto em reais"}
        aria-invalid={bad || undefined}
        className="mt-3 min-h-14 w-full rounded-2xl border border-line bg-surface px-4 text-center text-2xl font-bold tabular-nums"
      />
      {bad ? (
        <p role="alert" className="pt-1 text-sm font-semibold text-fail">
          {kind === "pct" ? "Use um número de 1 a 100." : "Use um valor em reais, como 15 ou 15,50."}
        </p>
      ) : discountCents ? (
        <p className="pt-2 text-center text-sm font-semibold text-muted">
          − {formatBRL(discountCents)} · fica <b className="text-lg text-primary-text">{formatBRL(totalCents)}</b>
        </p>
      ) : null}
    </OptionSheet>
  );
}

function DepositSheet({
  open,
  onOpenChange,
  totalCents,
  depositPct,
  pay,
  pixKey,
  serverError,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  totalCents: number;
  depositPct: number;
  pay: Pay;
  pixKey: string | null;
  serverError: boolean;
  onSave: (p: Pay) => void;
}) {
  const initial = (): Pay =>
    pay.choice === "request" || pay.choice === "deposit"
      ? pay
      : { choice: "request", amount: centsToField(suggestedDeposit(totalCents, depositPct)), method: null };
  const [draft, setDraft] = useState<Pay>(initial);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initial());
  }
  const cents = fieldToCents(draft.amount);
  const bad = draft.choice !== "none" && (cents === null || cents >= totalCents);
  const rest = cents !== null ? Math.max(0, totalCents - cents) : null;
  return (
    <OptionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Sinal"
      description={`Total ${formatBRL(totalCents)} · sugestão ${depositPct}%`}
      footer={
        <button
          type="button"
          disabled={bad}
          onClick={() => {
            onSave(draft.choice === "none" ? { choice: "none", amount: "", method: null } : draft);
            onOpenChange(false);
          }}
          className="btn-tint min-h-13 w-full rounded-full font-bold disabled:opacity-50"
        >
          Pronto
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-soft p-1" role="group" aria-label="Sinal">
        {(
          [
            ["none", "Sem sinal"],
            ["request", "Pedir à cliente"],
            ["deposit", "Já recebi"],
          ] as const
        ).map(([c, label]) => (
          <button
            key={c}
            type="button"
            aria-pressed={draft.choice === c}
            onClick={() =>
              setDraft({
                ...draft,
                choice: c,
                amount: draft.amount || centsToField(suggestedDeposit(totalCents, depositPct)),
              })
            }
            className="min-h-11 rounded-xl px-1 text-sm font-bold text-primary-text aria-pressed:bg-surface aria-pressed:text-fg aria-pressed:shadow-sm"
          >
            {label}
          </button>
        ))}
      </div>
      {draft.choice === "none" ? (
        <p className="pt-4 text-center text-sm font-semibold text-muted">A cliente paga tudo no dia.</p>
      ) : (
        <>
          <label className="relative mx-auto mt-4 block w-52">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted">
              R$
            </span>
            <input
              inputMode="decimal"
              autoComplete="off"
              aria-label="Valor do sinal"
              aria-invalid={bad || serverError || undefined}
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              className="min-h-15 w-full rounded-2xl border border-line bg-surface pl-12 pr-4 text-center text-3xl font-bold tabular-nums text-primary-text"
            />
          </label>
          {bad ? (
            <p role="alert" className="pt-1 text-center text-sm font-semibold text-fail">
              Digite o valor do sinal, menor que o total (ex.: 30,00).
            </p>
          ) : rest !== null ? (
            <p className="pt-1 text-center text-sm font-semibold text-muted">
              Falta <b className="text-fg">{formatBRL(rest)}</b> no dia
            </p>
          ) : null}
          <div className="flex justify-center gap-2 pt-3" role="group" aria-label="Porcentagem do sinal">
            {[...new Set([...DEPOSIT_PCTS, depositPct])]
              .sort((a, b) => a - b)
              .map((pct) => {
                const v = centsToField(suggestedDeposit(totalCents, pct));
                return (
                  <button
                    key={pct}
                    type="button"
                    aria-pressed={draft.amount === v}
                    onClick={() => setDraft({ ...draft, amount: v })}
                    className={chip}
                  >
                    {pct}%
                  </button>
                );
              })}
          </div>
          {draft.choice === "request" ? (
            <p className="pt-4 text-center text-sm font-semibold text-muted">
              Vai no WhatsApp {pixKey ? "com a sua chave Pix" : "(cadastre a chave Pix em Ajustes › Pagamentos)"}. Fica{" "}
              <b className="text-wait">a receber</b> até você marcar &quot;Sinal recebido&quot;.
            </p>
          ) : (
            <div className="pt-4">
              <MethodChips value={draft.method} onChange={(m) => setDraft({ ...draft, method: m })} />
            </div>
          )}
        </>
      )}
    </OptionSheet>
  );
}
