import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="correspondence"
      title="Gestion des courriers"
      categoryLabel="Volet administratif"
      description="Centralisez les courriers entrants, sortants et internes avec suivi, statut, pièces jointes et responsabilité."
      features={[
        "Courriers entrants avec référence, expéditeur, objet et date de réception",
        "Courriers sortants avec destinataire, objet, statut et date d’envoi",
        "Courriers internes entre services, départements ou responsables",
        "Pièces jointes : lettres, scans, décisions, notes et documents officiels",
        "Statuts : reçu, en traitement, transmis, clôturé, archivé",
        "Recherche par référence, objet, contact, période ou responsable"
]}
      nextSteps={[
        "Créer les tables courriers et pièces jointes",
        "Créer le formulaire d’ajout courrier entrant/sortant/interne",
        "Créer la liste filtrable avec statuts et priorités",
        "Ajouter la transmission interne et l’historique des actions"
]}
    />
  );
}
