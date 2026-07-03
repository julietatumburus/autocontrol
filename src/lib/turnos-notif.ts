import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplate } from "@/lib/mailer";
import { notificarCliente } from "@/lib/notificaciones";
import { formatTurno } from "@/lib/agenda";

const TIPO_LABEL: Record<string, string> = {
  PRESUPUESTO: "presupuesto",
  VISITA: "visita",
};

/** Email de contacto del taller (el configurado, o el del admin). */
async function emailDelTaller(
  tallerId: string,
  tallerEmail: string | null,
): Promise<string | null> {
  if (tallerEmail) return tallerEmail;
  const admin = await prisma.tallerMember.findFirst({
    where: { tallerId, role: "ADMIN" },
    include: { user: { select: { email: true } } },
    orderBy: { creadoEn: "asc" },
  });
  return admin?.user.email ?? null;
}

/**
 * Avisa de un turno al cliente y al taller.
 * - "alta": al reservar. - "recordatorio": 24 h antes.
 * Cliente registrado → in-app + email. No registrado → email.
 * Taller → email (y lo ve en su Agenda dentro del panel).
 */
export async function avisarTurno(
  turnoId: string,
  clase: "alta" | "recordatorio",
): Promise<void> {
  const turno = await prisma.turno.findUnique({
    where: { id: turnoId },
    include: { taller: true },
  });
  if (!turno) return;

  const cuando = formatTurno(turno.fechaHora);
  const tipo = TIPO_LABEL[turno.tipo] ?? "turno";
  const esAlta = clase === "alta";

  // ── Cliente ──
  const tituloCli = esAlta ? "Turno agendado ✅" : "Recordatorio de turno ⏰";
  const msgCli = esAlta
    ? `Reservaste un turno de ${tipo} en ${turno.taller.nombre} para el ${cuando}.`
    : `Te recordamos tu turno de ${tipo} en ${turno.taller.nombre}: ${cuando}.`;

  if (turno.clienteId) {
    await notificarCliente({
      userId: turno.clienteId,
      tipo: esAlta ? "TURNO_CREADO" : "TURNO_RECORDATORIO",
      titulo: tituloCli,
      mensaje: msgCli,
    });
  } else {
    await sendEmail({
      to: turno.email,
      subject: tituloCli,
      html: emailTemplate(tituloCli, msgCli),
    });
  }

  // ── Taller ──
  const tallerEmail = await emailDelTaller(turno.tallerId, turno.taller.email);
  if (tallerEmail) {
    const tituloT = esAlta
      ? `Nuevo turno de ${tipo}`
      : `Recordatorio: turno de ${tipo}`;
    const msgT = esAlta
      ? `${turno.nombre} reservó un turno de ${tipo} para el ${cuando}.${turno.telefono ? ` Tel: ${turno.telefono}.` : ""}${turno.vehiculo ? ` Vehículo: ${turno.vehiculo}.` : ""}`
      : `Turno de ${tipo} con ${turno.nombre} el ${cuando}.`;
    await sendEmail({
      to: tallerEmail,
      subject: tituloT,
      html: emailTemplate(tituloT, msgT),
    });
  }
}
