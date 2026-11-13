"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { maskPhone } from "@/lib/phone";
import { QrImage } from "./QrImage";
import { disconnectWhatsapp, startWhatsappPairing, whatsappStatus } from "./actions";
import { TileTitle } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";

type View = "connected" | "disconnected" | "pairing" | "unavailable";

const POLL_MS = 3000;
const POLL_MAX = 60; // ~3 minutos

export function WhatsAppCard({ initial }: { initial: "open" | "other" | "unavailable" }) {
  const router = useRouter();
  const [view, setView] = useState<View>(
    initial === "open" ? "connected" : initial === "unavailable" ? "unavailable" : "disconnected",
  );
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  /** Primeiro toque em Desconectar só pergunta: os lembretes param de sair. */
  const [confirming, setConfirming] = useState(false);
  /** O código passou do prazo sem conectar: a tela diz isso, em vez de um erro genérico. */
  const [expired, setExpired] = useState(false);
  /** Interruptor ligado antes de conectar: mostra o campo do número e o botão que gera o código. */
  const [wantsOn, setWantsOn] = useState(false);

  // Já conectado ao abrir: confere uma vez em silêncio. whatsappStatus religa o webhook se faltar (número
  // conectado antes de existir o webhook), para as respostas das clientes chegarem ao app.
  useEffect(() => {
    if (initial === "open") void whatsappStatus().catch(() => null);
  }, [initial]);

  // Enquanto mostra o código, acompanha o estado até conectar (ou expirar).
  useEffect(() => {
    if (view !== "pairing") return;
    let tries = 0;
    let alive = true;
    const id = setInterval(async () => {
      tries++;
      const res = await whatsappStatus().catch(() => null);
      if (!alive) return;
      if (res?.ok && res.data.state === "open") {
        setView("connected");
        notify.success("WhatsApp conectado");
        router.refresh();
      } else if (tries >= POLL_MAX) {
        setView("disconnected");
        setExpired(true);
      }
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [view, router]);

  function generate() {
    start(async () => {
      const res = await startWhatsappPairing(phone);
      if (!res.ok) {
        if (res.code === "VALIDATION") notify.error("VALIDATION");
        else notify.error(res.code, generate);
        return;
      }
      setExpired(false);
      setCode(res.data.pairingCode);
      setQr(res.data.qr);
      setView("pairing");
    });
  }

  function disconnect() {
    start(async () => {
      const res = await disconnectWhatsapp();
      if (!res.ok) {
        notify.error(res.code, disconnect);
        return;
      }
      setConfirming(false);
      setWantsOn(false);
      setView("disconnected");
      notify.success("WhatsApp desconectado");
    });
  }

  const box = "glass rounded-[1.75rem] px-5 py-4";
  const btn = "btn-glass min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60";

  if (view === "unavailable")
    return (
      <div className={box}>
        <TileTitle icon="chat" tint="green">
          WhatsApp
        </TileTitle>
        <p className="text-sm font-semibold text-muted">Indisponível no momento. Tente de novo em instantes.</p>
      </div>
    );

  if (view === "connected")
    return confirming ? (
      <div className={`${box} grid gap-3`} role="alertdialog" aria-label="Desconectar o WhatsApp?">
        <div>
          <p className="font-bold">Desconectar o WhatsApp?</p>
          <p className="text-sm font-semibold text-muted">
            Lembretes e confirmações param de sair até você conectar de novo.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={btn} onClick={() => setConfirming(false)} disabled={pending} autoFocus>
            Cancelar
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full bg-fail px-4 text-sm font-bold text-white disabled:opacity-60"
            onClick={disconnect}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Desconectando…" : "Desconectar"}
          </button>
        </div>
      </div>
    ) : (
      <div className={`${box} flex items-center justify-between gap-3`}>
        <div>
          <TileTitle icon="chat" tint="green">
            WhatsApp
          </TileTitle>
          <p className="text-sm font-semibold text-muted">Conectado. Os lembretes saem por aqui.</p>
        </div>
        <Switch checked onChange={() => setConfirming(true)} label="WhatsApp" />
      </div>
    );

  if (view === "pairing")
    return (
      <div className={`${box} grid gap-3`} aria-live="polite">
        <p className="font-bold">Escaneie o QR code ou digite o código</p>
        {qr ? <QrImage value={qr} /> : null}
        <p
          className="text-center text-3xl font-bold tracking-[0.2em] text-primary-text"
          aria-label={`Código ${code.split("").join(" ")}`}
        >
          {code}
        </p>
        <button
          type="button"
          className={btn}
          onClick={() =>
            navigator.clipboard.writeText(code).then(
              () => notify.success("Código copiado"),
              () => notify.error("CLIPBOARD"),
            )
          }
        >
          Copiar código
        </button>
        <ol className="list-decimal pl-5 text-sm font-semibold text-muted">
          <li>Abra o WhatsApp deste número.</li>
          <li>Toque em Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho.</li>
          <li>Escaneie o QR code ou escolha &quot;Conectar com número de telefone&quot; e digite o código.</li>
        </ol>
        <p className="text-sm font-semibold text-muted">Aguardando a conexão…</p>
        <button type="button" className={btn} onClick={() => setView("disconnected")}>
          Cancelar
        </button>
      </div>
    );

  const open = wantsOn || expired;
  return (
    <div className={`${box} grid gap-3`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <TileTitle icon="chat" tint="green">
            WhatsApp
          </TileTitle>
          <p className="text-sm font-semibold text-muted">
            {open ? "Digite o número do estúdio para gerar o código." : "Ligue para enviar lembretes às clientes."}
          </p>
        </div>
        <Switch
          checked={open}
          onChange={(on) => {
            setWantsOn(on);
            if (!on) setExpired(false);
          }}
          label="WhatsApp"
        />
      </div>
      {expired ? (
        <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
          O código expirou antes de conectar. Gere outro e digite no WhatsApp logo em seguida.
        </p>
      ) : null}
      {open ? (
        <>
          <input
            inputMode="tel"
            autoComplete="off"
            placeholder="(11) 98765-4321"
            aria-label="Número do WhatsApp do estúdio"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            className="min-h-13 w-full rounded-full border px-5 text-base font-semibold"
          />
          <button
            type="button"
            onClick={generate}
            disabled={pending || phone.replace(/\D/g, "").length < 10}
            aria-busy={pending}
            className="btn-tint min-h-12 rounded-full px-4 font-bold disabled:opacity-60"
          >
            {pending ? "Gerando código…" : "Gerar código de conexão"}
          </button>
        </>
      ) : null}
    </div>
  );
}
