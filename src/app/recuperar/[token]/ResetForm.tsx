"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetearPassword, type ActionState } from "@/lib/actions/password";
import { Button, Input, Label } from "@/components/ui";

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    resetearPassword,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          ✅ ¡Listo! Tu contraseña se actualizó. Ya podés ingresar con la nueva.
        </div>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Ir al ingreso
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="confirmar">Repetir contraseña</Label>
        <Input
          id="confirmar"
          name="confirmar"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}{" "}
          <Link href="/recuperar" className="font-medium underline">
            Pedir uno nuevo
          </Link>
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
