"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { Icon, TileTitle } from "@/components/ui/Icon";
import { applyDiscount, parseDiscount, type DiscountKind } from "@/features/appointments/pricing";
import { formatBRL } from "@/lib/dates";
import { messageFor, type ErrorCode } from "@/lib/errors";
import { createPromotionAction, updatePromotionAction } from "./actions";
import { DeleteOffer, isLive, splitByLive, StatusBadge, statusLabel, ToggleOffer } from "./OfferControls";
import { CapBar, NameField } from "./PackageSheets";
import { promotionFacts, promotionOffer } from "./promotion-rules";
import { capText, periodText, type SalonInfo } from "./promo-text";
import { ShareTextPanel, ShareTextSheet } from "./ShareText";
import type { PromotionView } from "./views";

type Svc = { id: string; name: string; priceCents: number };

const chip =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line bg-surface px-3 text-sm font-bold transition-colors aria-checked:border-primary aria-checked:bg-primary aria-checked:text-on-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary";
const field = "min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base";
const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold";

/** "O que acontece" com a promoção, em uma frase, conforme a situação. */
function whatHappens(p: PromotionView): string {
  switch (p.status) {
    case "running":
      return p.left === null
        ? "Funcionando: entra sozinha ao agendar os serviços da promoção."
        : `Funcionando: entra sozinha ao agendar. Ao chegar em ${p.maxClients} clientes, esgota.`;
    case "scheduled":
      return "Ainda não começou: entra sozinha no dia de início.";
    case "paused":
      return "Desativada: não entra em agendamento novo até você reativar. Quem já agendou mantém o desconto.";
    case "sold_out":
      return "Esgotada: chegou no limite. Se alguém cancelar, a vaga volta; ou edite o limite.";
    case "ended":
      return "Vencida: o período acabou. Edite as datas para usar de novo.";
  }
}

function PromoCard({ p, salon, services }: { p: PromotionView; salon: SalonInfo; services: Svc[] }) {
  const title = p.name ?? p.offer;
  const live = isLive(p.status);
  const off = p.paused || p.ended;
  return (
    <li
      aria-label={`${title}: ${statusLabel(p.status, "a")}`}
      className={`grid gap-2 rounded-2xl px-4 py-3 ${live ? "bg-soft" : "border border-dashed border-line bg-surface/60"}`}
    >
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-1">
          <StatusBadge status={p.status} g="a" />
          <p className={`font-bold ${live ? "" : "text-muted"}`}>{title}</p>
          {p.name ? <p className="text-sm font-semibold text-muted">{p.offer}</p> : null}
        </div>
        <span
          className={`shrink-0 text-2xl font-bold tabular-nums ${live ? "text-primary-text" : "text-muted line-through decoration-2"}`}
        >
          −{p.label}
        </span>
      </div>
      <span className="flex flex-wrap gap-1.5">
        {p.period ? (
          <span className={`${pill} bg-surface`}>
            <Icon name="calendar" size={13} className="text-primary-text" />
            {p.period}
          </span>
        ) : null}
        {p.maxClients === null ? (
          <span className={`${pill} bg-surface`}>
            <Icon name="users" size={13} className="text-primary-text" />
            {p.used} {p.used === 1 ? "cliente usou" : "clientes usaram"}
          </span>
        ) : null}
      </span>
      <CapBar used={p.used} max={p.maxClients} label="usaram" />
      <p className="text-sm font-semibold text-muted">{whatHappens(p)}</p>
      <div className="flex flex-wrap items-center gap-2">
        {live ? <ShareTextSheet title={title} facts={p.facts} salon={salon} /> : null}
        <ToggleOffer target="promotion" id={p.id} title={title} paused={off} g="a" />
        <NewPromotionSheet services={services} salon={salon} edit={p} />
        <DeleteOffer target="promotion" id={p.id} title={title} used={p.used} />
      </div>
    </li>
  );
}

/** Planos > Promoções: ativas em cima; desativadas, vencidas e esgotadas embaixo, sempre à vista. */
export function DiscountPromos({
  promotions,
  services,
  salon,
}: {
  promotions: PromotionView[];
  services: Svc[];
  salon: SalonInfo;
}) {
  const { live, off } = splitByLive(promotions);
  const running = live.filter((p) => p.status === "running").length;
  return (
    <div className="glass grid gap-3 rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between gap-2">
        <TileTitle as="h2" icon="percent" tint="lavender">
          Promoções de desconto
        </TileTitle>
        {promotions.length ? (
          <span className={`${pill} ${running ? "bg-ok-bg text-ok" : "bg-surface"}`}>
            {running} {running === 1 ? "ativa" : "ativas"}
          </span>
        ) : null}
      </div>
      <p className="text-sm font-semibold text-muted">
        Desconto que entra sozinho ao agendar. Ex.: as 30 primeiras clientes ganham 20%.
      </p>
      {live.length === 0 ? (
        <div className="grid gap-1 rounded-2xl bg-soft px-4 py-4 text-center">
          <p className="font-bold">Nenhuma promoção ativa</p>
          <p className="text-sm font-semibold text-muted">
            {off.length ? "Reative uma abaixo ou crie outra." : "Crie uma para Natal, Black Friday ou o mês fraco."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {live.map((p) => (
            <PromoCard key={p.id} p={p} salon={salon} services={services} />
          ))}
        </ul>
      )}
      <NewPromotionSheet services={services} salon={salon} />
      {off.length ? (
        <section aria-label="Promoções fora do ar" className="grid gap-2">
          <h3 className="flex items-center gap-2 pt-1 text-sm font-bold text-muted">
            Fora do ar
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums">{off.length}</span>
          </h3>
          <ul className="grid gap-2">
            {off.map((p) => (
              <PromoCard key={p.id} p={p} salon={salon} services={services} />
            ))}
          </ul>
        </section>
      ) : null}
      <details className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
        <summary className="min-h-8 cursor-pointer font-bold">Como funciona</summary>
        <ul className="mt-2 grid list-disc gap-1 pl-5 text-muted">
          <li>Na hora de agendar, a folha mostra a promoção e já aplica. Dá para desligar ali.</li>
          <li>Vale 1 vez por cliente. Cancelou? A vaga volta.</li>
          <li>Não soma com desconto digitado à mão nem com sessão de pacote.</li>
          <li>Desativar tira do ar e continua na lista; Reativar volta. Vencida? Edite as datas.</li>
          <li>Excluir pede para digitar &quot;excluir&quot;. Quem já agendou mantém o desconto.</li>
        </ul>
      </details>
    </div>
  );
}

const STEPS = ["Desconto e serviços", "Quem ganha e quando"] as const;
const STEP_OF: Record<string, number> = { discount: 0, serviceIds: 0, name: 1, startsOn: 1, endsOn: 1, maxClients: 1 };
const BAD_TEXT: Record<string, string> = {
  discount: "Digite o desconto (de 1% a 99%, ou um valor em reais).",
  serviceIds: "Escolha pelo menos um serviço.",
  endsOn: "O fim vem depois do começo.",
  maxClients: "De 1 a 10.000 clientes.",
  name: "Até 60 letras.",
};

/** Valor do desconto como a dona digita: "20" ou "15,00". */
const rawDiscount = (d: PromotionView["discount"]) =>
  d.kind === "pct" ? String(d.value) : (d.value / 100).toFixed(2).replace(".", ",");

/** Criar promoção ou, com `edit`, editar a existente (mesmo passo a passo, já preenchido). */
function NewPromotionSheet({ services, salon, edit }: { services: Svc[]; salon: SalonInfo; edit?: PromotionView }) {
  const side = useSheetSide();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<DiscountKind>("pct");
  const [raw, setRaw] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [limited, setLimited] = useState(true);
  const [cap, setCap] = useState("30");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [name, setName] = useState("");
  /** serviços que a promoção tinha e hoje estão pausados/excluídos: entram na lista para poder tirar */
  const choices = edit
    ? [
        ...services,
        ...edit.serviceIds
          .filter((id) => !services.some((s) => s.id === id))
          .map((id) => edit.services.find((s) => s.id === id) ?? { id, name: "Serviço pausado", priceCents: 0 }),
      ]
    : services;
  const [bad, setBad] = useState<string | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [created, setCreated] = useState<{ title: string; facts: ReturnType<typeof promotionFacts> } | null>(null);
  const [pending, start] = useTransition();

  const picked = choices.filter((s) => serviceIds.includes(s.id));
  const discount = parseDiscount(kind, raw);
  const valid = !!discount && discount !== "invalid" && (discount.kind === "brl" || discount.value <= 99);
  const max = limited ? Number(cap) || null : null;
  const step0Ok = valid && picked.length > 0;
  const toggle = (id: string) =>
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setStep(0);
      setBad(null);
      setError(null);
      setCreated(null);
      if (edit) {
        setKind(edit.discount.kind);
        setRaw(rawDiscount(edit.discount));
        setServiceIds(edit.serviceIds);
        setLimited(edit.maxClients !== null);
        setCap(String(edit.maxClients ?? 30));
        setStartsOn(edit.startsOn ?? "");
        setEndsOn(edit.endsOn ?? "");
        setName(edit.name ?? "");
      }
    }
  }

  const sentence =
    valid && picked.length
      ? `${max ? `As ${max} primeiras clientes que agendarem ganham` : "Toda cliente que agendar ganha"} ${promotionOffer(
          discount,
          picked.map((s) => s.name),
        )}. ${[
          periodText(startsOn || null, endsOn || null),
          max ? "1 vez por cliente; encerra sozinha no limite" : "1 vez por cliente",
        ]
          .filter(Boolean)
          .join(". ")}.`
      : "";

  function save() {
    setBad(null);
    setError(null);
    start(async () => {
      const input = {
        name,
        discountKind: kind,
        discountValue: raw,
        serviceIds,
        startsOn,
        endsOn,
        maxClients: limited ? cap : "",
      };
      const r = await (edit ? updatePromotionAction({ ...input, id: edit.id }) : createPromotionAction(input)).catch(
        () => null,
      );
      if (!r?.ok) {
        if (r && !r.ok && r.code === "VALIDATION") {
          setBad(r.field ?? "discount");
          setStep(STEP_OF[r.field ?? "discount"] ?? 0);
        } else setError(r && !r.ok ? r.code : "NETWORK");
        return;
      }
      if (!valid) return;
      if (edit) {
        notify.success("Promoção salva");
        setOpen(false);
        return;
      }
      setCreated({
        title:
          name.trim() ||
          promotionOffer(
            discount,
            picked.map((s) => s.name),
          ),
        facts: promotionFacts({
          name: name.trim() || null,
          discount,
          services: picked,
          startsOn: startsOn || null,
          endsOn: endsOn || null,
          maxClients: max,
          left: null,
        }),
      });
      setName("");
      setRaw("");
      setStartsOn("");
      setEndsOn("");
      notify.success("Promoção criada");
    });
  }

  return (
    <Drawer.Root direction={side} open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      {edit ? (
        <Drawer.Trigger
          aria-label={`Editar ${edit.name ?? edit.offer}`}
          className="btn-glass flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold"
        >
          <Icon name="pencil" size={16} className="text-primary-text" />
          {edit.status === "ended" ? "Editar datas" : "Editar"}
        </Drawer.Trigger>
      ) : (
        <Drawer.Trigger
          disabled={!services.length}
          className="btn-tint flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-60"
        >
          Criar promoção de desconto
        </Drawer.Trigger>
      )}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] rounded-t-3xl pt-4 outline-none",
            "sheet z-50 flex flex-col",
          )}
        >
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="text-xl font-bold">
              {created ? "Promoção criada!" : edit ? "Editar promoção" : "Nova promoção"}
            </Drawer.Title>
            <Drawer.Description className="pb-3 text-sm font-semibold text-muted">
              {created
                ? `${created.title} já está valendo. Agora é divulgar.`
                : `Passo ${step + 1} de 2 · ${STEPS[step]}`}
            </Drawer.Description>
            {created ? (
              <div className="grid gap-3">
                <ShareTextPanel facts={created.facts} salon={salon} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-glass min-h-13 rounded-full px-5 font-bold"
                >
                  Pronto
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-1.5" aria-hidden="true">
                  {STEPS.map((s, i) => (
                    <span key={s} className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-line"}`} />
                  ))}
                </div>
                {step === 0 ? (
                  <div className="grid gap-4">
                    <div className="grid gap-1.5">
                      <p className="text-sm font-bold">Desconto</p>
                      <div className="flex gap-2">
                        <div className="flex gap-2" role="radiogroup" aria-label="Tipo de desconto">
                          {(
                            [
                              ["pct", "Em %"],
                              ["brl", "Em R$"],
                            ] as const
                          ).map(([k, label]) => (
                            <button
                              key={k}
                              type="button"
                              role="radio"
                              aria-checked={kind === k}
                              onClick={() => {
                                setKind(k);
                                setRaw("");
                              }}
                              className={`${chip} flex-none px-4`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <input
                          inputMode={kind === "pct" ? "numeric" : "decimal"}
                          aria-label={kind === "pct" ? "Desconto em porcentagem" : "Desconto em reais"}
                          placeholder={kind === "pct" ? "Ex.: 20" : "Ex.: 15,00"}
                          value={raw}
                          onChange={(e) => setRaw(e.target.value)}
                          aria-invalid={bad === "discount" || discount === "invalid"}
                          className={`${field} min-w-0 flex-1`}
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <p className="text-sm font-bold">Em quais serviços?</p>
                      <div
                        className={`flex flex-wrap gap-2 rounded-2xl ${bad === "serviceIds" ? "ring-2 ring-fail" : ""}`}
                        role="group"
                        aria-label="Serviços da promoção"
                      >
                        {choices.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={serviceIds.includes(s.id)}
                            onClick={() => toggle(s.id)}
                            className={`${chip} flex-none`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    {valid && picked.length ? (
                      <ul className="grid gap-1.5 rounded-2xl bg-soft px-4 py-3" aria-label="Prévia dos preços">
                        {picked.map((s) => {
                          const { totalCents, discountCents } = applyDiscount(s.priceCents, discount);
                          return (
                            <li key={s.id} className="flex items-baseline justify-between gap-3">
                              <span className="min-w-0 truncate font-bold">{s.name}</span>
                              <span className="shrink-0 text-base font-semibold">
                                de <s className="tabular-nums text-muted">{formatBRL(s.priceCents)}</s> por{" "}
                                <b className="text-xl tabular-nums text-primary-text">{formatBRL(totalCents)}</b>
                                <span className="sr-only"> (menos {formatBRL(discountCents)})</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-1.5">
                      <p className="text-sm font-bold">Quem ganha?</p>
                      <div className="flex gap-2" role="radiogroup" aria-label="Quem ganha">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={limited}
                          onClick={() => setLimited(true)}
                          className={chip}
                        >
                          Só as primeiras
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={!limited}
                          onClick={() => setLimited(false)}
                          className={chip}
                        >
                          Todas
                        </button>
                      </div>
                      {limited ? (
                        <label className="grid gap-1.5">
                          <span className="text-sm font-bold">Quantas clientes?</span>
                          <input
                            inputMode="numeric"
                            aria-label="Quantas clientes ganham"
                            value={cap}
                            onChange={(e) => setCap(e.target.value.replace(/\D/g, "").slice(0, 5))}
                            aria-invalid={bad === "maxClients"}
                            className={field}
                          />
                        </label>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="grid min-w-0 gap-1.5">
                        <span className="text-sm font-bold">Começa (opcional)</span>
                        <input
                          type="date"
                          aria-label="Início da promoção"
                          value={startsOn}
                          onChange={(e) => setStartsOn(e.target.value)}
                          className={`${field} min-w-0 px-3`}
                        />
                      </label>
                      <label className="grid min-w-0 gap-1.5">
                        <span className="text-sm font-bold">Termina (opcional)</span>
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
                    <NameField value={name} onChange={setName} placeholder="Ex.: Natal" invalid={bad === "name"} />
                    {sentence ? (
                      <div className="grid gap-1 rounded-2xl bg-soft px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-primary-text">Resumo</p>
                        <p className="font-semibold" aria-live="polite">
                          {sentence}
                        </p>
                        {max ? <p className="text-sm font-semibold text-muted">{capText(max, null)}</p> : null}
                      </div>
                    ) : null}
                  </div>
                )}

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
                      onClick={() => setStep(0)}
                      className="btn-glass min-h-13 rounded-full px-5 font-bold"
                    >
                      Voltar
                    </button>
                  ) : null}
                  {step === 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={!step0Ok}
                      className="btn-tint flex min-h-13 flex-1 items-center justify-center rounded-full px-5 font-bold disabled:opacity-60"
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={save}
                      disabled={pending || (limited && !Number(cap))}
                      className="btn-tint flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-70"
                    >
                      {pending ? <span className="spin" aria-hidden="true" /> : null}
                      {pending ? (edit ? "Salvando…" : "Criando…") : edit ? "Salvar" : "Criar promoção"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
