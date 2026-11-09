"use client";

import { useCallback, useEffect, useState } from "react";
import type { HourForecast, Weather } from "./mood";

const CACHE = "mimo:clima";
const ASKED = "mimo:clima-pedido";
/** A pessoa desligou o interruptor: nada de buscar o clima nem pedir permissão sozinho. */
const OFF = "mimo:clima-desligado";
const TTL = 30 * 60_000;

const read = <T>(key: string): T | null => {
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

const PLACE = "mimo:local";
type Place = { lat: number; lon: number };

const locate = () =>
  new Promise<GeolocationPosition>((ok, fail) =>
    navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 8000, maximumAge: TTL }),
  );

// A localização vai direto do aparelho para a Open-Meteo (grátis, sem chave), nunca para o nosso servidor.
// Duas casas decimais (~1 km) bastam para o clima.
async function fetchWeather({ lat, lon }: Place): Promise<Weather> {
  const q = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    current: "temperature_2m,weather_code,is_day,precipitation",
    daily: "precipitation_probability_max",
    hourly: "temperature_2m,weather_code,is_day,precipitation_probability",
    forecast_days: "1",
    timezone: "auto",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);
  const j = await res.json();
  const h = j.hourly;
  const hours: HourForecast[] | undefined = h?.time?.map((t: string, i: number) => ({
    hour: Number(t.slice(11, 13)),
    temp: h.temperature_2m[i],
    code: h.weather_code[i],
    isDay: h.is_day[i] === 1,
    rainChance: h.precipitation_probability?.[i] ?? 0,
  }));
  return {
    hours,
    temp: j.current.temperature_2m,
    code: j.current.weather_code,
    isDay: j.current.is_day === 1,
    rainChance: j.daily?.precipitation_probability_max?.[0] ?? 0,
    precip: j.current.precipitation ?? 0,
  };
}

/**
 * Clima do ponto guardado, sem tocar na geolocalização: o iPhone (principalmente o app instalado)
 * pergunta de novo a cada abertura, então depois da primeira vez usamos só as coordenadas salvas.
 */
async function savedWeather(place: Place): Promise<Weather> {
  const cached = read<{ at: number; w: Weather }>(CACHE);
  // Cache de versões antigas não tem o hora a hora: busca de novo
  if (cached && Date.now() - cached.at < TTL && cached.w.hours) return cached.w;
  const w = await fetchWeather(place);
  write(CACHE, { at: Date.now(), w });
  return w;
}

/** Pede a localização (o aviso do navegador aparece aqui), guarda o ponto e o clima para a agenda já abrir com ele. */
export async function enableWeather(): Promise<Weather> {
  write(ASKED, true);
  try {
    localStorage.removeItem(OFF);
  } catch {}
  const { coords } = await locate();
  const place = { lat: coords.latitude, lon: coords.longitude };
  write(PLACE, place);
  const w = await fetchWeather(place);
  write(CACHE, { at: Date.now(), w });
  return w;
}

/** A localização está ligada neste aparelho (já existe um ponto guardado). */
export const hasSavedPlace = () => read<Place>(PLACE) !== null;

/** Desliga: esquece o ponto e o clima, e o Mimo não busca nem pede de novo até ligar outra vez. */
export function disableWeather() {
  write(OFF, true);
  try {
    localStorage.removeItem(PLACE);
    localStorage.removeItem(CACHE);
  } catch {}
}

/** Se o ponto já foi guardado, só busca o clima; senão cai no pedido de localização. */
export async function loadWeather(): Promise<Weather> {
  const place = read<Place>(PLACE);
  return place ? savedWeather(place) : enableWeather();
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
      setWeather(await loadWeather());
    } catch {
      setWeather(null);
    }
  }, []);

  useEffect(() => {
    if (read(OFF)) return;
    // Ponto já guardado: nunca mais passa pela permissão, só atualiza o clima de tempos em tempos
    if (read<Place>(PLACE)) {
      loadWeather().then(setWeather, () => setWeather(null));
      const onVisible = () => {
        const c = read<{ at: number }>(CACHE);
        if (document.visibilityState === "visible" && (!c || Date.now() - c.at >= TTL)) void load();
      };
      document.addEventListener("visibilitychange", onVisible);
      return () => document.removeEventListener("visibilitychange", onVisible);
    }
    if (!("geolocation" in navigator)) return;
    // Safari antigo não tem permissions.query: trata como "ainda não perguntado"
    (navigator.permissions?.query({ name: "geolocation" }) ?? Promise.resolve({ state: "prompt" }))
      .then(({ state }) => {
        if (state === "granted") void load();
        else if (state === "prompt" && !read(ASKED)) setCanAsk(true);
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
