import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { TallerLogo } from "@/components/TallerLogo";
import { impersonar } from "@/lib/actions/impersonar";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const talleres = await prisma.taller.findMany({
    where: { estado: "ACTIVO" },
    include: {
      _count: { select: { ordenes: true } },
      miembros: {
        where: { role: "ADMIN" },
        include: { user: { select: { id: true, nombre: true, email: true } } },
        orderBy: { creadoEn: "asc" },
        take: 1,
      },
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <p className="text-sm text-slate-500">
          Talleres activos en la plataforma. Podés entrar como cualquiera para
          dar soporte.
        </p>
      </div>

      {talleres.length === 0 ? (
        <Card className="text-center text-slate-500">
          Todavía no hay talleres activos.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {talleres.map((t) => {
            const admin = t.miembros[0]?.user;
            return (
              <Card key={t.id} className="flex items-center gap-4">
                <TallerLogo src={t.logoUrl} nombre={t.nombre} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {t.nombre}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {admin ? `${admin.nombre} · ${admin.email}` : "Sin admin"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t._count.ordenes} órdenes
                  </p>
                </div>
                {admin && (
                  <form action={impersonar.bind(null, admin.id)}>
                    <button
                      type="submit"
                      title={`Entrar como ${t.nombre}`}
                      className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                    >
                      Entrar como →
                    </button>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
