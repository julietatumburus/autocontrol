import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import PanelSidebar from "@/components/PanelSidebar";
import { Badge } from "@/components/ui";
import { LogoMark } from "@/components/Logo";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/panel");
  if (session.user.role === "CLIENTE") redirect("/mi-cuenta");

  const membership = await getTallerDelUsuario(session.user.id);
  const taller = membership?.taller;

  const agendaPendientes = taller
    ? await prisma.turno.count({
        where: {
          tallerId: taller.id,
          estado: "SOLICITADO",
          fechaHora: { gte: new Date() },
        },
      })
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/panel" className="flex items-center gap-2 font-bold text-slate-900">
            <LogoMark size={28} />
            <span>Autocontrol</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">{taller?.nombre ?? "Panel"}</span>
          </Link>
          <div className="flex items-center gap-3">
            {taller && (
              <Badge
                className={
                  taller.estado === "ACTIVO"
                    ? "bg-green-100 text-green-700"
                    : taller.estado === "PENDIENTE"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }
              >
                {taller.estado}
              </Badge>
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
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <PanelSidebar agendaPendientes={agendaPendientes} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
