// Processo separado do app (serviço "worker" no Railway): pnpm worker
import { PgBoss } from "pg-boss";
import { messagingForInstance } from "@/features/messaging/evolution";
import { runReminders } from "@/features/reminders/run";
import { pushFromEnv } from "@/features/push/webpush";
import { runOwnerNotices } from "@/features/owner-notices/run";
import { log as jlog } from "@/lib/log";
import { adminFromEnv } from "@/features/messaging/evolution-admin";
import { ensureWebhook } from "@/features/whatsapp/webhook";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

const QUEUE = "send-reminders";
const PUSH_QUEUE = "push-pendencias";
const NOTICES_QUEUE = "owner-notices";
const log = ({
  level,
  msg,
  ...rest
}: {
  level: "debug" | "info" | "warn" | "error";
  msg: string;
  [k: string]: unknown;
}) => jlog(level, msg, rest);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  const boss = new PgBoss(url);
  boss.on("error", (err) => log({ level: "error", msg: "pgboss", err: String(err) }));
  await boss.start();
  await boss.createQueue(QUEUE);
  await boss.schedule(QUEUE, "*/5 * * * *"); // a cada 5 minutos
  await boss.work(QUEUE, async () => {
    if (!process.env.EVOLUTION_URL || !process.env.EVOLUTION_API_KEY)
      return log({ level: "warn", msg: "reminders_skipped", reason: "Evolution não configurada" });
    // O aviso de "não respondeu" vai junto: depende do horário de cada lembrete, não de uma hora fixa
    const r = await runReminders(
      (i) => messagingForInstance(i),
      new Date(),
      pushFromEnv(),
    );
    log({ level: r.failed ? "warn" : "info", msg: "reminders_run", ...r });
  });
  // Avisos do dia no celular da dona: folga, resumo da manhã, fim do expediente, semana e datas comemorativas
  await boss.createQueue(NOTICES_QUEUE);
  await boss.schedule(NOTICES_QUEUE, "*/5 * * * *");
  await boss.work(NOTICES_QUEUE, async () => {
    const push = pushFromEnv();
    if (!push) return log({ level: "warn", msg: "owner_notices_skipped", reason: "VAPID não configurado" });
    const r = await runOwnerNotices(push);
    if (r.kinds.length || r.failed) log({ level: r.failed ? "warn" : "info", msg: "owner_notices_run", ...r });
  });
  // O resumo diário de pendências saiu: a dona só quer saber de confirmou, cancelar, remarcar e não respondeu
  await boss.unschedule(PUSH_QUEUE).catch(() => undefined);
  log({ level: "info", msg: "worker_started" });
  // Cada instância passa a chamar o webhook com o próprio token (migração do token único; idempotente)
  repointWebhooks().catch((e) => log({ level: "warn", msg: "webhook_repoint_failed", err: String(e) }));

  const stop = async () => {
    await boss.stop();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

async function repointWebhooks() {
  const admin = adminFromEnv();
  if (!admin) return;
  const rows = await getDb()
    .select({ instance: tenants.whatsappInstance })
    .from(tenants)
    .where(isNotNull(tenants.whatsappInstance));
  for (const r of rows) if (r.instance) await ensureWebhook(admin, r.instance);
  log({ level: "info", msg: "webhook_repointed", count: rows.length });
}

main().catch((e) => {
  log({ level: "error", msg: "worker_crashed", err: String(e) });
  process.exit(1);
});
