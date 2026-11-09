import "server-only";
import type { WhatsAppAdmin } from "@/features/messaging/evolution-admin";
import { webhookUrl } from "@/features/messaging/webhook-url";

/**
 * Garante que a instância manda as mensagens novas para o app. Idempotente na Evolution, então
 * pode rodar a cada conexão; falhar não atrapalha conectar (só as respostas não chegam ainda).
 */
export async function ensureWebhook(admin: WhatsAppAdmin, instance: string): Promise<void> {
  const url = webhookUrl();
  if (!url) {
    console.error(
      JSON.stringify({ level: "warn", msg: "whatsapp_webhook_skipped", reason: "sem BETTER_AUTH_URL ou segredo" }),
    );
    return;
  }
  try {
    await admin.setWebhook(instance, url);
  } catch (e) {
    console.error(
      JSON.stringify({
        level: "warn",
        msg: "whatsapp_webhook_failed",
        err: e instanceof Error ? e.message : String(e),
      }),
    );
  }
}
