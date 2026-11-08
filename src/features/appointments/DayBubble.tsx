"use client";

import { useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import type { Briefing } from "./briefing";

/** Bolha à esquerda com o balão do dia; tocar nela faz pular e trocar para a próxima informação. */
export function DayBubble({ briefing }: { briefing: Briefing }) {
  const [i, setI] = useState(0);
  const [hop, setHop] = useState(0);
  const line = briefing.lines[i % briefing.lines.length];

  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        type="button"
        data-tour="bubble"
        aria-label={briefing.lines.length > 1 ? "Ver mais sobre o dia" : "Bolha"}
        onClick={() => {
          setI((n) => n + 1);
          setHop((n) => n + 1);
        }}
        className="grid size-16 shrink-0 place-items-center rounded-full"
      >
        {/* key muda a cada toque: remonta e a animação de pulo roda de novo */}
        <span key={hop} className={hop ? "mascot-hop" : "mascot-float"}>
          <Mascot size={60} mood={i === 0 ? briefing.mood : "happy"} idle />
        </span>
      </button>
      <p aria-live="polite" className="speech glass relative min-h-14 flex-1 rounded-3xl px-4 py-2.5 text-sm font-semibold leading-snug">
        {line}
      </p>
    </div>
  );
}
