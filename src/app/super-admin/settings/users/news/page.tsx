import { redirect } from "next/navigation";

export default function RedirectToNewUserPage() {
  redirect("/super-admin/users/new");
}
