import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// El alta de taller por parte de un cliente quedó deshabilitada:
// los clientes solo exploran talleres (/talleres) y accionan sobre ellos.
// Un taller se da de alta desde el registro público de talleres.
export default function RegistrarTallerPage() {
  redirect("/talleres");
}
