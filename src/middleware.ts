import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Protege rutas según el rol del usuario.
export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const role = session?.user?.role;
  const isLoggedIn = !!session;

  const path = nextUrl.pathname;

  const enAdmin = path.startsWith("/admin");
  const enPanel = path.startsWith("/panel");
  const enCuenta = path.startsWith("/mi-cuenta");

  // No requiere sesión
  if (!enAdmin && !enPanel && !enCuenta) return NextResponse.next();

  // Requiere sesión
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Reglas por rol
  if (enAdmin && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  if (enPanel && role !== "TALLER" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/mi-cuenta", nextUrl));
  }
  if (enCuenta && role !== "CLIENTE" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/panel", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Excluye assets estáticos y la API de auth
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
