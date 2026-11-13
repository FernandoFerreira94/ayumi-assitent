import { notify } from "@/components/feedback/toast";
import type { SyncResult } from "@/features/google/sync";

/** Avisa quando o agendamento foi salvo mas não chegou ao Google Agenda. */
export function warnSync(sync: SyncResult) {
  if (sync === "auth")
    notify.warning("Salvo, mas o Google pediu para reconectar", "Entre de novo com o Google em Ajustes > Calendários.");
  else if (sync === "failed")
    notify.warning("Salvo, mas não foi para o Google Agenda", "Vamos tentar de novo mais tarde.");
}
