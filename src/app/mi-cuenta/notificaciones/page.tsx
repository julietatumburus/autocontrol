import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import MarcarLeidas from "./MarcarLeidas";

export const dynamic = "force-dynamic";

const ICONO: Record<string, string> = {
  ORDEN_CREADA: "🆕",
  ETAPA_ACTUALIZADA: "🔧",
  ORDEN_LISTA: "🎉",
  PAGO_REGISTRADO: "💳",
  COMPROBANTE_EMITIDO: "🧾",
  PRESUPUESTO_ENVIADO: "📄",
  PRESUPUESTO_APROBADO: "✅",
  PRESUPUESTO_RECHAZADO: "❌",
  MENSAJE_NUEVO: "💬",
  TURNO_CREADO: "📅",
  TURNO_RECORDATORIO: "⏰",
  GENERAL: "🔔",
};

export default async function NotificacionesPage() {
  const session = await auth();
  const notis = await prisma.notificacion.findMany({
    where: { userId: session!.user.id },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });
  return (
    <div className="space-y-6">
      {/* Marca todo como leído al entrar (actualiza la campanita) */}
      <MarcarLeidas />
      <h1 className="text-2xl font-bold text-slate-900">Avisos</h1>

      {notis.length === 0 ? (
        <Card className="text-center text-slate-500">No tenés avisos todavía.</Card>
      ) : (
        <div className="space-y-2">
          {notis.map((n) => {
            const contenido = (
              <Card
                className={
                  n.leidaEn ? "" : "border-brand-200 bg-brand-50"
                }
              >
                <div className="flex gap-3">
                  <span className="text-xl">{ICONO[n.tipo] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{n.titulo}</p>
                      {!n.leidaEn && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{n.mensaje}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(n.creadoEn)}
                    </p>
                  </div>
                </div>
              </Card>
            );
            return n.ordenId ? (
              <Link key={n.id} href={`/mi-cuenta/ordenes/${n.ordenId}`} className="block">
                {contenido}
              </Link>
            ) : (
              <div key={n.id}>{contenido}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
