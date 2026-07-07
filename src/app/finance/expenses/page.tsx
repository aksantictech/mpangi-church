import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="expenses"
      title="Dépenses"
      categoryLabel="Volet finances"
      description="Gérez les dépenses de l’église avec justificatifs, validation et suivi budgétaire."
      features={[
        "Saisie des dépenses avec catégorie et montant",
        "Pièces justificatives : factures, reçus, bons",
        "Workflow de validation",
        "Lien avec budget ou activité",
        "Statuts : brouillon, soumis, validé, rejeté, payé",
        "Export par période, catégorie ou responsable"
]}
      nextSteps={[
        "Créer les tables dépenses et justificatifs",
        "Créer le formulaire de dépense",
        "Ajouter validation par responsable",
        "Ajouter suivi des paiements"
]}
    />
  );
}
