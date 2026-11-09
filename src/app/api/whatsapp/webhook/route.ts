import { messagingForInstance } from "@/features/messaging/evolution";
import { handleInbound } from "@/features/messaging/inbound";
import { parseUpsert } from "@/features/messaging/replies";
import { isValidWebhookToken } from "@/features/messaging/webhook-url";
import { pushFromEnv } from "@/features/push/webpush";

/** Mensagens novas da Evolution (evento MESSAGES_UPSERT). Configurado por instância ao conectar o WhatsApp. */
export async function POST(req: Request) {
  if (!isValidWebhookToken(new URL(req.url).searchParams.get("token"))) return new Response(null, { status: 401 });
  const msg = parseUpsert(await req.json().catch(() => null));
  // Outros eventos, grupos, mídia: responde 200 para a Evolution não ficar reenviando
  if (!msg) return Response.json({ ok: true, ignored: true });
  try {
    const r = await handleInbound(msg, {
      portFor: (i) => messagingForInstance(i),
      push: pushFromEnv(),
    });
    // Sem ids na resposta: só se foi tratada (útil para conferir no log da Evolution)
    return Response.json({ ok: true, handled: r.handled });
  } catch (e) {
    // 500 faz a Evolution tentar de novo; o id da mensagem impede gravar duas vezes
    console.error(JSON.stringify({ level: "error", msg: "whatsapp_webhook_failed", err: String(e) }));
    return Response.json({ ok: false }, { status: 500 });
  }
}
