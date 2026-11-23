"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { formatBRL } from "@/lib/dates";
import { promoText, type PromoFacts, type SalonInfo, type ShareVariant } from "./promo-text";

const VARIANTS: [ShareVariant, string, string][] = [
  ["status", "Status", "Curto, para o status do WhatsApp ou stories"],
  ["message", "Mensagem", "Completo, para mandar para as clientes"],
];

/**
 * Texto pronto para divulgar: escolhe "Status" (curto) ou "Mensagem" (completo), edita se quiser e copia.
 * O texto sai só com os dados que existem (nome, desconto, serviços, datas, vagas, endereço).
 */
export function ShareTextPanel({ facts, salon }: { facts: PromoFacts; salon: SalonInfo }) {
  const [variant, setVariant] = useState<ShareVariant>("status");
  const [edited, setEdited] = useState<Partial<Record<ShareVariant, string>>>({});
  const [busy, setBusy] = useState(false);
  const text = edited[variant] ?? promoText(facts, salon, variant, formatBRL);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Texto copiado", "Cole no status ou na conversa do WhatsApp.");
    } catch {
      notify.error("CLIPBOARD", copy);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    try {
      await navigator.share({ text });
    } catch {
      // a pessoa fechou o compartilhar: nada a fazer
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Formato do texto">
        {VARIANTS.map(([v, label, hint]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={variant === v}
            onClick={() => setVariant(v)}
            className="grid gap-0.5 rounded-2xl border-2 border-line bg-surface px-3 py-2.5 text-left aria-checked:border-primary aria-checked:bg-soft"
          >
            <span className="font-bold">{label}</span>
            <span className="text-xs font-semibold text-muted">{hint}</span>
          </button>
        ))}
      </div>
      <label className="grid gap-1.5">
        <span className="flex items-center justify-between gap-2 text-sm font-bold">
          Texto (pode editar)
          {edited[variant] !== undefined ? (
            <button
              type="button"
              onClick={() => setEdited((cur) => ({ ...cur, [variant]: undefined }))}
              className="flex min-h-9 items-center gap-1 rounded-full px-2 text-sm font-bold text-primary-text"
            >
              <Icon name="refresh" size={15} />
              Refazer
            </button>
          ) : null}
        </span>
        <textarea
          aria-label="Texto para divulgar"
          value={text}
          rows={variant === "status" ? 7 : 12}
          onChange={(e) => setEdited((cur) => ({ ...cur, [variant]: e.target.value }))}
          className="w-full resize-y rounded-2xl border border-line bg-surface px-4 py-3 text-base leading-relaxed"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          disabled={busy || !text.trim()}
          className="btn-tint flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full px-5 font-bold disabled:opacity-60"
        >
          <Icon name="copy" size={18} />
          Copiar texto
        </button>
        {canShare ? (
          <button
            type="button"
            onClick={share}
            aria-label="Compartilhar texto"
            className="btn-glass flex min-h-13 items-center justify-center gap-2 rounded-full px-5 font-bold"
          >
            <Icon name="share" size={18} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Botão "Divulgar" + diálogo com o texto pronto. */
export function ShareTextSheet({
  title,
  facts,
  salon,
  nested = false,
}: {
  title: string;
  facts: PromoFacts;
  salon: SalonInfo;
  nested?: boolean;
}) {
  const side = useSheetSide();
  const Root = nested ? Drawer.NestedRoot : Drawer.Root;
  return (
    <Root direction={side} repositionInputs={false}>
      <Drawer.Trigger
        aria-label={`Divulgar ${title}`}
        className="btn-glass flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold"
      >
        <Icon name="megaphone" size={16} className="text-primary-text" />
        Divulgar
      </Drawer.Trigger>
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
            <Drawer.Title className="text-xl font-bold">Divulgar {title}</Drawer.Title>
            <Drawer.Description className="pb-3 text-sm font-semibold text-muted">
              Texto pronto com os dados da promoção. Copie e cole no WhatsApp.
            </Drawer.Description>
            <ShareTextPanel facts={facts} salon={salon} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Root>
  );
}
