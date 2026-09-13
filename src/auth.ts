import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { consumir, devolver } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** IP del pedido de login, para la clave del limitador. */
function ipDe(request: Request | undefined): string {
  const fwd = request?.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request?.headers.get("x-real-ip") ?? "desconocida";
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const emailNorm = email.toLowerCase();

        // Freno a la fuerza bruta. Va acá y no solo en la server action del
        // formulario porque /api/auth/callback/credentials es un endpoint
        // público: pegándole directo se salteaba el límite de la action.
        const claveEmail = `auth:email:${emailNorm}`;
        if (!consumir(claveEmail, 10, 15 * 60_000).permitido) return null;
        if (!consumir(`auth:ip:${ipDe(request)}`, 30, 15 * 60_000).permitido) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: emailNorm },
        });
        if (!user) return null;
        if (!user.activo) return null; // cuenta dada de baja

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) return null;

        // Login correcto: se limpia el contador de esa cuenta.
        devolver(claveEmail);

        return {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          role: user.role,
        };
      },
    }),
  ],
});
