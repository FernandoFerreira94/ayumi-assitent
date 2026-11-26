import { describe, expect, it } from "vitest";
import { DEFAULT_RESCHEDULE, rescheduleText } from "@/features/reminders/text";
import { rescheduleNoticeToast } from "@/features/messaging/reschedule-result";

const now = new Date("2026-11-10T12:00:00Z");
const a = { client: "Maria Silva", service: "Escova", startsAt: new Date("2026-11-11T17:30:00Z"), priceCents: 8000 };

describe("texto do aviso de remarcação", () => {
  it("padrão: sem o nome da cliente, com dia, hora e endereço", () => {
    const t = rescheduleText(a, now, { address: "Rua A, 10" });
    expect(t).toBe(
      "Oi! Seu horário de Escova foi remarcado 💜\n📅 amanhã, dia 11/11\n🕒 14:30\n📍 Rua A, 10\n\nQualquer dúvida, é só me chamar!",
    );
    expect(DEFAULT_RESCHEDULE).not.toContain("{nome}");
  });

  it("sem endereço cadastrado, a linha 📍 some", () => {
    expect(rescheduleText(a, now)).not.toContain("📍");
  });

  it("sem link da agenda; texto já salvo com {agenda} perde a linha", () => {
    expect(rescheduleText(a, now)).not.toContain("agenda:");
    const custom = rescheduleText(a, now, { template: "Mudou: {dia} {hora}\n{agenda}\nBeijo" });
    expect(custom).toBe("Mudou: amanhã, dia 11/11 14:30\nBeijo");
  });

  it("texto da dona com {nome}", () => {
    expect(rescheduleText(a, now, { template: "Oi, {nome}! {hora}" })).toBe("Oi, Maria! 14:30");
  });
});

describe("toast do aviso de remarcação", () => {
  it("diz se saiu ou por que não saiu", () => {
    expect(rescheduleNoticeToast("sent", "Maria Silva")).toMatchObject({
      kind: "success",
      title: "Maria recebeu o aviso no WhatsApp",
    });
    expect(rescheduleNoticeToast("offline", "Maria")?.kind).toBe("warning");
    expect(rescheduleNoticeToast("invalid_number", "Maria")?.description).toContain("não tem WhatsApp");
    expect(rescheduleNoticeToast("retry", "Maria")?.kind).toBe("warning");
    expect(rescheduleNoticeToast("opted_out", "Maria")?.kind).toBe("info");
  });
  it("cala quando não há o que dizer", () => {
    for (const r of ["unchanged", "none", "off", "no_whatsapp", null] as const)
      expect(rescheduleNoticeToast(r, "Maria")).toBeNull();
  });
});

describe("cancelamento e remarcação com dinheiro já pago", () => {
  const a = { client: "Bia", service: "Gel", startsAt: new Date("2026-11-11T17:30:00Z") };
  const eve = new Date("2026-11-10T15:00:00Z");
  it("cancelamento usa o texto da dona e avisa o crédito, sem falar de sinal retido", async () => {
    const { cancelText } = await import("@/features/reminders/text");
    expect(cancelText(a, eve)).toMatch(/^Oi! Seu horário de Gel \(amanhã, dia 11\/11, às 14:30\) foi cancelado\./);
    expect(cancelText(a, eve, { template: "Cancelado: {servico} {hora}" })).toBe("Cancelado: Gel 14:30");
    const t = cancelText({ ...a, creditCents: 3000 }, eve);
    expect(t).toMatch(/O valor de R\$\s30,00 que você já tinha pago ficou como crédito para o seu próximo horário 💜$/);
    expect(t).not.toMatch(/retid/i);
  });
  it("remarcação com algo pago avisa que continua valendo", async () => {
    const { rescheduleText } = await import("@/features/reminders/text");
    expect(rescheduleText({ ...a, paidCents: 3000 }, eve)).toContain("O que você já pagou continua valendo para o novo horário 💜");
    expect(rescheduleText(a, eve)).not.toContain("continua valendo");
  });
});
