import { cache } from "react";
import { count, eq, isNull } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { apiTokens, tenants } from "@/db/schema";
import { getHours } from "@/features/hours/core";
import { getReminderSettings } from "@/features/reminders/core";
import { shellStatus } from "@/features/shell/status";
import { unreadSupportReplies } from "@/features/support/core";
import { PushStatusText } from "./PushStatusText";
import { hoursSummary, type SectionKey } from "./sections";

export type SettingsLine = { section: SectionKey; status: React.ReactNode; todo?: string };
export type SettingsGroupData = { title: string; lines: SettingsLine[] };

/**
 * Resumo de cada seção de Ajustes ("Conectado", "Seg a Sex"...), em grupos.
 * Usado pela lista de `/ajustes` e pela coluna lateral das seções no desktop; `cache` evita consultar duas vezes.
 */
export const loadSettingsSummary = cache(async (tenantId: string): Promise<SettingsGroupData[]> => {
  const [{ whatsapp, google }, { week, reminders, replies, siri }, [salon]] = await Promise.all([
    shellStatus(tenantId),
    withTenant(tenantId, async (tx) => ({
      week: await getHours(tx),
      reminders: await getReminderSettings(tx),
      replies: await unreadSupportReplies(tx),
      siri: (await tx.select({ n: count() }).from(apiTokens).where(isNull(apiTokens.revokedAt)))[0]!.n > 0,
    })),
    getDb()
      .select({ calendarOn: tenants.calendarTokenHash, icloudOn: tenants.icloudCalendarUrl })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
  ]);
  const iphone = !!salon?.calendarOn || !!salon?.icloudOn;
  const calendars = [google ? "Google conectado" : null, iphone ? "iPhone ligado" : null].filter(Boolean);
  const avisos = [
    reminders.first ? `1º aviso ${reminders.hours}h antes` : null,
    reminders.secondHours ? `2º aviso ${reminders.secondHours}h antes` : null,
  ].filter(Boolean);

  return [
    {
      title: "Conexões",
      lines: [
        {
          section: "whatsapp",
          status:
            whatsapp === "open" ? "Conectado" : whatsapp === "unavailable" ? "Sem resposta agora" : "Desconectado",
          todo: whatsapp === "other" ? "Conectar" : undefined,
        },
        {
          section: "calendarios",
          status: calendars.length ? calendars.join(" · ") : "Google e iPhone",
          todo: calendars.length ? undefined : "Configurar",
        },
        { section: "notificacoes", status: <PushStatusText /> },
        { section: "siri", status: siri ? "Ligada" : "Pergunte sua agenda para a Siri" },
      ],
    },
    {
      title: "Clientes e agenda",
      lines: [
        { section: "mensagens", status: avisos.length ? avisos.join(" · ") : "Avisos desligados" },
        { section: "expediente", status: hoursSummary(week) },
      ],
    },
    {
      title: "Ajuda",
      lines: [
        {
          section: "suporte",
          status: replies ? "O suporte respondeu" : "Fale com a gente e dúvidas comuns",
          todo: replies ? (replies === 1 ? "1 nova" : `${replies} novas`) : undefined,
        },
      ],
    },
  ];
});
