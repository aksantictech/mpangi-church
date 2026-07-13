export const USER_ROLE_OPTIONS = [
  { value: "church_admin", label: "Admin Église" },
  { value: "pasteur_t", label: "Pasteur T" },
  { value: "pasteur_a", label: "Pasteur A" },
  { value: "charge_afp", label: "Chargé AFP" },
  { value: "responsable_d", label: "Responsable D" },
  { value: "logisticien", label: "Logisticien" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "worker", label: "Ouvrier / utilisateur" },
  { value: "readonly", label: "Lecture seule" },
] as const;

export const USER_ROLE_VALUES = USER_ROLE_OPTIONS.map((role) => role.value);

export type AppUserRole = (typeof USER_ROLE_OPTIONS)[number]["value"];

export function normalizeUserRole(role: string | null | undefined) {
  const normalized = String(role || "worker").trim();

  if (USER_ROLE_VALUES.includes(normalized as AppUserRole)) {
    return normalized;
  }

  return "worker";
}

export function getUserRoleLabel(role: string | null | undefined) {
  const normalized = normalizeUserRole(role);
  return (
    USER_ROLE_OPTIONS.find((option) => option.value === normalized)?.label ??
    "Ouvrier / utilisateur"
  );
}
