// Esportazione: copia, condivisione di sistema, ZIP salvato nel telefono.
// Fatto misurato sul Samsung (Chrome 157, comunicato da Luca): lo ZIP non si condivide
// (`canShare` dice sì ma `share` lancia NotAllowedError): lo ZIP si salva solo con saveToDevice
// e `canShare` non decide mai sullo ZIP.
import { Zip, ZipPassThrough, ZipDeflate, strToU8 } from '../../vendor/fflate.js';

const MAX_FILES_WITHOUT_WARNING = 10; // limite di Gemini (spec, sezione 3)
const RELEASE_URL_AFTER_MS = 30000; // il download deve fare in tempo a partire  [Da provare]
const ZIP_TYPES = ['application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip'];

export class ClipboardUnavailableError extends Error {
  constructor() {
    super('Appunti non disponibili (serve HTTPS e un tocco dell’utente)');
    this.name = 'ClipboardUnavailableError';
  }
}

export async function copyText(text, nav = globalThis.navigator) {
  if (!nav || !nav.clipboard || typeof nav.clipboard.writeText !== 'function') throw new ClipboardUnavailableError();
  await nav.clipboard.writeText(text);
}

function isZip(file) {
  return ZIP_TYPES.includes(String(file.type || '').toLowerCase()) || /\.zip$/i.test(file.name || '');
}

function askCanShare(nav, data) {
  try {
    return Boolean(nav.canShare(data));
  } catch {
    return false;
  }
}

// Mai per uno ZIP (nemmeno mescolato ad altri file): non si condivide, si salva.
export function canShareFiles(files, nav = globalThis.navigator) {
  if (files.length === 0 || files.some(isZip)) return false;
  if (!nav || typeof nav.canShare !== 'function') return false;
  return askCanShare(nav, { files });
}

// 'shared': la condivisione è partita (anche se poi l'utente non invia nell'altra app);
// 'cancelled': l'utente ha chiuso la finestra; 'unsupported': non si può (nessun supporto,
// file non ammessi, ZIP, NotAllowedError «Permission denied»).
export async function shareContent({ text = '', files = [] } = {}, nav = globalThis.navigator) {
  if (!text && files.length === 0) throw new TypeError('Niente da condividere');
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return 'unsupported';
  if (files.length > 0) {
    if (!canShareFiles(files, nav)) return 'unsupported';
  } else if (!askCanShare(nav, { text })) {
    return 'unsupported';
  }
  try {
    await nav.share(files.length > 0 ? { text, files } : { text });
    return 'shared';
  } catch (err) {
    if (err && err.name === 'AbortError') return 'cancelled';
    if (err && err.name === 'NotAllowedError') return 'unsupported';
    throw err;
  }
}

export function fileCountWarning(n) {
  return n > MAX_FILES_WITHOUT_WARNING;
}

// Nome sicuro dentro l'archivio: niente separatori di percorso né caratteri vietati.
function cleanName(name) {
  const cleaned = String(name ?? '')
    .normalize('NFC')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .trim();
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? 'file' : cleaned;
}

// Nomi doppi con suffisso -2, -3 (prima dell'estensione), senza scontrarsi con altri nomi
// né con prompt.txt, anche a meno delle maiuscole.
function uniqueName(name, used) {
  if (!used.has(name.toLowerCase())) {
    used.add(name.toLowerCase());
    return name;
  }
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let n = 2; ; n++) {
    const candidate = `${stem}-${n}${ext}`;
    if (!used.has(candidate.toLowerCase())) {
      used.add(candidate.toLowerCase());
      return candidate;
    }
  }
}

async function pushBlob(entry, blob) {
  if (typeof blob.stream === 'function') {
    const reader = blob.stream().getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      entry.push(value, false);
    }
    entry.push(new Uint8Array(0), true);
  } else {
    entry.push(new Uint8Array(await blob.arrayBuffer()), true);
  }
}

// ZIP a flusso con `prompt.txt` (compresso) e i file (senza compressione: foto e video sono già compressi).
// Restituisce un Blob: tutto l'output resta in memoria finché il Blob non è creato, quindi con
// file molto grandi la memoria del telefono è il limite.  [Da provare]
export async function makeZip({ promptText, files }) {
  const chunks = [];
  let finish;
  let fail;
  const finished = new Promise((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      fail(err);
      return;
    }
    chunks.push(chunk);
    if (final) finish();
  });
  const used = new Set(['prompt.txt']);

  const prompt = new ZipDeflate('prompt.txt');
  zip.add(prompt);
  prompt.push(strToU8(promptText ?? ''), true);

  for (const { name, blob } of files) {
    const entry = new ZipPassThrough(uniqueName(cleanName(name), used));
    zip.add(entry);
    await pushBlob(entry, blob);
  }
  zip.end();
  await finished;
  return new Blob(chunks, { type: 'application/zip' });
}

// Salva il file nel telefono con un link «download» (lo ZIP non si condivide).
export function saveToDevice(blob, filename, env = globalThis) {
  if (typeof filename !== 'string' || filename.trim() === '') throw new TypeError('Nome del file mancante');
  const url = env.URL.createObjectURL(blob);
  const link = env.document.createElement('a');
  link.href = url;
  link.download = cleanName(filename);
  link.style.display = 'none';
  env.document.body.append(link);
  link.click();
  env.document.body.removeChild(link);
  env.setTimeout(() => env.URL.revokeObjectURL(url), RELEASE_URL_AFTER_MS);
}
