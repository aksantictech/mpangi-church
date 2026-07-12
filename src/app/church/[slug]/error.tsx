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
      title="Erreur page église"
      description="Impossible de charger cette page publique."
      error={error}
      reset={reset}
      backHref="/"
      backLabel="Retour"
    />
  );
}
