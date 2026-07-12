import { redirect } from "next/navigation";

export default function RedirectPage() {
  // Super admin root redirects to dashboard.
  redirect("/super-admin/dashboard");
}
