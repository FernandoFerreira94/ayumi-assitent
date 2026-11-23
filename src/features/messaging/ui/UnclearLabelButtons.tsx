"use client";

import { useTransition } from "react";
import { notify } from "@/components/feedback/toast";
import { UNCLEAR_LABELS, UNCLEAR_LABEL_TEXT, type UnclearLabel } from "../unclear";
import { labelUnclearReplies } from "../unclear-actions";

/** Botões de rótulo de um grupo. Tocar no rótulo atual tira o rótulo. */
export function UnclearLabelButtons({ ids, current }: { ids: string[]; current: UnclearLabel | null }) {
  const [pending, start] = useTransition();
  function pick(label: UnclearLabel) {
    const next = current === label ? null : label;
    start(async () => {
      const res = await labelUnclearReplies({ ids, label: next }).catch(() => null);
      if (res?.ok) notify.success(next ? `Marcado como ${UNCLEAR_LABEL_TEXT[next]}` : "Rótulo tirado");
      else notify.error(res && !res.ok ? res.code : "NETWORK", () => pick(label));
    });
  }
  return (
    <div role="group" aria-label="O que a cliente quis dizer" className="flex flex-wrap gap-2">
      {UNCLEAR_LABELS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          disabled={pending}
          aria-pressed={current === l}
          className={`min-h-11 rounded-xl px-3 text-sm font-bold disabled:opacity-60 ${
            current === l ? "bg-primary text-white" : "btn-glass"
          }`}
        >
          {UNCLEAR_LABEL_TEXT[l]}
        </button>
      ))}
    </div>
  );
}
