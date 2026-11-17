// Vault: una chiave dei dati casuale (32 byte) custodita due volte, una cifrata con
// la chiave ricavata dalla password e una con quella ricavata dal codice di recupero.
import {
  PBKDF2_ITERATIONS,
  WrongSecretError,
  normalizeSecret,
  randomBytes,
  bytesToBase64,
  base64ToBytes,
  deriveWrapKey,
  importDataKey,
  sealBytes,
  openBytes,
  createSession,
  exportSessionKey,
} from './crypto.js';
import { assertPasswordLength } from './password.js';

const VAULT_VERSION = 1;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const CHECK_VALUE = { nay: 'vault-check' };

export class VaultMismatchError extends Error {
  constructor(message = 'La sessione non appartiene a questo vault') {
    super(message);
    this.name = 'VaultMismatchError';
  }
}

function toBase32(bytes) {
  let value = 0;
  let bits = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
      value &= (1 << bits) - 1;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

// 20 byte casuali → 32 caratteri base32 (A-Z, 2-7) in 8 gruppi da 4 separati da «-».
function newRecoveryCode() {
  return toBase32(randomBytes(20)).match(/.{4}/g).join('-');
}

// In ingresso si accettano minuscole, spazi e trattini in più (anche i trattini
// «tipografici» che certe tastiere mettono al posto di «-»).
export function normalizeRecoveryCode(code) {
  if (typeof code !== 'string') throw new TypeError('Il codice di recupero deve essere una stringa');
  return code
    .normalize('NFKC')
    .replace(/[\s\-‐-―−]/g, '')
    .toUpperCase();
}

async function wrapDataKey(secret, rawKey, iterations) {
  const salt = randomBytes(16);
  const kek = await deriveWrapKey(secret, salt, iterations);
  return { salt: bytesToBase64(salt), key: await sealBytes(kek, rawKey) };
}

async function openSession(secret, slot, iterations) {
  const kek = await deriveWrapKey(secret, base64ToBytes(slot.salt), iterations);
  let raw;
  try {
    raw = await openBytes(kek, slot.key);
  } catch (err) {
    if (err && err.name === 'OperationError') throw new WrongSecretError();
    throw err;
  }
  try {
    return createSession(await importDataKey(raw));
  } finally {
    raw.fill(0);
  }
}

// Vero se la sessione ha la chiave dei dati di questo vault (si decifra la costante `check`).
export async function sessionMatchesVault(vault, session) {
  try {
    const value = await session.decryptJson(vault.check);
    return Boolean(value) && value.nay === CHECK_VALUE.nay;
  } catch {
    return false;
  }
}

export async function createVault({ password, iterations = PBKDF2_ITERATIONS } = {}) {
  const secret = normalizeSecret(password);
  assertPasswordLength(secret);

  const rawKey = randomBytes(32);
  try {
    const recoveryCode = newRecoveryCode();
    const [passwordSlot, recoverySlot, dataKey] = await Promise.all([
      wrapDataKey(secret, rawKey, iterations),
      wrapDataKey(normalizeRecoveryCode(recoveryCode), rawKey, iterations),
      importDataKey(rawKey),
    ]);
    const session = createSession(dataKey);
    const vault = {
      id: 'vault',
      v: VAULT_VERSION,
      kdf: { name: 'PBKDF2-SHA256', iterations },
      password: passwordSlot,
      recovery: recoverySlot,
      check: await session.encryptJson(CHECK_VALUE),
      setupComplete: false,
    };
    return { vault, recoveryCode, session };
  } finally {
    rawKey.fill(0);
  }
}

export function confirmRecoveryCode(vault) {
  if (!vault || typeof vault !== 'object') throw new TypeError('Vault non valido');
  return { ...vault, setupComplete: true };
}

// Un vault mancante o mai confermato conta come configurazione non finita:
// al riavvio la creazione riparte da capo.
export function isSetupComplete(vault) {
  return Boolean(vault) && vault.setupComplete === true;
}

// async: anche con input non valido l'errore arriva come promessa rifiutata.
export async function unlockWithPassword(vault, password) {
  return openSession(normalizeSecret(password), vault.password, vault.kdf.iterations);
}

export async function unlockWithRecoveryCode(vault, code) {
  return openSession(normalizeRecoveryCode(code), vault.recovery, vault.kdf.iterations);
}

export async function changePassword(vault, session, newPassword) {
  const secret = normalizeSecret(newPassword);
  assertPasswordLength(secret);
  // Se la sessione non è di questo vault, ricustodire la sua chiave renderebbe
  // illeggibili i dati: meglio rifiutare.
  if (!(await sessionMatchesVault(vault, session))) throw new VaultMismatchError();
  const rawKey = await exportSessionKey(session);
  try {
    const passwordSlot = await wrapDataKey(secret, rawKey, vault.kdf.iterations);
    return { ...vault, password: passwordSlot };
  } finally {
    rawKey.fill(0);
  }
}
