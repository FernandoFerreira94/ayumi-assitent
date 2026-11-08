"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { maskPhone } from "@/lib/phone";
import { QrImage } from "./QrImage";
import { disconnectWhatsapp, startWhatsappPairing, whatsappStatus } from "./actions";

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
        notify.error("NETWORK");
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
      setView("disconnected");
      notify.success("WhatsApp desconectado");
    });
  }

  const box = "rounded-2xl border border-line bg-white px-4 py-3";
  const btn =
    "min-h-11 rounded-full bg-soft px-4 text-sm font-bold text-primary-text active:scale-[0.97] disabled:opacity-60";

  if (view === "unavailable")
    return (
      <div className={box}>
        <p className="font-bold">WhatsApp</p>
        <p className="text-sm font-semibold text-muted">Indisponível no momento. Tente de novo em instantes.</p>
      </div>
    );

  if (view === "connected")
    return (
      <div className={`${box} flex items-center justify-between gap-3`}>
        <div>
          <p className="font-bold">WhatsApp</p>
          <p className="text-sm font-semibold text-muted">Conectado. Os lembretes saem por aqui.</p>
        </div>
        <button type="button" className={btn} onClick={disconnect} disabled={pending} aria-busy={pending}>
          {pending ? "Aguarde…" : "Desconectar"}
        </button>
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
              () => notify.error("UNKNOWN"),
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

  return (
    <div className={`${box} grid gap-3`}>
      <div>
        <p className="font-bold">WhatsApp</p>
        <p className="text-sm font-semibold text-muted">
          Conecte o número do estúdio para enviar lembretes às clientes.
        </p>
      </div>
      <input
        inputMode="tel"
        autoComplete="off"
        placeholder="(11) 98765-4321"
        aria-label="Número do WhatsApp do estúdio"
        value={phone}
        onChange={(e) => setPhone(maskPhone(e.target.value))}
        className="min-h-13 w-full rounded-2xl border border-line bg-white px-4 text-base font-semibold outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={generate}
        disabled={pending || phone.replace(/\D/g, "").length < 10}
        aria-busy={pending}
        className="min-h-12 rounded-2xl bg-primary px-4 font-bold text-on-primary active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Gerando código…" : "Gerar código de conexão"}
      </button>
    </div>
  );
}
