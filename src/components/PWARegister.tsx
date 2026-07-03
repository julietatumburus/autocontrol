"use client";

import { useEffect } from "react";

/** Registra el service worker para habilitar la instalación / offline. */
export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignorar errores de registro */
      });
    }
  }, []);
  return null;
}
