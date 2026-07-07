import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="asset_maintenance"
      title="Maintenance patrimoine"
      categoryLabel="Volet patrimoine"
      description="Suivez les réparations, maintenances et interventions sur les biens de l’église."
      features={[
        "Demandes de maintenance",
        "Type : réparation, entretien, contrôle, remplacement",
        "Coût estimé et coût réel",
        "Responsable ou prestataire",
        "Statuts : demandé, validé, en cours, terminé",
        "Historique de maintenance par bien"
]}
      nextSteps={[
        "Créer les tables maintenance",
        "Créer le formulaire de demande",
        "Lier maintenance aux dépenses",
        "Ajouter alertes et historique"
]}
    />
  );
}
