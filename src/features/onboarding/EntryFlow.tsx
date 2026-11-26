"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { authClient } from "@/lib/auth-client";
import type { Day } from "@/features/hours/slots";
import { useInstall } from "@/features/install/useInstall";
import { detectPlatform } from "@/features/install/platform";
import { isNativeShell } from "@/features/install/platform";
import { nativePushPlatform } from "@/features/native/push";
import { locationGranted } from "@/features/owner-notices/device-location";
import { enableDeviceLocation } from "@/features/owner-notices/enable-location";
import { enablePush } from "@/features/push/enable";
import { usePushState } from "@/features/push/use-push-state";
import { finishOnboarding } from "./actions";
import { CalendarArt, PushArt, WeatherArt } from "./EntryArt";
import { EntryHours } from "./EntryHours";
import { EntryScreen, Fine, LinkButton, Note, PrimaryButton } from "./EntryScreen";
import { describeHours } from "./hours";
import {
  nextStep,
  resolveStep,
  summaryRows,
  type EntryFacts,
  type EntryResults,
  type EntryStep,
  type PushFact,
} from "./steps";

const noop = () => () => {};

/** Fato "avisos" deste aparelho, a partir do estado do push e de onde o app está aberto. */
function usePushFact(publicKey: string | null): PushFact {
  const state = usePushState();
  const install = useInstall();
  const native = useSyncExternalStore(noop, nativePushPlatform, () => null);
  if (state === "checking") return "checking";
  if (state === "on" || state === "denied") return state;
  if (state === "unsupported") return install?.platform === "ios" ? "install" : "none";
  return !native && !publicKey ? "none" : "ask";
}

/** "iPhone" no iPhone, "celular" no resto: é onde a pessoa liga a permissão depois. */
function usePhoneWord() {
  return useSyncExternalStore(
    noop,
    () => (detectPlatform(navigator.userAgent, navigator.maxTouchPoints) === "ios" ? "iPhone" : "celular"),
    () => "celular",
  );
}

type Sub = "main" | "iphone";

export function EntryFlow({
  firstName,
  initialWeek,
  googleConnected,
  locationOn,
  publicKey,
  startAt,
  googleFailed,
  iphoneCard,
}: {
  firstName: string;
  initialWeek: Day[];
  googleConnected: boolean;
  locationOn: boolean;
  publicKey: string | null;
  /** Depois do Google a página volta direto para a Agenda. */
  startAt: "hours" | "calendar";
  googleFailed: boolean;
  /** Passo a passo do Calendário do iPhone (o mesmo cartão de Ajustes › Calendários). */
  iphoneCard: ReactNode;
}) {
  const router = useRouter();
  const phone = usePhoneWord();
  const push = usePushFact(publicKey);
  const [step, setStep] = useState<EntryStep>(startAt);
  const [sub, setSub] = useState<Sub>("main");
  const [week, setWeek] = useState<Day[]>(initialWeek);
  const [locationNow, setLocationNow] = useState(locationOn);
  const [results, setResults] = useState<EntryResults>({ push: "skipped", calendar: "skipped", location: "skipped" });
  const facts: EntryFacts = { push, googleConnected, locationOn: locationNow };

  // Só sai da tela `from` se ainda for ela: evita pular duas telas quando o estado do aparelho muda no meio
  const advance = useCallback(
    (from: EntryStep, patch?: Partial<EntryResults>, over?: Partial<EntryFacts>) => {
      if (patch) setResults((r) => ({ ...r, ...patch }));
      setSub("main");
      setStep((s) => (s === from ? nextStep(from, { push, googleConnected, locationOn: locationNow, ...over }) : s));
    },
    [push, googleConnected, locationNow],
  );

  // Voltou do Google já com a agenda aceita (ou o aparelho já tinha tudo): não mostra a tela à toa
  const shown = step === "done" ? step : resolveStep(step, facts);
  // Avisos aparecem só quando o aparelho já respondeu se dá para pedir; "pronto" resolve sozinho
  const waiting = shown === "push" && push === "checking";

  return (
    <>
      {shown === "hours" && (
        <EntryHours
          initial={initialWeek}
          onSaved={(w) => {
            setWeek(w);
            advance("hours");
          }}
        />
      )}
      {shown === "push" && !waiting && <PushScreen push={push} publicKey={publicKey} phone={phone} onDone={advance} />}
      {shown === "calendar" &&
        (sub === "iphone" ? (
          <IphoneScreen
            card={iphoneCard}
            onBack={() => setSub("main")}
            onDone={() => advance("calendar", { calendar: "iphone" })}
          />
        ) : (
          <CalendarScreen
            failed={googleFailed}
            onIphone={() => setSub("iphone")}
            onSkip={() => advance("calendar", { calendar: "skipped" })}
          />
        ))}
      {shown === "location" && (
        <LocationScreen
          phone={phone}
          onDone={(r) => {
            if (r === "on") setLocationNow(true);
            advance("location", { location: r }, { locationOn: r === "on" });
          }}
        />
      )}
      {shown === "done" && (
        <DoneScreen
          firstName={firstName}
          hours={describeHours(week)}
          rows={summaryRows(results, facts)}
          onGo={async () => {
            const res = await finishOnboarding().catch(() => null);
            if (!res?.ok) return notify.error(res ? res.code : "NETWORK");
            router.replace("/agenda");
          }}
        />
      )}
    </>
  );
}

function PushScreen({
  push,
  publicKey,
  phone,
  onDone,
}: {
  push: PushFact;
  publicKey: string | null;
  phone: string;
  onDone: (from: EntryStep, patch?: Partial<EntryResults>, over?: Partial<EntryFacts>) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState(false);
  const denied = push === "denied" || refused;
  const skip = () => onDone("push", { push: denied ? "denied" : "skipped" });

  if (push === "install")
    return (
      <EntryScreen
        step="push"
        title="Instale o Bubbly para receber avisos"
        text="No iPhone, os avisos só chegam com o app na Tela de Início. Leva 10 segundos."
        onSkip={skip}
        skipLabel="Fazer depois"
        actions={<Fine>Entre de novo no app instalado e os avisos aparecem aqui.</Fine>}
      >
        <ol className="grid w-full gap-2.5">
          {[
            ["Toque em Compartilhar", "share"],
            ["Adicionar à Tela de Início", "plus"],
            ["Abra o Bubbly pelo ícone", "phone"],
          ].map(([label, icon], i) => (
            <li key={label} className="glass flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-sm font-bold">
              <span className="grid size-7 place-content-center rounded-full bg-primary text-xs text-on-primary">
                {i + 1}
              </span>
              <span className="flex-1">{label}</span>
              <Icon name={icon === "share" ? "external" : (icon as "plus" | "phone")} size={20} />
            </li>
          ))}
        </ol>
      </EntryScreen>
    );

  async function enable() {
    setBusy(true);
    const res = await enablePush(publicKey);
    setBusy(false);
    if (res.ok) return onDone("push", { push: "on" }, {});
    if (res.reason === "denied") return setRefused(true);
    notify.error(res.code, () => void enable());
  }

  return (
    <EntryScreen
      step="push"
      title="Saiba na hora quando a cliente responder"
      text="Avisamos quando alguém confirma, pede para remarcar ou marca pelo WhatsApp, e damos bom dia antes da primeira cliente."
      onSkip={skip}
      actions={
        denied ? (
          <>
            <Note tone="wait">
              Avisos desligados. Você ainda vê tudo no sino do app. Para ligar depois: Ajustes do {phone} › Notificações
              › Bubbly
            </Note>
            <PrimaryButton onClick={skip}>Continuar</PrimaryButton>
          </>
        ) : (
          <>
            <PrimaryButton onClick={() => void enable()} busy={busy}>
              <Icon name="bell" size={22} />
              Ativar avisos
            </PrimaryButton>
            <Fine>Você muda isso quando quiser em Ajustes.</Fine>
          </>
        )
      }
    >
      <PushArt muted={denied} />
    </EntryScreen>
  );
}

function CalendarScreen({ failed, onIphone, onSkip }: { failed: boolean; onIphone: () => void; onSkip: () => void }) {
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    // App da loja: liga pelo navegador do sistema (o Google não abre na WebView) e volta para esta etapa
    if (isNativeShell(navigator.userAgent)) {
      const { startNativeGoogleLink } = await import("@/features/native/google-login");
      const opened = await startNativeGoogleLink("/primeiro-acesso?etapa=agenda", () => setBusy(false));
      if (!opened) {
        setBusy(false);
        notify.error("NETWORK", () => void connect());
      }
      return;
    }
    const { error } = await authClient.linkSocial({
      provider: "google",
      callbackURL: "/primeiro-acesso?etapa=agenda",
      errorCallbackURL: "/primeiro-acesso?etapa=agenda&google=erro",
    });
    if (error) {
      setBusy(false);
      notify.error("NETWORK", () => void connect());
    }
    // Sem erro: o navegador segue para o Google e a página volta aqui
  }

  return (
    <EntryScreen
      step="calendar"
      title="Junte sua agenda com o Google"
      text="Seus horários vão para o Google Agenda, e o que você já marcou lá fica bloqueado aqui. Sem encaixe por cima de compromisso."
      onSkip={onSkip}
      actions={
        failed ? (
          <>
            <Note>
              Google não conectado. Tudo bem: a agenda do Bubbly funciona sozinha, e dá para conectar em Ajustes ›
              Calendários.
            </Note>
            <PrimaryButton onClick={onSkip}>Continuar</PrimaryButton>
            <LinkButton onClick={onIphone}>Uso o Calendário do iPhone</LinkButton>
          </>
        ) : (
          <>
            <PrimaryButton onClick={() => void connect()} busy={busy}>
              <span className="grid size-7 place-content-center rounded-full bg-white">
                <Icon name="google" size={18} />
              </span>
              Conectar Google Agenda
            </PrimaryButton>
            <LinkButton onClick={onIphone}>Uso o Calendário do iPhone</LinkButton>
          </>
        )
      }
    >
      <CalendarArt muted={failed} />
    </EntryScreen>
  );
}

/** Passo a passo do Calendário do iPhone: o mesmo cartão de Ajustes › Calendários, sem sair da entrada. */
function IphoneScreen({ card, onBack, onDone }: { card: ReactNode; onBack: () => void; onDone: () => void }) {
  return (
    <EntryScreen
      step="calendar"
      title="Calendário do iPhone"
      text="Siga o passo a passo para ver seus agendamentos no app Calendário. Dá para fazer agora ou depois, em Ajustes › Calendários."
      actions={
        <>
          <PrimaryButton onClick={onDone}>Continuar</PrimaryButton>
          <LinkButton onClick={onBack}>Voltar</LinkButton>
        </>
      }
    >
      <div className="grid w-full gap-3">{card}</div>
    </EntryScreen>
  );
}

function LocationScreen({ phone, onDone }: { phone: string; onDone: (r: "on" | "denied" | "skipped") => void }) {
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState(false);
  // Permissão já dada: salva a cidade em silêncio e segue, sem mostrar a tela
  const [probing, setProbing] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (await locationGranted()) {
        const res = await enableDeviceLocation();
        if (alive && res.ok) return onDone("on");
      }
      if (alive) setProbing(false);
    })();
    return () => {
      alive = false;
    };
    // onDone muda a cada render do pai; a sondagem roda só ao abrir a tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enable() {
    setBusy(true);
    const res = await enableDeviceLocation();
    setBusy(false);
    if (res.ok) return onDone("on");
    if (res.reason === "denied") return setRefused(true);
    if (res.reason === "unavailable")
      return notify.problem("Não deu para achar a localização", "Tente de novo perto de uma janela.");
    notify.error(res.code, () => void enable());
  }

  if (probing) return null;
  const skip = () => onDone(refused ? "denied" : "skipped");
  return (
    <EntryScreen
      step="location"
      title="A Bolha olha o tempo por você"
      text="Com sua cidade, ela muda de roupa conforme o clima e coloca a previsão nos avisos de folga. Usamos só a cidade, não seguimos você."
      onSkip={skip}
      actions={
        refused ? (
          <>
            <Note tone="wait">
              Localização desligada. Para ligar depois: Ajustes do {phone} › Privacidade › Serviços de Localização, e
              Ajustes › Notificações no Bubbly.
            </Note>
            <PrimaryButton onClick={skip}>Continuar</PrimaryButton>
          </>
        ) : (
          <>
            <PrimaryButton onClick={() => void enable()} busy={busy}>
              <Icon name="map" size={22} />
              Usar minha localização
            </PrimaryButton>
            <Fine>Você muda isso quando quiser em Ajustes › Notificações.</Fine>
          </>
        )
      }
    >
      <WeatherArt muted={refused} />
    </EntryScreen>
  );
}

function DoneScreen({
  firstName,
  hours,
  rows,
  onGo,
}: {
  firstName: string;
  hours: string;
  rows: ReturnType<typeof summaryRows>;
  onGo: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  // Marca a entrada como feita ao chegar aqui: sair do app antes de tocar no botão não repete as telas
  useEffect(() => {
    void finishOnboarding().catch(() => undefined);
  }, []);
  const icons = { push: "bell", calendar: "calendar", location: "map" } as const;
  return (
    <EntryScreen
      step="done"
      title={`Tudo pronto, ${firstName}!`}
      text="Sua agenda já está esperando. O que ficou de fora mora em Ajustes."
      actions={
        <>
          <PrimaryButton
            busy={busy}
            onClick={async () => {
              setBusy(true);
              await onGo();
              setBusy(false);
            }}
          >
            Ir para a agenda
          </PrimaryButton>
          <Fine>Ajustes › Expediente, Notificações e Calendários</Fine>
        </>
      }
    >
      <Mascot size={120} mood="happy" idle />
      <ul className="glass grid w-full gap-1 rounded-[1.75rem] p-3">
        <SummaryItem icon="clock" label="Horários" status={hours} ok />
        {rows.map((r) => (
          <SummaryItem key={r.key} icon={icons[r.key]} label={r.label} status={r.status} ok={r.ok} />
        ))}
      </ul>
    </EntryScreen>
  );
}

function SummaryItem({
  icon,
  label,
  status,
  ok,
}: {
  icon: "clock" | "bell" | "calendar" | "map";
  label: string;
  status: string;
  ok: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-2 py-2 text-sm font-bold">
      <span className="grid size-9 shrink-0 place-content-center rounded-full bg-soft text-primary-text">
        <Icon name={icon} size={18} />
      </span>
      <span className="flex-1">{label}</span>
      <span className={`max-w-[55%] text-right text-xs ${ok ? "text-ok" : "text-muted"}`}>{status}</span>
    </li>
  );
}
