import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTallerDelUsuario } from "@/lib/session";
import { Card } from "@/components/ui";
import NuevaOrdenForm from "./NuevaOrdenForm";

export default async function NuevaOrdenPage() {
  const session = await auth();
  const membership = await getTallerDelUsuario(session!.user.id);
  if (!membership) redirect("/panel");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nueva orden de trabajo</h1>
        <p className="text-sm text-slate-500">
          Cargá el cliente, el vehículo y el problema. La orden arranca en la
          primera etapa y el cliente recibe el aviso.
        </p>
      </div>
      <Card>
        <NuevaOrdenForm tallerId={membership.tallerId} />
      </Card>
    </div>
  );
}
