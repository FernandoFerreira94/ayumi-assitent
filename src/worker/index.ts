// Processo separado do app (serviço "worker" no Railway): pnpm worker
import { PgBoss } from "pg-boss";
import { messagingForInstance } from "@/features/messaging/evolution";
import { runReminders } from "@/features/reminders/run";
import { pushFromEnv } from "@/features/push/webpush";
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
    if (!process.env.EVOLUTION_URL || !process.env.EVOLUTION_API_KEY)
      return log({ level: "warn", msg: "reminders_skipped", reason: "Evolution não configurada" });
    // O aviso de "não respondeu" vai junto: depende do horário de cada lembrete, não de uma hora fixa
    const r = await runReminders(
      (i) => messagingForInstance(i),
      new Date(),
      process.env.EVOLUTION_INSTANCE,
      pushFromEnv(),
    );
    log({ level: r.failed ? "warn" : "info", msg: "reminders_run", ...r });
  });
  // O resumo diário de pendências saiu: a dona só quer saber de confirmou, cancelar, remarcar e não respondeu
  await boss.unschedule(PUSH_QUEUE).catch(() => undefined);
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
