import { messagingForInstance } from "@/features/messaging/evolution";
import { handleInbound } from "@/features/messaging/inbound";
import { parseUpsert } from "@/features/messaging/replies";
import { classifyReply } from "@/features/messaging/classify";
import { isLegacyWebhookToken, isValidWebhookToken } from "@/features/messaging/webhook-url";
import { pushFromEnv } from "@/features/push/webpush";

/** Mensagens novas da Evolution (evento MESSAGES_UPSERT). Configurado por instância ao conectar o WhatsApp. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const body = (await req.json().catch(() => null)) as { instance?: unknown } | null;
  const instance = typeof body?.instance === "string" ? body.instance : null;
  // O token precisa ser o da instância que diz ter mandado (um salão não forja mensagem de outro)
  const own = !!instance && isValidWebhookToken(token, instance);
  if (!own && !isLegacyWebhookToken(token)) return new Response(null, { status: 401 });
  if (!own) console.error(JSON.stringify({ level: "warn", msg: "whatsapp_webhook_legacy", instance }));
  const msg = parseUpsert(body);
  // Outros eventos, grupos, mídia: responde 200 para a Evolution não ficar reenviando
  if (!msg) return Response.json({ ok: true, ignored: true });
  try {
    const r = await handleInbound(msg, {
      portFor: (i) => messagingForInstance(i),
      push: pushFromEnv(),
      classify: classifyReply,
    });
    // Sem ids na resposta: só se foi tratada (útil para conferir no log da Evolution)
    return Response.json({ ok: true, handled: r.handled });
  } catch (e) {
    // 500 faz a Evolution tentar de novo; o id da mensagem impede gravar duas vezes
    console.error(JSON.stringify({ level: "error", msg: "whatsapp_webhook_failed", err: String(e) }));
    return Response.json({ ok: false }, { status: 500 });
  }
}
