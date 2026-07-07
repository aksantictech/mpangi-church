import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="asset_movements"
      title="Mouvements patrimoine"
      categoryLabel="Volet patrimoine"
      description="Gérez les affectations, sorties, retours, transferts, pertes ou déclassements des biens."
      features={[
        "Affectation d’un bien à un responsable",
        "Transfert entre départements",
        "Sortie temporaire et retour",
        "Perte, casse ou déclassement",
        "Historique complet des mouvements",
        "Traçabilité par date, responsable et motif"
]}
      nextSteps={[
        "Créer les tables mouvements patrimoine",
        "Créer le formulaire de mouvement",
        "Ajouter validation si nécessaire",
        "Ajouter l’historique par bien"
]}
    />
  );
}
