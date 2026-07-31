"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClipboardIcon,
  CalendarIcon,
  BellIcon,
  WrenchIcon,
  LayoutIcon,
  SettingsIcon,
} from "@/components/icons";

const ICONS = {
  ordenes: ClipboardIcon,
  turnos: CalendarIcon,
  agenda: CalendarIcon,
  avisos: BellIcon,
  talleres: WrenchIcon,
  resumen: LayoutIcon,
  taller: SettingsIcon,
} as const;

export type TabItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  exact?: boolean;
  badge?: number;
};

/** Barra de navegación inferior, sólo visible en móvil (tipo app nativa). */
export default function MobileTabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const Icon = ICONS[it.icon];
        const active = it.exact
          ? pathname === it.href
          : pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors active:bg-slate-100",
              active ? "text-brand-600" : "text-slate-500",
            )}
          >
            <span className="relative">
              <Icon size={22} />
              {it.badge && it.badge > 0 ? (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {it.badge > 9 ? "9+" : it.badge}
                </span>
              ) : null}
            </span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
