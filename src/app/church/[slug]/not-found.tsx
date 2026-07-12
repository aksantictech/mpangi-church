import RouteNotFoundView from "@/components/common/RouteNotFoundView";

export default function NotFound() {
  return (
    <RouteNotFoundView
      title="Église introuvable"
      description="Cette page publique d’église n’existe pas ou n’est plus disponible."
      backHref="/"
      backLabel="Retour"
    />
  );
}
