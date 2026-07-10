import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { LogoMark } from "@/components/Logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?redirect=/admin");
  if (session.user.role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <LogoMark size={28} /> Autocontrol
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs">
              Super admin
            </span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10">
              Salir
            </button>
          </form>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-2">
          <Link
            href="/admin"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            Talleres
          </Link>
          <Link
            href="/admin/clientes"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            Clientes
          </Link>
          <Link
            href="/admin/usuarios"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            Usuarios
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
