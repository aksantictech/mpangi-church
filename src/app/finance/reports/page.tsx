import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="financial_reports"
      title="Rapports financiers"
      categoryLabel="Volet finances"
      description="Générez les rapports financiers de l’église par période, catégorie, département ou événement."
      features={[
        "Rapport mensuel des entrées et sorties",
        "Rapport par type d’opération",
        "Rapport par département ou projet",
        "Export Excel et PDF",
        "Synthèse pour pasteur ou comité",
        "Historique des rapports générés"
]}
      nextSteps={[
        "Définir les modèles de rapports",
        "Créer l’export Excel",
        "Créer l’export PDF",
        "Ajouter filtres et période personnalisée"
]}
    />
  );
}
