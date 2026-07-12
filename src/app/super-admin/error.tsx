"use client";

import SuperAdminShell from "@/components/layout/SuperAdminShell";
import RouteErrorView from "@/components/common/RouteErrorView";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SuperAdminShell>
      <RouteErrorView
        title="Erreur Super Admin"
        description="Impossible de charger cette section d’administration."
        error={error}
        reset={reset}
        backHref="/super-admin/dashboard"
        backLabel="Retour Super Admin"
      />
    </SuperAdminShell>
  );
}
