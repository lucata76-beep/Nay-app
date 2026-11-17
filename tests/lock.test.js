// T11: regole di creazione del vault (revisione T4: mai una nuova creazione sopra dati cifrati).
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../js/core/db.js';
import { confirmRecoveryCode, createVault } from '../js/core/vault.js';
import { creationStatus, hasEncryptedData } from '../js/ui/screens/lock.js';

let counter = 0;
const freshDb = () => openDb(`nay-lock-test-${++counter}`);
const encrypted = { v: 1, iv: 'AA', ct: 'AA' };

async function vaultRecords() {
  const { vault } = await createVault({ password: 'una contraseña larga', iterations: 1000 });
  return { unconfirmed: vault, confirmed: confirmRecoveryCode(vault) };
}

test('creationStatus is ok on an empty database', async () => {
  const db = await freshDb();
  assert.equal(await creationStatus(db), 'ok');
  assert.equal(await hasEncryptedData(db), false);
});

test('creationStatus is exists when a confirmed vault is stored, and a lone vault is not data', async () => {
  const db = await freshDb();
  await db.put('meta', (await vaultRecords()).confirmed);
  assert.equal(await creationStatus(db), 'exists');
  assert.equal(await hasEncryptedData(db), false);
});

test('an unconfirmed vault alone does not block a new creation', async () => {
  const db = await freshDb();
  await db.put('meta', (await vaultRecords()).unconfirmed);
  assert.equal(await creationStatus(db), 'ok');
});

test('creationStatus is orphan when encrypted data exists without a confirmed vault', async () => {
  for (const [store, record] of [
    ['ideas', { id: 'i', updatedAt: 'x', enc: encrypted }],
    ['media', { id: 'm', updatedAt: 'x', enc: encrypted }],
    ['publications', { id: 'p', updatedAt: 'x', enc: encrypted }],
    ['meta', { id: 'draft:idea:new', updatedAt: 'x', enc: encrypted }],
  ]) {
    const db = await freshDb();
    assert.equal(await creationStatus(db), 'ok', store);
    await db.put(store, record);
    assert.equal(await creationStatus(db), 'orphan', `solo ${store}`);
    // anche con un vault non confermato accanto ai dati
    await db.put('meta', (await vaultRecords()).unconfirmed);
    assert.equal(await creationStatus(db), 'orphan', `${store} + vault non confermato`);
  }
});

test('a confirmed vault wins over the data it protects (the app unlocks, it never recreates)', async () => {
  const db = await freshDb();
  await db.put('ideas', { id: 'i', updatedAt: 'x', enc: encrypted });
  await db.put('meta', (await vaultRecords()).confirmed);
  assert.equal(await creationStatus(db), 'exists');
});

test('hasEncryptedData never reads the blobs store (it would load the videos in memory)', async () => {
  const db = await freshDb();
  const reads = [];
  const spy = { ...db, list: async (store) => (reads.push(store), db.list(store)) };
  await hasEncryptedData(spy);
  assert.ok(!reads.includes('blobs'), reads.join(','));
  assert.ok(reads.includes('ideas') && reads.includes('meta'));
});
