import { describe, expect, it } from "vitest";
import {
  falaAgenda,
  falaProxima,
  falaResumo,
  numberWords,
  parseDia,
  spokenHour,
  spokenTime,
  type AtalhoRow,
} from "@/features/atalhos/core";
import { createLimiter } from "@/features/atalhos/rate";
import { bearerToken, hashApiToken, isApiTokenShape, newApiToken, tokenLast4 } from "@/features/atalhos/token";

const at = (d: string, h: string) => new Date(`2026-11-${d}T${h}:00-03:00`);
const row = (
  d: string,
  s: string,
  e: string,
  status: AtalhoRow["status"],
  clientName = "Ana Souza",
  priceCents = 10000,
): AtalhoRow => ({
  startsAt: at(d, s),
  endsAt: at(d, e),
  status,
  clientName,
  serviceName: "Design de sobrancelha",
  priceCents,
});

describe("chave", () => {
  it("tem prefixo bub_, 47 caracteres e hash estável", () => {
    const t = newApiToken();
    expect(t.startsWith("bub_")).toBe(true);
    expect(isApiTokenShape(t)).toBe(true);
    expect(hashApiToken(t)).toHaveLength(64);
    expect(hashApiToken(t)).toBe(hashApiToken(t));
    expect(tokenLast4(t)).toBe(t.slice(-4));
    expect(newApiToken()).not.toBe(t);
  });
  it("lê só Bearer com chave no formato", () => {
    const t = newApiToken();
    expect(bearerToken(`Bearer ${t}`)).toBe(t);
    expect(bearerToken(`bearer ${t}`)).toBe(t);
    expect(bearerToken(t)).toBeNull();
    expect(bearerToken("Bearer bub_curta")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});

describe("parseDia", () => {
  it("aceita hoje, amanha e vazio; recusa o resto", () => {
    expect(parseDia(null)).toBe("hoje");
    expect(parseDia("amanha")).toBe("amanha");
    expect(parseDia("amanhã")).toBe("amanha");
    expect(parseDia("ontem")).toBeNull();
  });
});

describe("frases da Siri", () => {
  it("hora curta nos dados e hora falada na frase", () => {
    expect(spokenTime(at("18", "09:00"))).toBe("9h");
    expect(spokenTime(at("18", "10:30"))).toBe("10h30");
    expect(spokenHour(at("18", "09:00"))).toBe("às nove");
    expect(spokenHour(at("18", "14:30"))).toBe("às duas e meia da tarde");
    expect(spokenHour(at("18", "13:15"))).toBe("à uma e quinze da tarde");
    expect(spokenHour(at("18", "12:00"))).toBe("ao meio-dia");
    expect(spokenHour(at("18", "19:45"))).toBe("às sete e quarenta e cinco da noite");
    expect(numberWords(2, true)).toBe("duas");
    expect(numberWords(41)).toBe("quarenta e um");
  });

  it("dia vazio", () => {
    expect(falaAgenda("hoje", [], at("18", "08:00"))).toBe("Sua agenda de hoje está livre, nenhuma cliente marcada.");
    expect(falaAgenda("amanha", [])).toBe("Sua agenda de amanhã está livre, nenhuma cliente marcada.");
  });

  it("agenda de hoje em fala corrida, só o que falta, primeiro nome e quem não confirmou", () => {
    const rows = [
      row("18", "08:00", "09:00", "done", "Carla Dias"),
      row("18", "10:30", "11:30", "confirmed", "Bia Lima"),
      row("18", "14:00", "15:00", "pending_confirmation", "Ana Souza"),
    ];
    const f = falaAgenda("hoje", rows, at("18", "10:00"));
    expect(f).toBe(
      "Hoje você tem três clientes e ainda faltam duas. Agora vem Bia às dez e meia, design de sobrancelha, depois Ana às duas da tarde, design de sobrancelha. Só Ana ainda não confirmou.",
    );
    expect(f).not.toContain("Souza");
    expect(f).not.toMatch(/\d/);
  });

  it("amanhã com uma cliente", () => {
    expect(falaAgenda("amanha", [row("19", "09:00", "10:00", "confirmed")])).toBe(
      "Amanhã você tem uma cliente. Primeiro Ana às nove, design de sobrancelha.",
    );
  });

  it("todos já passaram", () => {
    expect(falaAgenda("hoje", [row("18", "08:00", "09:00", "done")], at("18", "12:00"))).toBe(
      "Hoje você teve uma cliente e já acabou tudo. Bom descanso!",
    );
  });

  it("próxima cliente hoje, com quanto falta", () => {
    expect(falaProxima([row("18", "10:30", "11:30", "pending_confirmation", "Bia Lima")], at("18", "09:50"))).toBe(
      "Sua próxima cliente é Bia, daqui a quarenta minutos, às dez e meia, para design de sobrancelha. Ela ainda não confirmou.",
    );
  });

  it("próxima em atendimento agora e em outro dia", () => {
    expect(falaProxima([row("18", "10:00", "11:00", "confirmed")], at("18", "10:20"))).toBe(
      "Agora você está com Ana, design de sobrancelha, e termina lá pelas onze.",
    );
    expect(falaProxima([row("19", "09:00", "10:00", "confirmed")], at("18", "20:00"))).toBe(
      "Sua próxima cliente é Ana, amanhã às nove, para design de sobrancelha.",
    );
    expect(falaProxima([], at("18", "20:00"))).toContain("próximos sete dias");
  });

  it("resumo com previsto, recebido e pendentes; falta não conta", () => {
    const rows = [
      row("18", "08:00", "09:00", "done", "A", 5000),
      row("18", "10:00", "11:00", "pending_confirmation", "Bia", 8050),
      row("18", "12:00", "13:00", "no_show", "C", 9000),
    ];
    expect(falaResumo("hoje", rows)).toBe(
      "Hoje você tem duas clientes, com R$ 130,50 previstos e R$ 50 já recebidos. Só Bia ainda não confirmou.",
    );
    expect(falaResumo("amanha", [row("19", "08:00", "09:00", "confirmed", "A", 5000)])).toBe(
      "Amanhã você tem uma cliente, com R$ 50 previstos.",
    );
  });
});

describe("limite", () => {
  it("bloqueia acima do máximo e libera na janela seguinte", () => {
    const allow = createLimiter(2, 1000);
    expect(allow("k", 0)).toBe(true);
    expect(allow("k", 10)).toBe(true);
    expect(allow("k", 20)).toBe(false);
    expect(allow("outra", 20)).toBe(true);
    expect(allow("k", 1001)).toBe(true);
  });
});
