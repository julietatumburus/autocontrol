import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import TallerAcciones from "./TallerAcciones";

export const dynamic = "force-dynamic";

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  ACTIVO: "bg-green-100 text-green-700",
  SUSPENDIDO: "bg-red-100 text-red-700",
};

export default async function AdminPage() {
  const [talleres, totalClientes, totalOrdenes] = await Promise.all([
    prisma.taller.findMany({
      include: {
        _count: { select: { ordenes: true, miembros: true } },
        miembros: {
          where: { role: "ADMIN" },
          include: { user: true },
          take: 1,
        },
      },
      orderBy: [{ estado: "asc" }, { creadoEn: "desc" }],
    }),
    prisma.user.count({ where: { role: "CLIENTE" } }),
    prisma.ordenDeTrabajo.count(),
  ]);

  const pendientes = talleres.filter((t) => t.estado === "PENDIENTE").length;

  const stats = [
    { label: "Talleres", value: talleres.length },
    { label: "Pendientes de aprobar", value: pendientes },
    { label: "Clientes", value: totalClientes },
    { label: "Órdenes totales", value: totalOrdenes },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Administración</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Talleres</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Taller</th>
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Órdenes</th>
                <th className="px-5 py-3">Alta</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {talleres.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{t.nombre}</p>
                    <p className="text-xs text-slate-400">/{t.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {t.miembros[0]?.user.email ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{t._count.ordenes}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {formatDate(t.creadoEn)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={ESTADO_COLOR[t.estado]}>{t.estado}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <TallerAcciones tallerId={t.id} estado={t.estado} />
                  </td>
                </tr>
              ))}
              {talleres.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                    Aún no hay talleres registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
