import { describe, it, expect } from "vitest";
import { escapeHtml } from "./html";
import { emailTemplate, emailTemplateHtml } from "./mailer";

describe("escapeHtml", () => {
  it("neutraliza las etiquetas", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("escapa comillas y ampersands", () => {
    expect(escapeHtml(`a & "b" 'c'`)).toBe("a &amp; &quot;b&quot; &#39;c&#39;");
  });
});

describe("emailTemplate", () => {
  it("no deja pasar HTML que escribió un usuario", () => {
    // El cuerpo del chat y el motivo de rechazo van a parar acá: sin escapar,
    // un cliente podía inyectar un enlace de phishing en el mail del taller.
    const html = emailTemplate(
      "Nuevo mensaje",
      'Hola <a href="http://malo.example">hacé clic acá</a>',
    );
    expect(html).not.toContain("<a href");
    expect(html).toContain("&lt;a href=&quot;http://malo.example&quot;&gt;");
  });

  it("escapa también el título", () => {
    const html = emailTemplate("<img src=x onerror=alert(1)>", "hola");
    expect(html).not.toContain("<img");
  });

  it("convierte los saltos de línea en <br>", () => {
    expect(emailTemplate("t", "linea 1\nlinea 2")).toContain(
      "linea 1<br>linea 2",
    );
  });

  it("emailTemplateHtml sí respeta el HTML propio de la app", () => {
    const html = emailTemplateHtml("Recuperá tu contraseña", '<a href="/x">ir</a>');
    expect(html).toContain('<a href="/x">ir</a>');
  });
});
