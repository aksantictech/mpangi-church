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
      title="Erreur application"
      description="Une erreur inattendue a empêché le chargement de cette page."
      error={error}
      reset={reset}
      backHref="/dashboard"
      backLabel="Retour au dashboard"
    />
  );
}
