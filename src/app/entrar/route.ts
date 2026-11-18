import { isPlatformAdmin } from "@/features/admin/access";
import { getSession } from "@/lib/session";
import { landingAfterLogin } from "@/features/admin/landing";

/**
 * Destino logo depois do login (senha, código, Google e app da loja). O dono do produto (ADMIN_USER_IDS) cai no
 * /admin, que continua pedindo o 2FA/step-up pelo requireAdmin; o resto vai para o Painel. Só no login: abrir o
 * app depois (start_url /agenda) segue no Painel, e o dono volta ao app pelo menu do /admin.
 *
 * Location RELATIVO de propósito: no Railway o `request.url` de um route handler é o endereço interno do servidor
 * (http://localhost:8080), e `new URL(to, request.url)` mandava o celular para o localhost depois do Google.
 */
export async function GET() {
  const session = await getSession();
  const to = landingAfterLogin(session ? isPlatformAdmin(session.user.id) : null);
  return new Response(null, { status: 307, headers: { Location: to, "Cache-Control": "no-store" } });
}
