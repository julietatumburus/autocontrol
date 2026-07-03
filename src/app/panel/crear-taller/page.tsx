import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTallerDelUsuario } from "@/lib/session";
import { Card } from "@/components/ui";
import CrearTallerForm from "./CrearTallerForm";

export default async function CrearTallerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const membership = await getTallerDelUsuario(session.user.id);
  if (membership) redirect("/panel");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Creá tu taller</h1>
        <p className="text-sm text-slate-500">
          Completá los datos para empezar a gestionar tus reparaciones.
        </p>
      </div>
      <Card>
        <CrearTallerForm />
      </Card>
    </div>
  );
}
