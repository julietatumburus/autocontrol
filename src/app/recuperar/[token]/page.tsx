import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import ResetForm from "./ResetForm";

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
          <h1 className="text-xl font-bold text-slate-900">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">
            Elegí una contraseña nueva para tu cuenta.
          </p>
          <ResetForm token={token} />
        </div>
      </div>
    </div>
  );
}
