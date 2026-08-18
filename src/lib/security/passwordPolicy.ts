export const MIN_PASSWORD_LENGTH = 15;

export const PASSWORD_POLICY_MESSAGE =
  `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;

export function getPasswordCharacterCount(password: string) {
  // Compte les points de code Unicode. Ne pas trim() : une phrase de passe
  // peut volontairement contenir des espaces en début ou fin.
  return Array.from(password).length;
}

export function getPasswordPolicyError(
  password: string | null | undefined
) {
  if (!password || getPasswordCharacterCount(password) < MIN_PASSWORD_LENGTH) {
    return PASSWORD_POLICY_MESSAGE;
  }

  return null;
}
