"use client";

import { useEffect, useState, useTransition } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { notify } from "@/components/feedback/toast";
import { Switch } from "@/components/ui/Switch";
import { weatherMood, type Weather } from "./mood";
import { disableWeather, enableWeather, hasSavedPlace, loadWeather } from "./useWeather";

type State = "checking" | "unsupported" | "off" | "denied" | "on";

/**
 * Localização só para o clima do Mimo, num interruptor: ligado guarda o ponto uma vez e nunca mais pede
 * permissão; desligado esquece o ponto. O que vale é o ponto guardado neste aparelho, não a permissão do navegador.
 */
export function LocationCard() {
  const [state, setState] = useState<State>("checking");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let alive = true;
    // localStorage e geolocation só existem no navegador: decide depois da hidratação, fora do corpo do efeito
    void Promise.resolve().then(() => {
      if (!alive) return;
      if (!("geolocation" in navigator)) return setState("unsupported");
      if (!hasSavedPlace()) return setState("off");
      setState("on");
      loadWeather().then(
        (w) => alive && setWeather(w),
        () => {},
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  function turnOn() {
    start(async () => {
      try {
        setWeather(await enableWeather());
        setState("on");
        notify.success("Localização ligada", "O Mimo já se veste conforme o clima.");
      } catch (e) {
        // Código 1 = a pessoa negou no aviso do navegador
        if (e instanceof GeolocationPositionError && e.code === 1) {
          setState("denied");
          notify.problem("Localização bloqueada", "Libere em Ajustes do iPhone e ligue de novo.");
        } else {
          setState("off");
          notify.error("NETWORK", turnOn);
        }
      }
    });
  }

  function turnOff() {
    disableWeather();
    setWeather(null);
    setState("off");
    notify.info("Localização desligada", "O Mimo deixa de olhar o clima.");
  }

  const hint: Record<State, string> = {
    checking: "Verificando…",
    unsupported: "Este aparelho não informa a localização.",
    off: "Ligue para o Mimo trocar de roupa conforme o clima: guarda-chuva, moletom ou óculos de sol.",
    denied:
      "Bloqueada. No iPhone: Ajustes › Privacidade e Segurança › Serviços de Localização › Sites do Safari › Ao Usar o App.",
    on: weather ? `Ligada. Agora faz ${Math.round(weather.temp)}°C aí.` : "Ligada. O Mimo acompanha o clima daí.",
  };

  return (
    <div className="glass grid gap-3 rounded-[1.75rem] px-5 py-4">
      <div className="flex items-center gap-3">
        <Mascot size={52} weather={weather ? (weatherMood(weather) ?? undefined) : undefined} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Localização do Mimo</p>
          <p className="text-sm font-semibold text-muted">{hint[state]}</p>
        </div>
        {state !== "unsupported" && state !== "checking" ? (
          <Switch
            checked={state === "on"}
            busy={pending}
            onChange={(next) => (next ? turnOn() : turnOff())}
            label="Localização do Mimo"
          />
        ) : null}
      </div>
      {state === "off" || state === "denied" ? (
        <p className="px-1 text-xs font-semibold text-muted">
          A localização vai direto do aparelho para o serviço de clima, nunca para o nosso servidor. O aviso do iPhone
          aparece só na primeira vez.
        </p>
      ) : null}
    </div>
  );
}
