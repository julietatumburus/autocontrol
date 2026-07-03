import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, ButtonLink, Input, Button } from "@/components/ui";
import { TallerLogo } from "@/components/TallerLogo";
import { MapPinIcon, PhoneIcon, SearchIcon } from "@/components/icons";
import Timeline from "@/components/Timeline";
import {
  formatMoney,
  ORDEN_ESTADO_LABEL,
  ORDEN_ESTADO_COLOR,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TallerPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ patente?: string }>;
}) {
  const { slug } = await params;
  const { patente: patenteRaw } = await searchParams;
  const taller = await prisma.taller.findUnique({
    where: { slug },
    include: { servicios: true },
  });

  if (!taller || taller.estado !== "ACTIVO") notFound();

  // Consulta pública por patente: solo la hoja de ruta (etapas).
  const patente = patenteRaw
    ? patenteRaw.toUpperCase().replace(/\s+/g, "").trim()
    : "";

  const orden = patente
    ? await prisma.ordenDeTrabajo.findFirst({
        where: { tallerId: taller.id, vehiculo: { patente } },
        include: {
          vehiculo: true,
          etapaActual: true,
          timeline: { orderBy: { ingresoEn: "asc" } },
        },
        orderBy: { creadoEn: "desc" },
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Encabezado del taller */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <TallerLogo src={taller.logoUrl} nombre={taller.nombre} size={80} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{taller.nombre}</h1>
            <Badge className="bg-green-100 text-green-700">Activo</Badge>
          </div>
          {taller.direccion && (
            <p className="mt-1 flex items-center gap-2 text-slate-500">
              <MapPinIcon className="text-slate-400" /> {taller.direccion}
            </p>
          )}
          {taller.telefono && (
            <p className="flex items-center gap-2 text-slate-500">
              <PhoneIcon className="text-slate-400" /> {taller.telefono}
            </p>
          )}
        </div>
      </div>

      {taller.descripcion && (
        <p className="mt-6 text-slate-600">{taller.descripcion}</p>
      )}

      {/* Sacar turno */}
      {taller.agendaActiva && (
        <div className="mt-6">
          <ButtonLink href={`/talleres/${taller.slug}/turno`} className="px-5 py-2.5">
            Sacar un turno
          </ButtonLink>
          <span className="ml-3 text-sm text-slate-500">
            Para presupuesto o visita.
          </span>
        </div>
      )}

      {/* Consulta rápida por patente */}
      <Card className="mt-8 border-brand-100 bg-brand-50/40">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <SearchIcon size={20} className="text-brand-600" /> Seguí tu auto por
          patente
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ingresá la patente para ver la hoja de ruta de tu reparación en este
          taller.
        </p>
        <form method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            name="patente"
            defaultValue={patente}
            placeholder="Ej: AB123CD"
            aria-label="Patente"
            required
            className="uppercase sm:max-w-xs"
          />
          <Button type="submit">Consultar</Button>
        </form>
      </Card>

      {/* Resultado de la consulta: SOLO la hoja de ruta */}
      {patente && (
        <section className="mt-6">
          {!orden ? (
            <Card className="text-center text-slate-500">
              No encontramos un auto con la patente{" "}
              <span className="font-semibold text-slate-700">{patente}</span> en
              este taller. Revisá la patente o consultá directamente en el taller.
            </Card>
          ) : (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {orden.vehiculo.marca} {orden.vehiculo.modelo}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Orden #{orden.numero} · {orden.vehiculo.patente}
                  </p>
                </div>
                <Badge className={ORDEN_ESTADO_COLOR[orden.estado]}>
                  {ORDEN_ESTADO_LABEL[orden.estado]}
                </Badge>
              </div>

              <h4 className="mb-4 mt-6 font-semibold text-slate-900">
                Hoja de ruta
              </h4>
              <Timeline
                eventos={orden.timeline.map((t) => ({
                  nombre: t.nombre,
                  ingresoEn: t.ingresoEn,
                  salidaEn: t.salidaEn,
                }))}
              />

              {/* CTA: para avisos y detalle hay que registrarse */}
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                <p className="text-sm font-medium text-slate-700">
                  ¿Querés que te avisemos cuando esté listo y ver el detalle del
                  costo?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Creá tu cuenta gratis en Autocontrol para recibir
                  notificaciones y acceder a todos los detalles.
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <ButtonLink href="/registro">Crear cuenta</ButtonLink>
                  <ButtonLink href="/login" variant="secondary">
                    Ya tengo cuenta
                  </ButtonLink>
                </div>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* Servicios */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">Servicios</h2>
        {taller.servicios.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Este taller todavía no cargó sus servicios.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {taller.servicios.map((s) => (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.nombre}</h3>
                    {s.descripcion && (
                      <p className="mt-1 text-sm text-slate-500">{s.descripcion}</p>
                    )}
                  </div>
                  {s.precioDesde != null && (
                    <span className="whitespace-nowrap text-sm font-medium text-brand-600">
                      desde {formatMoney(s.precioDesde)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CTA general */}
      <Card className="mt-10 bg-slate-900 text-center text-white">
        <h3 className="text-lg font-semibold">¿Dejaste tu auto en este taller?</h3>
        <p className="mt-1 text-sm text-slate-300">
          Creá tu cuenta para seguir la reparación en tiempo real y recibir
          avisos.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <ButtonLink href="/registro">Crear cuenta</ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            Ya tengo cuenta
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
