"use client";

import { useState, useTransition } from "react";
import { responderPresupuesto } from "@/lib/actions/presupuesto";
import { Button, Input, Label } from "@/components/ui";

export default function PresupuestoAprobacion({
  presupuestoId,
  dniActual = "",
}: {
  presupuestoId: string;
  dniActual?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [dni, setDni] = useState(dniActual);

  function responder(decision: "APROBAR" | "RECHAZAR") {
    if (decision === "APROBAR" && dni.trim().length < 6) {
      setError("Ingresá tu DNI para firmar el presupuesto.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await responderPresupuesto(
        presupuestoId,
        decision,
        decision === "RECHAZAR" ? motivo : undefined,
        decision === "APROBAR" ? dni.trim() : undefined,
      );
      if (res?.error) setError(res.error);
    });
  }

  if (rechazando) {
    return (
      <div className="space-y-2">
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          placeholder="¿Por qué lo rechazás? (opcional)"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => responder("RECHAZAR")}
          >
            {pending ? "Enviando..." : "Confirmar rechazo"}
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setRechazando(false)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="firma-dni">Tu DNI (firma)</Label>
        <Input
          id="firma-dni"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          inputMode="numeric"
          placeholder="Ej: 30123456"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          disabled={pending}
          onClick={() => responder("APROBAR")}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {pending ? "Procesando..." : "✓ Aprobar y firmar"}
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => setRechazando(true)}
          className="flex-1"
        >
          Rechazar
        </Button>
      </div>
      <p className="text-center text-xs text-slate-400">
        Al aprobar, se genera el contrato con tu nombre y DNI, y los del taller,
        como firma.
      </p>
    </div>
  );
}
