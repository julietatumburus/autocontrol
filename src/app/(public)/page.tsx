import Link from "next/link";
import { getTalleresDestacados } from "@/lib/talleres-publicos";
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

// La página no se puede prerenderizar (el nav público lee la sesión), pero la
// consulta de talleres sí se cachea: ver src/lib/talleres-publicos.ts
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const talleres = await getTalleresDestacados();

  return (
    <div className="bg-white">
      {/* ───────────────── Hero (claro) ───────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50/60 to-white">
        {/* Un único glow, más marcado */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[40rem] w-[64rem] max-w-full -translate-x-[35%] rounded-full bg-brand-300/55 blur-[110px]" />

        {/* Rueda que rueda y gira al cruzar (azul acero, sutil, desktop) */}
        <div className="hero-car" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="66" height="66" fill="none">
            <g className="hero-wheel" style={{ transformOrigin: "32px 32px" }}>
              <circle cx="32" cy="32" r="30" fill="#2a405d" stroke="#385c8c" strokeWidth="1.5" />
              <circle cx="32" cy="32" r="25" fill="none" stroke="rgba(99,137,189,0.45)" strokeWidth="1" />
              <circle cx="32" cy="32" r="21" fill="rgba(56,92,140,0.14)" stroke="#6389bd" strokeWidth="2" />
              <g stroke="#97b2d5" strokeWidth="3" strokeLinecap="round">
                <line x1="32" y1="32" x2="32" y2="13" />
                <line x1="32" y1="32" x2="50.1" y2="26.1" />
                <line x1="32" y1="32" x2="43.2" y2="47.4" />
                <line x1="32" y1="32" x2="20.8" y2="47.4" />
                <line x1="32" y1="32" x2="13.9" y2="26.1" />
              </g>
              <g fill="#97b2d5">
                <circle cx="32" cy="22.5" r="1.4" />
                <circle cx="41" cy="29.5" r="1.4" />
                <circle cx="37.6" cy="40" r="1.4" />
                <circle cx="26.4" cy="40" r="1.4" />
                <circle cx="23" cy="29.5" r="1.4" />
              </g>
              <circle cx="32" cy="32" r="5.5" fill="#a1b2c8" />
              <circle cx="32" cy="32" r="2.3" fill="#2a405d" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <span className="hero-rise hero-d1 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-medium text-brand-700 shadow-sm">
              <span className="hero-pulse-dot h-1.5 w-1.5 rounded-full bg-brand-500" />
              Talleres y clientes, en sintonía
            </span>

            <h1 className="hero-rise hero-d2 mt-6 text-[2rem] font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.05]">
              El control de tu auto,
              <br className="hidden sm:block" />{" "}
              <span className="text-brand-600">de principio a fin.</span>
            </h1>

            <p className="hero-rise hero-d3 mt-5 max-w-xl text-base text-slate-500 sm:mt-6 sm:text-lg">
              Dejás tu vehículo y seguís cada etapa de la reparación en tiempo
              real: repuestos, fotos del avance, costos y el aviso cuando está
              listo. Sin levantar el teléfono.
            </p>

            <div className="hero-rise hero-d4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/registro"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition-all hover:bg-brand-700 active:scale-[0.98] sm:w-auto"
              >
                Crear mi cuenta <ArrowRightIcon size={16} />
              </Link>
              <Link
                href="/talleres"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] sm:w-auto"
              >
                Ver talleres
              </Link>
            </div>

            <div className="hero-rise hero-d5 mt-10 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {[
                { icon: GaugeIcon, t: "Seguimiento en vivo" },
                { icon: BellIcon, t: "Avisos automáticos" },
                { icon: ReceiptIcon, t: "Comprobante digital" },
              ].map((f) => (
                <span key={f.t} className="inline-flex items-center gap-2">
                  <f.icon size={16} className="text-brand-500" /> {f.t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Cómo funciona ───────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Cómo funciona
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
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
              className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_6px_-1px_rgba(15,23,42,0.13),0_18px_40px_-10px_rgba(15,23,42,0.30)] transition-transform hover:-translate-y-0.5"
            >
              <span className="absolute right-6 top-5 text-3xl font-bold text-slate-200">
                {s.n}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <s.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── Talleres ───────────────── */}
      <section className="border-t border-slate-200/70 bg-slate-100">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
                Red de talleres
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Talleres en Autocontrol
              </h2>
            </div>
            <Link
              href="/talleres"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              Ver todos <ArrowRightIcon size={14} />
            </Link>
          </div>

          {talleres.length === 0 ? (
            <Card className="text-center text-slate-500">
              Todavía no hay talleres activos. ¿Tenés un taller?{" "}
              <Link href="/registro" className="font-medium text-brand-600 hover:underline">
                Registralo acá
              </Link>
              .
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talleres.map((t) => (
                <Link key={t.id} href={`/talleres/${t.slug}`} className="group">
                  <div className="h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_6px_-1px_rgba(15,23,42,0.13),0_18px_40px_-10px_rgba(15,23,42,0.30)] transition-transform hover:-translate-y-0.5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <TallerLogo src={t.logoUrl ? `/api/img/logo/${t.id}` : null} nombre={t.nombre} size={48} />
                      <Badge className="bg-emerald-50 text-emerald-700">Activo</Badge>
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-brand-600">
                      {t.nombre}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {t.descripcion ?? "Taller en Autocontrol"}
                    </p>
                    <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
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
      <section className="border-t border-slate-100">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-2">
          {/* Clientes */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_6px_-1px_rgba(15,23,42,0.13),0_18px_40px_-10px_rgba(15,23,42,0.30)] sm:p-7">
            <Badge className="bg-brand-50 text-brand-700">Para vos</Badge>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              Si dejás tu auto
            </h3>
            <ul className="mt-5 space-y-4">
              {[
                { icon: GaugeIcon, t: "Transparencia total", d: "Seguí el avance etapa por etapa, sin llamar ni pasar por el taller." },
                { icon: BellIcon, t: "Te avisamos", d: "Recibí un aviso cuando tu auto esté listo para retirar." },
                { icon: ReceiptIcon, t: "Todo registrado", d: "Detalle de costos y comprobante del servicio, siempre a mano." },
              ].map((f) => (
                <li key={f.t} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <f.icon size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{f.t}</p>
                    <p className="text-sm text-slate-500">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Talleres (acento navy) */}
          <div className="rounded-2xl bg-brand-600 p-6 text-white shadow-[0_12px_30px_-10px_rgba(43,75,128,0.5)] sm:p-7">
            <Badge className="bg-white/15 text-white">Para tu taller</Badge>
            <h3 className="mt-3 text-2xl font-bold">Si tenés un taller</h3>
            <ul className="mt-5 space-y-4">
              {[
                { icon: WrenchIcon, t: "Gestión por etapas", d: "Configurá tu propio flujo de trabajo y cargá repuestos, trabajos y fotos." },
                { icon: ShieldCheckIcon, t: "Presupuestos aprobados", d: "El cliente aprueba el presupuesto y queda firmado como contrato." },
                { icon: BellIcon, t: "Menos llamados", d: "Tus clientes se enteran solos: vos trabajás, ellos siguen el progreso." },
              ].map((f) => (
                <li key={f.t} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                    <f.icon size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{f.t}</p>
                    <p className="text-sm text-brand-100">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/registro"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-brand-700 transition-all hover:bg-brand-50 active:scale-[0.98] sm:w-auto"
            >
              Registrar mi taller <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── CTA final ───────────────── */}
      <section className="px-5 pb-14 sm:px-6 sm:pb-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-5 py-12 text-center text-white sm:px-6 sm:py-14">
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-[34rem] max-w-full -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Empezá a controlar tus reparaciones
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Creá tu cuenta gratis, seas cliente o taller. En minutos estás
              siguiendo (o gestionando) la primera orden.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-brand-700 transition-all hover:bg-brand-50 active:scale-[0.98] sm:w-auto"
              >
                Crear cuenta gratis <ArrowRightIcon size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] sm:w-auto"
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
