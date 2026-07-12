import RouteNotFoundView from "@/components/common/RouteNotFoundView";

export default function NotFound() {
  return (
    <RouteNotFoundView
      title="Extension introuvable"
      description="L’élément demandé n’existe pas ou n’est plus disponible."
      backHref="/extensions"
      backLabel="Retour aux extensions"
    />
  );
}
