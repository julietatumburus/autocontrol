import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { impersonar } from "@/lib/actions/impersonar";
import UsuarioAcciones from "./UsuarioAcciones";

export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  CLIENTE: "Cliente",
  TALLER: "Taller",
  SUPER_ADMIN: "Super admin",
};
const ROL_COLOR: Record<string, string> = {
  CLIENTE: "bg-slate-100 text-slate-600",
  TALLER: "bg-blue-50 text-blue-700",
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
};

export default async function UsuariosPage() {
  const session = await auth();
  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      activo: true,
      creadoEn: true,
      _count: { select: { ordenesComoCliente: true, membresias: true } },
    },
    orderBy: [{ role: "asc" }, { creadoEn: "desc" }],
  });

  const activos = usuarios.filter((u) => u.activo).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500">
          Todas las cuentas registradas. Podés entrar como cualquiera para dar
          soporte, o dar de baja una cuenta ante irregularidades.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Cuentas activas</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{activos}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Dadas de baja</p>
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
              {usuarios.map((u) => {
                const esYo = u.id === session?.user?.id;
                const esSuper = u.role === "SUPER_ADMIN";
                return (
                  <tr key={u.id} className={u.activo ? "" : "bg-red-50/40"}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{u.nombre}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={ROL_COLOR[u.role]}>
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
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!esYo && u.activo && (
                          <form action={impersonar.bind(null, u.id)}>
                            <button
                              type="submit"
                              title={`Entrar como ${u.nombre}`}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                            >
                              Entrar como →
                            </button>
                          </form>
                        )}
                        {!esSuper && (
                          <UsuarioAcciones userId={u.id} activo={u.activo} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
