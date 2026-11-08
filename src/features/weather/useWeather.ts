"use client";

import { useCallback, useEffect, useState } from "react";
import type { Weather } from "./mood";

const CACHE = "mimo:clima";
const ASKED = "mimo:clima-pedido";
const TTL = 30 * 60_000;

const read = <T,>(key: string): T | null => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
};

const locate = () =>
  new Promise<GeolocationPosition>((ok, fail) =>
    navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 8000, maximumAge: TTL }),
  );

// A localização vai direto do aparelho para a Open-Meteo (grátis, sem chave), nunca para o nosso servidor.
// Duas casas decimais (~1 km) bastam para o clima.
async function fetchWeather(): Promise<Weather> {
  const { coords } = await locate();
  const q = new URLSearchParams({
    latitude: coords.latitude.toFixed(2),
    longitude: coords.longitude.toFixed(2),
    current: "temperature_2m,weather_code,is_day",
    daily: "precipitation_probability_max",
    forecast_days: "1",
    timezone: "auto",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);
  const j = await res.json();
  return {
    temp: j.current.temperature_2m,
    code: j.current.weather_code,
    isDay: j.current.is_day === 1,
    rainChance: j.daily?.precipitation_probability_max?.[0] ?? 0,
  };
}

/** Pede a localização (o aviso do navegador aparece aqui) e guarda o clima para a agenda já abrir com ele. */
export async function enableWeather(): Promise<Weather> {
  write(ASKED, true);
  const w = await fetchWeather();
  write(CACHE, { at: Date.now(), w });
  return w;
}

/**
 * Clima do lugar onde a usuária está. Só pede a localização uma vez, num toque no Mimo (`ask`),
 * para o aviso do navegador não pular sozinho ao abrir a agenda. Sem permissão ou sem rede, fica null
 * e o Mimo segue como sempre.
 */
export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [canAsk, setCanAsk] = useState(false);

  const load = useCallback(async () => {
    try {
      setWeather(await enableWeather());
    } catch {
      setWeather(null);
    }
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    // Safari antigo não tem permissions.query: trata como "ainda não perguntado"
    (navigator.permissions?.query({ name: "geolocation" }) ?? Promise.resolve({ state: "prompt" }))
      .then(({ state }) => {
        if (state === "granted") {
          // Cache só vale com a permissão ainda dada: se ela tirar, o Mimo para de usar o clima
          const cached = read<{ at: number; w: Weather }>(CACHE);
          if (cached && Date.now() - cached.at < TTL) setWeather(cached.w);
          else void load();
        } else if (state === "prompt" && !read(ASKED)) setCanAsk(true);
      })
      .catch(() => {});
  }, [load]);

  const ask = useCallback(() => {
    if (!canAsk) return;
    setCanAsk(false);
    void load();
  }, [canAsk, load]);

  return { weather, ask };
}
