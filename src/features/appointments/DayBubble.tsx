"use client";

import { useState } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { weatherLine, weatherMood } from "@/features/weather/mood";
import { useWeather } from "@/features/weather/useWeather";
import type { Briefing } from "./briefing";

/**
 * Bolha à esquerda com o balão do dia; tocar nela faz pular e trocar para a próxima informação.
 * Em hoje, veste a roupa do clima. O resumo do salão segue na frente e o clima vem logo depois,
 * na ordem de prioridade da prancha de humores.
 */
export function DayBubble({ briefing, isToday }: { briefing: Briefing; isToday: boolean }) {
  const [i, setI] = useState(0);
  const [hop, setHop] = useState(0);
  const { weather, ask } = useWeather();
  const today = isToday && weather ? weather : null;
  const extra = today ? weatherLine(today) : null;
  const lines = extra ? [briefing.lines[0], extra, ...briefing.lines.slice(1)] : briefing.lines;
  const line = lines[i % lines.length];

  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        type="button"
        data-tour="bubble"
        aria-label={lines.length > 1 ? "Ver mais sobre o dia" : "Mimo"}
        onClick={() => {
          ask();
          setI((n) => n + 1);
          setHop((n) => n + 1);
        }}
        className="grid size-16 shrink-0 place-items-center rounded-full"
      >
        {/* key muda a cada toque: remonta e a animação de pulo roda de novo */}
        <span key={hop} className={hop ? "mascot-hop" : "mascot-float"}>
          <Mascot
            size={60}
            mood={i === 0 ? briefing.mood : "happy"}
            weather={(today && weatherMood(today)) || undefined}
            idle
          />
        </span>
      </button>
      <p
        aria-live="polite"
        className="speech glass relative min-h-14 flex-1 rounded-3xl px-4 py-2.5 text-sm font-semibold leading-snug"
      >
        {line}
      </p>
    </div>
  );
}
