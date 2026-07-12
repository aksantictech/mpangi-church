import RouteNotFoundView from "@/components/common/RouteNotFoundView";

export default function NotFound() {
  return (
    <RouteNotFoundView
      title="Page introuvable"
      description="La page demandée n’existe pas ou n’est plus disponible."
      backHref="/dashboard"
      backLabel="Retour au dashboard"
    />
  );
}
