/**
 * Clima pelo Open-Meteo (gratuito, sem chave). Só serve para escolher o tom da mensagem de folga: qualquer falha
 * vira "não sei" e a mensagem sai sem falar do sol.
 */
const TIMEOUT = 5_000;

export type Coords = { latitude: number; longitude: number };

/** Coordenadas da cidade do salão (no Brasil). */
export async function geocodeCity(city: string, uf: string, f: typeof fetch = fetch): Promise<Coords | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=10&language=pt&countryCode=BR&format=json`;
    const res = await f(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: { latitude: number; longitude: number; admin1?: string; admin1_code?: string }[];
    };
    const list = data.results ?? [];
    const state = UF_NAMES[uf.trim().toUpperCase()];
    const hit = list.find((r) => state && r.admin1 === state) ?? list[0];
    return hit ? { latitude: hit.latitude, longitude: hit.longitude } : null;
  } catch {
    return null;
  }
}

export type Forecast = { code: number; min: number; max: number; rain: number };

/** Códigos WMO de céu limpo ou poucas nuvens. */
const CLEAR = new Set([0, 1, 2]);

export const isSunny = (f: Forecast) => CLEAR.has(f.code) && f.rain < 30;

/** Emoji do céu da previsão (código WMO); à noite o céu limpo vira lua. */
export function weatherEmoji(code: number, night: boolean): string {
  if (code === 0) return night ? "🌙" : "☀️";
  if (code <= 2) return night ? "☁️" : "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "❄️";
  if (code >= 95) return "⛈️";
  return night ? "🌙" : "🌤️";
}

/** Céu pelo código WMO, em palavras do dia a dia. */
export function skyLabel(code: number): string {
  if (code === 0) return "céu limpo";
  if (code <= 2) return "sol entre nuvens";
  if (code === 3) return "nublado";
  if (code === 45 || code === 48) return "neblina";
  if (code >= 51 && code <= 57) return "garoa";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return code >= 65 && code !== 80 ? "chuva forte" : "chuva";
  if (code >= 95) return "tempestade";
  if (code >= 71 && code <= 86) return "frio intenso";
  return "tempo instável";
}

/** "Previsão: nublado, 17° a 24°, 60% de chance de chuva. Leve o guarda-chuva." */
export function weatherLine(f: Forecast): string {
  const parts = [`Previsão: ${skyLabel(f.code)}, ${Math.round(f.min)}° a ${Math.round(f.max)}°`];
  if (f.rain >= 20) parts.push(`${Math.round(f.rain)}% de chance de chuva`);
  const tip =
    f.rain >= 50 || (f.code >= 61 && f.code <= 99)
      ? "Leve o guarda-chuva ☔"
      : f.max <= 18
        ? "Dia frio, vá bem agasalhada 🧣"
        : f.min <= 15
          ? "Começa friozinho, leve um casaco 🧥"
          : f.max >= 32
            ? "Dia quente, beba bastante água 💧"
            : isSunny(f)
              ? "Dia bonito ☀️"
              : "";
  return `${parts.join(", ")}.${tip ? ` ${tip}` : ""}`;
}

/** Previsão de hoje na cidade do salão; null = não deu para saber. */
export async function forecastToday(c: Coords, f: typeof fetch = fetch): Promise<Forecast | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.latitude}&longitude=${c.longitude}&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max&timezone=America%2FSao_Paulo&forecast_days=1`;
    const res = await f(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      daily?: {
        weather_code?: number[];
        temperature_2m_min?: number[];
        temperature_2m_max?: number[];
        precipitation_probability_max?: (number | null)[];
      };
    };
    const d = data.daily;
    const code = d?.weather_code?.[0];
    const min = d?.temperature_2m_min?.[0];
    const max = d?.temperature_2m_max?.[0];
    if (code === undefined || min === undefined || max === undefined) return null;
    return { code, min, max, rain: d?.precipitation_probability_max?.[0] ?? 0 };
  } catch {
    return null;
  }
}

export const UF_NAMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};
