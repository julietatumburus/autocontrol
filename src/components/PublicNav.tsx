import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ButtonLink } from "@/components/ui";
import { LogoMark } from "@/components/Logo";
import { getTallerDelUsuario } from "@/lib/session";

export default async function PublicNav() {
  const session = await auth();
  const role = session?.user?.role;

  // Super admin → /admin; con taller (membresía) → /panel; resto → /mi-cuenta.
  const membership =
    session?.user && role !== "SUPER_ADMIN"
      ? await getTallerDelUsuario(session.user.id)
      : null;
  const panelHref =
    role === "SUPER_ADMIN" ? "/admin" : membership ? "/panel" : "/mi-cuenta";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <LogoMark size={32} />
          <span className="hidden sm:inline">Autocontrol</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/talleres"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block"
          >
            Talleres
          </Link>

          {session?.user ? (
            <>
              <ButtonLink href={panelHref} variant="secondary">
                Mi panel
              </ButtonLink>
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
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost">
                Ingresar
              </ButtonLink>
              <ButtonLink href="/registro">Crear cuenta</ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
