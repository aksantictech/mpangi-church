import AppShell from "@/components/layout/AppShell";
import RouteLoadingView from "@/components/common/RouteLoadingView";

export default function Loading() {
  return (
    <AppShell>
      <RouteLoadingView label="Chargement paramètres..." />
    </AppShell>
  );
}
