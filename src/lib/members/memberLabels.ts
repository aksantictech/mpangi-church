export function getMemberTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    pasteur: "Pasteur",
    pastor: "Pasteur",
    responsable: "Responsable",
    leader: "Leader",
    ouvrier: "Ouvrier",
    worker: "Ouvrier",
    membre: "Membre",
    member: "Membre",
    nouveau_converti: "Nouveau converti",
    new_convert: "Nouveau converti",
    nouveau_accueilli: "Nouveau accueilli",
    visitor: "Visiteur",
    visiteur: "Visiteur",
    inactif: "Inactif",
  };
  return labels[value || ""] || value?.replaceAll("_", " ") || "Membre";
}

export function getMemberStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    actif: "Actif",
    active: "Actif",
    nouveau: "Nouveau",
    a_suivre: "À suivre",
    en_suivi: "En suivi",
    integre: "Intégré",
    irregulier: "Irrégulier",
    inactif: "Inactif",
    suspendu: "Suspendu",
    transfere: "Transféré",
    en_attente: "À valider",
    refuse: "Refusé",
  };
  return labels[value || ""] || value?.replaceAll("_", " ") || "Non défini";
}

export function getDiscipleshipStageLabel(value?: string | null) {
  const labels: Record<string, string> = {
    accueil: "Accueil / découverte",
    nouvelle_naissance: "Nouvelle naissance",
    fondements: "Fondements de la foi",
    bapteme: "Préparation au baptême",
    integration: "Intégration",
    service: "Service actif",
    leadership: "Leadership",
    maturite: "Maturité / mentorat",
  };
  return labels[value || ""] || value?.replaceAll("_", " ") || "À définir";
}

export function getFamilyRoleLabel(value?: string | null) {
  const labels: Record<string, string> = {
    responsable: "Responsable du foyer",
    conjoint: "Conjoint(e)",
    enfant: "Enfant",
    parent: "Parent",
    autre: "Autre proche",
  };
  return labels[value || ""] || value?.replaceAll("_", " ") || "Non renseigné";
}
