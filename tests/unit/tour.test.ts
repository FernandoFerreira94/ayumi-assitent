import { describe, expect, it } from "vitest";
import { TOUR_STEPS, unionBox } from "@/features/tour/steps";

describe("unionBox", () => {
  it("cobre todos os retângulos com folga", () => {
    const b = unionBox(
      [
        { top: 100, left: 20, width: 48, height: 48 },
        { top: 40, left: 120, width: 48, height: 48 },
      ],
      8,
    );
    expect(b).toEqual({ top: 32, left: 12, width: 164, height: 124 });
  });

  it("ignora o que não está na tela e devolve null sem nada visível", () => {
    expect(unionBox([{ top: 0, left: 0, width: 0, height: 0 }])).toBeNull();
    expect(unionBox([])).toBeNull();
  });
});

describe("TOUR_STEPS", () => {
  it("tem 4 passos: Oi, WhatsApp, Mensagens e fim (o resto virou a entrada de primeiro acesso)", () => {
    expect(TOUR_STEPS.map((s) => s.title)).toEqual([
      "Oi, eu sou o Bubbly!",
      "Conecte o WhatsApp",
      "Edite suas mensagens",
      "Agora é com você!",
    ]);
    expect(TOUR_STEPS.map((s) => s.target)).toEqual([undefined, "#ajuste-whatsapp", "#ajuste-mensagens", undefined]);
  });

  it("começa e termina sem destaque, e todo passo de toque tem alvo", () => {
    expect(TOUR_STEPS[0].target).toBeUndefined();
    expect(TOUR_STEPS.at(-1)!.target).toBeUndefined();
    for (const s of TOUR_STEPS.filter((s) => s.advance === "tap")) expect(s.target).toBeTruthy();
  });
});
