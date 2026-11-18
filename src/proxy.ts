import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalRedirect } from "@/lib/canonical-host";

// Checagem otimista (só olha o cookie). A validação real é feita no servidor por requireSession().
// Se o cookie existe mas a sessão não vale mais, requireSession() manda para /login?sessao=invalida:
// aqui apagamos os cookies do Better Auth, senão /login voltaria para /agenda em loop infinito.
const PUBLIC_PATHS = new Set(["/privacidade", "/termos", "/redefinir-senha"]);

export function proxy(request: NextRequest) {
  const canonical = canonicalRedirect(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    request.nextUrl,
  );
  if (canonical) return NextResponse.redirect(canonical, 308);
  const logged = !!getSessionCookie(request);
  const { pathname, searchParams } = request.nextUrl;
  // Páginas públicas (Google OAuth exige as legais; nova senha vem do link do e-mail): abertas com ou sem login
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (pathname.startsWith("/login") && searchParams.get("sessao") === "invalida") {
    const res = NextResponse.next();
    for (const { name } of request.cookies.getAll()) {
      if (name.includes("better-auth")) res.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
    return res;
  }
  // Painel do dono: sem login, a rota nem existe (404, sem mandar para o login). Quem está logado e não é admin
  // recebe o 404 do requireAdmin na própria página.
  if (!logged && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    return NextResponse.rewrite(new URL("/_admin-nao-existe", request.url));
  }
  if (!logged && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (logged && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|\\.well-known|_next/static|_next/image|icons|manifest.webmanifest|sw.js|offline|icon.png|apple-icon.png|og.png).*)",
  ],
};
