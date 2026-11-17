// Primitive di cifratura (WebCrypto). Nessuna libreria esterna.
export const PBKDF2_ITERATIONS = 600000;

const ENVELOPE_VERSION = 1;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class WrongSecretError extends Error {
  constructor(message = 'Password o codice di recupero non corretti') {
    super(message);
    this.name = 'WrongSecretError';
  }
}

// Le password si confrontano sempre in forma NFC: la stessa parola digitata con
// tastiere diverse (ñ precomposta oppure n + tilde) apre sempre il vault.
export function normalizeSecret(secret) {
  if (typeof secret !== 'string') throw new TypeError('La password deve essere una stringa');
  return secret.normalize('NFC');
}

export function randomBytes(length) {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

export function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Ricava da un segreto (già normalizzato) la chiave che custodisce la chiave dei dati.
export async function deriveWrapKey(secret, salt, iterations) {
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new RangeError('Le ripetizioni PBKDF2 devono essere un intero >= 1');
  }
  const subtle = globalThis.crypto.subtle;
  const material = await subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function importDataKey(rawBytes) {
  // extractable: serve solo a ricustodire la stessa chiave quando si cambia password
  return globalThis.crypto.subtle.importKey('raw', rawBytes, 'AES-GCM', true, ['encrypt', 'decrypt']);
}

function assertEnvelope(envelope) {
  if (!envelope || envelope.v !== ENVELOPE_VERSION || typeof envelope.iv !== 'string' || typeof envelope.ct !== 'string') {
    throw new TypeError('Busta cifrata non valida');
  }
}

// AES-GCM con IV casuale di 12 byte per ogni messaggio.
export async function sealBytes(key, bytes) {
  const data = ArrayBuffer.isView(bytes) ? bytes : new Uint8Array(bytes);
  const iv = randomBytes(12);
  const ct = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  return { v: ENVELOPE_VERSION, iv: bytesToBase64(iv), ct: bytesToBase64(ct) };
}

export async function openBytes(key, envelope) {
  assertEnvelope(envelope);
  const iv = base64ToBytes(envelope.iv);
  const ct = base64ToBytes(envelope.ct);
  // Una busta fatta male è un dato corrotto, non una password sbagliata: si
  // riconosce prima di provare a decifrare (IV di 12 byte, almeno il tag da 16).
  if (iv.length !== 12 || ct.length < 16) throw new TypeError('Busta cifrata non valida');
  return new Uint8Array(await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
}

const sessionKeys = new WeakMap();

// La sessione espone solo cifra/decifra; la chiave dei dati resta qui dentro.
export function createSession(dataKey) {
  const session = Object.freeze({
    async encryptJson(value) {
      const text = JSON.stringify(value);
      if (text === undefined) throw new TypeError('Valore non serializzabile in JSON');
      return sealBytes(dataKey, encoder.encode(text));
    },
    async decryptJson(envelope) {
      return JSON.parse(decoder.decode(await openBytes(dataKey, envelope)));
    },
    encryptBytes(bytes) {
      return sealBytes(dataKey, bytes);
    },
    decryptBytes(envelope) {
      return openBytes(dataKey, envelope);
    },
  });
  sessionKeys.set(session, dataKey);
  return session;
}

// Solo per vault.js (cambio password): i byte della chiave dei dati di una sessione,
// per custodirla di nuovo con la nuova password. Chi chiama deve azzerarli dopo l'uso.
export async function exportSessionKey(session) {
  const key = sessionKeys.get(session);
  if (!key) throw new TypeError('Sessione non valida');
  return new Uint8Array(await globalThis.crypto.subtle.exportKey('raw', key));
}
