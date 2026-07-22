"use client";

import { useActionState, useState } from "react";
import {
  registrarCliente,
  registrarTaller,
  type ActionState,
} from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { cn as _cn } from "@/lib/utils";

type Tab = "cliente" | "taller";

export default function RegistroTabs() {
  const [tab, setTab] = useState<Tab>("cliente");

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-slate-500">
        Elegí el tipo de cuenta que querés crear.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setTab("cliente")}
          className={_cn(
            "rounded-md py-2 text-sm font-medium transition-colors",
            tab === "cliente" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
          )}
        >
          Soy cliente
        </button>
        <button
          onClick={() => setTab("taller")}
          className={_cn(
            "rounded-md py-2 text-sm font-medium transition-colors",
            tab === "taller" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
          )}
        >
          Soy taller
        </button>
      </div>

      {tab === "cliente" ? <ClienteForm /> : <TallerForm />}
    </div>
  );
}

function ClienteForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    registrarCliente,
    undefined,
  );
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="c-nombre">Nombre completo</Label>
        <Input id="c-nombre" name="nombre" required />
      </div>
      <div>
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="c-tel">Teléfono</Label>
        <Input id="c-tel" name="telefono" type="tel" required />
      </div>
      <div>
        <Label htmlFor="c-dni">DNI</Label>
        <Input id="c-dni" name="dni" inputMode="numeric" required />
        <p className="mt-1 text-xs text-slate-400">
          Lo usamos como tu identificación al firmar presupuestos.
        </p>
      </div>
      <div>
        <Label htmlFor="c-pass">Contraseña</Label>
        <Input id="c-pass" name="password" type="password" required minLength={6} />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando..." : "Crear cuenta de cliente"}
      </Button>
    </form>
  );
}

function TallerForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    registrarTaller,
    undefined,
  );
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="t-taller">Nombre del taller</Label>
        <Input id="t-taller" name="nombreTaller" required />
      </div>
      <div>
        <Label htmlFor="t-nombre">Tu nombre</Label>
        <Input id="t-nombre" name="nombre" required />
      </div>
      <div>
        <Label htmlFor="t-email">Email</Label>
        <Input id="t-email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="t-tel">Teléfono</Label>
        <Input id="t-tel" name="telefono" type="tel" required />
      </div>
      <div>
        <Label htmlFor="t-dni">DNI</Label>
        <Input id="t-dni" name="dni" inputMode="numeric" required />
        <p className="mt-1 text-xs text-slate-400">
          Se usa como identificación al firmar presupuestos.
        </p>
      </div>
      <div>
        <Label htmlFor="t-pass">Contraseña</Label>
        <Input id="t-pass" name="password" type="password" required minLength={6} />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Tu taller quedará pendiente de aprobación por el equipo de Autocontrol
        antes de aparecer públicamente.
      </p>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando..." : "Registrar taller"}
      </Button>
    </form>
  );
}
