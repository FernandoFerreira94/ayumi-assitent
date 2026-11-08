/** Agora e hoje no ponto da usuária, como a Open-Meteo devolve (temperatura em °C, código WMO). */
export type Weather = { temp: number; code: number; isDay: boolean; rainChance: number };

export type WeatherMood = "rain" | "cold" | "hot" | "sun";

// Códigos WMO de chuvisco, chuva, pancada e trovoada
const RAIN = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

/** Limites da prancha "Humores do Mimo": chuva ganha de temperatura, sol só com céu limpo de dia. */
export function weatherMood(w: Weather): WeatherMood | null {
  if (RAIN.has(w.code) || w.rainChance >= 60) return "rain";
  if (w.temp < 16) return "cold";
  if (w.temp > 32) return "hot";
  if (w.code <= 1 && w.isDay && w.temp >= 26) return "sun";
  return null;
}

/** Fala do balão para cada clima; sem clima marcante, o Mimo não comenta. */
export function weatherLine(w: Weather): string | null {
  const t = `${Math.round(w.temp)}°C`;
  switch (weatherMood(w)) {
    case "rain":
      return "Previsão de chuva hoje. Leva o guarda-chuva!";
    case "cold":
      return `Tá frio lá fora, ${t}. Agasalha bem!`;
    case "hot":
      return `Calorão de ${t}! Bebe bastante água.`;
    case "sun":
      return `Dia de sol, ${t} lá fora.`;
    default:
      return null;
  }
}
