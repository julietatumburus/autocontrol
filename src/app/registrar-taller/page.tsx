import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTallerDelUsuario } from "@/lib/session";
import { LogoMark } from "@/components/Logo";
import { Card } from "@/components/ui";
import CrearTallerForm from "@/app/panel/crear-taller/CrearTallerForm";

export const dynamic = "force-dynamic";

export default async function RegistrarTallerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/registrar-taller");

  // Si ya tiene un taller, va directo al panel.
  const membership = await getTallerDelUsuario(session.user.id);
  if (membership) redirect("/panel");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href="/mi-cuenta"
          className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900"
        >
          <LogoMark size={32} /> Autocontrol
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Registrá tu taller</h1>
          <p className="mt-1 text-sm text-slate-500">
            Seguí siendo cliente y, además, gestioná tu taller desde la misma
            cuenta.
          </p>
        </div>

        <Card>
          <CrearTallerForm />
        </Card>

        <p className="text-center text-sm text-slate-500">
          <Link href="/mi-cuenta" className="font-medium text-brand-600 hover:underline">
            ← Volver a mi cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
