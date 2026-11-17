// T16: cambio password, ripristino con il codice, esportazione del backup col vault aggiornato, errori del backup.
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../js/core/db.js';
import { createSecureStore, StorageFullError } from '../js/core/secure-store.js';
import { WrongSecretError } from '../js/core/crypto.js';
import { PasswordTooShortError } from '../js/core/password.js';
import { BackupFormatError, BackupVersionError, importBackup } from '../js/core/backup.js';
import { confirmRecoveryCode, createVault, isSetupComplete, sessionMatchesVault, unlockWithPassword, unlockWithRecoveryCode } from '../js/core/vault.js';
import {
  VaultChangedError,
  backupErrorKey,
  backupFileName,
  changeVaultPassword,
  exportCurrentBackup,
  resetPasswordWithRecoveryCode,
  unlockCurrentVault,
} from '../js/features/account.js';

const OLD = 'contraseña vieja larga';
const NEW = 'contraseña nueva larga ñ';
let counter = 0;

// un telefono con un vault confermato e un dato cifrato
async function phone({ wrap = (db) => db } = {}) {
  const db = await openDb(`nay-account-${++counter}`);
  const created = await createVault({ password: OLD, iterations: 1000 });
  const vault = confirmRecoveryCode(created.vault);
  await db.put('meta', vault);
  const store = createSecureStore(db, created.session);
  await store.save('ideas', { text: 'una idea que debe seguir legible' });
  return { db, vault, session: created.session, recoveryCode: created.recoveryCode, store, wrapped: wrap(db) };
}

test('changeVaultPassword opens with the new password, rejects the old one and keeps the recovery code', async () => {
  const { db, session, recoveryCode } = await phone();
  const next = await changeVaultPassword(db, session, { currentPassword: OLD, newPassword: NEW });
  const stored = await db.get('meta', 'vault');
  assert.deepEqual(stored, next, 'si salva il record nuovo');
  await unlockWithPassword(stored, NEW);
  await assert.rejects(unlockWithPassword(stored, OLD), WrongSecretError);
  await unlockWithRecoveryCode(stored, recoveryCode);
});

test('changeVaultPassword keeps the data readable and the vault confirmed', async () => {
  const { db, session } = await phone();
  await changeVaultPassword(db, session, { currentPassword: OLD, newPassword: NEW });
  const stored = await db.get('meta', 'vault');
  assert.equal(isSetupComplete(stored), true);
  const reopened = await unlockWithPassword(stored, NEW);
  const ideas = await createSecureStore(db, reopened).all('ideas');
  assert.deepEqual(ideas.map((i) => i.text), ['una idea que debe seguir legible']);
});

test('changeVaultPassword asks for the current password and changes nothing when it is wrong', async () => {
  const { db, session, vault } = await phone();
  await assert.rejects(changeVaultPassword(db, session, { currentPassword: 'no es esa contraseña', newPassword: NEW }), WrongSecretError);
  assert.deepEqual(await db.get('meta', 'vault'), vault);
});

test('changeVaultPassword refuses a short password and changes nothing', async () => {
  const { db, session, vault } = await phone();
  await assert.rejects(changeVaultPassword(db, session, { currentPassword: OLD, newPassword: 'corta' }), PasswordTooShortError);
  assert.deepEqual(await db.get('meta', 'vault'), vault);
});

test('changeVaultPassword refuses a session of another vault', async () => {
  const { db, vault } = await phone();
  const other = await createVault({ password: 'otra contraseña larga', iterations: 1000 });
  await assert.rejects(changeVaultPassword(db, other.session, { currentPassword: OLD, newPassword: NEW }), (e) => e.name === 'VaultMismatchError');
  assert.deepEqual(await db.get('meta', 'vault'), vault);
});

test('changeVaultPassword puts the old vault back when the saved one does not open with the new password', async () => {
  let tampered = false;
  const { db, session, vault } = await phone();
  // un db che la prima volta scrive un vault rovinato (come un guasto di scrittura)
  const flaky = {
    ...db,
    put: async (store, record) => {
      if (!tampered && store === 'meta' && record.id === 'vault') {
        tampered = true;
        return db.put(store, { ...record, password: { ...record.password, salt: 'AAAAAAAAAAAAAAAAAAAAAA==' } });
      }
      return db.put(store, record);
    },
  };
  await assert.rejects(changeVaultPassword(flaky, session, { currentPassword: OLD, newPassword: NEW }), WrongSecretError);
  assert.deepEqual(await db.get('meta', 'vault'), vault, 'il vault di prima è tornato com’era');
  await unlockWithPassword(await db.get('meta', 'vault'), OLD);
});

test('changeVaultPassword refuses when there is no confirmed vault', async () => {
  const db = await openDb(`nay-account-${++counter}`);
  const created = await createVault({ password: OLD, iterations: 1000 });
  await assert.rejects(changeVaultPassword(db, created.session, { currentPassword: OLD, newPassword: NEW }), /vault/i);
  await db.put('meta', created.vault); // non confermato
  await assert.rejects(changeVaultPassword(db, created.session, { currentPassword: OLD, newPassword: NEW }), /vault/i);
});

test('resetPasswordWithRecoveryCode sets a new password with the code, and a wrong code changes nothing', async () => {
  const { db, recoveryCode, vault } = await phone();
  await assert.rejects(resetPasswordWithRecoveryCode(db, { recoveryCode: 'AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH', newPassword: NEW }), WrongSecretError);
  assert.deepEqual(await db.get('meta', 'vault'), vault);
  const next = await resetPasswordWithRecoveryCode(db, { recoveryCode: recoveryCode.toLowerCase().replace(/-/g, ' '), newPassword: NEW });
  const stored = await db.get('meta', 'vault');
  assert.deepEqual(stored, next);
  await unlockWithPassword(stored, NEW);
  await assert.rejects(unlockWithPassword(stored, OLD), WrongSecretError);
  await unlockWithRecoveryCode(stored, recoveryCode); // il codice resta lo stesso
  assert.deepEqual((await createSecureStore(db, await unlockWithPassword(stored, NEW)).all('ideas')).length, 1);
});

test('resetPasswordWithRecoveryCode refuses a short new password and changes nothing', async () => {
  const { db, recoveryCode, vault } = await phone();
  await assert.rejects(resetPasswordWithRecoveryCode(db, { recoveryCode, newPassword: 'corta' }), PasswordTooShortError);
  assert.deepEqual(await db.get('meta', 'vault'), vault);
});

test('exportCurrentBackup uses the vault stored now, not an older copy', async () => {
  const { db, session } = await phone();
  const stale = await db.get('meta', 'vault'); // la copia letta prima del cambio di password
  assert.ok(stale);
  await changeVaultPassword(db, session, { currentPassword: OLD, newPassword: NEW });
  const { blob, name, size } = await exportCurrentBackup(db, new Date('2026-11-17T08:05:00'));
  assert.equal(size, blob.size);
  assert.match(name, /^nay-backup-2026-11-17-0805\.naybk$/);
  // su un telefono nuovo si apre con la password nuova, non con la vecchia
  const fresh = await openDb(`nay-account-${++counter}`);
  await assert.rejects(importBackup(blob, OLD, fresh), WrongSecretError);
  assert.equal((await fresh.list('ideas')).length, 0, 'un segreto sbagliato non scrive nulla');
  const result = await importBackup(blob, NEW, fresh);
  assert.ok(result.imported >= 1);
  assert.equal((await fresh.list('ideas')).length, 1);
});

test('exportCurrentBackup also opens with the recovery code', async () => {
  const { db, recoveryCode } = await phone();
  const { blob } = await exportCurrentBackup(db);
  const fresh = await openDb(`nay-account-${++counter}`);
  await importBackup(blob, recoveryCode, fresh);
  assert.equal((await fresh.list('ideas')).length, 1);
});

test('exportCurrentBackup refuses when the vault is missing or not confirmed', async () => {
  const db = await openDb(`nay-account-${++counter}`);
  await assert.rejects(exportCurrentBackup(db), /vault/i);
  const created = await createVault({ password: OLD, iterations: 1000 });
  await db.put('meta', created.vault);
  await assert.rejects(exportCurrentBackup(db), /vault/i);
});

test('backupFileName is a safe dated name', () => {
  assert.match(backupFileName(new Date(2026, 10, 17, 9, 5)), /^nay-backup-2026-11-17-0905\.naybk$/);
  assert.match(backupFileName(), /^nay-backup-\d{4}-\d{2}-\d{2}-\d{4}\.naybk$/);
  assert.ok(!/[\\/:*?"<>|\s]/.test(backupFileName()));
});

test('backupErrorKey maps each backup error to its message key', () => {
  assert.equal(backupErrorKey(new WrongSecretError()), 'error.wrongSecret');
  assert.equal(backupErrorKey(new BackupFormatError('troncato')), 'error.backupCorrupt');
  assert.equal(backupErrorKey(new BackupVersionError(9)), 'error.backupVersion');
  assert.equal(backupErrorKey(new StorageFullError(new Error('x'))), 'error.storageFull');
  assert.equal(backupErrorKey(new DOMException('quota', 'QuotaExceededError')), 'error.storageFull');
  assert.equal(backupErrorKey(new RangeError('Invalid string length')), 'error.backupMemory');
  assert.equal(backupErrorKey(new PasswordTooShortError()), 'error.passwordTooShort');
  assert.equal(backupErrorKey(new Error('boh')), 'error.unexpected');
  assert.equal(backupErrorKey(undefined), 'error.unexpected');
});

// ---------- il vault cambia mentre l'app lavora (backup importato in un'altra scheda o a schermo bloccato) ----------
// Alla N-esima lettura del vault il database contiene già `replacement` (scritto davvero), come se un'importazione
// avesse finito proprio allora.
function replaceAtRead(db, replacement, atRead) {
  let reads = 0;
  return {
    ...db,
    get: async (store, id) => {
      if (store === 'meta' && id === 'vault' && ++reads === atRead) await db.put('meta', replacement);
      return db.get(store, id);
    },
  };
}

async function otherVault(password = OLD) {
  const created = await createVault({ password, iterations: 1000 });
  return { vault: confirmRecoveryCode(created.vault), session: created.session };
}

test('unlockCurrentVault opens with the vault stored now and returns a working session', async () => {
  const { db, vault } = await phone();
  const session = await unlockCurrentVault(db, OLD);
  assert.equal(await sessionMatchesVault(vault, session), true);
  assert.deepEqual((await createSecureStore(db, session).all('ideas')).map((i) => i.text), ['una idea que debe seguir legible']);
  await assert.rejects(unlockCurrentVault(db, 'no es esa contraseña'), WrongSecretError);
});

test('unlockCurrentVault reads the vault at every attempt: the vault replaced by an import is used, the old password no longer opens', async () => {
  const { db } = await phone();
  const imported = await otherVault('contraseña de la copia');
  await db.put('meta', imported.vault); // il backup importato ha sostituito il vault
  await assert.rejects(unlockCurrentVault(db, OLD), WrongSecretError);
  const session = await unlockCurrentVault(db, 'contraseña de la copia');
  assert.equal(await sessionMatchesVault(imported.vault, session), true);
});

test('unlockCurrentVault opens with the recovery code of the vault stored now', async () => {
  const { db, recoveryCode } = await phone();
  const session = await unlockCurrentVault(db, recoveryCode.toLowerCase().replace(/-/g, ' '), { recovery: true });
  assert.equal(await sessionMatchesVault(await db.get('meta', 'vault'), session), true);
  await assert.rejects(unlockCurrentVault(db, 'AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH', { recovery: true }), WrongSecretError);
});

test('unlockCurrentVault never returns a session of a vault that was replaced while the key was derived', async () => {
  const { db, vault } = await phone();
  const imported = await otherVault(); // stessa password, ma un'altra chiave dei dati
  const racing = replaceAtRead(db, imported.vault, 2); // la 2ª lettura è il controllo dopo la derivazione
  const session = await unlockCurrentVault(racing, OLD);
  assert.equal(await sessionMatchesVault(imported.vault, session), true, 'sessione del vault nuovo');
  assert.equal(await sessionMatchesVault(vault, session), false, 'non quella del vecchio');
});

test('unlockCurrentVault gives up with VaultChangedError when the vault keeps changing', async () => {
  const { db, vault } = await phone();
  const other = await otherVault();
  let reads = 0;
  const flapping = { ...db, get: async (store, id) => (store === 'meta' && id === 'vault' ? (++reads % 2 ? vault : other.vault) : db.get(store, id)) };
  await assert.rejects(unlockCurrentVault(flapping, OLD), VaultChangedError);
});

test('unlockCurrentVault refuses when there is no confirmed vault', async () => {
  const db = await openDb(`nay-account-${++counter}`);
  await assert.rejects(unlockCurrentVault(db, OLD), VaultChangedError);
  const created = await createVault({ password: OLD, iterations: 1000 });
  await db.put('meta', created.vault); // non confermato
  await assert.rejects(unlockCurrentVault(db, OLD), VaultChangedError);
});

test('changeVaultPassword does not save over a vault that was replaced by an import while it worked', async () => {
  const { db, session } = await phone();
  const imported = await otherVault('contraseña de la copia');
  const racing = replaceAtRead(db, imported.vault, 2); // dopo la lettura iniziale, prima del salvataggio
  await assert.rejects(changeVaultPassword(racing, session, { currentPassword: OLD, newPassword: NEW }), VaultChangedError);
  assert.deepEqual(await db.get('meta', 'vault'), imported.vault, 'il vault importato non è stato toccato');
});

test('resetPasswordWithRecoveryCode does not save over a vault that was replaced by an import while it worked', async () => {
  const { db, recoveryCode } = await phone();
  const imported = await otherVault('contraseña de la copia');
  const racing = replaceAtRead(db, imported.vault, 2);
  await assert.rejects(resetPasswordWithRecoveryCode(racing, { recoveryCode, newPassword: NEW }), VaultChangedError);
  assert.deepEqual(await db.get('meta', 'vault'), imported.vault);
});

test('changeVaultPassword does not put the old vault back over a vault replaced meanwhile', async () => {
  const { db, session } = await phone();
  const imported = await otherVault('contraseña de la copia');
  let tampered = false;
  let replaced = false;
  // il vault salvato non si apre con la password nuova (guasto di scrittura) e, mentre lo si verifica, un'importazione
  // sostituisce il vault: il ripristino del vecchio non deve cancellarla
  const flaky = {
    ...db,
    put: async (store, record) => {
      if (!tampered && store === 'meta' && record.id === 'vault') {
        tampered = true;
        return db.put(store, { ...record, password: { ...record.password, salt: 'AAAAAAAAAAAAAAAAAAAAAA==' } });
      }
      return db.put(store, record);
    },
    get: async (store, id) => {
      const value = await db.get(store, id);
      if (tampered && !replaced && store === 'meta' && id === 'vault') {
        replaced = true;
        await db.put('meta', imported.vault);
      }
      return value;
    },
  };
  await assert.rejects(changeVaultPassword(flaky, session, { currentPassword: OLD, newPassword: NEW }), WrongSecretError);
  assert.deepEqual(await db.get('meta', 'vault'), imported.vault, 'il vault importato non è stato sovrascritto con quello di prima');
});
