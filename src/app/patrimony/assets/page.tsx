import ModulePlaceholderPage from "@/components/modules/ModulePlaceholderPage";

export default async function Page() {
  return (
    <ModulePlaceholderPage
      moduleCode="assets"
      title="Biens et patrimoine"
      categoryLabel="Volet patrimoine"
      description="Inventoriez les biens de l’église : bâtiments, terrains, véhicules, matériels, mobilier et équipements."
      features={[
        "Inventaire détaillé des biens",
        "Catégories : bâtiment, terrain, véhicule, matériel, mobilier",
        "Photo, valeur estimée et localisation",
        "État : bon, moyen, à réparer, hors service",
        "Affectation à un département ou responsable",
        "Documents associés : facture, titre, contrat, garantie"
]}
      nextSteps={[
        "Créer les tables biens et catégories",
        "Créer le formulaire d’ajout d’un bien",
        "Ajouter upload photo/document",
        "Créer la liste filtrable"
]}
    />
  );
}
