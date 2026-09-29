import { redirect } from "next/navigation";

// /admin no tiene contenido propio: lleva directo a los pedidos.
export default function Admin() {
  redirect("/admin/pedidos");
}
