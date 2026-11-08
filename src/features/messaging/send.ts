import { fail, ok, type ActionResult } from "@/lib/errors";
import { MessagingOfflineError, type MessagingPort } from "./port";

/** Texto que a dona digita para uma cliente; limite folgado para não virar disparo de textão. */
export const MAX_MESSAGE = 1000;

/** Envia uma mensagem avulsa e traduz a falha da porta para o erro que a tela mostra. */
export async function sendDirect(
  port: MessagingPort | null,
  phoneE164: string,
  text: string,
): Promise<ActionResult<{ id: string | null }>> {
  if (!port) return fail("WHATSAPP_OFFLINE");
  try {
    return ok(await port.sendText(phoneE164, text));
  } catch (e) {
    // Desconectado pede reconectar; o resto (rede, 5xx) vale tentar de novo
    return fail(e instanceof MessagingOfflineError ? "WHATSAPP_OFFLINE" : "WHATSAPP_UNAVAILABLE");
  }
}
