"use client";

import { useActionState } from "react";
import { actualizarAgenda } from "@/lib/actions/taller";
import { Button, Input, Label, Select } from "@/components/ui";

const DIAS = [
  { v: 1, l: "Lun" },
  { v: 2, l: "Mar" },
  { v: 3, l: "Mié" },
  { v: 4, l: "Jue" },
  { v: 5, l: "Vie" },
  { v: 6, l: "Sáb" },
  { v: 0, l: "Dom" },
];

export default function AgendaConfig({
  taller,
}: {
  taller: {
    id: string;
    agendaActiva: boolean;
    agendaApertura: string;
    agendaCierre: string;
    agendaDuracionMin: number;
    agendaDias: number[];
  };
}) {
  const [state, action, pending] = useActionState(actualizarAgenda, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tallerId" value={taller.id} />

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="agendaActiva"
          defaultChecked={taller.agendaActiva}
          className="h-4 w-4 rounded border-slate-300"
        />
        Tomar turnos online
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="agendaApertura">Abre</Label>
          <Input
            id="agendaApertura"
            name="agendaApertura"
            type="time"
            defaultValue={taller.agendaApertura}
            required
          />
        </div>
        <div>
          <Label htmlFor="agendaCierre">Cierra</Label>
          <Input
            id="agendaCierre"
            name="agendaCierre"
            type="time"
            defaultValue={taller.agendaCierre}
            required
          />
        </div>
        <div>
          <Label htmlFor="agendaDuracionMin">Duración del turno</Label>
          <Select
            id="agendaDuracionMin"
            name="agendaDuracionMin"
            defaultValue={String(taller.agendaDuracionMin)}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>Días que atendés</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {DIAS.map((d) => (
            <label
              key={d.v}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
            >
              <input
                type="checkbox"
                name="agendaDias"
                value={d.v}
                defaultChecked={taller.agendaDias.includes(d.v)}
                className="sr-only"
              />
              {d.l}
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">✅ Agenda actualizada.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar agenda"}
      </Button>
    </form>
  );
}
