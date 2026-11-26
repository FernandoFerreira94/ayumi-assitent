"use client";

import { useSyncExternalStore } from "react";
import { currentPosition, locationGranted } from "@/features/owner-notices/device-location";
import { forecastNow, type Forecast, type WeatherNow } from "@/features/owner-notices/weather";

/**
 * Clima do lugar do aparelho para a Bolha (roupa e falas do balão). Uma busca só para a tela toda (sidebar e
 * Painel leem a mesma), guardada no aparelho por 30 min. Só usa a localização se a permissão já foi dada no
 * onboarding: nunca abre o pedido sozinho. Sem permissão ou sem rede, fica null e a Bolha sai como sempre.
 */
export type Weather = { now: WeatherNow; today: Forecast };

const KEY = "bubbly-weather";
const TTL = 30 * 60_000;

let value: Weather | null = null;
let loading = false;
const listeners = new Set<() => void>();

function set(w: Weather) {
  value = w;
  listeners.forEach((l) => l());
}

function cached(): Weather | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? "null") as { at: number; w: Weather } | null;
    return c && Date.now() - c.at < TTL ? c.w : null;
  } catch {
    return null;
  }
}

async function load() {
  if (loading) return;
  loading = true;
  try {
    const hit = cached();
    if (hit) return set(hit);
    if (!(await locationGranted())) return;
    const { coords } = await currentPosition();
    const w = await forecastNow({ latitude: coords.latitude, longitude: coords.longitude });
    if (!w) return;
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), w }));
    set(w);
  } catch {
    // sem posição ou sem rede: a Bolha fica com o desenho de sempre
  } finally {
    loading = false;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!value || !cached()) void load();
  return () => listeners.delete(onChange);
}

export function useWeather(): Weather | null {
  return useSyncExternalStore(
    subscribe,
    () => value,
    () => null,
  );
}
