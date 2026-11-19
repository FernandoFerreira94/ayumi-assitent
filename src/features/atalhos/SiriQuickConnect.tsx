"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import type { ErrorCode } from "@/lib/errors";
import { createSiriPairing } from "./actions";
import { SHORTCUT_MENU, SHORTCUT_NAME } from "./tokens-shared";

/**
 * Cria o código de uso único e copia. O ClipboardItem com Promise mantém o "toque" do usuário vivo no Safari
 * enquanto o servidor responde (writeText depois de um await é recusado no iPhone).
 */
async function copyPairingCode(): Promise<ErrorCode | null> {
  let failed: ErrorCode | null = null;
  const get = async () => {
    const res = await createSiriPairing().catch(() => null);
    if (!res?.ok) {
      failed = res ? res.code : "NETWORK";
      throw new Error("pairing");
    }
    return res.data.code;
  };
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      const blob = get().then((c) => new Blob([c], { type: "text/plain" }));
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
    } else {
      await navigator.clipboard.writeText(await get());
    }
    return null;
  } catch {
    return failed ?? "CLIPBOARD";
  }
}

/** Roda o Atalho já instalado com o código copiado como entrada (nada sensível vai na URL). */
const RUN_URL = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=clipboard`;

/**
 * Ligar a Siri em 2 toques: "Adicionar à Siri" copia um código de uso único e abre o Atalho pronto do iCloud;
 * a pessoa toca "Adicionar Atalho" e já pode falar. Na primeira vez o Atalho troca o código pela chave e guarda.
 */
export function SiriQuickConnect({ shortcutUrl, disabled }: { shortcutUrl: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"add" | "reconnect" | null>(null);
  const [sent, setSent] = useState(false);

  // Ao voltar do app Atalhos, a lista de chaves já mostra o iPhone ligado.
  useEffect(() => {
    if (!sent) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sent, router]);

  async function go(kind: "add" | "reconnect") {
    setBusy(kind);
    const err = await copyPairingCode();
    setBusy(null);
    if (err) return notify.error(err, () => void go(kind));
    setSent(true);
    window.location.assign(kind === "add" ? shortcutUrl : RUN_URL);
  }

  return (
    <div className="grid min-w-0 gap-3">
      <button
        type="button"
        className="btn-tint flex min-h-13 items-center justify-center gap-2 rounded-2xl px-5 text-base font-bold disabled:opacity-60"
        onClick={() => void go("add")}
        disabled={disabled || busy !== null}
        aria-busy={busy === "add"}
      >
        <Icon name="sparkles" size={18} /> {busy === "add" ? "Preparando…" : "Adicionar à Siri"}
      </button>

      {sent ? (
        <div className="grid gap-1.5 rounded-2xl bg-soft px-4 py-3" role="status">
          <p className="text-sm font-bold">Falta só um toque</p>
          <p className="text-sm font-semibold text-muted">
            No app Atalhos, toque em <b>Adicionar Atalho</b>. Depois diga <b>&quot;E aí Siri, {SHORTCUT_NAME}&quot;</b>.
            Na primeira vez ela pede para usar o que você copiou: toque em Permitir.
          </p>
          <a href={shortcutUrl} className="text-sm font-bold text-primary underline">
            Não abriu? Toque aqui
          </a>
        </div>
      ) : (
        <p className="text-sm font-semibold text-muted">
          Faça no iPhone em que você usa a Siri. Você não digita nada: o código vale 15 minutos e uma vez só.
        </p>
      )}

      <div className="grid gap-1.5">
        <p className="px-1 text-xs font-bold uppercase tracking-wide text-muted">Depois é só falar</p>
        <p className="px-1 text-sm font-semibold">
          &quot;E aí Siri, {SHORTCUT_NAME}&quot; → ela pergunta o que você quer saber:
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Frases da Siri">
          {SHORTCUT_MENU.map((f) => (
            <li key={f} className="glass rounded-full px-3 py-1.5 text-sm font-bold">
              {f}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="btn-glass min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60"
        onClick={() => void go("reconnect")}
        disabled={disabled || busy !== null}
        aria-busy={busy === "reconnect"}
      >
        {busy === "reconnect" ? "Preparando…" : `Já tenho o Atalho ${SHORTCUT_NAME}: ligar de novo`}
      </button>
    </div>
  );
}
