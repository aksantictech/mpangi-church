import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="meetings_minutes"
      title="PV et réunions"
      categoryLabel="Volet administratif"
      description="Gérez les réunions, procès-verbaux, décisions et actions de suivi."
      features={[
        "Création de réunions avec participants et ordre du jour",
        "Rédaction et archivage des procès-verbaux",
        "Décisions prises et responsables assignés",
        "Actions de suivi liées aux décisions",
        "Pièces jointes et documents de réunion",
        "Export PDF des procès-verbaux"
]}
      nextSteps={[
        "Créer les tables réunions, PV et décisions",
        "Créer le formulaire de réunion",
        "Ajouter l’éditeur de PV",
        "Ajouter export PDF et suivi des décisions"
]}
    />
  );
}
