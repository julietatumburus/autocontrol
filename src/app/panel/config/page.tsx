import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTallerDelUsuario } from "@/lib/session";
import { Card } from "@/components/ui";
import TallerForm from "./TallerForm";
import ServiciosManager from "./ServiciosManager";
import LogoUploader from "./LogoUploader";
import EtapasManager from "./EtapasManager";
import AgendaConfig from "./AgendaConfig";
import GarantiaConfig from "./GarantiaConfig";
import CompartirTaller from "@/components/CompartirTaller";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const session = await auth();
  const membership = await getTallerDelUsuario(session!.user.id);
  if (!membership) redirect("/panel");

  const taller = await prisma.taller.findUnique({
    where: { id: membership.tallerId },
    include: {
      servicios: { orderBy: { nombre: "asc" } },
      etapas: { orderBy: { orden: "asc" } },
    },
  });
  if (!taller) redirect("/panel");

  const esAdmin = membership.role === "ADMIN" || session!.user.role === "SUPER_ADMIN";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi taller</h1>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-900">Compartí tu taller</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pasale a tus clientes el QR o el link a tu página, donde siguen su
            reparación por patente.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            autocontrol.app/talleres/{taller.slug}
          </p>
        </div>
        <CompartirTaller
          path={`/talleres/${taller.slug}`}
          nombre={taller.nombre}
          variant="primary"
        />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-slate-900">Logo del taller</h2>
        <p className="mb-4 text-sm text-slate-500">
          Aparece en tu tarjeta y en tu página pública dentro de Autocontrol.
        </p>
        {esAdmin ? (
          <LogoUploader
            tallerId={taller.id}
            nombre={taller.nombre}
            logoUrl={taller.logoUrl}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Solo el administrador del taller puede cambiar el logo.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-slate-900">Datos del taller</h2>
        {esAdmin ? (
          <TallerForm
            taller={{
              id: taller.id,
              nombre: taller.nombre,
              descripcion: taller.descripcion ?? "",
              direccion: taller.direccion ?? "",
              telefono: taller.telefono ?? "",
              email: taller.email ?? "",
            }}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Solo el administrador del taller puede editar estos datos.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Tu página pública: <code>/talleres/{taller.slug}</code>
        </p>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-slate-900">Servicios que ofrecés</h2>
        <p className="mb-4 text-sm text-slate-500">
          Se muestran en tu página pública dentro de Autocontrol.
        </p>
        <ServiciosManager
          tallerId={taller.id}
          editable={esAdmin}
          servicios={taller.servicios.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            descripcion: s.descripcion ?? "",
            precioDesde: s.precioDesde?.toString() ?? null,
          }))}
        />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-slate-900">Agenda de turnos</h2>
        <p className="mb-4 text-sm text-slate-500">
          Definí tus horarios para que los clientes saquen turnos de presupuesto
          o visita.
        </p>
        {esAdmin ? (
          <AgendaConfig
            taller={{
              id: taller.id,
              agendaActiva: taller.agendaActiva,
              agendaApertura: taller.agendaApertura,
              agendaCierre: taller.agendaCierre,
              agendaDuracionMin: taller.agendaDuracionMin,
              agendaDias: taller.agendaDias,
            }}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Solo el administrador puede configurar la agenda.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-slate-900">Garantía</h2>
        <p className="mb-4 text-sm text-slate-500">
          Si ofrecés garantía, los clientes ven el distintivo con el tiempo que
          corre desde que retiran el vehículo.
        </p>
        {esAdmin ? (
          <GarantiaConfig
            taller={{
              id: taller.id,
              garantiaActiva: taller.garantiaActiva,
              garantiaMeses: taller.garantiaMeses,
            }}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Solo el administrador puede configurar la garantía.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-slate-900">Etapas del flujo</h2>
        <p className="mb-4 text-sm text-slate-500">
          El camino que recorre cada reparación en tu taller. Reordenalas,
          cambiá el nombre y el color, o agregá las tuyas.
        </p>
        <EtapasManager
          tallerId={taller.id}
          editable={esAdmin}
          etapas={taller.etapas.map((e) => ({
            id: e.id,
            nombre: e.nombre,
            color: e.color,
            orden: e.orden,
            esFinal: e.esFinal,
          }))}
        />
      </Card>
    </div>
  );
}
