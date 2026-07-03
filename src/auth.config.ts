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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.nombre = user.nombre;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.nombre = token.nombre as string;
      }
      return session;
    },
  },
  providers: [], // se completan en src/auth.ts
} satisfies NextAuthConfig;
