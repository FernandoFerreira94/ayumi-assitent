"use client";

import { useEffect, useRef } from "react";
import { weatherIcon, type Weather } from "./mood";

/**
 * Previsão de hoje, hora a hora, numa faixa que rola para o lado: da hora atual até o fim do dia.
 * Chuva aparece em lavanda quando a chance passa de 30%.
 */
export function HourlyForecast({ weather }: { weather: Weather }) {
  const ref = useRef<HTMLUListElement>(null);
  const nowHour = new Date().getHours();
  const hours = (weather.hours ?? []).filter((h) => h.hour >= nowHour);

  // Volta ao início quando o clima atualiza
  useEffect(() => {
    ref.current?.scrollTo({ left: 0 });
  }, [weather]);

  if (hours.length === 0) return null;
  return (
    <section aria-label="Previsão do tempo de hoje" className="mb-3">
      <ul
        ref={ref}
        className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {hours.map((h, i) => {
          const rain = h.rainChance >= 30;
          return (
            <li
              key={h.hour}
              className="glass grid w-14 shrink-0 snap-start justify-items-center gap-0.5 rounded-2xl px-1 py-2 text-center"
            >
              <span className="text-xs font-bold text-muted">{i === 0 ? "Agora" : `${h.hour}h`}</span>
              <span aria-hidden="true" className="text-xl leading-7">
                {weatherIcon(h.code, h.isDay)}
              </span>
              <b className="text-sm tabular-nums">{Math.round(h.temp)}°</b>
              <span
                className={`text-[11px] font-bold tabular-nums ${rain ? "text-primary-text" : "text-muted/60"}`}
                aria-label={`${h.rainChance}% de chance de chuva`}
              >
                {rain ? `💧${h.rainChance}%` : "–"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
