import { notify } from "@/components/feedback/toast";
import type { SyncResult } from "@/features/google/sync";

/** Avisa quando o agendamento foi salvo mas não chegou ao Google Agenda. */
export function warnSync(sync: SyncResult) {
  if (sync === "auth")
    notify.info("Salvo, mas o Google pediu para reconectar", "Entre de novo com o Google em Ajustes.");
  else if (sync === "failed")
    notify.info("Salvo, mas não foi para o Google Agenda", "Vamos tentar de novo mais tarde.");
}
