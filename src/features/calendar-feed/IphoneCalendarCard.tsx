"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { Icon, IconTile, TileTitle, type IconName, type Tint } from "@/components/ui/Icon";
import { StepGuide } from "@/components/ui/StepGuide";
import { Switch } from "@/components/ui/Switch";
import { ICLOUD_STEPS } from "./icloud-guide";
import { detectPlatform } from "@/features/install/platform";
import { normalizeIcloudUrl } from "./icloud-url";
import { ICLOUD_SYNC_ERROR, readLine, type IcloudCalendarView } from "./icloud-view";
import {
  calendarLinkStatus,
  createCalendarLink,
  disableCalendarLink,
  removeIcloudCalendar,
  saveIcloudCalendar,
  setCalendarHideNames,
} from "./actions";

type Tab = "out" | "in";

const noop = () => () => {};
/** iPhone/iPad: só lá o atalho abre o app Calendário. No servidor, não mostra. */
function useIsIos() {
  return useSyncExternalStore(
    noop,
    () => detectPlatform(navigator.userAgent, navigator.maxTouchPoints) === "ios",
    () => false,
  );
}

/** Desenho do caminho: de onde sai → para onde vai. Explica a direção antes de ler. */
function Flow({ from, to }: { from: { icon: IconName; tint: Tint; label: string }; to: typeof from }) {
  const end = (e: typeof from) => (
    <span className="grid justify-items-center gap-1">
      <IconTile name={e.icon} tint={e.tint} size="lg" />
      <span className="text-xs font-bold text-muted">{e.label}</span>
    </span>
  );
  return (
    <div className="flex items-start justify-center gap-3 pt-1" aria-hidden="true">
      {end(from)}
      <span className="mt-4 flex items-center gap-1 text-primary">
        <span className="size-1.5 rounded-full bg-current opacity-30" />
        <span className="size-1.5 rounded-full bg-current opacity-60" />
        <Icon name="arrowRight" size={20} />
      </span>
      {end(to)}
    </div>
  );
}

/** Passos curtos em linha: feito (verde com ✓), agora (roxo) e depois (claro). */
function Steps({ items, current }: { items: { icon: IconName; label: string }[]; current: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Passos">
      {items.map((it, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li
            key={it.label}
            aria-current={now ? "step" : undefined}
            className={`grid justify-items-center gap-1.5 rounded-2xl px-1 py-2.5 text-center text-xs font-bold transition-colors ${
              done ? "bg-ok-bg text-ok" : now ? "bg-soft text-primary-text ring-2 ring-primary/40" : "glass text-muted"
            }`}
          >
            <span
              className={`grid size-8 place-content-center rounded-full ${
                done ? "bg-[#25B864] text-white" : now ? "bg-primary text-on-primary" : "bg-white text-muted"
              }`}
              aria-hidden="true"
            >
              <Icon name={done ? "check" : it.icon} size={17} />
            </span>
            <span>
              <span className="sr-only">{done ? "Feito: " : now ? "Agora: " : ""}</span>
              {it.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Linha curta com ícone (aviso de privacidade, dica). */
function Note({ icon, children, tone = "muted" }: { icon: IconName; children: ReactNode; tone?: "muted" | "warn" }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold ${
        tone === "warn" ? "bg-wait-bg text-wait" : "text-muted"
      }`}
    >
      <Icon name={icon} size={18} className="mt-px" />
      <span>{children}</span>
    </p>
  );
}

/** Caminho do iPhone em pílulas: lê de relance, sem frase longa. */
function Path({ parts }: { parts: string[] }) {
  return (
    <p className="flex flex-wrap items-center gap-1 text-sm font-bold">
      {parts.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 ? (
            <span aria-hidden="true" className="text-muted">
              ›
            </span>
          ) : null}
          <span className="rounded-full bg-soft px-2.5 py-1 text-primary-text">{p}</span>
        </span>
      ))}
    </p>
  );
}

/** Esperando o iPhone assinar: confere sozinho; o botão confere na hora. */
function WaitSubscribe({ checking, onCheck }: { checking: boolean; onCheck: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-soft px-4 py-2.5" role="status">
      <span className="flex items-center gap-2 text-sm font-bold text-primary-text">
        <span className="spin" aria-hidden="true" />
        Esperando o iPhone assinar…
      </span>
      <button
        type="button"
        onClick={onCheck}
        disabled={checking}
        aria-busy={checking}
        className="min-h-11 shrink-0 rounded-full bg-white px-3 text-sm font-bold text-primary-text disabled:opacity-60"
      >
        {checking ? "Conferindo…" : "Já assinei"}
      </button>
    </div>
  );
}

const OUT_STEPS: { icon: IconName; label: string }[] = [
  { icon: "link", label: "Criar link" },
  { icon: "plus", label: "Adicionar" },
  { icon: "check", label: "Assinar" },
];

/**
 * Calendários do iPhone ligados: nome, o que veio na última leitura (ou o erro, em vermelho) e Tirar.
 * Um toque em Tirar já tira (o calendário volta colando o link de novo).
 */
function IcloudList({
  cals,
  busy,
  onRemove,
}: {
  cals: IcloudCalendarView[];
  busy: string | null;
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="grid gap-2" aria-label="Calendários do iPhone ligados">
      {cals.map((c) => {
        const removing = busy === c.id;
        return (
          <li
            key={c.id}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${c.syncError ? "bg-fail-bg" : "bg-ok-bg"}`}
          >
            <Icon
              name={c.syncError ? "alert" : "checkCircle"}
              size={22}
              className={c.syncError ? "shrink-0 text-fail" : "shrink-0 text-ok"}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.name ?? "Calendário do iPhone"}</p>
              <p className={`text-sm font-semibold ${c.syncError ? "text-fail" : "text-ok"}`} role="status">
                {c.syncError ? ICLOUD_SYNC_ERROR[c.syncError] : readLine(c.syncedAt, c.eventCount)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              disabled={busy !== null}
              aria-busy={removing}
              aria-label={`Parar de ler ${c.name ?? "este calendário"}`}
              className="min-h-11 shrink-0 px-1 text-sm font-bold text-fail disabled:opacity-60"
            >
              {removing ? "Tirando…" : "Tirar"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Calendário do iPhone (iCloud): link assinado só de leitura com os agendamentos.
 * Quem usa o Google Agenda já vê tudo pelo Google; o sheet avisa para não usar os dois e duplicar.
 */
export function IphoneCalendarCard({
  enabled: initialEnabled,
  hideNames: initialHide,
  googleConnected,
  icloudCalendars: initialCals,
  subscribed: initialSubscribed = false,
}: {
  enabled: boolean;
  hideNames: boolean;
  googleConnected: boolean;
  /** O iPhone já leu o link atual (assinou). */
  subscribed?: boolean;
  /** Calendários do iCloud já ligados (o link em si nunca vem para a tela). */
  icloudCalendars: IcloudCalendarView[];
}) {
  const side = useSheetSide();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [cals, setCals] = useState(initialCals);
  const icloudOn = cals.length > 0;
  /** Com calendário ligado, o campo de colar só aparece ao tocar em "Adicionar outro calendário". */
  const [adding, setAdding] = useState(false);
  const [icloudUrl, setIcloudUrl] = useState("");
  const [icloudBusy, setIcloudBusy] = useState<null | "save" | string>(null);
  const [icloudErr, setIcloudErr] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmAllOff, setConfirmAllOff] = useState(false);
  const [allOffBusy, setAllOffBusy] = useState(false);
  const on = enabled || icloudOn;
  const [hideNames, setHideNames] = useState(initialHide);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "create" | "hide" | "off">(null);
  const [confirmOff, setConfirmOff] = useState(false);
  // Abre na direção que já está ligada; sem nada ligado, trazer do iPhone (o uso mais comum).
  const [tab, setTab] = useState<Tab>(initialEnabled && !initialCals.length ? "out" : "in");
  const [copied, setCopied] = useState(false);
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [added, setAdded] = useState(false);
  const [checking, setChecking] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const ios = useIsIos();
  const icloudValid = !!normalizeIcloudUrl(icloudUrl);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  /** Pergunta se o iPhone já leu o link. `manual`: toque em "Já assinei" (mostra o resultado). */
  async function checkSubscribed(manual = false) {
    if (manual) setChecking(true);
    const res = await calendarLinkStatus().catch(() => null);
    if (manual) setChecking(false);
    if (!res?.ok) return manual ? notify.error(res ? res.code : "NETWORK") : undefined;
    if (res.data.subscribed) {
      setSubscribed(true);
      notify.success("Assinado no iPhone", "Os agendamentos já aparecem no app Calendário.");
    } else if (manual) {
      notify.info("O iPhone ainda não leu o link", "Toque em Adicionar ao iPhone e depois em Assinar.");
    }
  }
  const checkRef = useRef(checkSubscribed);
  useEffect(() => {
    checkRef.current = checkSubscribed;
  });

  // Esperando a assinatura: confere a cada 4 s com o sheet aberto (até 15 min) e na volta do app Calendário.
  useEffect(() => {
    if (!open || !enabled || subscribed) return;
    const started = Date.now();
    const tick = () => {
      if (document.visibilityState === "visible" && Date.now() - started < 15 * 60_000) void checkRef.current();
    };
    const id = setInterval(tick, 4000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [open, enabled, subscribed]);

  async function create() {
    setBusy("create");
    const res = await createCalendarLink().catch(() => null);
    setBusy(null);
    if (!res?.ok) return notify.error(res ? res.code : "NETWORK", create);
    setUrl(res.data.url);
    setSubscribed(false);
    setAdded(false);
    setEnabled(true);
    notify.success(
      enabled ? "Link novo criado" : "Link criado",
      enabled ? "O link antigo parou de funcionar." : undefined,
    );
  }

  async function off() {
    setBusy("off");
    const res = await disableCalendarLink().catch(() => null);
    setBusy(null);
    if (!res?.ok) return notify.error(res ? res.code : "NETWORK", off);
    setEnabled(false);
    setUrl(null);
    setSubscribed(false);
    setConfirmOff(false);
    notify.success("Link desligado", "Apague a assinatura no iPhone se ela ainda aparecer.");
  }

  async function toggleHide(next: boolean) {
    setBusy("hide");
    setHideNames(next);
    const res = await setCalendarHideNames(next).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setHideNames(!next);
      return notify.error(res ? res.code : "NETWORK");
    }
    notify.success(next ? "Nomes ocultos no calendário" : "Nomes visíveis no calendário");
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2500);
      notify.success("Link copiado", "Cole no iPhone em Adicionar Calendário Assinado.");
    } catch {
      notify.error("CLIPBOARD");
    }
  }

  /** Colar com um toque; link do iCloud já liga na hora (sem segundo toque). */
  async function paste() {
    let text = "";
    try {
      text = (await navigator.clipboard.readText()).trim();
    } catch {
      inputRef.current?.focus();
      return notify.info("Toque no campo e escolha Colar");
    }
    if (!text) return notify.info("Nada copiado ainda", "No iPhone, toque em Compartilhar Link › Copiar.");
    setIcloudUrl(text);
    setIcloudErr(false);
    if (normalizeIcloudUrl(text)) void saveIcloud(text);
    else {
      setIcloudErr(true);
      notify.error("ICLOUD_LINK_INVALID");
    }
  }

  async function saveIcloud(link = icloudUrl) {
    setIcloudBusy("save");
    setIcloudErr(false);
    const res = await saveIcloudCalendar(link).catch(() => null);
    setIcloudBusy(null);
    if (!res?.ok) {
      setIcloudErr(res?.code === "ICLOUD_LINK_INVALID");
      return notify.error(res ? res.code : "NETWORK", () => void saveIcloud(link));
    }
    const cal = res.data;
    const again = cals.some((c) => c.id === cal.id);
    setCals((list) => (again ? list.map((c) => (c.id === cal.id ? cal : c)) : [...list, cal]));
    setIcloudUrl("");
    setAdding(false);
    const n = cal.eventCount;
    notify.success(
      `${cal.name ? `“${cal.name}”` : "Calendário"} ${again ? "lido de novo" : "ligado"}`,
      n
        ? `${n} evento${n === 1 ? "" : "s"} na agenda, em cinza.`
        : "Nenhum evento com horário nos próximos meses. Os novos aparecem em cinza.",
    );
  }

  async function removeIcloud(id: string) {
    setIcloudBusy(id);
    const res = await removeIcloudCalendar(id).catch(() => null);
    setIcloudBusy(null);
    if (!res?.ok) return notify.error(res ? res.code : "NETWORK", () => void removeIcloud(id));
    setCals((list) => list.filter((c) => c.id !== id));
    notify.success("Eventos desse calendário tirados da agenda");
  }

  /** Interruptor desligado: para as duas direções (link para o iPhone e leitura do iCloud). */
  async function allOff() {
    setAllOffBusy(true);
    const [a, b] = await Promise.all([
      enabled ? disableCalendarLink().catch(() => null) : Promise.resolve({ ok: true as const, data: undefined }),
      icloudOn ? removeIcloudCalendar().catch(() => null) : Promise.resolve({ ok: true as const, data: undefined }),
    ]);
    setAllOffBusy(false);
    if (a?.ok) {
      setEnabled(false);
      setUrl(null);
    }
    if (b?.ok) setCals([]);
    if (!a?.ok || !b?.ok) {
      const bad = !a?.ok ? a : b;
      return notify.error(bad && !bad.ok ? bad.code : "NETWORK", allOff);
    }
    setConfirmAllOff(false);
    notify.success(
      "Calendário desligado",
      enabled ? "Apague a assinatura no iPhone se ela ainda aparecer." : undefined,
    );
  }

  let hint = "Traga a agenda do iPhone para o app e veja os agendamentos no Calendário.";
  if (icloudOn && enabled) hint = "Ligado nas duas direções.";
  else if (icloudOn)
    hint = `Ligado. ${cals.length > 1 ? `${cals.length} calendários do iPhone` : "Os eventos do iPhone"} na agenda, em cinza.`;
  else if (enabled) hint = "Ligado. Os agendamentos aparecem no Calendário do iPhone.";
  else if (googleConnected) hint = "Você já vê pelo Google Agenda. Toque para ver como.";

  return (
    <Drawer.Root direction={side} repositionInputs={false} open={open} onOpenChange={setOpen}>
      <div className="glass grid gap-3 rounded-[1.75rem] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <Drawer.Trigger className="min-w-0 flex-1 text-left">
            <TileTitle icon="calendar" tint="red">
              Calendário do iPhone
            </TileTitle>
            <span className="block text-sm font-semibold text-muted">{hint}</span>
          </Drawer.Trigger>
          <Switch
            checked={on}
            onChange={(next) => (next ? setOpen(true) : setConfirmAllOff(true))}
            busy={allOffBusy}
            label="Calendário do iPhone"
          />
        </div>
        {confirmAllOff ? (
          <div className="grid gap-2" role="alertdialog" aria-label="Desligar o calendário?">
            <p className="text-sm font-semibold text-muted">
              Desligar? O link do iPhone para de funcionar e os eventos do iPhone saem da agenda do app.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold"
                onClick={() => setConfirmAllOff(false)}
                disabled={allOffBusy}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className="min-h-11 rounded-full bg-fail px-4 text-sm font-bold text-white disabled:opacity-60"
                onClick={() => void allOff()}
                disabled={allOffBusy}
                aria-busy={allOffBusy}
              >
                {allOffBusy ? "Desligando…" : "Desligar"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-[520px] rounded-t-3xl pt-4 outline-none",
            "sheet z-50 flex flex-col",
          )}
        >
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="pt-2 text-center text-xl font-bold">Calendário do iPhone</Drawer.Title>
            <Drawer.Description className="sr-only">
              Duas direções, cada uma liga separado: ver os agendamentos no Calendário do iPhone ou trazer a agenda do
              iPhone para o app.
            </Drawer.Description>

            <div role="tablist" aria-label="Direção" className="glass mt-3 grid grid-cols-2 gap-1 rounded-full p-1">
              {(
                [
                  { id: "in", icon: "download", label: "Trazer do iPhone", on: icloudOn },
                  { id: "out", icon: "calendar", label: "Ver no iPhone", on: enabled },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`cal-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`cal-panel-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-bold transition-colors duration-200 ${
                    tab === t.id ? "bg-primary text-on-primary shadow-sm" : "text-muted"
                  }`}
                >
                  <Icon name={t.icon} size={18} />
                  {t.label}
                  {t.on ? <span className="size-2 rounded-full bg-[#34c759]" aria-label="ligado" role="img" /> : null}
                </button>
              ))}
            </div>

            {tab === "out" ? (
              <section role="tabpanel" id="cal-panel-out" aria-labelledby="cal-tab-out" className="grid gap-3 pt-4">
                <Flow
                  from={{ icon: "sparkles", tint: "lavender", label: "Bubbly" }}
                  to={{ icon: "calendar", tint: "red", label: "iPhone" }}
                />
                <h3 className="text-center text-base font-bold">Seus agendamentos no Calendário do iPhone</h3>

                {googleConnected ? (
                  <div className="grid gap-2 rounded-2xl bg-wait-bg px-3 py-3 text-wait" role="note">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <Icon name="google" size={18} />
                      Você já usa o Google Agenda
                    </p>
                    <p className="text-sm font-semibold">
                      Use só um caminho, senão tudo aparece duas vezes. No iPhone:
                    </p>
                    <Path parts={["Ajustes", "Calendário", "Contas", "Google"]} />
                  </div>
                ) : null}

                <Steps items={OUT_STEPS} current={subscribed ? 3 : url ? (added ? 2 : 1) : enabled ? 2 : 0} />

                {subscribed ? (
                  <div
                    className="flex items-center gap-3 rounded-2xl bg-ok-bg px-4 py-3 text-sm font-semibold text-ok"
                    role="status"
                  >
                    <span className="grid size-9 shrink-0 place-content-center rounded-full bg-[#25B864] text-white">
                      <Icon name="check" size={20} />
                    </span>
                    <span>
                      <span className="block font-bold">Assinado no iPhone</span>
                      Atualiza sozinho. Os agendamentos já aparecem no Calendário.
                    </span>
                  </div>
                ) : null}

                {url && !subscribed ? (
                  <div className="grid gap-2">
                    <a
                      href={url.replace(/^https?:/, "webcal:")}
                      onClick={() => setAdded(true)}
                      className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-5 font-bold text-on-primary shadow-[0_8px_20px_-8px_var(--primary)]"
                    >
                      <Icon name="plus" size={20} />
                      Adicionar ao iPhone
                    </a>
                    {added ? (
                      <WaitSubscribe checking={checking} onCheck={() => void checkSubscribed(true)} />
                    ) : (
                      <p className="text-center text-sm font-semibold text-muted">
                        Depois toque em <b className="text-fg">Assinar</b>.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void copy()}
                      aria-label="Copiar link"
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-colors ${
                        copied ? "bg-ok-bg text-ok" : "btn-glass text-primary-text"
                      }`}
                    >
                      <Icon name={copied ? "check" : "copy"} size={18} />
                      {copied ? "Copiado" : "Copiar link"}
                    </button>
                    <Note icon="lock">Link pessoal: não envie para ninguém. Ele só aparece agora.</Note>
                  </div>
                ) : enabled && !url ? (
                  <div className="grid gap-2">
                    {subscribed ? null : (
                      <WaitSubscribe checking={checking} onCheck={() => void checkSubscribed(true)} />
                    )}
                    <button
                      type="button"
                      onClick={() => void create()}
                      disabled={busy !== null}
                      aria-busy={busy === "create"}
                      className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-primary-text disabled:opacity-60"
                    >
                      {busy === "create" ? (
                        <span className="spin" aria-hidden="true" />
                      ) : (
                        <Icon name="refresh" size={18} />
                      )}
                      {busy === "create" ? "Criando…" : "Gerar link novo"}
                    </button>
                    <Note icon="phone">Para outro aparelho, gere um novo. O antigo para de funcionar.</Note>
                  </div>
                ) : !enabled ? (
                  <button
                    type="button"
                    onClick={() => void create()}
                    disabled={busy !== null}
                    aria-busy={busy === "create"}
                    className={`flex min-h-13 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-60 ${
                      googleConnected ? "btn-glass text-sm text-primary-text" : "bg-primary text-on-primary"
                    }`}
                  >
                    {busy === "create" ? <span className="spin" aria-hidden="true" /> : <Icon name="link" size={20} />}
                    {busy === "create" ? "Criando…" : "Criar link do calendário"}
                  </button>
                ) : null}

                {url && !subscribed ? (
                  <details className="glass group rounded-2xl px-4 py-3 text-sm font-semibold">
                    <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-2 font-bold text-primary-text">
                      Não abriu? Cole à mão
                      <span aria-hidden="true" className="transition-transform group-open:rotate-180">
                        ⌄
                      </span>
                    </summary>
                    <div className="grid gap-2 pt-3">
                      <p className="text-muted">Copie o link e, nos Ajustes do iPhone, vá em:</p>
                      <Path
                        parts={["Calendário", "Contas", "Adicionar Conta", "Outra", "Adicionar Calendário Assinado"]}
                      />
                    </div>
                  </details>
                ) : null}

                <div className="glass grid rounded-2xl">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <IconTile name="eyeOff" tint="gray" />
                      <span>
                        <span className="block text-sm font-bold">Ocultar nome da cliente</span>
                        <span className="block text-xs font-semibold text-muted">Mostra só o serviço</span>
                      </span>
                    </span>
                    <Switch
                      checked={hideNames}
                      onChange={(v) => void toggleHide(v)}
                      busy={busy === "hide"}
                      label="Ocultar nome da cliente"
                    />
                  </div>
                  {enabled ? (
                    <div className="border-t border-line px-4 py-2">
                      {confirmOff ? (
                        <div className="grid gap-2 py-1" role="alertdialog" aria-label="Desligar o link?">
                          <p className="text-sm font-semibold text-muted">O iPhone para de receber os agendamentos.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold"
                              onClick={() => setConfirmOff(false)}
                              disabled={busy === "off"}
                              autoFocus
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="min-h-11 rounded-full bg-fail px-4 text-sm font-bold text-white disabled:opacity-60"
                              onClick={() => void off()}
                              disabled={busy === "off"}
                              aria-busy={busy === "off"}
                            >
                              {busy === "off" ? "Desligando…" : "Desligar"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmOff(true)}
                          className="min-h-11 w-full text-left text-sm font-bold text-fail"
                        >
                          Desligar link
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : (
              <section role="tabpanel" id="cal-panel-in" aria-labelledby="cal-tab-in" className="grid gap-3 pt-4">
                <Flow
                  from={{ icon: "calendar", tint: "red", label: "iPhone" }}
                  to={{ icon: "sparkles", tint: "lavender", label: "Bubbly" }}
                />
                <h3 className="text-center text-base font-bold">Trazer a agenda do iPhone para o app</h3>

                {icloudOn ? (
                  <IcloudList cals={cals} busy={icloudBusy} onRemove={(id) => void removeIcloud(id)} />
                ) : null}
                {icloudOn && !adding ? (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    disabled={icloudBusy !== null}
                    className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-primary-text disabled:opacity-60"
                  >
                    <Icon name="plus" size={18} />
                    Adicionar outro calendário
                  </button>
                ) : (
                  <>
                    <StepGuide steps={ICLOUD_STEPS} label="Como pegar o link no iPhone" />
                    <Note icon="calendar">
                      Tem mais de um calendário (Pessoal, Trabalho…)? Cada link traz um. Ligue um, depois toque em{" "}
                      <b>Adicionar outro calendário</b>.
                    </Note>
                    {ios ? (
                      <a
                        href="calshow:"
                        className="btn-glass flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-primary-text"
                      >
                        <Icon name="external" size={18} />
                        Abrir o Calendário
                      </a>
                    ) : null}
                    <form
                      className="grid gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (icloudBusy === null && icloudUrl.trim()) void saveIcloud();
                      }}
                    >
                      <label htmlFor="icloudUrl" className="px-1 text-sm font-bold">
                        Link do calendário
                      </label>
                      <div className="relative">
                        <input
                          ref={inputRef}
                          id="icloudUrl"
                          name="icloudUrl"
                          type="url"
                          inputMode="url"
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          placeholder="Cole o link aqui"
                          value={icloudUrl}
                          onChange={(e) => {
                            setIcloudUrl(e.target.value);
                            setIcloudErr(false);
                          }}
                          aria-invalid={icloudErr}
                          aria-describedby={icloudErr ? "icloudUrl-err" : undefined}
                          className="min-h-13 w-full rounded-2xl border pl-4 pr-28 text-base font-semibold aria-[invalid=true]:border-fail"
                        />
                        {icloudValid && !icloudErr ? (
                          <span className="absolute right-3 top-1/2 grid -translate-y-1/2 place-content-center text-ok">
                            <Icon name="checkCircle" size={22} />
                            <span className="sr-only">Link do iCloud reconhecido</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void paste()}
                            disabled={icloudBusy !== null}
                            className="absolute right-1.5 top-1/2 flex min-h-10 -translate-y-1/2 items-center gap-1.5 rounded-xl bg-soft px-3 text-sm font-bold text-primary-text disabled:opacity-60"
                          >
                            <Icon name="paste" size={17} />
                            Colar
                          </button>
                        )}
                      </div>
                      {icloudErr ? (
                        <p
                          id="icloudUrl-err"
                          className="flex items-center gap-1.5 px-1 text-sm font-semibold text-fail"
                        >
                          <Icon name="alert" size={16} />
                          Use o link do Compartilhar Link do iCloud.
                        </p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={icloudBusy !== null || !icloudUrl.trim()}
                        aria-busy={icloudBusy === "save"}
                        className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-5 font-bold text-on-primary disabled:opacity-60"
                      >
                        {icloudBusy === "save" ? <span className="spin" aria-hidden="true" /> : null}
                        {icloudBusy === "save" ? "Lendo o calendário…" : "Ligar"}
                      </button>
                      {adding ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAdding(false);
                            setIcloudUrl("");
                            setIcloudErr(false);
                          }}
                          disabled={icloudBusy !== null}
                          className="min-h-11 text-sm font-bold text-muted disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      ) : null}
                      <Note icon="lock">Só leitura: o app nunca muda seu iPhone. Não envie o link para ninguém.</Note>
                    </form>
                  </>
                )}
              </section>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
