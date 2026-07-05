"use client";

import { useActionState } from "react";
import { solicitarReset, type ActionState } from "@/lib/actions/password";
import { Button, Input, Label } from "@/components/ui";

export default function RecuperarForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    solicitarReset,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        ✅ Si el email está registrado, te enviamos un enlace para restablecer tu
        contraseña. Revisá tu casilla (y el spam). El enlace vence en 1 hora.
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar enlace"}
      </Button>
    </form>
  );
}
