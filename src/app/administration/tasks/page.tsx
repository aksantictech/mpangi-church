import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="administrative_tasks"
      title="Tâches administratives"
      categoryLabel="Volet administratif"
      description="Organisez les tâches internes, responsabilités, délais et suivi administratif de l’église."
      features={[
        "Création de tâches avec responsable et échéance",
        "Priorités : faible, normale, urgente",
        "Statuts : à faire, en cours, en attente, terminé",
        "Lien avec courrier, réunion, décision ou document",
        "Suivi par responsable et par département",
        "Alertes pour tâches en retard"
]}
      nextSteps={[
        "Créer les tables tâches administratives",
        "Créer la vue liste Kanban ou tableau",
        "Ajouter les rappels et notifications",
        "Ajouter les rapports d’avancement"
]}
    />
  );
}
