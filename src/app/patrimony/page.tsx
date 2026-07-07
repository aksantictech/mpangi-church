import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="patrimony_dashboard"
      title="Dashboard patrimoine"
      categoryLabel="Volet patrimoine"
      description="Vue globale du patrimoine de l’église : biens, état, maintenance, valeur et affectations."
      features={[
        "Nombre de biens par catégorie",
        "État général du patrimoine",
        "Biens à réparer ou à renouveler",
        "Valeur estimée du patrimoine",
        "Mouvements récents",
        "Alertes de maintenance"
]}
      nextSteps={[
        "Créer les tables patrimoine",
        "Créer la page inventaire des biens",
        "Ajouter photos et documents",
        "Créer les indicateurs du dashboard"
]}
    />
  );
}
