import SuperAdminShell from "@/components/layout/SuperAdminShell";
import RouteNotFoundView from "@/components/common/RouteNotFoundView";

export default function NotFound() {
  return (
    <SuperAdminShell>
      <RouteNotFoundView
        title="Page super admin introuvable"
        description="La page demandée n’existe pas ou n’est plus disponible."
        backHref="/super-admin/dashboard"
        backLabel="Retour Super Admin"
      />
    </SuperAdminShell>
  );
}
