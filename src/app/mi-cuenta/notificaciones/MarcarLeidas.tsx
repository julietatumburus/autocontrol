"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { marcarTodasLeidas } from "@/lib/actions/notif";

/** Al montar (entrar a Avisos) marca todas las notificaciones como leídas. */
export default function MarcarLeidas() {
  const router = useRouter();
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    (async () => {
      await marcarTodasLeidas();
      router.refresh(); // actualiza la campanita del header
    })();
  }, [router]);

  return null;
}
