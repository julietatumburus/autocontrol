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

  // /admin es exclusivo del super admin.
  if (enAdmin && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  // /panel y /mi-cuenta: cualquier usuario logueado. El acceso real lo
  // resuelven los layouts (panel exige tener un taller; multi-rol soportado).
  return NextResponse.next();
});

export const config = {
  // Excluye assets estáticos y la API de auth
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
