"use client";

import RouteErrorView from "@/components/common/RouteErrorView";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorView
      title="Erreur extensions"
      description="Impossible de charger le module extensions."
      error={error}
      reset={reset}
      backHref="/dashboard"
      backLabel="Retour au dashboard"
    />
  );
}
