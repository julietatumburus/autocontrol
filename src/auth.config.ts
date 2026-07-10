import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

// Configuración base de Auth.js, segura para el runtime "edge" (middleware).
// No importa Prisma ni bcrypt: esos van en src/auth.ts (runtime Node).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.nombre = user.nombre;
      }

      // Impersonación (login-as). Los datos del objetivo llegan desde la
      // action `impersonar` (runtime Node, valida super admin + lee de la DB).
      const upd = session as
        | {
            impersonate?: { id: string; role: UserRole; nombre: string };
            stopImpersonate?: boolean;
          }
        | undefined;

      if (trigger === "update" && upd?.impersonate && token.role === "SUPER_ADMIN") {
        // Guardo la identidad real para poder volver
        token.actorId = token.id;
        token.actorNombre = token.nombre;
        token.id = upd.impersonate.id;
        token.role = upd.impersonate.role;
        token.nombre = upd.impersonate.nombre;
        token.impersonating = true;
      }

      if (trigger === "update" && upd?.stopImpersonate && token.actorId) {
        token.id = token.actorId;
        token.nombre = token.actorNombre;
        token.role = "SUPER_ADMIN";
        token.actorId = undefined;
        token.actorNombre = undefined;
        token.impersonating = false;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.nombre = token.nombre as string;
      }
      session.impersonating = Boolean(token.impersonating);
      session.actorNombre = token.actorNombre as string | undefined;
      return session;
    },
  },
  providers: [], // se completan en src/auth.ts
} satisfies NextAuthConfig;
