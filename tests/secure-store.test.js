import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, storageStatus, NEAR_FULL_RATIO, STORES } from '../js/core/db.js';
import { createSecureStore, StorageFullError } from '../js/core/secure-store.js';
import { createVault } from '../js/core/vault.js';

let counter = 0;
async function setup() {
  const db = await openDb(`nay-test-${++counter}`);
  const { session } = await createVault({ password: 'una contraseña larga', iterations: 1000 });
  return { db, session, store: createSecureStore(db, session) };
}

function quotaError() {
  return new DOMException('The quota has been exceeded.', 'QuotaExceededError');
}

test('openDb creates every store and Db works on each', async () => {
  const { db } = await setup();
  assert.deepEqual(STORES, ['meta', 'ideas', 'media', 'blobs', 'templates', 'prompts', 'publications', 'repetitions']);
  for (const name of STORES) {
    assert.deepEqual(await db.list(name), []);
    await db.put(name, { id: 'a', n: 1 });
    assert.deepEqual(await db.get(name, 'a'), { id: 'a', n: 1 });
    assert.equal(await db.get(name, 'missing'), null);
    await db.remove(name, 'a');
    assert.equal(await db.get(name, 'a'), null);
  }
});

test('stored value does not contain the plaintext', async () => {
  const { db, store } = await setup();
  const saved = await store.save('ideas', { text: 'Texto secreto: ¿qué tal, señorita?', lang: 'es' });
  const raw = await db.get('ideas', saved.id);
  assert.deepEqual(Object.keys(raw).sort(), ['enc', 'id', 'updatedAt']);
  const dump = JSON.stringify(raw);
  assert.ok(!dump.includes('Texto secreto'), dump);
  assert.ok(!dump.includes('señorita'), dump);
  assert.ok(!dump.includes('"lang"'), dump);
});

test('stored blob does not contain the plaintext bytes or the mime type', async () => {
  const { db, store } = await setup();
  const secret = 'FOTO-SEGRETA-1234567890';
  const id = await store.saveBlob(new Blob([secret], { type: 'image/jpeg' }));
  const raw = await db.get('blobs', id);
  assert.deepEqual(Object.keys(raw).sort(), ['enc', 'id', 'info', 'updatedAt']);
  const dump = JSON.stringify(raw);
  assert.ok(!dump.includes('FOTO-SEGRETA'), dump);
  assert.ok(!dump.includes(btoa(secret)), dump);
  assert.ok(!dump.includes('image/jpeg'), dump);
});

test('save sets id and updatedAt', async () => {
  const { store } = await setup();
  const input = { text: 'hola' };
  const saved = await store.save('ideas', input);
  assert.match(saved.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.equal(new Date(saved.updatedAt).toISOString(), saved.updatedAt);
  assert.ok(Math.abs(Date.now() - new Date(saved.updatedAt).getTime()) < 5000);
  assert.equal(saved.text, 'hola');
  assert.deepEqual(input, { text: 'hola' }, 'save non deve modificare l’oggetto ricevuto');
  assert.deepEqual(await store.load('ideas', saved.id), saved);
});

test('save keeps an explicit id, overwrites that record and refreshes updatedAt', async () => {
  const { store } = await setup();
  const first = await store.save('ideas', { id: 'idea-1', text: 'uno' });
  assert.equal(first.id, 'idea-1');
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = await store.save('ideas', { id: 'idea-1', text: 'dos' });
  assert.equal(second.id, 'idea-1');
  assert.ok(second.updatedAt > first.updatedAt);
  assert.equal((await store.all('ideas')).length, 1);
  assert.equal((await store.load('ideas', 'idea-1')).text, 'dos');
});

test('all returns decrypted records', async () => {
  const { store } = await setup();
  await store.save('ideas', { text: 'uno' });
  await store.save('ideas', { text: 'dos' });
  await store.save('ideas', { text: 'tres ñ' });
  await store.save('prompts', { text: 'otro almacén' });
  const texts = (await store.all('ideas')).map((r) => r.text).sort();
  assert.deepEqual(texts, ['dos', 'tres ñ', 'uno']);
  assert.equal((await store.all('prompts')).length, 1);
  assert.deepEqual(await store.all('templates'), []);
});

test('load returns null for a missing record and remove deletes a record', async () => {
  const { store } = await setup();
  assert.equal(await store.load('ideas', 'nope'), null);
  const saved = await store.save('ideas', { text: 'x' });
  await store.remove('ideas', saved.id);
  assert.equal(await store.load('ideas', saved.id), null);
  assert.deepEqual(await store.all('ideas'), []);
});

test('records are unreadable with another session', async () => {
  const { db, store } = await setup();
  const saved = await store.save('ideas', { text: 'privado' });
  const { session: other } = await createVault({ password: 'otra contraseña larga', iterations: 1000 });
  const intruder = createSecureStore(db, other);
  await assert.rejects(intruder.load('ideas', saved.id));
  await assert.rejects(intruder.all('ideas'));
});

test('a record copied under another id is rejected', async () => {
  const { db, store } = await setup();
  const saved = await store.save('ideas', { text: 'privado' });
  const raw = await db.get('ideas', saved.id);
  await db.put('ideas', { ...raw, id: 'otro-id' });
  await assert.rejects(store.load('ideas', 'otro-id'));
});

test('blob roundtrip keeps bytes', async () => {
  const { store } = await setup();
  const bytes = new Uint8Array(256).map((_, i) => i);
  const id = await store.saveBlob(new Blob([bytes], { type: 'video/mp4' }));
  assert.equal(typeof id, 'string');
  const blob = await store.loadBlob(id);
  assert.equal(blob.type, 'video/mp4');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
});

test('a blob record copied under another id is rejected', async () => {
  const { db, store } = await setup();
  const id = await store.saveBlob(new Blob(['abc'], { type: 'image/png' }));
  await db.put('blobs', { ...(await db.get('blobs', id)), id: 'otro-blob' });
  await assert.rejects(store.loadBlob('otro-blob'));
});

test('loadBlob rejects for a missing id', async () => {
  const { store } = await setup();
  await assert.rejects(store.loadBlob('missing'));
});

test('QuotaExceededError becomes StorageFullError and leaves the previous record intact', async () => {
  const { db, session, store } = await setup();
  const saved = await store.save('ideas', { id: 'idea-1', text: 'versión 1' });

  const fullDb = { ...db, put: async () => { throw quotaError(); } };
  const fullStore = createSecureStore(fullDb, session);

  await assert.rejects(fullStore.save('ideas', { id: 'idea-1', text: 'versión 2' }), StorageFullError);
  const err = await fullStore.save('ideas', { id: 'idea-1', text: 'versión 2' }).catch((e) => e);
  assert.ok(err instanceof Error);
  assert.equal(err.name, 'StorageFullError');

  assert.deepEqual(await store.load('ideas', 'idea-1'), saved, 'il record precedente deve restare uguale');
  assert.equal((await store.all('ideas')).length, 1);
});

test('QuotaExceededError while saving a blob becomes StorageFullError and writes nothing', async () => {
  const { db, session, store } = await setup();
  const fullDb = { ...db, put: async () => { throw quotaError(); } };
  const fullStore = createSecureStore(fullDb, session);
  await assert.rejects(fullStore.saveBlob(new Blob(['video enorme'], { type: 'video/mp4' })), StorageFullError);
  assert.deepEqual(await db.list('blobs'), []);
  assert.ok(store);
});

test('other write errors are not turned into StorageFullError', async () => {
  const { db, session } = await setup();
  const brokenDb = { ...db, put: async () => { throw new Error('disco rotto'); } };
  const broken = createSecureStore(brokenDb, session);
  const err = await broken.save('ideas', { text: 'x' }).catch((e) => e);
  assert.ok(!(err instanceof StorageFullError));
  assert.equal(err.message, 'disco rotto');
});

test('a quota error raised inside the IndexedDB request writes nothing and reaches the caller', async () => {
  const { db, store } = await setup();
  await store.save('ideas', { id: 'idea-1', text: 'versión 1' });
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function () {
    throw quotaError();
  };
  let err;
  try {
    err = await store.save('ideas', { id: 'idea-1', text: 'versión 2' }).catch((e) => e);
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.ok(err instanceof StorageFullError, String(err));
  assert.equal((await store.load('ideas', 'idea-1')).text, 'versión 1');
  assert.equal((await db.list('ideas')).length, 1);
});

test('a quota error that aborts the IndexedDB transaction writes nothing and becomes StorageFullError', async () => {
  // Nel browser la quota esaurita annulla la transazione in modo asincrono e mette
  // l'errore in tx.error: qui si simula lo stesso percorso.
  const { db, store } = await setup();
  await store.save('ideas', { id: 'idea-1', text: 'versión 1' });
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (...args) {
    const request = original.apply(this, args);
    Object.defineProperty(this.transaction, 'error', { value: quotaError(), configurable: true });
    this.transaction.abort();
    return request;
  };
  let err;
  try {
    err = await store.save('ideas', { id: 'idea-1', text: 'versión 2' }).catch((e) => e);
    const blobErr = await store.saveBlob(new Blob(['video'], { type: 'video/mp4' })).catch((e) => e);
    assert.ok(blobErr instanceof StorageFullError, String(blobErr));
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.ok(err instanceof StorageFullError, String(err));
  assert.equal((await store.load('ideas', 'idea-1')).text, 'versión 1', 'la transazione annullata non deve cambiare nulla');
  assert.deepEqual(await db.list('blobs'), []);
});

test('replaceAll replaces every store in one transaction', async () => {
  const { db } = await setup();
  await db.put('ideas', { id: 'vecchia', n: 1 });
  await db.put('meta', { id: 'vault', n: 1 });
  await db.put('prompts', { id: 'p-vecchio', n: 1 });
  await db.replaceAll({ ideas: [{ id: 'nuova-1', n: 2 }, { id: 'nuova-2', n: 3 }], meta: [{ id: 'vault', n: 9 }] });
  assert.deepEqual((await db.list('ideas')).map((r) => r.id).sort(), ['nuova-1', 'nuova-2']);
  assert.deepEqual(await db.list('meta'), [{ id: 'vault', n: 9 }]);
  assert.deepEqual(await db.list('prompts'), [], 'gli archivi non nominati si svuotano');
  await db.replaceAll({});
  for (const name of STORES) assert.deepEqual(await db.list(name), []);
});

test('replaceAll rolls everything back when a write fails', async () => {
  const { db } = await setup();
  await db.put('ideas', { id: 'vecchia', n: 1 });
  await db.put('meta', { id: 'vault', n: 1 });
  const original = IDBObjectStore.prototype.put;
  let puts = 0;
  IDBObjectStore.prototype.put = function (...args) {
    if (++puts === 3) throw quotaError();
    return original.apply(this, args);
  };
  let err;
  try {
    err = await db.replaceAll({ ideas: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], meta: [{ id: 'vault', n: 2 }] }).catch((e) => e);
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.equal(err.name, 'QuotaExceededError');
  assert.deepEqual(await db.list('ideas'), [{ id: 'vecchia', n: 1 }]);
  assert.deepEqual(await db.list('meta'), [{ id: 'vault', n: 1 }]);
});

test('replaceAll rolls everything back when the browser aborts the transaction', async () => {
  // come con la quota esaurita nel browser: la transazione si annulla più tardi e l'errore sta in tx.error
  const { db } = await setup();
  await db.put('ideas', { id: 'vecchia', n: 1 });
  await db.put('meta', { id: 'vault', n: 1 });
  const original = IDBObjectStore.prototype.put;
  let puts = 0;
  IDBObjectStore.prototype.put = function (...args) {
    const request = original.apply(this, args);
    if (++puts === 3) {
      // l'annullamento arriva dopo che tutte le scritture sono state accodate, come nel browser
      const tx = this.transaction;
      queueMicrotask(() => {
        Object.defineProperty(tx, 'error', { value: quotaError(), configurable: true });
        tx.abort();
      });
    }
    return request;
  };
  let err;
  try {
    err = await db.replaceAll({ ideas: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], meta: [{ id: 'vault', n: 2 }] }).catch((e) => e);
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.equal(err && err.name, 'QuotaExceededError', String(err));
  assert.deepEqual(await db.list('ideas'), [{ id: 'vecchia', n: 1 }]);
  assert.deepEqual(await db.list('meta'), [{ id: 'vault', n: 1 }]);
});

test('replaceAll rejects unknown store names without touching the data', async () => {
  const { db } = await setup();
  await db.put('ideas', { id: 'vecchia', n: 1 });
  await assert.rejects(db.replaceAll({ inventato: [{ id: 'x' }] }), TypeError);
  assert.deepEqual(await db.list('ideas'), [{ id: 'vecchia', n: 1 }]);
});

test('storageStatus flags nearFull at 80% usage', async () => {
  const nav = (usage, quota, persisted = true) => ({
    storage: { estimate: async () => ({ usage, quota }), persisted: async () => persisted },
  });
  assert.equal(NEAR_FULL_RATIO, 0.8);
  assert.deepEqual(await storageStatus(nav(800, 1000)), { usage: 800, quota: 1000, persisted: true, nearFull: true });
  assert.equal((await storageStatus(nav(799, 1000))).nearFull, false);
  assert.equal((await storageStatus(nav(950, 1000))).nearFull, true);
  assert.equal((await storageStatus(nav(100, 1000, false))).persisted, false);
});

test('storageStatus does not fail when the browser has no storage API', async () => {
  assert.deepEqual(await storageStatus({}), { usage: 0, quota: 0, persisted: false, nearFull: false });
  assert.equal((await storageStatus({ storage: { estimate: async () => ({}) } })).nearFull, false);
});
