import { redirect } from "next/navigation";

export default function RedirectPage() {
  // Legacy security page redirects to password page.
  redirect("/profile/password");
}
