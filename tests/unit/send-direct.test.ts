import { describe, expect, it } from "vitest";
import { sendDirect } from "@/features/messaging/send";
import { MessagingOfflineError, MessagingTransientError, type MessagingPort } from "@/features/messaging/port";

const port = (impl: MessagingPort["sendText"]): MessagingPort => ({ sendText: impl });

describe("mensagem avulsa para a cliente", () => {
  it("envia para o número da cliente com o texto digitado", async () => {
    const sent: [string, string][] = [];
    const res = await sendDirect(
      port(async (to, text) => {
        sent.push([to, text]);
        return { id: "W1" };
      }),
      "+5511987654321",
      "Oi, Maria!",
    );
    expect(res).toEqual({ ok: true, data: { id: "W1" } });
    expect(sent).toEqual([["+5511987654321", "Oi, Maria!"]]);
  });
  it("sem WhatsApp configurado ou desconectado pede reconectar", async () => {
    expect(await sendDirect(null, "+5511987654321", "Oi")).toMatchObject({ ok: false, code: "WHATSAPP_OFFLINE" });
    const off = port(async () => {
      throw new MessagingOfflineError("401");
    });
    expect(await sendDirect(off, "+5511987654321", "Oi")).toMatchObject({ ok: false, code: "WHATSAPP_OFFLINE" });
  });
  it("falha de rede deixa tentar de novo", async () => {
    const flaky = port(async () => {
      throw new MessagingTransientError("network");
    });
    expect(await sendDirect(flaky, "+5511987654321", "Oi")).toMatchObject({ ok: false, code: "WHATSAPP_UNAVAILABLE" });
  });
});
