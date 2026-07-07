import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="document_transmissions"
      title="Transmission interne des documents"
      categoryLabel="Volet administratif"
      description="Suivez les documents transmis entre responsables, services ou départements avec accusé de réception."
      features={[
        "Transmission d’un document à un utilisateur, service ou département",
        "Accusé de réception numérique",
        "Historique complet des transferts",
        "Commentaires internes et consignes de traitement",
        "Statuts : envoyé, reçu, lu, traité, retourné, archivé",
        "Traçabilité par date, émetteur, destinataire et objet"
]}
      nextSteps={[
        "Créer les tables transmissions et étapes de transmission",
        "Lier les transmissions aux courriers et documents",
        "Créer la boîte de réception interne",
        "Ajouter l’accusé de réception et les notifications"
]}
    />
  );
}
