import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Checagem otimista (só olha o cookie). A validação real é feita no servidor por requireSession().
// Se o cookie existe mas a sessão não vale mais, requireSession() manda para /login?sessao=invalida:
// aqui apagamos os cookies do Better Auth, senão /login voltaria para /agenda em loop infinito.
const PUBLIC_PATHS = new Set(["/privacidade", "/termos"]);

export function proxy(request: NextRequest) {
  const logged = !!getSessionCookie(request);
  const { pathname, searchParams } = request.nextUrl;
  // Páginas públicas (exigidas pelo Google OAuth): abertas com ou sem login
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (pathname.startsWith("/login") && searchParams.get("sessao") === "invalida") {
    const res = NextResponse.next();
    for (const { name } of request.cookies.getAll()) {
      if (name.includes("better-auth")) res.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
    return res;
  }
  if (!logged && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (logged && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/agenda", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icons|manifest.webmanifest|sw.js|offline|icon.png|apple-icon.png).*)"],
};
