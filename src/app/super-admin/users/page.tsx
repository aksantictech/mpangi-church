import { redirect } from "next/navigation";

export default function RedirectToSuperAdminSettingsPage() {
  redirect("/super-admin/settings");
}
