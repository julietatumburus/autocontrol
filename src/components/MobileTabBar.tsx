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

/**
 * Barra de navegación inferior (sólo móvil), al estilo de la app de PlayStation:
 * barra blanca clara pegada abajo, con el borde superior curvado (domo suave).
 * El ítem activo se muestra en color de marca con su etiqueta; los demás, gris.
 */
export default function MobileTabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 sm:hidden">
      <div className="relative">
        {/* Forma curva blanca (como la barra de la PS App) */}
        <svg
          viewBox="0 0 375 70"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[70px] w-full"
          style={{ filter: "drop-shadow(0 -3px 10px rgba(15,23,42,0.07))" }}
        >
          <path d="M0,16 C 96,-5 279,-5 375,16 L375,70 L0,70 Z" fill="white" />
        </svg>

        <div
          className="relative flex items-stretch px-1 pt-3.5 pb-2"
          style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
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
                className="flex flex-1 flex-col items-center gap-1 py-1 transition-transform active:scale-90"
              >
                <span className="relative">
                  <Icon
                    size={23}
                    className={active ? "text-brand-600" : "text-slate-400"}
                  />
                  {it.badge && it.badge > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {it.badge > 9 ? "9+" : it.badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[10.5px] font-semibold leading-none transition-opacity",
                    active ? "text-brand-600 opacity-100" : "opacity-0",
                  )}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
