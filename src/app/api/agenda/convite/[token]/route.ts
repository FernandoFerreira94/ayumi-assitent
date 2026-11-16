import { connection } from "next/server";
import { appointmentInvite } from "@/features/calendar-feed/invite";
import { readInviteToken } from "@/features/calendar-feed/invite-token";
import { errInfo, log } from "@/lib/log";

const PRIVATE = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" };

/**
 * Convite (.ics) de um atendimento, aberto pela cliente no link da mensagem de agendamento. Abre direto no
 * Calendário do iPhone; no Android baixa e abre no Google Agenda. Token inválido, vencido ou de agendamento
 * apagado: 404 igual para todos.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/agenda/convite/[token]">) {
  await connection();
  const { token: raw } = await ctx.params;
  const notFound = () => new Response("Not found", { status: 404, headers: PRIVATE });
  const ids = readInviteToken(raw.replace(/\.ics$/, ""));
  if (!ids) return notFound();
  try {
    const body = await appointmentInvite(ids.tenantId, ids.appointmentId);
    if (!body) return notFound();
    return new Response(body, {
      headers: {
        ...PRIVATE,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="agendamento.ics"',
      },
    });
  } catch (e) {
    // Sem o token no log: quem tem o link vê o horário
    log("error", "appointment_invite_failed", errInfo(e));
    return new Response("Erro", { status: 500, headers: PRIVATE });
  }
}
