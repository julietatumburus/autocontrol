import { cn } from "@/lib/utils";

/**
 * Logo de un taller. Si tiene logoUrl muestra la imagen; si no, un fallback
 * con la inicial del taller sobre un fondo neutro.
 */
export function TallerLogo({
  src,
  nombre,
  size = 48,
  className,
}: {
  src?: string | null;
  nombre: string;
  size?: number;
  className?: string;
}) {
  const radius = Math.round(size / 4);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={`Logo de ${nombre}`}
        width={size}
        height={size}
        className={cn("object-cover", className)}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-slate-100 font-bold text-slate-400",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: size * 0.4,
      }}
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}
