import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { LogoMark } from "@/components/Logo";
import { ArrowLeftIcon } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeftIcon size={16} /> Volver al inicio
      </Link>
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-xl font-bold text-slate-900"
        >
          <LogoMark size={32} /> Autocontrol
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Ingresá a tu cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Clientes y talleres ingresan acá.
          </p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="font-medium text-brand-600 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
