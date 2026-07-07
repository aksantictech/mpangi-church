import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="offerings"
      title="Offrandes, dîmes et dons"
      categoryLabel="Volet finances"
      description="Enregistrez les entrées financières : offrandes, dîmes, dons, cotisations et contributions spéciales."
      features={[
        "Saisie des offrandes par culte ou événement",
        "Dîmes et dons avec ou sans identification du fidèle",
        "Catégories d’entrées personnalisables",
        "Mode de paiement : cash, mobile money, banque",
        "Validation par responsable financier",
        "Export par période, catégorie ou événement"
]}
      nextSteps={[
        "Créer les tables recettes et catégories",
        "Créer le formulaire de saisie des entrées",
        "Ajouter validation et historique",
        "Ajouter export Excel"
]}
    />
  );
}
