import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import { Card } from "@/components/ui";
import AgendaCalendar, { type TurnoDTO } from "./AgendaCalendar";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const session = await auth();
  const membership = await getTallerDelUsuario(session!.user.id);
  if (!membership) return <Card>No tenés un taller asociado.</Card>;

  const turnos = await prisma.turno.findMany({
    where: { tallerId: membership.tallerId },
    orderBy: { fechaHora: "asc" },
    take: 500,
  });

  const dto: TurnoDTO[] = turnos.map((t) => ({
    id: t.id,
    fechaHora: t.fechaHora.toISOString(),
    tipo: t.tipo,
    estado: t.estado,
    nombre: t.nombre,
    email: t.email,
    telefono: t.telefono,
    vehiculo: t.vehiculo,
    motivo: t.motivo,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
        <p className="text-sm text-slate-500">
          Turnos reservados por tus clientes. Tocá un turno para ver el detalle.
        </p>
      </div>

      <Card>
        <AgendaCalendar turnos={dto} />
      </Card>
    </div>
  );
}
