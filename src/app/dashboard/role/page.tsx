import { redirect } from "next/navigation";

export default function RoleDashboardPage() {
  // Un seul dashboard par compte : /dashboard adapte déjà les données
  // et les cartes au rôle courant.
  redirect("/dashboard");
}
