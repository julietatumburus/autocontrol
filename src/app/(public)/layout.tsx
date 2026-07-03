import PublicNav from "@/components/PublicNav";
import { LogoMark } from "@/components/Logo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <LogoMark size={24} /> Autocontrol
            </span>
            <span>Seguí la reparación de tu auto, paso a paso.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
