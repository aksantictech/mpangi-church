import { redirect } from "next/navigation";

export default function SettingsSecurityRedirectPage() {
  redirect(
    "/settings/security-audit"
  );
}