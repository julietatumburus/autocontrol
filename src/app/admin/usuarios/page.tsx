import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import UsuarioAcciones from "./UsuarioAcciones";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  CLIENTE: "Cliente",
  TALLER: "Taller",
};

export default async function UsuariosPage() {
  const usuarios = await prisma.user.findMany({
    where: { role: { not: "SUPER_ADMIN" } },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      activo: true,
      creadoEn: true,
      _count: { select: { ordenesComoCliente: true, membresias: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  const activos = usuarios.filter((u) => u.activo).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500">
          Todos los usuarios registrados. Podés dar de baja una cuenta ante
          irregularidades (no podrá volver a ingresar).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Usuarios activos</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{activos}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Dados de baja</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {usuarios.length - activos}
          </p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Actividad</th>
                <th className="px-5 py-3">Alta</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className={u.activo ? "" : "bg-red-50/40"}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{u.nombre}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className="bg-slate-100 text-slate-600">
                      {ROL_LABEL[u.role] ?? u.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {u._count.ordenesComoCliente} órdenes ·{" "}
                    {u._count.membresias} taller
                    {u._count.membresias === 1 ? "" : "es"}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {formatDate(u.creadoEn)}
                  </td>
                  <td className="px-5 py-3">
                    {u.activo ? (
                      <Badge className="bg-green-100 text-green-700">Activo</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700">Baja</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <UsuarioAcciones userId={u.id} activo={u.activo} />
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                    Aún no hay usuarios registrados.
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
