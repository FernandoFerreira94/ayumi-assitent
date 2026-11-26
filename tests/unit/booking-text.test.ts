import { describe, expect, it } from "vitest";
import { bookingText } from "@/features/messaging/booking";

const a = { client: "Maria Silva", service: "Gel", startsAt: new Date("2026-11-11T17:30:00Z"), priceCents: 12050 }; // 14:30 BRT, quarta
const eve = new Date("2026-11-10T15:00:00Z");

describe("mensagem ao agendar", () => {
  it("diz agendado (não confirmado: quem confirma é a cliente), o dia e o horário, sem valor", () => {
    expect(bookingText(a, eve)).toBe(
      "Oi! Seu horário de Gel está agendado 💜\n📅 amanhã, dia 11/11\n🕒 14:30\n\nTe espero com carinho!",
    );
    expect(bookingText(a, eve)).not.toMatch(/R\$/);
  });
  it("o valor entra só quando a dona põe {valor} no texto", () => {
    const t = bookingText(a, eve, { template: "Oi, {nome}! {servico} {dia} às {hora}\n💰 {valor}" });
    expect(t).toMatch(/^Oi, Maria! Gel amanhã, dia 11\/11 às 14:30\n💰 R\$\s120,50$/);
  });
  it("usa o dia da semana quando é mais longe", () => {
    expect(bookingText(a, new Date("2026-11-05T15:00:00Z"))).toContain("quarta-feira, dia 11/11");
  });
  it("texto padrão sem o nome; com {nome} chama pelo nome do contato quando a dona escolhe", () => {
    expect(bookingText(a, eve)).not.toContain("Maria");
    expect(
      bookingText({ ...a, client: "Maria  Zona Norte" }, eve, { fullName: true, template: "Oi, {nome}!" }),
    ).toMatch(/^Oi, Maria Zona Norte!/);
  });
  it("{endereco} e {mapa} trazem o endereço do estúdio e o link do mapa", () => {
    const address = "Rua A, 430 - Centro, São José dos Campos - SP, 12245-000";
    const t = bookingText(a, eve, { address, template: "Te espero!\n📍 {endereco}\n🗺️ {mapa}" });
    expect(t).toContain(`📍 ${address}`);
    expect(t).toContain("🗺️ https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%20430");
  });
  it("texto padrão já traz o endereço e o mapa quando o estúdio tem endereço", () => {
    const address = "Rua A, 430 - Centro, São José dos Campos - SP, 12245-000";
    expect(bookingText(a, eve, { address })).toBe(
      `Oi! Seu horário de Gel está agendado 💜\n📅 amanhã, dia 11/11\n🕒 14:30\n📍 ${address}\n🗺️ https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}\n\nTe espero com carinho!`,
    );
  });
  it("sem endereço cadastrado, a linha do {endereco}/{mapa} some inteira", () => {
    const t = bookingText(a, eve, { template: "Te espero!\n📍 {endereco}\n🗺️ {mapa}\nBeijos" });
    expect(t).toBe("Te espero!\nBeijos");
    expect(bookingText(a, eve, { template: "Fica em {endereco}, perto do mercado" })).toBe(
      "Fica em , perto do mercado",
    );
  });
  it("sinal pedido vai com valor e Pix no fim, mesmo com texto editado", () => {
    const t = bookingText({ ...a, deposit: { cents: 3000, pixKey: "salao@pix.com" } }, eve, {
      template: "Oi, {nome}!",
    });
    expect(t).toMatch(/^Oi, Maria!\n\nPara confirmar, falta só o sinal de R\$\s30,00\.\nPix: salao@pix\.com\n/);
    expect(t).toMatch(/comprovante por aqui 😊$/);
  });
  it("sem chave Pix, pede o sinal sem a linha do Pix", () => {
    const t = bookingText({ ...a, deposit: { cents: 3000, pixKey: null } }, eve);
    expect(t).toContain("falta só o sinal de");
    expect(t).not.toContain("Pix:");
  });
  it("com sinal pendente, o texto padrão diz Reservei e não diz agendado nem confirmado", () => {
    const t = bookingText({ ...a, deposit: { cents: 3000, pixKey: "x" } }, eve);
    expect(t.startsWith("Oi! Reservei seu horário de Gel 💜")).toBe(true);
    expect(t).not.toMatch(/agendado|confirmado|Te espero/);
    expect(t).toMatch(/Pode me mandar o comprovante por aqui/);
  });
  it("pago ao agendar ganha a linha do recibo; sem sinal pendente", () => {
    expect(bookingText({ ...a, paid: { cents: 3000, full: false } }, eve)).toMatch(/✅ Sinal de R\$\s30,00 recebido\.$/);
    expect(bookingText({ ...a, paid: { cents: 12050, full: true } }, eve)).toMatch(/✅ Pagamento recebido\.$/);
  });
});

describe("sinal nos avisos e sinal recebido", () => {
  const start = a.startsAt;
  it("1º e 2º aviso com sinal pendente lembram o valor e o Pix, sem 1/2/3", async () => {
    const { reminderText, secondReminderText } = await import("@/features/reminders/text");
    const dep = { ...a, deposit: { cents: 3000, pixKey: "salao@pix.com" } };
    for (const t of [reminderText(dep, eve), secondReminderText(dep, eve)]) {
      expect(t).toMatch(/Lembrando que falta o sinal de R\$\s30,00 para confirmar\.\nPix: salao@pix\.com$/);
      expect(t).not.toContain("Responda com o número");
      expect(t).not.toContain("Pode me confirmar");
    }
  });
  it("sinal recebido confirma com o valor e o horário", async () => {
    const { depositReceivedText } = await import("@/features/reminders/text");
    expect(depositReceivedText({ ...a, startsAt: start, receivedCents: 3000 }, eve)).toMatch(
      /^Recebi seu sinal de R\$\s30,00 💜\nSeu horário de Gel amanhã às 14:30 está confirmado\. Te espero com carinho!$/,
    );
  });
});
