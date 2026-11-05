import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Checagem otimista (só olha o cookie). A validação real é feita no servidor por requireSession().
export function proxy(request: NextRequest) {
  const logged = !!getSessionCookie(request);
  const { pathname } = request.nextUrl;
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
