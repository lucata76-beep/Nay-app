// Account (T16): cambio della password, ripristino con il codice di recupero, esportazione del backup.
// Il vault si legge sempre dal database al momento dell'uso (mai da una copia tenuta in memoria): dopo un
// cambio di password la copia vecchia aprirebbe il backup con la password vecchia.
import { WrongSecretError } from '../core/crypto.js';
import { BackupFormatError, BackupVersionError, exportBackup } from '../core/backup.js';
import { StorageFullError } from '../core/secure-store.js';
import { PasswordTooShortError } from '../core/password.js';
import { changePassword, isSetupComplete, unlockWithPassword, unlockWithRecoveryCode } from '../core/vault.js';

// Il vault nel database non è più quello con cui si stava lavorando (per esempio un backup importato nel frattempo,
// in questa o in un'altra scheda): meglio fermarsi che scrivere o sbloccare con la chiave vecchia.
export class VaultChangedError extends Error {
  constructor(message = 'Il vault è cambiato nel frattempo') {
    super(message);
    this.name = 'VaultChangedError';
  }
}

async function confirmedVault(db) {
  const vault = await db.get('meta', 'vault');
  if (!vault || !isSetupComplete(vault)) throw new Error('Nessun vault confermato in questo telefono');
  return vault;
}

// Sblocco con il vault che c'è NEL DATABASE adesso, riletto a ogni tentativo e riconfrontato dopo la derivazione della
// chiave (che dura secondi): se nel frattempo un backup importato lo ha sostituito, la sessione appena aperta sarebbe
// quella del vault vecchio sopra dati nuovi, quindi si ricomincia con quello nuovo. `recovery`: il segreto è il codice.
export async function unlockCurrentVault(db, secret, { recovery = false } = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const vault = await db.get('meta', 'vault');
    if (!isSetupComplete(vault)) throw new VaultChangedError('Nessun vault confermato in questo telefono');
    const session = recovery ? await unlockWithRecoveryCode(vault, secret) : await unlockWithPassword(vault, secret);
    if (sameData(vault, await db.get('meta', 'vault'))) return session;
  }
  throw new VaultChangedError();
}

// Stessa chiave dei dati? (`check` è la costante cifrata con quella chiave: cambia solo se cambia il vault, non con la password)
function sameData(a, b) {
  return Boolean(a) && Boolean(b) && JSON.stringify(a.check) === JSON.stringify(b.check);
}

// Salva il vault nuovo e controlla che si apra davvero con la password nuova; se non si apre rimette quello di prima.
// Se nel frattempo il vault è stato sostituito (backup importato) non scrive nulla e non rimette niente: sovrascriverebbe
// i dati importati con una chiave che non li apre.
async function saveAndVerify(db, previous, next, newPassword) {
  if (!sameData(await db.get('meta', 'vault'), previous)) throw new VaultChangedError();
  await db.put('meta', next);
  try {
    await unlockWithPassword(await db.get('meta', 'vault'), newPassword);
  } catch (err) {
    if (sameData(await db.get('meta', 'vault'), previous)) await db.put('meta', previous); // niente password rotta: si torna com'era
    throw err;
  }
  return next;
}

// Cambia la password. Chiede quella attuale (chi trova il telefono sbloccato non può cambiarla) e usa la sessione
// aperta; il codice di recupero e i dati restano gli stessi. Restituisce il record salvato.
export async function changeVaultPassword(db, session, { currentPassword, newPassword }) {
  const vault = await confirmedVault(db);
  await unlockWithPassword(vault, currentPassword); // WrongSecretError se non è quella giusta
  const next = await changePassword(vault, session, newPassword); // password corta, sessione di un altro vault
  return saveAndVerify(db, vault, next, newPassword);
}

// «Ripristina con il codice»: una nuova password senza conoscere la vecchia, provando di avere il codice di recupero.
export async function resetPasswordWithRecoveryCode(db, { recoveryCode, newPassword }) {
  const vault = await confirmedVault(db);
  const session = await unlockWithRecoveryCode(vault, recoveryCode); // WrongSecretError se il codice è sbagliato
  const next = await changePassword(vault, session, newPassword);
  return saveAndVerify(db, vault, next, newPassword);
}

const pad = (n) => String(n).padStart(2, '0');

export function backupFileName(now = new Date()) {
  return `nay-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.naybk`;
}

// Esporta con il vault che c'è adesso nel database.
export async function exportCurrentBackup(db, now = new Date()) {
  const vault = await confirmedVault(db);
  const blob = await exportBackup(db, vault);
  return { blob, name: backupFileName(now), size: blob.size };
}

// Messaggio da mostrare per un errore del backup o del cambio password (chiavi di js/i18n/).
export function backupErrorKey(err) {
  if (err instanceof WrongSecretError) return 'error.wrongSecret';
  if (err instanceof BackupFormatError) return 'error.backupCorrupt';
  if (err instanceof BackupVersionError) return 'error.backupVersion';
  if (err instanceof StorageFullError || err?.name === 'QuotaExceededError') return 'error.storageFull';
  if (err instanceof PasswordTooShortError) return 'error.passwordTooShort';
  if (err instanceof RangeError) return 'error.backupMemory'; // per esempio «Invalid string length»: file troppo grande per la memoria
  return 'error.unexpected';
}
