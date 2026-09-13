import { after } from "next/server";

/**
 * Corre una tarea después de responderle al usuario.
 *
 * Lo usamos para los emails: el SMTP puede tardar hasta 15 segundos (ver los
 * timeouts del mailer) y no tiene sentido que el empleado espere ese tiempo
 * mirando la pantalla para avanzar una etapa o subir fotos.
 *
 * `after()` necesita el contexto de una request. Si no lo hay (un script, el
 * seed), la ejecutamos igual sin bloquear a quien llamó.
 */
export function enDiferido(tarea: () => Promise<unknown>): void {
  const correr = () =>
    Promise.resolve()
      .then(tarea)
      .catch((err) => console.error("[diferido] tarea fallida:", err));

  try {
    after(correr);
  } catch {
    void correr();
  }
}
