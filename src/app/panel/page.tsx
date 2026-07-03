import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import { Card, Badge, ButtonLink } from "@/components/ui";
import { MessageIcon } from "@/components/icons";
import { formatMoney, ORDEN_ESTADO_LABEL, ORDEN_ESTADO_COLOR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PanelDashboard() {
  const session = await auth();
  const membership = await getTallerDelUsuario(session!.user.id);

  if (!membership) {
    return (
      <Card className="text-center">
        <p className="text-slate-600">
          No tenés un taller asociado.{" "}
          {session!.user.role === "SUPER_ADMIN" ? (
            <Link href="/admin" className="font-medium text-brand-600 hover:underline">
              Ir al panel de administración
            </Link>
          ) : (
            <Link
              href="/panel/crear-taller"
              className="font-medium text-brand-600 hover:underline"
            >
              Crear mi taller
            </Link>
          )}
        </p>
      </Card>
    );
  }

  const tallerId = membership.tallerId;

  const [abiertas, listas, pagadasMes, ultimas] = await Promise.all([
    prisma.ordenDeTrabajo.count({ where: { tallerId, estado: "ABIERTA" } }),
    prisma.ordenDeTrabajo.count({ where: { tallerId, estado: "LISTA" } }),
    prisma.ordenDeTrabajo.count({
      where: { tallerId, estado: { in: ["PAGADA", "ENTREGADA"] } },
    }),
    prisma.ordenDeTrabajo.findMany({
      where: { tallerId },
      include: {
        vehiculo: true,
        cliente: true,
        etapaActual: true,
        mensajes: {
          orderBy: { creadoEn: "desc" },
          take: 1,
          select: { autorId: true, creadoEn: true },
        },
      },
      orderBy: { actualizadoEn: "desc" },
      take: 6,
    }),
  ]);

  // Órdenes con mensaje del cliente sin ver desde la última visita del taller
  const sinVer = (o: (typeof ultimas)[number]) => {
    const last = o.mensajes[0];
    return (
      !!last &&
      last.autorId === o.clienteId &&
      (!o.vistoTallerEn || last.creadoEn > o.vistoTallerEn)
    );
  };
  const sinResponder = ultimas.filter(sinVer).length;

  const stats = [
    { label: "En proceso", value: abiertas, color: "text-blue-600" },
    { label: "Listas para retirar", value: listas, color: "text-amber-600" },
    { label: "Pagadas / entregadas", value: pagadasMes, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resumen</h1>
          <p className="text-sm text-slate-500">{membership.taller.nombre}</p>
        </div>
        <ButtonLink href="/panel/ordenes/nueva">+ Nueva orden</ButtonLink>
      </div>

      {membership.taller.estado === "PENDIENTE" && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            ⏳ Tu taller está <strong>pendiente de aprobación</strong>. Mientras
            tanto podés cargar órdenes, pero no aparecerás en la página pública
            hasta que el equipo de Autocontrol lo active.
          </p>
        </Card>
      )}

      {sinResponder > 0 && (
        <Link href="/panel/ordenes" className="block">
          <Card className="flex items-center gap-3 border-red-200 bg-red-50 transition-shadow hover:shadow-sm">
            <MessageIcon className="text-red-600" />
            <p className="text-sm text-red-700">
              Tenés{" "}
              <strong>
                {sinResponder} mensaje{sinResponder > 1 ? "s" : ""} sin responder
              </strong>{" "}
              de clientes. Tocá para verlos.
            </p>
          </Card>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Últimas órdenes</h2>
          <Link href="/panel/ordenes" className="text-sm text-brand-600 hover:underline">
            Ver todas →
          </Link>
        </div>
        {ultimas.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Todavía no cargaste órdenes.{" "}
            <Link href="/panel/ordenes/nueva" className="text-brand-600 hover:underline">
              Creá la primera
            </Link>
            .
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {ultimas.map((o) => (
              <Link
                key={o.id}
                href={`/panel/ordenes/${o.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    #{o.numero} · {o.vehiculo.marca} {o.vehiculo.modelo}
                    {sinVer(o) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        <MessageIcon size={12} /> nuevo
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {o.cliente.nombre} · {o.vehiculo.patente}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {formatMoney(o.total)}
                  </span>
                  <Badge className={ORDEN_ESTADO_COLOR[o.estado]}>
                    {ORDEN_ESTADO_LABEL[o.estado]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
