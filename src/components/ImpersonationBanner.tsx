import { auth } from "@/auth";
import { dejarDeImpersonar } from "@/lib/actions/impersonar";

/** Banner fijo mientras el super admin está viendo como otro usuario. */
export default async function ImpersonationBanner() {
  const session = await auth();
  if (!session?.impersonating) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-amber-600 bg-amber-400 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
        <span>
          👁️ Estás viendo como <strong>{session.user.nombre}</strong>
          {session.actorNombre ? (
            <span className="hidden sm:inline"> · super admin: {session.actorNombre}</span>
          ) : null}
        </span>
        <form action={dejarDeImpersonar}>
          <button className="rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-900">
            ← Volver a super admin
          </button>
        </form>
      </div>
    </div>
  );
}
