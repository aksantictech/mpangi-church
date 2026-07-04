type ChurchPublicNameInput = {
  name?: string | null;
  public_name?: string | null;
  pwa_name?: string | null;
};

export function getPublicChurchName(church: ChurchPublicNameInput) {
  const pwaName = church.pwa_name?.trim();

  if (pwaName) {
    return pwaName;
  }

  const publicName = church.public_name?.trim();

  if (publicName) {
    return publicName;
  }

  const name = church.name?.trim();

  if (!name) {
    return "Église";
  }

  return name.replace(/\s*[,|-]?\s*extension.*$/i, "").trim();
}