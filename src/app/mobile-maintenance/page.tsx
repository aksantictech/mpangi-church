import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  HardDrive,
  Smartphone,
  Wifi,
} from "lucide-react";

import { getCurrentSecurityContext } from "@/lib/security/permissionEngine";

const ALLOWED_ROLES = new Set([
  "super_admin",
  "church_admin",
  "admin_eglise",
]);

const checks = [
  {
    title: "Navigation mobile",
    description:
      "Menu supérieur, barre publique et liens principaux.",
    icon: Smartphone,
  },
  {
    title: "Performance",
    description:
      "Poids des ressources, chargements et animations.",
    icon: Gauge,
  },
  {
    title: "Réseau",
    description:
      "Comportement sur connexion lente et économie de données.",
    icon: Wifi,
  },
  {
    title: "Maintenance",
    description:
      "Backups, scripts temporaires et fichiers volumineux.",
    icon: HardDrive,
  },
];

export default async function MobileMaintenancePage() {
  const context = await getCurrentSecurityContext();

  if (!ALLOWED_ROLES.has(context.role)) {
    redirect("/unauthorized?reason=mobile_maintenance");
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F9FC] px-3 py-5 pb-24 sm:px-6 sm:py-8">
        {/* tout ton contenu actuel */}
      </main>
    </AppShell>
  );
}