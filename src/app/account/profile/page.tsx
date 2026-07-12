import { redirect } from "next/navigation";

export default function RedirectPage() {
  // Legacy account profile redirects to the stable profile page.
  redirect("/profile");
}
