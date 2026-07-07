import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="budgets"
      title="Budgets"
      categoryLabel="Volet finances"
      description="Planifiez et suivez les budgets par période, département, activité ou projet."
      features={[
        "Budgets mensuels, trimestriels ou annuels",
        "Budgets par département ou activité",
        "Montant prévu, engagé et consommé",
        "Alertes de dépassement",
        "Suivi des écarts",
        "Rapport budget vs dépenses réelles"
]}
      nextSteps={[
        "Créer les tables budgets et lignes budgétaires",
        "Lier les dépenses aux budgets",
        "Créer les indicateurs d’écart",
        "Ajouter les rapports budgétaires"
]}
    />
  );
}
