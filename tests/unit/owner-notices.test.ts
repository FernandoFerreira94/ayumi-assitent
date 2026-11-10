import { describe, expect, it } from "vitest";
import { easter, holidayOn, holidaysOf } from "@/features/owner-notices/holidays";
import { dueNotices, type DayInput } from "@/features/owner-notices/plan";
import {
  clientGreetingFallback,
  DAY_END,
  DAY_END_LATE,
  DAY_OFF,
  DAY_OFF_SUN,
  dayEndText,
  EMPTY_DAY,
  morningText,
  namesList,
  pickVariant,
  weekFallback,
} from "@/features/owner-notices/texts";
import { isSunny, skyLabel, weatherLine } from "@/features/owner-notices/weather";
import { ufFromCode } from "@/features/owner-notices/device-location";

const h = (hh: number, mm = 0) => hh * 60 + mm;
const work: DayInput = {
  nowMin: h(7),
  weekday: 2,
  hours: { opens: h(9), closes: h(18) },
  appts: [
    { start: h(10), end: h(11) },
    { start: h(14), end: h(15) },
  ],
  fullDayBlock: false,
  greetTomorrow: false,
};
const kinds = (d: DayInput) => dueNotices(d).map((x) => x.kind);

describe("quando cada aviso sai", () => {
  it("resumo da manhã 2 horas antes da primeira cliente", () => {
    expect(kinds({ ...work, nowMin: h(7, 55) })).toEqual([]);
    expect(kinds({ ...work, nowMin: h(8) })).toEqual(["morning"]);
    expect(kinds({ ...work, nowMin: h(10) })).toEqual([]);
  });
  it("dia de trabalho sem clientes avisa perto da abertura", () => {
    expect(kinds({ ...work, appts: [], nowMin: h(8) })).toEqual(["morning"]);
    expect(kinds({ ...work, appts: [], nowMin: h(6, 55) })).toEqual([]);
  });
  it("fim do expediente no fechamento ou depois da última cliente", () => {
    expect(kinds({ ...work, nowMin: h(18) })).toEqual(["day_end"]);
    const late = { ...work, appts: [...work.appts, { start: h(19), end: h(20, 30) }] };
    expect(kinds({ ...late, nowMin: h(18) })).toEqual([]);
    expect(kinds({ ...late, nowMin: h(20, 30) })).toEqual(["day_end"]);
    expect(kinds({ ...late, nowMin: h(23, 35) })).toEqual([]);
  });
  it("folga às 9h (sem expediente ou bloqueio do dia inteiro)", () => {
    expect(kinds({ ...work, hours: null, appts: [], nowMin: h(9) })).toEqual(["day_off"]);
    expect(kinds({ ...work, appts: [], fullDayBlock: true, nowMin: h(9, 30) })).toEqual(["day_off"]);
  });
  it("domingo à noite manda o roteiro da semana", () => {
    expect(dueNotices({ ...work, weekday: 0, hours: null, appts: [], nowMin: h(19) })).toContainEqual({
      kind: "week",
      tomorrow: true,
    });
  });
  it("véspera de data comemorativa pergunta às 10h", () => {
    expect(kinds({ ...work, greetTomorrow: true, nowMin: h(10, 5) })).toContain("holiday");
  });
});

describe("feriados", () => {
  it("datas móveis pela Páscoa", () => {
    expect(easter(2026)).toBe("2026-04-05");
    expect(easter(2027)).toBe("2027-03-28");
    const y = holidaysOf(2026);
    expect(y.find((x) => x.name === "Sexta-feira Santa")?.date).toBe("2026-04-03");
    expect(y.find((x) => x.name === "Carnaval")?.date).toBe("2026-02-16");
    expect(y.find((x) => x.name === "Dia das Mães")?.date).toBe("2026-05-10");
    expect(y.find((x) => x.name === "Dia dos Pais")?.date).toBe("2026-08-09");
  });
  it("estaduais pela UF e municipais pela cidade", () => {
    expect(holidayOn("2026-07-09", "SP")?.scope).toBe("estadual");
    expect(holidayOn("2026-07-09", "RJ")).toBeNull();
    expect(holidayOn("2026-01-25", "SP", "São Paulo")?.name).toBe("Aniversário de São Paulo");
    expect(holidayOn("2026-01-25", "SP", "Campinas")).toBeNull();
  });
  it("Natal é data para mandar carinho", () => {
    expect(holidayOn("2026-12-25")).toMatchObject({ greet: true, holiday: true });
  });
});

describe("textos", () => {
  it("não repete as últimas frases", () => {
    for (let i = 0; i < 20; i++) expect([0, 1, 2]).not.toContain(pickVariant(6, [0, 1, 2]));
    expect(pickVariant(2, [0, 1], () => 0)).toBe(1);
  });
  it("resumo da manhã com clientes, confirmadas, pendentes e pedidos em aberto", () => {
    const t = morningText(0, "Bom dia, Yumi", {
      names: ["Ana Souza", "Bia", "Carla", "Duda", "Eva", "Fê"],
      firstTime: "09:00",
      confirmed: 3,
      pending: 1,
      reschedule: 1,
      cancel: 1,
    });
    expect(t.title).toBe("Bom dia, Yumi! ☀️");
    expect(t.body).toContain("são 6 clientes: Ana, Bia, Carla, Duda e mais 2");
    expect(t.body).toContain("A primeira chega às 09:00");
    expect(t.body).toContain("3 confirmadas e 1 pendente");
    expect(t.body).toContain("1 pediu para remarcar");
    expect(t.body).toContain("1 pediu para cancelar e ainda falta cancelar");
  });
  it("dia sem nada marcado", () => {
    expect(EMPTY_DAY).toContain(morningText(0, "Bom dia", null).body);
  });
  it("fim do expediente: depois das 19h é 'trabalhamos muito'", () => {
    expect(dayEndText(0, 5, true).title).toContain("trabalhamos muito");
    expect(dayEndText(0, 1, false).body).toContain("1 cliente atendida");
  });
  it("nenhum texto fala de dinheiro", () => {
    const all = [
      ...DAY_OFF,
      ...DAY_OFF_SUN,
      ...EMPTY_DAY,
      ...DAY_END,
      ...DAY_END_LATE,
      clientGreetingFallback("Natal", "X"),
    ];
    for (const t of all) expect(t).not.toMatch(/R\$|reais|faturamento|ganho/i);
  });
  it("nomes e roteiro sem IA", () => {
    expect(namesList(["Ana"])).toBe("Ana");
    expect(namesList(["Ana", "Bia"])).toBe("Ana e Bia");
    const w = weekFallback([
      { date: "2026-11-16", label: "Seg 16/11", off: false, count: 2, holiday: null },
      { date: "2026-11-20", label: "Sex 20/11", off: true, count: 0, holiday: "Dia da Consciência Negra" },
    ]);
    expect(w).toContain("Seg 16/11: 2 clientes");
    expect(w).toContain("Sex 20/11: folga · Dia da Consciência Negra");
  });
  it("mensagem pronta para a cliente assina com o salão", () => {
    expect(clientGreetingFallback("Natal", "Studio Yumi")).toContain("Studio Yumi");
  });
});

describe("previsão do tempo", () => {
  it("resume céu, temperatura e chuva", () => {
    expect(weatherLine({ code: 61, min: 17, max: 22, rain: 80 })).toBe(
      "Previsão: chuva, 17° a 22°, 80% de chance de chuva. Leve o guarda-chuva ☔",
    );
    expect(weatherLine({ code: 0, min: 20, max: 28, rain: 0 })).toBe("Previsão: céu limpo, 20° a 28°. Dia bonito ☀️");
    expect(weatherLine({ code: 3, min: 10, max: 16, rain: 10 })).toContain("frio");
  });
  it("sol = céu limpo e pouca chance de chuva", () => {
    expect(isSunny({ code: 1, min: 20, max: 30, rain: 10 })).toBe(true);
    expect(isSunny({ code: 1, min: 20, max: 30, rain: 60 })).toBe(false);
    expect(skyLabel(3)).toBe("nublado");
  });
});

describe("localização do aparelho", () => {
  it("UF a partir do código da BigDataCloud", () => {
    expect(ufFromCode("BR-SP")).toBe("SP");
    expect(ufFromCode("US-CA")).toBeNull();
    expect(ufFromCode(undefined)).toBeNull();
  });
});
