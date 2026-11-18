import { NextResponse, type NextRequest } from "next/server";
import { isPlatformAdmin } from "@/features/admin/access";
import { getSession } from "@/lib/session";
import { landingAfterLogin } from "@/features/admin/landing";

/**
 * Destino logo depois do login (senha, código, Google e app da loja). O dono do produto (ADMIN_USER_IDS) cai no
 * /admin, que continua pedindo o 2FA/step-up pelo requireAdmin; o resto vai para o Painel. Só no login: abrir o
 * app depois (start_url /agenda) segue no Painel, e o dono volta ao app pelo menu do /admin.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  const to = landingAfterLogin(session ? isPlatformAdmin(session.user.id) : null);
  return NextResponse.redirect(new URL(to, request.url), { headers: { "Cache-Control": "no-store" } });
}
