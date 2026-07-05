import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import RecuperarForm from "./RecuperarForm";

export default function RecuperarPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-xl font-bold text-slate-900"
        >
          <LogoMark size={32} /> Autocontrol
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresá tu email y te enviamos un enlace para restablecerla.
          </p>
          <RecuperarForm />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            ← Volver al ingreso
          </Link>
        </p>
      </div>
    </div>
  );
}
