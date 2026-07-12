"use client";

import AppShell from "@/components/layout/AppShell";
import RouteErrorView from "@/components/common/RouteErrorView";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <RouteErrorView
        title="Erreur suivi des âmes"
        description="Impossible de charger cette section correctement."
        error={error}
        reset={reset}
        backHref="/dashboard"
        backLabel="Retour au dashboard"
      />
    </AppShell>
  );
}
