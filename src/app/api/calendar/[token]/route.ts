import { feedIcs, tenantByTokenHash } from "@/features/calendar-feed/server";
import { hashToken, isTokenShape } from "@/features/calendar-feed/token";

export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" };

/** Link assinado do Calendário do iPhone (webcal). Token inválido, trocado ou desligado: 404 igual para todos. */
export async function GET(_req: Request, ctx: RouteContext<"/api/calendar/[token]">) {
  const { token: raw } = await ctx.params;
  const token = raw.replace(/\.ics$/, "");
  const notFound = () => new Response("Not found", { status: 404, headers: PRIVATE });
  if (!isTokenShape(token)) return notFound();
  try {
    const tenant = await tenantByTokenHash(hashToken(token));
    if (!tenant) return notFound();
    const body = await feedIcs(tenant);
    return new Response(body, {
      headers: {
        ...PRIVATE,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="bubbly.ics"',
      },
    });
  } catch {
    // Sem o token no log: quem tem o link vê a agenda
    console.error("calendar_feed_failed");
    return new Response("Erro", { status: 500, headers: PRIVATE });
  }
}
