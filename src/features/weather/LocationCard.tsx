"use client";

import { useEffect, useState, useTransition } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { notify } from "@/components/feedback/toast";
import { weatherMood, type Weather } from "./mood";
import { enableWeather } from "./useWeather";

type State = "checking" | "unsupported" | "prompt" | "denied" | "granted";

/** Localização só para o clima do Mimo: roupa e fala na agenda mudam com o tempo lá fora. */
export function LocationCard() {
  const [state, setState] = useState<State>("checking");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let alive = true;
    const query: Promise<{ state: State }> = !("geolocation" in navigator)
      ? Promise.resolve({ state: "unsupported" })
      : // Safari antigo não tem permissions.query: trata como "ainda não perguntado"
        (navigator.permissions?.query({ name: "geolocation" }) ?? Promise.resolve({ state: "prompt" }));
    query
      .then(({ state: s }) => {
        if (!alive) return;
        setState(s);
        // Já liberada: não abre aviso, só busca o clima para mostrar a roupa de agora
        if (s === "granted")
          enableWeather().then(
            (w) => alive && setWeather(w),
            () => {},
          );
      })
      .catch(() => alive && setState("prompt"));
    return () => {
      alive = false;
    };
  }, []);

  function enable() {
    start(async () => {
      try {
        setWeather(await enableWeather());
        setState("granted");
        notify.success("Localização ligada", "O Mimo já se veste conforme o clima.");
      } catch (e) {
        // Código 1 = a pessoa negou no aviso do navegador
        if (e instanceof GeolocationPositionError && e.code === 1) setState("denied");
        else notify.error("NETWORK", enable);
      }
    });
  }

  const hint: Record<State, string> = {
    checking: "Verificando…",
    unsupported: "Este aparelho não informa a localização.",
    prompt: "Deixe o Mimo ver o clima daí para trocar de roupa: guarda-chuva, moletom ou óculos de sol.",
    denied:
      "Bloqueada. No iPhone: Ajustes › Privacidade e Segurança › Serviços de Localização › Sites do Safari › Ao Usar o App.",
    granted: weather ? `Ligada. Agora faz ${Math.round(weather.temp)}°C aí.` : "Ligada. O Mimo acompanha o clima daí.",
  };

  return (
    <div className="glass grid gap-3 rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center gap-3">
        <Mascot size={52} weather={weather ? (weatherMood(weather) ?? undefined) : undefined} className="shrink-0" />
        <div className="min-w-0">
          <p className="font-bold">Localização do Mimo</p>
          <p className="text-sm font-semibold text-muted">{hint[state]}</p>
        </div>
      </div>
      {state === "prompt" && (
        <>
          <button
            type="button"
            onClick={enable}
            disabled={pending}
            aria-busy={pending}
            className="btn-tint min-h-12 rounded-full px-4 font-bold disabled:opacity-60"
          >
            {pending ? "Buscando o clima…" : "Permitir localização"}
          </button>
          <p className="px-1 text-xs font-semibold text-muted">
            A localização vai direto do aparelho para o serviço de clima, nunca para o nosso servidor.
          </p>
        </>
      )}
    </div>
  );
}
