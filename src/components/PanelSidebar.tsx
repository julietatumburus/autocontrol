"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutIcon,
  ClipboardIcon,
  CalendarIcon,
  SettingsIcon,
} from "@/components/icons";

const items = [
  { href: "/panel", label: "Resumen", Icon: LayoutIcon, exact: true },
  { href: "/panel/ordenes", label: "Órdenes", Icon: ClipboardIcon },
  { href: "/panel/agenda", label: "Agenda", Icon: CalendarIcon },
  { href: "/panel/config", label: "Mi taller", Icon: SettingsIcon },
];

export default function PanelSidebar({
  agendaPendientes = 0,
}: {
  agendaPendientes?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {items.map((it) => {
        const active = it.exact
          ? pathname === it.href
          : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <it.Icon size={18} />
            <span>{it.label}</span>
            {it.href === "/panel/agenda" && agendaPendientes > 0 && (
              <span
                className={cn(
                  "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold",
                  active ? "bg-white text-brand-700" : "bg-red-500 text-white",
                )}
              >
                {agendaPendientes}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
