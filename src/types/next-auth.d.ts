import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

// Extiende los tipos de Auth.js para incluir el rol y el nombre del usuario.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      nombre: string;
    } & DefaultSession["user"];
    /** Está el super admin viendo como otro usuario */
    impersonating?: boolean;
    /** Nombre del super admin real (mientras impersona) */
    actorNombre?: string;
    /** Payload para iniciar impersonación (solo se usa en unstable_update) */
    impersonate?: { id: string; role: UserRole; nombre: string };
    /** Señal para terminar la impersonación (solo se usa en unstable_update) */
    stopImpersonate?: boolean;
  }

  interface User {
    role: UserRole;
    nombre: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    nombre: string;
    // Impersonación
    impersonating?: boolean;
    actorId?: string;
    actorNombre?: string;
  }
}
