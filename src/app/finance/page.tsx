import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="finance_dashboard"
      title="Dashboard finances"
      categoryLabel="Volet finances"
      description="Vue globale des finances de l’église : entrées, dépenses, solde, budgets et rapports."
      features={[
        "Synthèse des recettes et dépenses",
        "Solde par période",
        "Évolution mensuelle des finances",
        "Répartition par type d’entrée et type de dépense",
        "Alertes budgets dépassés",
        "Accès rapide aux exports et rapports"
]}
      nextSteps={[
        "Créer les tables financières de base",
        "Créer le modèle recettes/dépenses",
        "Créer les graphiques du dashboard",
        "Ajouter exports mensuels Excel/PDF"
]}
    />
  );
}
