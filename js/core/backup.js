// Backup cifrato. File: 'NAYBK1' (6 byte), versione del formato (2 byte), lunghezza
// dell'intestazione (4 byte), SHA-256 dell'intestazione (32 byte), intestazione JSON (vault e numero
// di record per archivio), poi i record così come stanno nel database, quindi ancora cifrati:
// indice dell'archivio (1 byte), lunghezza (4 byte), JSON del record. I numeri sono big-endian.
//
// I record sono autenticati dalla cifratura; l'intestazione (che contiene il vault) no, perciò ha il
// suo SHA-256: riconosce un file rovinato per caso (per esempio un bit del codice di recupero), non
// un file costruito apposta.
//
// L'importazione sostituisce tutto, vault compreso (telefono nuovo), ma scrive solo dopo aver
// letto tutto il file, aver controllato che `secret` apra il vault del file e che ogni record
// si decifri; la scrittura è una sola transazione: se qualcosa va storto i dati attuali restano.
import { STORES } from './db.js';
import { WrongSecretError } from './crypto.js';
import { unlockWithPassword, unlockWithRecoveryCode, isSetupComplete, sessionMatchesVault } from './vault.js';
import { StorageFullError } from './secure-store.js';

const MAGIC = 'NAYBK1';
const FORMAT_VERSION = 1;
const FIXED_HEAD = 12; // magic + versione + lunghezza dell'intestazione
const DIGEST_LENGTH = 32; // SHA-256 dell'intestazione
const FRAME_HEAD = 5; // indice dell'archivio + lunghezza del record
const MAX_PBKDF2_ITERATIONS = 10_000_000; // contro intestazioni manomesse che bloccherebbero il telefono

const encoder = new TextEncoder();

export class BackupFormatError extends Error {
  constructor(detail) {
    super(detail ? `File di backup non valido: ${detail}` : 'File di backup non valido');
    this.name = 'BackupFormatError';
  }
}

export class BackupVersionError extends Error {
  constructor(version) {
    super(`Versione del file di backup non supportata: ${version}`);
    this.name = 'BackupVersionError';
    this.version = version;
  }
}

function utf8Length(value) {
  return encoder.encode(JSON.stringify(value)).length;
}

// Somma dei byte di tutti i record (per l'avviso sulla dimensione prima di esportare).
export async function estimateBackupSize(db) {
  let total = 0;
  for (const name of STORES) {
    for (const record of await db.list(name)) total += utf8Length(record);
  }
  return total;
}

// Il vault sta nell'intestazione, non tra i record dell'archivio `meta`.
export async function exportBackup(db, vault) {
  if (!vault || typeof vault !== 'object' || vault.id !== 'vault') throw new TypeError('vault non valido');
  // un vault con il codice di recupero mai confermato è una configurazione non finita: non si esporta
  if (!isSetupComplete(vault)) throw new TypeError('Il vault non è confermato: il codice di recupero non è stato confermato');
  const stores = [];
  const parts = [];
  for (const [index, name] of STORES.entries()) {
    let records = await db.list(name);
    if (name === 'meta') records = records.filter((record) => record.id !== 'vault');
    stores.push({ name, count: records.length });
    for (const record of records) {
      const payload = encoder.encode(JSON.stringify(record));
      const head = new Uint8Array(FRAME_HEAD);
      head[0] = index;
      new DataView(head.buffer).setUint32(1, payload.length);
      parts.push(head, payload);
    }
  }
  const header = encoder.encode(
    JSON.stringify({ format: 'NAYBK', createdAt: new Date().toISOString(), vault, stores }),
  );
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', header));
  const fixed = new Uint8Array(FIXED_HEAD);
  fixed.set(encoder.encode(MAGIC));
  const view = new DataView(fixed.buffer);
  view.setUint16(6, FORMAT_VERSION);
  view.setUint32(8, header.length);
  return new Blob([fixed, digest, header, ...parts], { type: 'application/octet-stream' });
}

async function readBytes(file, start, length) {
  if (start + length > file.size) throw new BackupFormatError('il file è troncato');
  return new Uint8Array(await file.slice(start, start + length).arrayBuffer());
}

function parseJson(bytes, what) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new BackupFormatError(`${what} illeggibile`);
  }
}

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isEnvelope = (value) =>
  isObject(value) && value.v === 1 && typeof value.iv === 'string' && typeof value.ct === 'string';
const isSlot = (value) => isObject(value) && typeof value.salt === 'string' && isEnvelope(value.key);

function checkHeader(header) {
  if (!isObject(header) || !Array.isArray(header.stores) || !isObject(header.vault)) {
    throw new BackupFormatError('intestazione incompleta');
  }
  const names = new Set();
  for (const store of header.stores) {
    const valid = isObject(store) && STORES.includes(store.name) && Number.isInteger(store.count) && store.count >= 0;
    if (!valid || names.has(store.name)) throw new BackupFormatError('elenco degli archivi non valido');
    names.add(store.name);
  }
  if (header.stores.length > 255) throw new BackupFormatError('elenco degli archivi non valido');
  const vault = header.vault;
  const iterations = isObject(vault.kdf) ? vault.kdf.iterations : undefined;
  const valid =
    vault.id === 'vault' &&
    vault.v === 1 &&
    vault.kdf.name === 'PBKDF2-SHA256' &&
    // un backup si fa solo da un'app configurata: un vault non confermato farebbe ripartire la creazione
    vault.setupComplete === true &&
    Number.isInteger(iterations) &&
    iterations >= 1 &&
    iterations <= MAX_PBKDF2_ITERATIONS &&
    isSlot(vault.password) &&
    isSlot(vault.recovery) &&
    isEnvelope(vault.check);
  if (!valid) throw new BackupFormatError('vault non valido');
}

// Legge tutto il file con le sue verifiche di forma. Non tocca il database.
async function readBackup(file) {
  const first = await readBytes(file, 0, Math.min(8, file.size));
  if (first.length < 6 || new TextDecoder('latin1').decode(first.subarray(0, 6)) !== MAGIC) {
    throw new BackupFormatError('non è un backup di NAY-App');
  }
  if (first.length < 8) throw new BackupFormatError('il file è troncato');
  const version = new DataView(first.buffer, first.byteOffset).getUint16(6);
  if (version > FORMAT_VERSION) throw new BackupVersionError(version);
  if (version === 0) throw new BackupFormatError('versione non valida');

  const fixed = await readBytes(file, 0, FIXED_HEAD);
  const headerLength = new DataView(fixed.buffer).getUint32(8);
  const digest = await readBytes(file, FIXED_HEAD, DIGEST_LENGTH);
  const headerBytes = await readBytes(file, FIXED_HEAD + DIGEST_LENGTH, headerLength);
  const actual = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', headerBytes));
  if (actual.some((byte, i) => byte !== digest[i])) throw new BackupFormatError('intestazione alterata');
  const header = parseJson(headerBytes, 'intestazione');
  checkHeader(header);

  const total = header.stores.reduce((sum, store) => sum + store.count, 0);
  const records = header.stores.map(() => []);
  const ids = header.stores.map(() => new Set());
  let offset = FIXED_HEAD + DIGEST_LENGTH + headerLength;
  for (let i = 0; i < total; i++) {
    const head = await readBytes(file, offset, FRAME_HEAD);
    const index = head[0];
    if (index >= header.stores.length) throw new BackupFormatError('record di un archivio sconosciuto');
    const length = new DataView(head.buffer).getUint32(1);
    const record = parseJson(await readBytes(file, offset + FRAME_HEAD, length), 'record');
    offset += FRAME_HEAD + length;
    const name = header.stores[index].name;
    const valid = isObject(record) && typeof record.id === 'string' && record.id !== '' && isEnvelope(record.enc);
    if (!valid || ids[index].has(record.id) || (name === 'meta' && record.id === 'vault')) {
      throw new BackupFormatError('record non valido');
    }
    ids[index].add(record.id);
    records[index].push(record);
  }
  if (offset !== file.size) throw new BackupFormatError('dati in più alla fine del file');
  header.stores.forEach((store, index) => {
    if (records[index].length !== store.count) throw new BackupFormatError('numero di record diverso da quello dichiarato');
  });
  return { header, records, total };
}

// `secret` è la password o il codice di recupero. Un vault del file fatto male non è una password
// sbagliata: è un file non valido.
async function unlock(vault, secret) {
  try {
    return await unlockWithPassword(vault, secret);
  } catch (err) {
    if (!(err instanceof WrongSecretError)) throw new BackupFormatError('vault illeggibile');
  }
  try {
    return await unlockWithRecoveryCode(vault, secret);
  } catch (err) {
    if (err instanceof WrongSecretError) throw new WrongSecretError();
    throw new BackupFormatError('vault illeggibile');
  }
}

// Ogni record deve decifrarsi e appartenere al suo id (come quando lo legge l'archivio cifrato).
async function verifyRecord(session, storeName, record) {
  try {
    if (storeName === 'blobs') {
      if (!isEnvelope(record.info)) throw new Error('info mancante');
      await session.decryptBytes(record.enc);
      const info = await session.decryptJson(record.info);
      if (info.id !== record.id) throw new Error('id diverso');
    } else {
      const value = await session.decryptJson(record.enc);
      if (value.id !== record.id) throw new Error('id diverso');
    }
  } catch {
    throw new BackupFormatError('un record è alterato o non si può decifrare');
  }
}

function isQuotaError(err) {
  return Boolean(err) && (err.name === 'QuotaExceededError' || err.code === 22);
}

export async function importBackup(blob, secret, db) {
  if (typeof secret !== 'string') throw new TypeError('La password o il codice devono essere una stringa');
  const file = blob instanceof Blob ? blob : new Blob([blob]);
  const { header, records, total } = await readBackup(file);
  const session = await unlock(header.vault, secret);
  // lo slot della password deve aprire proprio la chiave a cui appartiene il vault del file
  if (!(await sessionMatchesVault(header.vault, session))) throw new BackupFormatError('vault incoerente');

  const data = {};
  for (const [index, store] of header.stores.entries()) {
    for (const record of records[index]) await verifyRecord(session, store.name, record);
    data[store.name] = records[index];
  }
  data.meta = [...(data.meta ?? []), header.vault];

  try {
    await db.replaceAll(data);
  } catch (err) {
    throw isQuotaError(err) ? new StorageFullError(err) : err;
  }
  return { imported: total };
}
