import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb, withTenant } from "@/db/client";
import { icloudCalendars, tenants } from "@/db/schema";
import { getHours } from "@/features/hours/core";
import { getReminderSettings } from "@/features/reminders/core";
import { shellStatus } from "@/features/shell/status";
import { unreadSupportReplies } from "@/features/support/core";
import { getWalletSettings } from "@/features/wallet/core";
import { type Badge, calendarsLine, whatsappLine } from "./connection-status";
import { hoursSummary, type SectionKey } from "./sections";

/**
 * Linha de Ajustes. `badge` é o selo de estado das conexões (verde/âmbar/cinza); `todo`, o selo amarelo das outras
 * linhas. `push` marca a Notificação: o estado é do aparelho, então quem desenha resolve no cliente
 * (`notificationsLine`) com a localização que veio daqui.
 */
export type SettingsLine = {
  section: SectionKey;
  status: string;
  todo?: string;
  badge?: Badge;
  push?: { locationOn: boolean };
};
export type SettingsGroupData = { title: string; lines: SettingsLine[] };

/**
 * Resumo de cada seção de Ajustes ("Conectado", "Seg a Sex"...), em grupos.
 * Usado pela lista de `/ajustes` e pela coluna lateral das seções no desktop; `cache` evita consultar duas vezes.
 */
export const loadSettingsSummary = cache(async (tenantId: string): Promise<SettingsGroupData[]> => {
  const [{ whatsapp, google }, { week, reminders, replies, wallet, icloud }, [salon]] = await Promise.all([
    shellStatus(tenantId),
    withTenant(tenantId, async (tx) => ({
      week: await getHours(tx),
      reminders: await getReminderSettings(tx),
      replies: await unreadSupportReplies(tx),
      wallet: await getWalletSettings(tx),
      icloud: (await tx.select({ id: icloudCalendars.id }).from(icloudCalendars).limit(1)).length > 0,
    })),
    getDb()
      .select({
        calendarOn: tenants.calendarTokenHash,
        locationSource: tenants.locationSource,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId)),
  ]);
  const iphone = !!salon?.calendarOn || icloud;
  const avisos = [
    reminders.first ? `1º aviso ${reminders.hours}h antes` : null,
    reminders.secondHours ? `2º aviso ${reminders.secondHours}h antes` : null,
  ].filter(Boolean);

  return [
    {
      title: "Conexões",
      lines: [
        { section: "whatsapp", ...whatsappLine(whatsapp) },
        { section: "calendarios", ...calendarsLine(google, iphone) },
        { section: "notificacoes", status: "", push: { locationOn: salon?.locationSource === "device" } },
      ],
    },
    {
      title: "Clientes e agenda",
      lines: [
        { section: "mensagens", status: avisos.length ? avisos.join(" · ") : "Avisos desligados" },
        { section: "expediente", status: hoursSummary(week) },
        {
          section: "pagamentos",
          status: `Sinal ${wallet.depositPct}% · crédito com ${wallet.cancelNoticeHours}h de antecedência`,
        },
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
