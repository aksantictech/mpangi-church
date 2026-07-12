import AppShell from "@/components/layout/AppShell";
import RouteNotFoundView from "@/components/common/RouteNotFoundView";

export default function NotFound() {
  return (
    <AppShell>
      <RouteNotFoundView
        title="Profil introuvable"
        description="L’élément demandé n’existe pas ou n’est plus disponible."
        backHref="/dashboard"
        backLabel="Retour au dashboard"
      />
    </AppShell>
  );
}
