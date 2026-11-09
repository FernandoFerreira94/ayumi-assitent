import { describe, expect, it } from "vitest";
import { isRaining, weatherLine, weatherMood, type Weather } from "@/features/weather/mood";

const w = (o: Partial<Weather>): Weather => ({ temp: 24, code: 2, isDay: true, rainChance: 0, ...o });

describe("humor do Mimo pelo clima", () => {
  it("chuva agora ou provável ganha de qualquer temperatura", () => {
    expect(weatherMood(w({ code: 61, temp: 34 }))).toBe("rain");
    expect(weatherMood(w({ rainChance: 70, temp: 10 }))).toBe("rain");
    expect(weatherMood(w({ rainChance: 59 }))).toBeNull();
  });
  it("só está chovendo quando o código ou a chuva medida dizem; previsão não conta", () => {
    expect(isRaining(w({ code: 80 }))).toBe(true);
    expect(isRaining(w({ precip: 0.3 }))).toBe(true);
    expect(isRaining(w({ rainChance: 90 }))).toBe(false);
    expect(weatherLine(w({ code: 61 }))).toBe("Tá chovendo aí. Leva o guarda-chuva!");
    expect(weatherLine(w({ rainChance: 90 }))).toBe("Previsão de chuva hoje. Leva o guarda-chuva!");
  });
  it("frio abaixo de 16°C e calor acima de 32°C", () => {
    expect(weatherMood(w({ temp: 15.9 }))).toBe("cold");
    expect(weatherMood(w({ temp: 16 }))).toBeNull();
    expect(weatherMood(w({ temp: 32.5 }))).toBe("hot");
  });
  it("sol só com céu limpo, de dia e quente", () => {
    expect(weatherMood(w({ code: 0, temp: 28 }))).toBe("sun");
    expect(weatherMood(w({ code: 0, temp: 28, isDay: false }))).toBeNull();
    expect(weatherMood(w({ code: 3, temp: 28 }))).toBeNull();
  });
  it("a fala arredonda a temperatura e some sem clima marcante", () => {
    expect(weatherLine(w({ temp: 12.4 }))).toBe("Tá frio lá fora, 12°C. Agasalha bem!");
    expect(weatherLine(w({}))).toBeNull();
  });
});
