"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { autenticar, type ActionState } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    autenticar,
    undefined,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="redirect" value={redirect} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
