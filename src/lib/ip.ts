import { headers } from "next/headers";

/**
 * IP del cliente, para las claves del limitador de tasa.
 * Detrás de un proxy (Coolify/Traefik) llega en `x-forwarded-for`.
 */
export async function ipDelCliente(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "desconocida";
}
