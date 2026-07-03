"use client";

import { useActionState, useState } from "react";
import { crearTurno } from "@/lib/actions/turnos";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

type FechaSlot = { fecha: string; etiqueta: string; slots: string[] };

export default function ReservarTurno({
  tallerId,
  fechas,
  logueado,
  nombre,
  email,
}: {
  tallerId: string;
  fechas: FechaSlot[];
  logueado: boolean;
  nombre: string;
  email: string;
}) {
  const [tipo, setTipo] = useState<"PRESUPUESTO" | "VISITA">("PRESUPUESTO");
  const [fecha, setFecha] = useState<string>(fechas[0]?.fecha ?? "");
  const [hora, setHora] = useState<string>("");
  const [state, action, pending] = useActionState(crearTurno, undefined);

  const slots = fechas.find((f) => f.fecha === fecha)?.slots ?? [];

  if (state?.ok) {
    return (
      <div className="py-6 text-center">
        <p className="text-2xl">✅</p>
        <h2 className="mt-2 text-lg font-bold text-slate-900">
          ¡Turno reservado!
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Te enviamos la confirmación por email. También te vamos a recordar el
          turno 24 horas antes.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="tallerId" value={tallerId} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="hora" value={hora} />

      {/* Tipo */}
      <div>
        <Label>¿Qué necesitás?</Label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["PRESUPUESTO", "VISITA"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                tipo === t
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {t === "PRESUPUESTO" ? "Presupuesto" : "Visita"}
            </button>
          ))}
        </div>
      </div>

      {/* Fecha */}
      <div>
        <Label>Día</Label>
        <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
          {fechas.map((f) => (
            <button
              key={f.fecha}
              type="button"
              onClick={() => {
                setFecha(f.fecha);
                setHora("");
              }}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                fecha === f.fecha
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* Hora */}
      <div>
        <Label>Horario</Label>
        <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHora(h)}
              className={cn(
                "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                hora === h
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Datos de contacto */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        {!logueado && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Sacá tu turno sin registrarte. Si querés ver el seguimiento y recibir
            avisos en la app,{" "}
            <a href="/registro" className="font-medium text-brand-600 hover:underline">
              creá tu cuenta
            </a>
            .
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={nombre} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              required
              readOnly={logueado && !!email}
            />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono (opcional)</Label>
            <Input id="telefono" name="telefono" />
          </div>
          <div>
            <Label htmlFor="vehiculo">Vehículo (opcional)</Label>
            <Input id="vehiculo" name="vehiculo" placeholder="Ej: VW Gol 2018" />
          </div>
        </div>
        <div>
          <Label htmlFor="motivo">Motivo / detalle (opcional)</Label>
          <textarea
            id="motivo"
            name="motivo"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending || !hora} className="w-full">
        {pending
          ? "Reservando..."
          : hora
            ? `Reservar turno ${fechas.find((f) => f.fecha === fecha)?.etiqueta ?? ""} ${hora}`
            : "Elegí un horario"}
      </Button>
    </form>
  );
}
