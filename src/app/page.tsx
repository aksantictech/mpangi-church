import { redirect } from "next/navigation";

export default function RedirectPage() {
  // Root route redirects to dashboard.
  redirect("/dashboard");
}
