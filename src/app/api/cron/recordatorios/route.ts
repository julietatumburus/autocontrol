import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { avisarTurno } from "@/lib/turnos-notif";

export const dynamic = "force-dynamic";

/**
 * Envía los recordatorios de turnos dentro de las próximas 24 h.
 * Pensado para ejecutarse cada hora (cron de Coolify / servicio externo).
 * Protegido con CRON_SECRET (header Authorization: Bearer <secret> o ?token=).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const auth = request.headers.get("authorization");
    const token = url.searchParams.get("token");
    const ok = auth === `Bearer ${secret}` || token === secret;
    if (!ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

  const turnos = await prisma.turno.findMany({
    where: {
      recordatorioEnviado: false,
      fechaHora: { gt: ahora, lte: en24h },
      estado: { in: ["SOLICITADO", "CONFIRMADO"] },
    },
    select: { id: true },
  });

  for (const t of turnos) {
    await avisarTurno(t.id, "recordatorio");
    await prisma.turno.update({
      where: { id: t.id },
      data: { recordatorioEnviado: true },
    });
  }

  return NextResponse.json({ enviados: turnos.length });
}
