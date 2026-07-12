import SuperAdminShell from "@/components/layout/SuperAdminShell";
import RouteLoadingView from "@/components/common/RouteLoadingView";

export default function Loading() {
  return (
    <SuperAdminShell>
      <RouteLoadingView label="Chargement super admin..." />
    </SuperAdminShell>
  );
}
