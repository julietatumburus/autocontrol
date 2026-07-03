"use client";

import { useTransition } from "react";
import { entregarOrden } from "@/lib/actions/ordenes";
import { Card, Button } from "@/components/ui";

export default function AccionesOrden({
  ordenId,
  estado,
}: {
  ordenId: string;
  estado: string;
}) {
  const [pending, startTransition] = useTransition();

  if (estado !== "PAGADA") return null;

  return (
    <Card>
      <h2 className="mb-2 font-semibold text-slate-900">Cierre</h2>
      <p className="mb-3 text-sm text-slate-500">
        El cliente ya pagó. Marcá la orden como entregada cuando retire el auto.
      </p>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await entregarOrden(ordenId);
          })
        }
        className="w-full"
      >
        {pending ? "Guardando..." : "Marcar como entregada"}
      </Button>
    </Card>
  );
}
