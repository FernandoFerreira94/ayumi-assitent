import { describe, expect, it } from "vitest";
import { formatBRL } from "@/lib/dates";
import {
  bestPromotion,
  parsePromotionDraft,
  promotionFacts,
  promotionOffCents,
  promotionStatus,
} from "@/features/wallet/promotion-rules";
import { promoText } from "@/features/wallet/promo-text";

const base = { startsOn: null, endsOn: null, maxClients: 30, paused: false, ended: false };

describe("promoção de desconto: situação", () => {
  it("valendo, agendada, pausada, esgotada e encerrada", () => {
    expect(promotionStatus(base, "2030-12-01", 0)).toBe("running");
    expect(promotionStatus({ ...base, startsOn: "2030-12-02" }, "2030-12-01", 0)).toBe("scheduled");
    expect(promotionStatus({ ...base, paused: true }, "2030-12-01", 3)).toBe("paused");
    expect(promotionStatus(base, "2030-12-01", 30)).toBe("sold_out");
    expect(promotionStatus({ ...base, paused: true }, "2030-12-01", 30)).toBe("sold_out");
    expect(promotionStatus({ ...base, endsOn: "2030-11-30" }, "2030-12-01", 0)).toBe("ended");
    expect(promotionStatus({ ...base, ended: true }, "2030-12-01", 0)).toBe("paused");
    expect(promotionStatus({ ...base, paused: true, endsOn: "2030-11-30" }, "2030-12-01", 0)).toBe("ended");
    expect(promotionStatus({ ...base, maxClients: null }, "2030-12-01", 999)).toBe("running");
  });
});

describe("promoção de desconto: quanto sai", () => {
  const unha = { id: "u", priceCents: 5000 };
  const pe = { id: "p", priceCents: 4000 };
  it("só sobre os serviços da promoção", () => {
    expect(promotionOffCents({ discount: { kind: "pct", value: 20 }, serviceIds: ["u"] }, [unha, pe])).toBe(1000);
    expect(promotionOffCents({ discount: { kind: "pct", value: 20 }, serviceIds: ["u", "p"] }, [unha, pe])).toBe(1800);
    expect(promotionOffCents({ discount: { kind: "brl", value: 9000 }, serviceIds: ["p"] }, [unha, pe])).toBe(4000);
    expect(promotionOffCents({ discount: { kind: "pct", value: 20 }, serviceIds: ["x"] }, [unha])).toBe(0);
  });
  it("com mais de uma, a de maior desconto", () => {
    const a = { id: "a", discount: { kind: "pct" as const, value: 10 }, serviceIds: ["u"] };
    const b = { id: "b", discount: { kind: "brl" as const, value: 800 }, serviceIds: ["u"] };
    expect(bestPromotion([a, b], [unha])).toEqual({ promo: b, offCents: 800 });
    expect(bestPromotion([a], [pe])).toBeNull();
  });
});

describe("promoção de desconto: formulário e texto", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  it("parse", () => {
    expect(
      parsePromotionDraft({
        name: " Natal ",
        discount: { kind: "pct", value: 20 },
        serviceIds: [id],
        maxClients: "30",
      }),
    ).toEqual({
      ok: true,
      draft: {
        name: "Natal",
        discount: { kind: "pct", value: 20 },
        serviceIds: [id],
        startsOn: null,
        endsOn: null,
        maxClients: 30,
      },
    });
    expect(parsePromotionDraft({ discount: null, serviceIds: [id] })).toEqual({ ok: false, field: "discount" });
    expect(parsePromotionDraft({ discount: { kind: "pct", value: 100 }, serviceIds: [id] })).toEqual({
      ok: false,
      field: "discount",
    });
    expect(parsePromotionDraft({ discount: { kind: "pct", value: 20 }, serviceIds: [] })).toEqual({
      ok: false,
      field: "serviceIds",
    });
    expect(parsePromotionDraft({ discount: { kind: "pct", value: 20 }, serviceIds: [id], maxClients: "0" })).toEqual({
      ok: false,
      field: "maxClients",
    });
  });

  it("texto: 'as 30 primeiras', de/por com 1 serviço, sem endereço inventado", () => {
    const facts = promotionFacts({
      name: "Black Friday",
      discount: { kind: "pct", value: 20 },
      services: [{ name: "Esmaltação", priceCents: 4500 }],
      startsOn: null,
      endsOn: "2030-11-30",
      maxClients: 30,
      left: 12,
    });
    expect(promoText(facts, { name: "Estúdio Yumi", address: null, instagram: null }, "status", formatBRL)).toBe(
      [
        "✨ Black Friday · Estúdio Yumi ✨",
        "20% de desconto em Esmaltação",
        "De R$ 45,00 por R$ 36,00 (economize R$ 9,00)",
        "Válido até 30/11. Só para as 30 primeiras clientes! Restam 12 vagas.",
        "Agende o seu horário 💜",
      ].join("\n"),
    );
  });

  it("vários serviços: sem de/por (não inventa preço)", () => {
    const facts = promotionFacts({
      name: null,
      discount: { kind: "brl", value: 1000 },
      services: [
        { name: "Mão", priceCents: 3000 },
        { name: "Pé", priceCents: 4000 },
      ],
      startsOn: null,
      endsOn: null,
      maxClients: null,
      left: null,
    });
    const t = promoText(facts, { name: "Estúdio", address: null, instagram: null }, "status", formatBRL);
    expect(t).toContain("R$ 10,00 de desconto em Mão ou Pé");
    expect(t).not.toContain("De R$");
  });
});

describe("planos: editar e excluir", () => {
  it("lê a edição do pacote (nome, período e limite)", async () => {
    const { parseOfferEdit } = await import("@/features/wallet/rules");
    expect(parseOfferEdit({ name: " Natal ", startsOn: "2030-12-01", endsOn: "2030-12-31", maxClients: "30" })).toEqual(
      {
        ok: true,
        edit: { name: "Natal", startsOn: "2030-12-01", endsOn: "2030-12-31", maxClients: 30 },
      },
    );
    expect(parseOfferEdit({ name: "X", startsOn: "", endsOn: "", maxClients: "" })).toEqual({
      ok: true,
      edit: { name: "X", startsOn: null, endsOn: null, maxClients: null },
    });
    expect(parseOfferEdit({ name: "" })).toEqual({ ok: false, field: "name" });
    expect(parseOfferEdit({ name: "X", startsOn: "2030-12-02", endsOn: "2030-12-01" })).toEqual({
      ok: false,
      field: "endsOn",
    });
    expect(parseOfferEdit({ name: "X", maxClients: "0" })).toEqual({ ok: false, field: "maxClients" });
  });

  it("excluir só com a palavra digitada", async () => {
    const { isDeleteWord } = await import("@/features/wallet/rules");
    expect(isDeleteWord("excluir")).toBe(true);
    expect(isDeleteWord(" EXCLUIR ")).toBe(true);
    expect(isDeleteWord("excluí")).toBe(false);
    expect(isDeleteWord("")).toBe(false);
  });
});
