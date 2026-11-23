import { describe, expect, it } from "vitest";
import { formatBRL } from "@/lib/dates";
import { capText, packageFacts, periodText, promoText, type SalonInfo } from "@/features/wallet/promo-text";
import { autoPackageName, offPct, packagePrice, parsePackageDraft } from "@/features/wallet/rules";

const salon: SalonInfo = { name: "Estúdio Yumi", address: "Rua das Flores, 10", instagram: "@yumi.nails" };
const bare: SalonInfo = { name: "Estúdio Yumi", address: null, instagram: null };
const facts = (over: Partial<Parameters<typeof packageFacts>[0]> = {}) =>
  packageFacts({
    name: "Natal",
    kind: "sessions",
    sessionsPaid: null,
    sessionsTotal: 4,
    serviceNames: ["Esmaltação", "Pé"],
    priceCents: 12000,
    unitCents: 4000,
    validDays: 90,
    startsOn: "2030-12-01",
    endsOn: "2030-12-31",
    maxClients: 30,
    left: 18,
    ...over,
  });

describe("texto para divulgar", () => {
  it("status: curto, com nome, preço de/por, período, vagas e endereço", () => {
    expect(promoText(facts(), salon, "status", formatBRL)).toBe(
      [
        "✨ Natal · Estúdio Yumi ✨",
        "Pacote com 4 sessões de Esmaltação ou Pé",
        "De R$ 160,00 por R$ 120,00 (economize R$ 40,00)",
        "Válido de 01/12 a 31/12. Só para as 30 primeiras clientes! Restam 18 vagas.",
        "📍 Rua das Flores, 10",
        "Garanta o seu 💜",
      ].join("\n"),
    );
  });

  it("mensagem: saudação, validade do pacote, endereço e Instagram, chamada", () => {
    const t = promoText(facts(), salon, "message", formatBRL);
    expect(t.startsWith("Oi! Tudo bem? 💜\n\n✨ Natal · Estúdio Yumi ✨")).toBe(true);
    expect(t).toContain("O pacote vale 90 dias depois da compra.");
    expect(t).toContain("📸 @yumi.nails");
    expect(t.endsWith("Garanta o seu: é só me responder aqui.")).toBe(true);
    expect(t).not.toMatch(/\n\n\n/);
  });

  it("não inventa dado: sem endereço, sem período, sem limite e sem nome", () => {
    const t = promoText(
      facts({ name: "x", autoName: true, startsOn: null, endsOn: null, maxClients: null, left: null }),
      bare,
      "status",
      formatBRL,
    );
    expect(t).toBe(
      [
        "✨ Promoção · Estúdio Yumi ✨",
        "Pacote com 4 sessões de Esmaltação ou Pé",
        "De R$ 160,00 por R$ 120,00 (economize R$ 40,00)",
        "Garanta o seu 💜",
      ].join("\n"),
    );
    expect(t).not.toContain("📍");
    expect(t).not.toContain("Válido");
  });

  it("sem desconto real não mostra 'De… por…'", () => {
    const t = promoText(facts({ priceCents: 16000 }), bare, "status", formatBRL);
    expect(t).toContain("Por R$ 160,00");
    expect(t).not.toContain("economize");
  });

  it("Pague X, leve Y", () => {
    const f = facts({ kind: "pay_x", sessionsPaid: 3, priceCents: 12000 });
    expect(f.offer).toBe("Pague 3 e leve 4 sessões de Esmaltação ou Pé");
  });

  it("período e vagas", () => {
    expect(periodText("2030-12-01", null)).toBe("Válido a partir de 01/12");
    expect(periodText(null, "2030-12-31")).toBe("Válido até 31/12");
    expect(periodText(null, null)).toBe("");
    expect(capText(30, null)).toBe("Só para as 30 primeiras clientes!");
    expect(capText(30, 30)).toBe("Só para as 30 primeiras clientes!");
    expect(capText(30, 1)).toBe("Só para as 30 primeiras clientes! Resta 1 vaga.");
    expect(capText(30, 0)).toBe("Vagas esgotadas.");
    expect(capText(1, null)).toBe("Só para a primeira cliente!");
    expect(capText(null, 3)).toBe("");
  });
});

describe("pacote com desconto em % ou R$", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const base = { kind: "sessions", name: "Natal", serviceIds: [id], sessionsTotal: "4" };

  it("o preço sai do valor cheio (sessões × serviço) menos o desconto", () => {
    const pct = { kind: "sessions" as const, sessionsPaid: null, sessionsTotal: 4, priceCents: 0 };
    expect(packagePrice({ ...pct, discount: { kind: "pct", value: 20 } }, 5000)).toBe(16000);
    expect(packagePrice({ ...pct, discount: { kind: "brl", value: 3000 } }, 5000)).toBe(17000);
    expect(packagePrice({ ...pct, discount: { kind: "brl", value: 999999 } }, 5000)).toBe(0);
    expect(packagePrice({ ...pct, priceCents: 15000 }, 5000)).toBe(15000);
  });

  it("parse: aceita desconto no lugar do preço; recusa 0% e 100%", () => {
    expect(parsePackageDraft({ ...base, discount: { kind: "pct", value: 20 } })).toMatchObject({
      ok: true,
      draft: { discount: { kind: "pct", value: 20 }, priceCents: 0 },
    });
    expect(parsePackageDraft({ ...base, discount: { kind: "pct", value: 100 } })).toEqual({
      ok: false,
      field: "priceCents",
    });
    expect(parsePackageDraft({ ...base, discount: { kind: "pct", value: 0 } })).toEqual({
      ok: false,
      field: "priceCents",
    });
  });

  it("% de desconto e nome automático", () => {
    expect(offPct(16000, 12000)).toBe(25);
    expect(offPct(16000, 16000)).toBe(0);
    expect(offPct(0, 0)).toBe(0);
    expect(autoPackageName({ kind: "pay_x", sessionsPaid: 3, sessionsTotal: 4 }, ["Pé", "Mão"])).toBe(
      "Pague 3 leve 4 Pé ou Mão",
    );
  });
});
