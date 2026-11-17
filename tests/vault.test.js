import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PBKDF2_ITERATIONS, WrongSecretError, normalizeSecret } from '../js/core/crypto.js';
import {
  createVault,
  confirmRecoveryCode,
  isSetupComplete,
  unlockWithPassword,
  unlockWithRecoveryCode,
  changePassword,
} from '../js/core/vault.js';
import { MIN_PASSWORD_LENGTH } from '../js/core/password.js';

const FAST = 1000; // ripetizioni ridotte: solo per velocizzare i test
const PASSWORD = 'una contraseña larga';

async function newVault(password = PASSWORD) {
  return createVault({ password, iterations: FAST });
}

test('json roundtrip', async () => {
  const { session } = await newVault();
  const value = { text: 'Ánimo, ¿qué tal? ¡Señorita!', n: 3, list: ['a', 'ñ'], nested: { ok: true } };
  const envelope = await session.encryptJson(value);
  assert.equal(envelope.v, 1);
  assert.equal(typeof envelope.iv, 'string');
  assert.equal(typeof envelope.ct, 'string');
  assert.deepEqual(await session.decryptJson(envelope), value);
});

test('bytes roundtrip keeps every byte', async () => {
  const { session } = await newVault();
  const bytes = new Uint8Array(256).map((_, i) => i);
  assert.deepEqual(await session.decryptBytes(await session.encryptBytes(bytes)), bytes);
  assert.deepEqual(await session.decryptBytes(await session.encryptBytes(new Uint8Array(0))), new Uint8Array(0));
});

test('encrypting the same value twice gives different ciphertexts', async () => {
  const { session } = await newVault();
  const a = await session.encryptJson({ x: 1 });
  const b = await session.encryptJson({ x: 1 });
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ct, b.ct);
});

test('tampered ciphertext is rejected', async () => {
  const { session } = await newVault();
  const envelope = await session.encryptJson({ x: 1 });
  const bytes = Uint8Array.from(atob(envelope.ct), (c) => c.charCodeAt(0));
  bytes[0] ^= 1;
  const tampered = { ...envelope, ct: btoa(String.fromCharCode(...bytes)) };
  await assert.rejects(session.decryptJson(tampered));
});

test('wrong password throws WrongSecretError', async () => {
  const { vault } = await newVault();
  await assert.rejects(unlockWithPassword(vault, 'otra contraseña distinta'), WrongSecretError);
  const err = await unlockWithPassword(vault, 'otra contraseña distinta').catch((e) => e);
  assert.ok(err instanceof Error);
  assert.equal(err.name, 'WrongSecretError');
});

test('correct password opens the vault and reads the same data', async () => {
  const { vault, session } = await newVault();
  const envelope = await session.encryptJson({ secret: 'dato' });
  const again = await unlockWithPassword(vault, PASSWORD);
  assert.deepEqual(await again.decryptJson(envelope), { secret: 'dato' });
});

test('recovery code has 32 base32 characters in groups of 4', async () => {
  const { recoveryCode } = await newVault();
  assert.match(recoveryCode, /^([A-Z2-7]{4}-){7}[A-Z2-7]{4}$/);
  assert.equal(recoveryCode.replaceAll('-', '').length, 32);
});

test('recovery code opens the vault (lowercase and spaces)', async () => {
  const { vault, session, recoveryCode } = await newVault();
  const envelope = await session.encryptJson({ secret: 'dato' });

  const exact = await unlockWithRecoveryCode(vault, recoveryCode);
  assert.deepEqual(await exact.decryptJson(envelope), { secret: 'dato' });

  const sloppy = `  ${recoveryCode.toLowerCase().replaceAll('-', ' - ')}  `;
  const lower = await unlockWithRecoveryCode(vault, sloppy);
  assert.deepEqual(await lower.decryptJson(envelope), { secret: 'dato' });

  const noDashes = await unlockWithRecoveryCode(vault, recoveryCode.replaceAll('-', '').toLowerCase());
  assert.deepEqual(await noDashes.decryptJson(envelope), { secret: 'dato' });
});

test('wrong recovery code throws WrongSecretError', async () => {
  const { vault } = await newVault();
  await assert.rejects(unlockWithRecoveryCode(vault, 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AAAA'), WrongSecretError);
  await assert.rejects(unlockWithRecoveryCode(vault, 'troppo corto'), WrongSecretError);
});

test('changePassword keeps old data readable and rejects the old password', async () => {
  const { vault, session } = await newVault();
  const envelope = await session.encryptJson({ secret: 'dato' });
  const updated = await changePassword(vault, session, 'una contraseña nueva');

  const withNew = await unlockWithPassword(updated, 'una contraseña nueva');
  assert.deepEqual(await withNew.decryptJson(envelope), { secret: 'dato' });
  await assert.rejects(unlockWithPassword(updated, PASSWORD), WrongSecretError);
});

test('changePassword keeps the recovery code and the setup state', async () => {
  const { vault, session, recoveryCode } = await newVault();
  const confirmed = confirmRecoveryCode(vault);
  const envelope = await session.encryptJson({ secret: 'dato' });
  const updated = await changePassword(confirmed, session, 'una contraseña nueva');
  assert.equal(isSetupComplete(updated), true);
  const viaCode = await unlockWithRecoveryCode(updated, recoveryCode);
  assert.deepEqual(await viaCode.decryptJson(envelope), { secret: 'dato' });
});

test('changePassword rejects a password shorter than MIN_PASSWORD_LENGTH', async () => {
  const { vault, session } = await newVault();
  await assert.rejects(changePassword(vault, session, 'corta'), { name: 'PasswordTooShortError' });
  // il vault non è cambiato: la vecchia password funziona ancora
  await unlockWithPassword(vault, PASSWORD);
});

test('changePassword rejects a session from another vault', async () => {
  const { vault } = await newVault();
  const other = await newVault('otra contraseña larga');
  await assert.rejects(changePassword(vault, other.session, 'una contraseña nueva'), { name: 'VaultMismatchError' });
  // il vault non è stato toccato
  await unlockWithPassword(vault, PASSWORD);
});

test('password is normalized to NFC', async () => {
  const nfc = 'contraseña'; // 10 caratteri con ñ precomposta
  const nfd = nfc.normalize('NFD'); // n + tilde combinante
  assert.notEqual(nfc, nfd);
  assert.equal(normalizeSecret(nfd), nfc);

  // creata con NFC, aperta con NFD
  const a = await createVault({ password: nfc, iterations: FAST });
  const envelopeA = await a.session.encryptJson({ n: 1 });
  const openedWithNfd = await unlockWithPassword(a.vault, nfd);
  assert.deepEqual(await openedWithNfd.decryptJson(envelopeA), { n: 1 });

  // creata con NFD, aperta con NFC
  const b = await createVault({ password: nfd, iterations: FAST });
  const envelopeB = await b.session.encryptJson({ n: 2 });
  const openedWithNfc = await unlockWithPassword(b.vault, nfc);
  assert.deepEqual(await openedWithNfc.decryptJson(envelopeB), { n: 2 });
});

test('password with accents, ñ, ¿ and ¡ opens with any normalization', async () => {
  const typed = 'Ánimo, ¿qué tal? ¡Señorita!';
  const { vault, session } = await createVault({ password: typed, iterations: FAST });
  const envelope = await session.encryptJson({ ok: true });
  for (const form of ['NFC', 'NFD']) {
    const opened = await unlockWithPassword(vault, typed.normalize(form));
    assert.deepEqual(await opened.decryptJson(envelope), { ok: true }, form);
  }
});

test('isSetupComplete is false until confirmRecoveryCode', async () => {
  const { vault } = await newVault();
  assert.equal(isSetupComplete(vault), false);
  const confirmed = confirmRecoveryCode(vault);
  assert.equal(isSetupComplete(confirmed), true);
  // non modifica l'originale
  assert.equal(isSetupComplete(vault), false);
});

test('a vault never confirmed is still incomplete after a restart', async () => {
  const { vault } = await newVault();
  const stored = JSON.parse(JSON.stringify(vault)); // ciò che resta nel telefono
  assert.equal(isSetupComplete(stored), false);
  assert.equal(isSetupComplete(null), false);
  assert.equal(isSetupComplete(undefined), false);
  assert.equal(isSetupComplete({}), false);
});

test('vault record survives a JSON roundtrip and can be stored as a meta record', async () => {
  const { vault, session } = await newVault();
  assert.equal(vault.id, 'vault');
  const envelope = await session.encryptJson({ ok: 1 });
  const restored = JSON.parse(JSON.stringify(confirmRecoveryCode(vault)));
  assert.equal(isSetupComplete(restored), true);
  const opened = await unlockWithPassword(restored, PASSWORD);
  assert.deepEqual(await opened.decryptJson(envelope), { ok: 1 });
});

test('default iterations constant is 600000', async () => {
  assert.equal(PBKDF2_ITERATIONS, 600000);
  const { vault } = await createVault({ password: PASSWORD });
  assert.equal(vault.kdf.iterations, 600000);
});

test('createVault rejects a password shorter than MIN_PASSWORD_LENGTH', async () => {
  await assert.rejects(createVault({ password: 'a'.repeat(MIN_PASSWORD_LENGTH - 1), iterations: FAST }), {
    name: 'PasswordTooShortError',
  });
  await assert.rejects(createVault({ password: '', iterations: FAST }), { name: 'PasswordTooShortError' });
  await createVault({ password: 'a'.repeat(MIN_PASSWORD_LENGTH), iterations: FAST }); // il minimo esatto va bene
});

test('createVault rejects a non-string password and invalid iterations', async () => {
  await assert.rejects(createVault({ password: 12345678901, iterations: FAST }), TypeError);
  await assert.rejects(createVault({ password: PASSWORD, iterations: 0 }), RangeError);
});

test('two vaults get different recovery codes and wrapped keys', async () => {
  const a = await newVault();
  const b = await newVault();
  assert.notEqual(a.recoveryCode, b.recoveryCode);
  assert.notEqual(a.vault.password.key.ct, b.vault.password.key.ct);
  assert.notEqual(a.vault.password.salt, b.vault.password.salt);
});

// ---- aggiunti dopo la revisione indipendente di T4 ----

test('changePassword accepts a new password typed as NFD and unlocks with NFC', async () => {
  const { vault, session } = await newVault();
  const nfc = 'nueva contraseña';
  const updated = await changePassword(vault, session, nfc.normalize('NFD'));
  await unlockWithPassword(updated, nfc);
  await unlockWithPassword(updated, nfc.normalize('NFD'));
});

test('createVault counts the minimum length after NFC', async () => {
  const nfd = 'contraseñ'.normalize('NFD'); // 9 caratteri, 10 punti di codice in NFD
  assert.equal(nfd.length, 10);
  await assert.rejects(createVault({ password: nfd, iterations: FAST }), { name: 'PasswordTooShortError' });
});

test('recovery code accepts typographic dashes and full-width characters', async () => {
  const { vault, session, recoveryCode } = await newVault();
  const envelope = await session.encryptJson({ ok: 1 });
  const enDash = recoveryCode.replaceAll('-', '–');
  const fullWidth = [...recoveryCode.replaceAll('-', '')]
    .map((c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0))
    .join('');
  for (const typed of [enDash, fullWidth]) {
    const opened = await unlockWithRecoveryCode(vault, typed);
    assert.deepEqual(await opened.decryptJson(envelope), { ok: 1 });
  }
});

test('a corrupt vault record is not reported as a wrong password', async () => {
  const { vault } = await newVault();
  const b64 = (n) => btoa(String.fromCharCode(...new Uint8Array(n)));
  const broken = [
    { ...vault, password: { ...vault.password, key: { ...vault.password.key, iv: b64(8) } } }, // IV di 8 byte
    { ...vault, password: { ...vault.password, key: { ...vault.password.key, iv: b64(0) } } }, // IV vuoto
    { ...vault, password: { ...vault.password, key: { ...vault.password.key, ct: b64(4) } } }, // più corto del tag
    { ...vault, password: { ...vault.password, key: { ...vault.password.key, iv: '@@non-base64@@' } } },
    { ...vault, password: { ...vault.password, key: { v: 2, iv: vault.password.key.iv, ct: vault.password.key.ct } } },
  ];
  for (const record of broken) {
    const err = await unlockWithPassword(record, PASSWORD).catch((e) => e);
    assert.ok(err instanceof Error, 'doveva fallire');
    assert.notEqual(err.name, 'WrongSecretError', JSON.stringify(record.password.key).slice(0, 60));
  }
});

test('a vault whose wrapped key was altered looks like a wrong password', async () => {
  // con AES-GCM un testo cifrato alterato non si distingue da una chiave sbagliata
  const { vault } = await newVault();
  const bytes = Uint8Array.from(atob(vault.password.key.ct), (c) => c.charCodeAt(0));
  bytes[0] ^= 1;
  const altered = { ...vault, password: { ...vault.password, key: { ...vault.password.key, ct: btoa(String.fromCharCode(...bytes)) } } };
  await assert.rejects(unlockWithPassword(altered, PASSWORD), WrongSecretError);
});

test('unlock functions always return a promise, even for invalid input', async () => {
  const { vault } = await newVault();
  const a = unlockWithPassword(vault, 12345);
  assert.ok(a instanceof Promise);
  await assert.rejects(a, TypeError);
  const b = unlockWithRecoveryCode(vault, undefined);
  assert.ok(b instanceof Promise);
  await assert.rejects(b, TypeError);
  const c = unlockWithPassword({}, PASSWORD);
  assert.ok(c instanceof Promise);
  await assert.rejects(c);
});
