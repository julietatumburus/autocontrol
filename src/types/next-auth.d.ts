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
  }
}
