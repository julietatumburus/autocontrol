import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { TallerLogo } from "@/components/TallerLogo";
import {
  RouteIcon,
  GaugeIcon,
  WrenchIcon,
  BellIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const talleres = await prisma.taller.findMany({
    where: { estado: "ACTIVO" },
    include: { _count: { select: { ordenes: true, servicios: true } } },
    orderBy: { creadoEn: "desc" },
    take: 12,
  });

  return (
    <div className="bg-white">
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        {/* Patrón blueprint */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* Glow navy sutil */}
        <div className="absolute -top-28 left-1/2 h-72 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-[#2b4b80]/25 blur-3xl" />

        {/* Aurora animada */}
        <div className="hero-aurora" aria-hidden="true">
          <span className="hero-blob hero-b1" />
          <span className="hero-blob hero-b2" />
          <span className="hero-blob hero-b3" />
        </div>

        {/* Rueda que rueda y gira al cruzar */}
        <div className="hero-car" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="60" height="60" fill="none">
            <g className="hero-wheel" style={{ transformOrigin: "32px 32px" }}>
              {/* neumático */}
              <circle cx="32" cy="32" r="30" fill="rgba(16,22,34,0.95)" stroke="rgba(170,195,235,0.35)" strokeWidth="1.5" />
              <circle cx="32" cy="32" r="25" fill="none" stroke="rgba(170,195,235,0.22)" strokeWidth="1" />
              {/* llanta */}
              <circle cx="32" cy="32" r="21" fill="rgba(150,178,224,0.08)" stroke="rgba(170,195,235,0.55)" strokeWidth="2" />
              {/* rayos */}
              <g stroke="rgba(170,195,235,0.5)" strokeWidth="3" strokeLinecap="round">
                <line x1="32" y1="32" x2="32" y2="13" />
                <line x1="32" y1="32" x2="50.1" y2="26.1" />
                <line x1="32" y1="32" x2="43.2" y2="47.4" />
                <line x1="32" y1="32" x2="20.8" y2="47.4" />
                <line x1="32" y1="32" x2="13.9" y2="26.1" />
              </g>
              {/* tuercas */}
              <g fill="rgba(170,195,235,0.55)">
                <circle cx="32" cy="22.5" r="1.4" />
                <circle cx="41" cy="29.5" r="1.4" />
                <circle cx="37.6" cy="40" r="1.4" />
                <circle cx="26.4" cy="40" r="1.4" />
                <circle cx="23" cy="29.5" r="1.4" />
              </g>
              {/* buje */}
              <circle cx="32" cy="32" r="5.5" fill="rgba(170,195,235,0.7)" />
              <circle cx="32" cy="32" r="2.3" fill="rgba(16,22,34,0.95)" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <span className="hero-rise hero-d1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-zinc-300">
              <span className="hero-pulse-dot h-1.5 w-1.5 rounded-full bg-[#5b82c4]" />
              Talleres y clientes, en sintonía
            </span>

            <h1 className="hero-rise hero-d2 mt-6 text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-6xl sm:leading-[1.05]">
              El control de tu auto,
              <br className="hidden sm:block" />{" "}
              <span className="text-zinc-500">de principio a fin.</span>
            </h1>

            <p className="hero-rise hero-d3 mt-5 max-w-xl text-base text-zinc-400 sm:mt-6 sm:text-lg">
              Dejás tu vehículo y seguís cada etapa de la reparación en tiempo
              real: repuestos, fotos del avance, costos y el aviso cuando está
              listo. Sin levantar el teléfono.
            </p>

            <div className="hero-rise hero-d4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/registro"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 sm:w-auto"
              >
                Crear mi cuenta <ArrowRightIcon size={16} />
              </Link>
              <Link
                href="/talleres"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Ver talleres
              </Link>
            </div>

            <div className="hero-rise hero-d5 mt-10 flex flex-col gap-3 text-sm text-zinc-400 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {[
                { icon: GaugeIcon, t: "Seguimiento en vivo" },
                { icon: BellIcon, t: "Avisos automáticos" },
                { icon: ReceiptIcon, t: "Comprobante digital" },
              ].map((f) => (
                <span key={f.t} className="inline-flex items-center gap-2">
                  <f.icon size={16} className="text-[#5b82c4]" /> {f.t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Cómo funciona ───────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2b4b80]">
            Cómo funciona
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Tres pasos, cero incertidumbre
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {[
            {
              n: "01",
              icon: WrenchIcon,
              t: "Dejás tu auto",
              d: "El taller abre la orden con tu vehículo y el problema a resolver.",
            },
            {
              n: "02",
              icon: RouteIcon,
              t: "Seguís la hoja de ruta",
              d: "Mirás en vivo por qué etapa va, los repuestos y las fotos del avance.",
            },
            {
              n: "03",
              icon: ReceiptIcon,
              t: "Retirás y pagás",
              d: "Te avisamos cuando está listo, abonás en el taller y tenés tu comprobante.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400"
            >
              <span className="absolute right-6 top-5 text-3xl font-bold text-zinc-300">
                {s.n}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                <s.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── Talleres ───────────────── */}
      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#2b4b80]">
                Red de talleres
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Talleres en Autocontrol
              </h2>
            </div>
            <Link
              href="/talleres"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2b4b80] hover:underline"
            >
              Ver todos <ArrowRightIcon size={14} />
            </Link>
          </div>

          {talleres.length === 0 ? (
            <Card className="text-center text-zinc-500">
              Todavía no hay talleres activos. ¿Tenés un taller?{" "}
              <Link href="/registro" className="font-medium text-[#2b4b80] hover:underline">
                Registralo acá
              </Link>
              .
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talleres.map((t) => (
                <Link key={t.id} href={`/talleres/${t.slug}`} className="group">
                  <div className="h-full rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 sm:p-6">
                    <div className="flex items-start justify-between">
                      <TallerLogo src={t.logoUrl} nombre={t.nombre} size={48} />
                      <Badge className="bg-emerald-50 text-emerald-700">Activo</Badge>
                    </div>
                    <h3 className="mt-4 font-semibold text-zinc-900 group-hover:text-[#2b4b80]">
                      {t.nombre}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {t.descripcion ?? "Taller en Autocontrol"}
                    </p>
                    <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-4 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <WrenchIcon size={13} /> {t._count.servicios} servicios
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <RouteIcon size={13} /> {t._count.ordenes} órdenes
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────────────── Pensado para los dos ───────────────── */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-2">
          {/* Clientes */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7">
            <Badge className="bg-[#eef2f7] text-[#2b4b80]">Para vos</Badge>
            <h3 className="mt-3 text-2xl font-bold text-zinc-950">
              Si dejás tu auto
            </h3>
            <ul className="mt-5 space-y-4">
              {[
                { icon: GaugeIcon, t: "Transparencia total", d: "Seguí el avance etapa por etapa, sin llamar ni pasar por el taller." },
                { icon: BellIcon, t: "Te avisamos", d: "Recibí un aviso cuando tu auto esté listo para retirar." },
                { icon: ReceiptIcon, t: "Todo registrado", d: "Detalle de costos y comprobante del servicio, siempre a mano." },
              ].map((f) => (
                <li key={f.t} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-[#2b4b80]">
                    <f.icon size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{f.t}</p>
                    <p className="text-sm text-zinc-500">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Talleres */}
          <div className="rounded-2xl bg-zinc-950 p-6 text-white sm:p-7">
            <Badge className="bg-white/10 text-zinc-200">Para tu taller</Badge>
            <h3 className="mt-3 text-2xl font-bold">Si tenés un taller</h3>
            <ul className="mt-5 space-y-4">
              {[
                { icon: WrenchIcon, t: "Gestión por etapas", d: "Configurá tu propio flujo de trabajo y cargá repuestos, trabajos y fotos." },
                { icon: ShieldCheckIcon, t: "Presupuestos aprobados", d: "El cliente aprueba el presupuesto y queda firmado como contrato." },
                { icon: BellIcon, t: "Menos llamados", d: "Tus clientes se enteran solos: vos trabajás, ellos siguen el progreso." },
              ].map((f) => (
                <li key={f.t} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#5b82c4]">
                    <f.icon size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{f.t}</p>
                    <p className="text-sm text-zinc-400">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/registro"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 sm:w-auto"
            >
              Registrar mi taller <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── CTA final ───────────────── */}
      <section className="px-5 pb-14 sm:px-6 sm:pb-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-zinc-950 px-5 py-12 text-center text-white sm:px-6 sm:py-14">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute -bottom-24 left-1/2 h-56 w-[34rem] max-w-full -translate-x-1/2 rounded-full bg-[#2b4b80]/30 blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Empezá a controlar tus reparaciones
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              Creá tu cuenta gratis, seas cliente o taller. En minutos estás
              siguiendo (o gestionando) la primera orden.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 sm:w-auto"
              >
                Crear cuenta gratis <ArrowRightIcon size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
