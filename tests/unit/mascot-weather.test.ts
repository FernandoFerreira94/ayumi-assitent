import { describe, expect, it } from "vitest";
import { forecastNow, nowLine, outfitFor, type WeatherNow } from "@/features/owner-notices/weather";

const now = (code: number, temp: number, isDay = true): WeatherNow => ({ code, temp, isDay });

describe("roupa do clima da Bolha", () => {
  it.each([
    [now(61, 22), "rain"], // chuva
    [now(81, 28), "rain"], // pancada de chuva
    [now(53, 14), "rain"], // garoa ganha do frio: o guarda-chuva é o que importa
    [now(95, 30), "rain"], // tempestade
    [now(3, 14), "cold"],
    [now(73, 2), "cold"], // neve
    [now(0, 31), "hot"],
    [now(0, 31, false), "hot"], // noite quente continua quente
    [now(0, 24), "sun"],
    [now(1, 24), "sun"],
    [now(0, 24, false), undefined], // noite: sem óculos de sol
    [now(3, 24), undefined], // nublado e ameno: como sempre
  ])("%o → %s", (n, outfit) => {
    expect(outfitFor(n)).toBe(outfit);
  });
});

describe("fala do clima de agora", () => {
  it("diz o céu e a temperatura", () => {
    expect(nowLine(now(61, 19.4))).toBe("Agora está com chuva e 19° aí 🌧️");
    expect(nowLine(now(0, 25, false))).toBe("Agora está com céu limpo e 25° aí 🌙");
  });
});

describe("previsão de agora e do dia (Open-Meteo)", () => {
  const ok = (body: unknown) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

  it("lê o tempo de agora e o resumo do dia", async () => {
    const f = ok({
      current: { weather_code: 63, temperature_2m: 18.6, is_day: 1 },
      daily: {
        weather_code: [63],
        temperature_2m_min: [16],
        temperature_2m_max: [21],
        precipitation_probability_max: [90],
      },
    });
    expect(await forecastNow({ latitude: -23.5, longitude: -46.6 }, f)).toEqual({
      now: { code: 63, temp: 18.6, isDay: true },
      today: { code: 63, min: 16, max: 21, rain: 90 },
    });
  });

  it("falha vira null", async () => {
    expect(await forecastNow({ latitude: 0, longitude: 0 }, ok({}))).toBeNull();
    const boom = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await forecastNow({ latitude: 0, longitude: 0 }, boom)).toBeNull();
  });
});
