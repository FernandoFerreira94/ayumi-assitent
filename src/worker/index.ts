// Processo separado do app (serviço "worker" no Railway): pnpm worker
import { PgBoss } from "pg-boss";
import { messagingFromEnv } from "@/features/messaging/evolution";
import { runReminders } from "@/features/reminders/run";
import { pushFromEnv } from "@/features/push/webpush";
import { runPushPendencias } from "@/features/push/run";
import { log as jlog } from "@/lib/log";

const QUEUE = "send-reminders";
const PUSH_QUEUE = "push-pendencias";
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
    const port = messagingFromEnv();
    if (!port) return log({ level: "warn", msg: "reminders_skipped", reason: "Evolution não configurada" });
    const r = await runReminders(port);
    log({ level: r.failed ? "warn" : "info", msg: "reminders_run", ...r });
  });
  await boss.createQueue(PUSH_QUEUE);
  await boss.schedule(PUSH_QUEUE, "0 12 * * *"); // 09h no horário de Brasília
  await boss.work(PUSH_QUEUE, async () => {
    const port = pushFromEnv();
    if (!port) return log({ level: "warn", msg: "push_skipped", reason: "VAPID não configurado" });
    const r = await runPushPendencias(port);
    log({ level: r.failed ? "warn" : "info", msg: "push_run", ...r });
  });
  log({ level: "info", msg: "worker_started" });

  const stop = async () => {
    await boss.stop();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

main().catch((e) => {
  log({ level: "error", msg: "worker_crashed", err: String(e) });
  process.exit(1);
});
