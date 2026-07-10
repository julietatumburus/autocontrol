import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import { LogoMark } from "@/components/Logo";

export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/mi-cuenta");

  const [noLeidas, membership] = await Promise.all([
    prisma.notificacion.count({
      where: { userId: session.user.id, leidaEn: null },
    }),
    getTallerDelUsuario(session.user.id),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/mi-cuenta" className="flex items-center gap-2 font-bold text-slate-900">
            <LogoMark size={28} /> Autocontrol
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/mi-cuenta"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Mis órdenes
            </Link>
            <Link
              href="/mi-cuenta/turnos"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Turnos
            </Link>
            <Link
              href="/mi-cuenta/notificaciones"
              className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Avisos
              {noLeidas > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {noLeidas}
                </span>
              )}
            </Link>
            {membership ? (
              <Link
                href="/panel"
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Mi taller
              </Link>
            ) : (
              <Link
                href="/registrar-taller"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:bg-slate-100 sm:block"
              >
                Registrar mi taller
              </Link>
            )}
            <span className="hidden text-sm text-slate-500 sm:inline">
              {session.user.nombre}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
