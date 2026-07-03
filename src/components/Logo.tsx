import { cn } from "@/lib/utils";

/**
 * Isotipo de Autocontrol (logo de marca). Se recorta a círculo por CSS, así
 * queda limpio sobre cualquier fondo. Reemplaza al ícono anterior.
 */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/autocontrol-logo.png"
      alt="Autocontrol"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Logotipo completo: isotipo + palabra "Autocontrol". */
export function Logo({
  size = 32,
  className,
  textClassName,
}: {
  size?: number;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className={cn("font-bold text-slate-900", textClassName)}>
        Autocontrol
      </span>
    </span>
  );
}
