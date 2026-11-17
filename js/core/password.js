import { normalizeSecret } from './crypto.js';

export const MIN_PASSWORD_LENGTH = 10;

export class PasswordTooShortError extends Error {
  constructor(minLength = MIN_PASSWORD_LENGTH) {
    super(`La password deve avere almeno ${minLength} caratteri`);
    this.name = 'PasswordTooShortError';
    this.minLength = minLength;
  }
}

// Lunghezza in caratteri dopo la normalizzazione NFC: così «ñ» digitata come
// una lettera sola o come n + tilde conta uguale su ogni tastiera.
export function passwordLength(password) {
  return [...normalizeSecret(password)].length;
}

export function assertPasswordLength(password) {
  if (passwordLength(password) < MIN_PASSWORD_LENGTH) throw new PasswordTooShortError();
}

// debole: sotto MIN_PASSWORD_LENGTH caratteri.
// buona: da 14 caratteri, con almeno tre tipi tra minuscole, maiuscole, cifre, simboli.
// media: tutti gli altri casi.
export function passwordStrength(password) {
  const text = normalizeSecret(password);
  const length = [...text].length;
  if (length < MIN_PASSWORD_LENGTH) return 'debole';
  const kinds = [/\p{Ll}/u, /\p{Lu}/u, /\p{Nd}/u, /[^\p{L}\p{N}]/u].filter((re) => re.test(text)).length;
  return length >= 14 && kinds >= 3 ? 'buona' : 'media';
}
