import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateBackupSize,
  exportBackup,
  importBackup,
  BackupFormatError,
  BackupVersionError,
} from '../js/core/backup.js';
import { openDb, STORES } from '../js/core/db.js';
import { createSecureStore, StorageFullError } from '../js/core/secure-store.js';
import { createVault, confirmRecoveryCode, unlockWithPassword } from '../js/core/vault.js';
import { WrongSecretError } from '../js/core/crypto.js';

const PASSWORD = 'una contraseña larga';
let counter = 0;
const newDb = () => openDb(`nay-backup-${++counter}-${Math.random().toString(36).slice(2)}`);

// Un'app con dati in ogni archivio, compresi due blob (uno da 300 KB di byte casuali).
async function makeApp(password = PASSWORD) {
  const db = await newDb();
  const { vault: created, session, recoveryCode } = await createVault({ password, iterations: 1000 });
  const vault = confirmRecoveryCode(created);
  await db.put('meta', vault);
  const store = createSecureStore(db, session);
  const video = new Uint8Array(300 * 1024).map((_, i) => (i * 31 + (i >> 9)) & 255);
  const videoId = await store.saveBlob(new Blob([video], { type: 'video/mp4' }));
  const photoId = await store.saveBlob(new Blob(['FOTO-SEGRETA-123'], { type: 'image/jpeg' }));
  await store.save('media', { id: 'media-1', kind: 'video', mime: 'video/mp4', name: 'prova.mp4', blobId: videoId, description: 'Texto secreto del vídeo' });
  await store.save('media', { id: 'media-2', kind: 'foto', mime: 'image/jpeg', name: 'foto.jpg', blobId: photoId, description: 'otra' });
  await store.save('ideas', { id: 'idea-1', text: 'Idea secreta: ¿qué tal, señorita?', mediaIds: ['media-1'], lang: 'es', status: 'nuova' });
  await store.save('ideas', { id: 'idea-2', text: 'Un’altra idea segreta', mediaIds: [], lang: 'it', status: 'nuova' });
  await store.save('templates', { id: 'tpl-1', name: 'Mi plantilla', kind: 'foto', lang: 'es', body: 'cuerpo {idea}', builtin: false });
  await store.save('prompts', { id: 'prompt-1', ideaId: 'idea-1', templateId: 'tpl-1', lang: 'es', text: 'Prompt secreto', createdAt: '2026-01-01T00:00:00.000Z' });
  await store.save('publications', { id: 'pub-1', title: 'Título secreto', description: 'Descripción', type: 'foto', lang: 'es', publishedAt: '2026-01-01T00:00:00.000Z', screenshotMediaId: 'media-2' });
  await store.save('repetitions', { id: 'rep-1', pairKey: 'k', sourceType: 'idea', sourceId: 'idea-1', publicationId: 'pub-1', score: 0.6, sharedWords: ['palabra'], status: 'da_valutare', checkedAt: '2026-01-02T00:00:00.000Z' });
  await store.save('meta', { id: 'draft:idea-form', data: { text: 'borrador' } });
  return { db, vault, session, store, recoveryCode, video, videoId, photoId };
}

async function snapshot(db) {
  const out = {};
  for (const name of STORES) out[name] = (await db.list(name)).sort((a, b) => (a.id < b.id ? -1 : 1));
  return out;
}

const countRecords = (snap) => Object.values(snap).reduce((n, list) => n + list.length, 0);

// Disposizione del file (per costruire i casi di prova): 'NAYBK1' (6 byte), versione (2 byte),
// lunghezza dell'intestazione (4 byte), SHA-256 dell'intestazione (32 byte), intestazione JSON, poi i
// record: indice dell'archivio (1 byte), lunghezza (4 byte), JSON del record.
const HEADER_START = 12 + 32;

async function layout(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const headerEnd = HEADER_START + view.getUint32(8);
  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(HEADER_START, headerEnd)));
  const total = header.stores.reduce((n, s) => n + s.count, 0);
  const bounds = [headerEnd];
  let offset = headerEnd;
  for (let i = 0; i < total; i++) {
    offset += 5 + view.getUint32(offset + 1);
    bounds.push(offset);
  }
  assert.equal(offset, bytes.length);
  return { bytes, view, header, headerEnd, bounds, total };
}

async function importFails(db, bytes, secret, expected) {
  const before = await snapshot(db);
  await assert.rejects(importBackup(new Blob([bytes]), secret, db), expected);
  assert.deepEqual(await snapshot(db), before, 'i dati attuali devono restare uguali');
}

test('roundtrip into an empty db restores all stores', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);
  const target = await newDb();

  const { imported } = await importBackup(backup, PASSWORD, target);
  const original = await snapshot(app.db);
  const restored = await snapshot(target);
  assert.deepEqual(restored, original);
  assert.equal(imported, countRecords(original) - 1, 'imported conta i record, non il vault');
  for (const name of STORES) assert.ok(name in restored);

  // i dati si leggono con la password, come su un telefono nuovo
  const vault = await target.get('meta', 'vault');
  const session = await unlockWithPassword(vault, PASSWORD);
  const store = createSecureStore(target, session);
  assert.equal((await store.load('ideas', 'idea-1')).text, 'Idea secreta: ¿qué tal, señorita?');
  assert.equal((await store.all('publications')).length, 1);
  const video = await store.loadBlob(app.videoId);
  assert.equal(video.type, 'video/mp4');
  assert.deepEqual(new Uint8Array(await video.arrayBuffer()), app.video);
});

test('the backup keeps the records encrypted', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);
  const text = new TextDecoder('latin1').decode(new Uint8Array(await backup.arrayBuffer()));
  for (const secret of ['Texto secreto', 'Idea secreta', 'Prompt secreto', 'Título secreto', 'palabra', 'borrador', 'FOTO-SEGRETA', 'video/mp4', PASSWORD]) {
    assert.ok(!text.includes(secret), `in chiaro nel backup: ${secret}`);
  }
  assert.ok(text.startsWith('NAYBK1'));
});

test('import replaces the existing data and the vault', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);

  const other = await makeApp('otra contraseña totalmente distinta');
  const before = await snapshot(other.db);
  assert.notDeepEqual(before, await snapshot(app.db));

  await importBackup(backup, PASSWORD, other.db);
  assert.deepEqual(await snapshot(other.db), await snapshot(app.db));
  // il vault del vecchio telefono non c'è più: la sua password non apre più nulla
  await assert.rejects(unlockWithPassword(await other.db.get('meta', 'vault'), 'otra contraseña totalmente distinta'), WrongSecretError);
  await unlockWithPassword(await other.db.get('meta', 'vault'), PASSWORD);
});

test('wrong secret throws WrongSecretError and leaves the db unchanged', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);
  const bytes = new Uint8Array(await backup.arrayBuffer());
  const target = await makeApp('otra contraseña totalmente distinta'); // con i suoi dati
  await importFails(target.db, bytes, 'una contraseña sbagliata', WrongSecretError);
  await importFails(target.db, bytes, 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AAAA', WrongSecretError);
  await importFails(target.db, bytes, '', WrongSecretError);
  // anche la password del telefono di destinazione non apre il backup
  await importFails(target.db, bytes, 'otra contraseña totalmente distinta', WrongSecretError);
  const err = await importBackup(new Blob([bytes]), 'sbagliata', target.db).catch((e) => e);
  assert.equal(err.name, 'WrongSecretError');
});

test('truncated file throws BackupFormatError and leaves the db unchanged', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);
  const { bytes, headerEnd, bounds } = await layout(backup);
  const target = await makeApp('otra contraseña totalmente distinta');

  // ogni taglio nell'intestazione e subito dopo, ai confini tra i record e a metà dei record
  const cuts = new Set([0, 1, 5, 6, 7, 8, 11, 12, headerEnd - 1, headerEnd, headerEnd + 1, headerEnd + 4, headerEnd + 5, bytes.length - 1]);
  for (let i = 12; i < Math.min(headerEnd + 8, bytes.length); i += 37) cuts.add(i);
  for (const bound of bounds) {
    cuts.add(bound);
    cuts.add(bound - 1);
    cuts.add(bound + 3);
  }
  for (let i = 1; i < bounds.length; i++) cuts.add(Math.floor((bounds[i - 1] + bounds[i]) / 2));
  for (const cut of [...cuts].filter((n) => n >= 0 && n < bytes.length).sort((a, b) => a - b)) {
    await importFails(target.db, bytes.subarray(0, cut), PASSWORD, BackupFormatError);
  }
});

test('a file with extra bytes at the end throws BackupFormatError', async () => {
  const app = await makeApp();
  const { bytes } = await layout(await exportBackup(app.db, app.vault));
  const target = await makeApp('otra contraseña totalmente distinta');
  const longer = new Uint8Array(bytes.length + 1);
  longer.set(bytes);
  await importFails(target.db, longer, PASSWORD, BackupFormatError);
});

test('a corrupted record throws BackupFormatError and leaves the db unchanged', async () => {
  const app = await makeApp();
  const { bytes, headerEnd } = await layout(await exportBackup(app.db, app.vault));
  const target = await makeApp('otra contraseña totalmente distinta');
  const text = new TextDecoder('latin1').decode(bytes);
  // un carattere del testo cifrato di un record (dopo l'intestazione) cambiato in un altro valido
  const at = text.indexOf('"ct":"', headerEnd) + 6 + 10;
  const flipped = bytes.slice();
  flipped[at] = flipped[at] === 65 ? 66 : 65; // 'A' <-> 'B'
  await importFails(target.db, flipped, PASSWORD, BackupFormatError);
});

test('a record moved under another id throws BackupFormatError', async () => {
  const app = await makeApp();
  const { bytes } = await layout(await exportBackup(app.db, app.vault));
  const target = await makeApp('otra contraseña totalmente distinta');
  const text = new TextDecoder('latin1').decode(bytes);
  const at = text.indexOf('"id":"idea-1"');
  assert.ok(at > 0);
  const changed = bytes.slice();
  changed[at + '"id":"idea-'.length] = '9'.charCodeAt(0); // idea-1 → idea-9, stessa lunghezza
  await importFails(target.db, changed, PASSWORD, BackupFormatError);
});

test('future version throws BackupVersionError', async () => {
  const app = await makeApp();
  const { bytes } = await layout(await exportBackup(app.db, app.vault));
  const target = await makeApp('otra contraseña totalmente distinta');
  for (const version of [2, 3, 255, 65535]) {
    const future = bytes.slice();
    new DataView(future.buffer).setUint16(6, version);
    await importFails(target.db, future, PASSWORD, BackupVersionError);
  }
  const err = await importBackup(new Blob([bytes.slice().fill(2, 7, 8)]), PASSWORD, target.db).catch((e) => e);
  assert.ok(err instanceof BackupVersionError);
  assert.equal(err.name, 'BackupVersionError');
  // anche se il resto del file non si può leggere, vale l'errore di versione
  const unreadable = bytes.slice(0, 20);
  new DataView(unreadable.buffer).setUint16(6, 2);
  await importFails(target.db, unreadable, PASSWORD, BackupVersionError);
});

test('files that are not backups throw BackupFormatError', async () => {
  const target = await makeApp('otra contraseña totalmente distinta');
  await importFails(target.db, new Uint8Array(0), PASSWORD, BackupFormatError);
  await importFails(target.db, new TextEncoder().encode('{"hola": "esto no es un backup"}'), PASSWORD, BackupFormatError);
  await importFails(target.db, new TextEncoder().encode('NAYBK2 pero otra cosa'), PASSWORD, BackupFormatError);
  await importFails(target.db, crypto.getRandomValues(new Uint8Array(500)), PASSWORD, BackupFormatError);
  const zero = new Uint8Array(40);
  zero.set(new TextEncoder().encode('NAYBK1'));
  await importFails(target.db, zero, PASSWORD, BackupFormatError); // versione 0
  const app = await makeApp();
  const { bytes } = await layout(await exportBackup(app.db, app.vault));
  const hugeHeader = bytes.slice();
  new DataView(hugeHeader.buffer).setUint32(8, 0xffffffff);
  await importFails(target.db, hugeHeader, PASSWORD, BackupFormatError);
});

test('errors carry clear names and are Error instances', () => {
  const format = new BackupFormatError();
  const version = new BackupVersionError(9);
  assert.ok(format instanceof Error && version instanceof Error);
  assert.equal(format.name, 'BackupFormatError');
  assert.equal(version.name, 'BackupVersionError');
  assert.equal(version.version, 9);
});

test('recovery code opens a backup', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);
  const typed = ` ${app.recoveryCode.toLowerCase().replaceAll('-', ' ')} `;
  const target = await newDb();
  const { imported } = await importBackup(backup, typed, target);
  assert.ok(imported > 0);
  assert.deepEqual(await snapshot(target), await snapshot(app.db));
  // e il vault ripristinato si apre ancora con la password
  await unlockWithPassword(await target.get('meta', 'vault'), PASSWORD);
});

test('estimateBackupSize is at least the sum of the stored blob sizes', async () => {
  const app = await makeApp();
  const blobBytes = app.video.length + 'FOTO-SEGRETA-123'.length;
  const estimate = await estimateBackupSize(app.db);
  assert.ok(estimate >= blobBytes, `${estimate} < ${blobBytes}`);
  // la stima non supera la dimensione del file (che ha in più l'intestazione e 5 byte per record)
  const file = await exportBackup(app.db, app.vault);
  assert.ok(file.size >= estimate, `${file.size} < ${estimate}`);
  // aggiungere un blob fa crescere la stima di almeno la sua dimensione
  const store = createSecureStore(app.db, app.session);
  await store.saveBlob(new Blob([new Uint8Array(50000)], { type: 'video/mp4' }));
  assert.ok((await estimateBackupSize(app.db)) >= estimate + 50000);
  // db vuoto: stima zero
  assert.equal(await estimateBackupSize(await newDb()), 0);
});

test('exporting an app with only the vault gives a backup that imports', async () => {
  const db = await newDb();
  const { vault: created } = await createVault({ password: PASSWORD, iterations: 1000 });
  const vault = confirmRecoveryCode(created);
  await db.put('meta', vault);
  const backup = await exportBackup(db, vault);
  const target = await newDb();
  assert.deepEqual(await importBackup(backup, PASSWORD, target), { imported: 0 });
  assert.deepEqual(await target.get('meta', 'vault'), vault);
});

test('the backup does not list the vault twice and its counts match the records', async () => {
  const app = await makeApp();
  const { header, total } = await layout(await exportBackup(app.db, app.vault));
  assert.deepEqual(header.stores.map((s) => s.name), STORES);
  assert.equal(header.stores.find((s) => s.name === 'meta').count, 1, 'solo la bozza: il vault sta nell’intestazione');
  assert.equal(total, countRecords(await snapshot(app.db)) - 1);
  assert.deepEqual(header.vault, app.vault);
});

test('import is all-or-nothing when the storage fills up while writing', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);
  const target = await makeApp('otra contraseña totalmente distinta');
  const before = await snapshot(target.db);

  const original = IDBObjectStore.prototype.put;
  let puts = 0;
  IDBObjectStore.prototype.put = function (...args) {
    if (++puts === 5) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    return original.apply(this, args);
  };
  let err;
  try {
    err = await importBackup(backup, PASSWORD, target.db).catch((e) => e);
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.ok(err instanceof StorageFullError, String(err));
  assert.ok(puts >= 5);
  assert.deepEqual(await snapshot(target.db), before, 'nessun record a metà: tutto come prima');
  // riprovando con spazio a sufficienza funziona
  await importBackup(backup, PASSWORD, target.db);
  assert.deepEqual(await snapshot(target.db), await snapshot(app.db));
});

test('import is all-or-nothing when the browser aborts the write transaction', async () => {
  const app = await makeApp();
  const backup = await exportBackup(app.db, app.vault);
  const target = await makeApp('otra contraseña totalmente distinta');
  const before = await snapshot(target.db);

  const original = IDBObjectStore.prototype.put;
  let puts = 0;
  IDBObjectStore.prototype.put = function (...args) {
    const request = original.apply(this, args);
    if (++puts === 6) {
      // l'annullamento arriva dopo che tutte le scritture sono state accodate, come nel browser
      const tx = this.transaction;
      queueMicrotask(() => {
        Object.defineProperty(tx, 'error', {
          value: new DOMException('The quota has been exceeded.', 'QuotaExceededError'),
          configurable: true,
        });
        tx.abort();
      });
    }
    return request;
  };
  let err;
  try {
    err = await importBackup(backup, PASSWORD, target.db).catch((e) => e);
  } finally {
    IDBObjectStore.prototype.put = original;
  }
  assert.ok(err instanceof StorageFullError, String(err));
  assert.deepEqual(await snapshot(target.db), before);
});

// ---- dopo la revisione indipendente di T9: intestazione protetta e un test per ogni controllo ----

const decode = (bytes) => new TextDecoder().decode(bytes);

async function parseFile(blob) {
  const { bytes, view, header, headerEnd, total } = await layout(blob);
  const frames = [];
  let offset = headerEnd;
  for (let i = 0; i < total; i++) {
    const length = view.getUint32(offset + 1);
    frames.push({ index: bytes[offset], record: JSON.parse(decode(bytes.subarray(offset + 5, offset + 5 + length))) });
    offset += 5 + length;
  }
  return { header, frames };
}

// Costruisce un file valido (con il digest giusto) da intestazione e record, per provare un difetto alla volta.
async function buildFile({ header, frames, version = 1 }) {
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(JSON.stringify(header));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', headerBytes));
  const fixed = new Uint8Array(12);
  fixed.set(encoder.encode('NAYBK1'));
  new DataView(fixed.buffer).setUint16(6, version);
  new DataView(fixed.buffer).setUint32(8, headerBytes.length);
  const parts = [];
  for (const { index, record } of frames) {
    const payload = encoder.encode(JSON.stringify(record));
    const head = new Uint8Array(5);
    head[0] = index;
    new DataView(head.buffer).setUint32(1, payload.length);
    parts.push(head, payload);
  }
  return new Uint8Array(await new Blob([fixed, digest, headerBytes, ...parts]).arrayBuffer());
}

async function crafted(app, change = () => {}, version = 1) {
  const parsed = await parseFile(await exportBackup(app.db, app.vault));
  change(parsed);
  return buildFile({ ...parsed, version });
}

const indexOfStore = (header, name) => header.stores.findIndex((s) => s.name === name);

test('a rebuilt file without defects imports (so the cases below fail only for their own defect)', async () => {
  const app = await makeApp();
  const target = await newDb();
  const bytes = await crafted(app);
  await importBackup(new Blob([bytes]), PASSWORD, target);
  assert.deepEqual(await snapshot(target), await snapshot(app.db));
});

test('every single flipped bit in the header area is rejected, never imported', async () => {
  const app = await makeApp();
  const { bytes, headerEnd } = await layout(await exportBackup(app.db, app.vault));
  const target = await makeApp('otra contraseña totalmente distinta');
  const before = await snapshot(target.db);
  const allowed = ['BackupFormatError', 'BackupVersionError', 'WrongSecretError'];
  for (let i = 0; i < headerEnd; i++) {
    const flipped = bytes.slice();
    flipped[i] ^= 1 << (i % 8);
    const err = await importBackup(new Blob([flipped]), PASSWORD, target.db).then(
      () => assert.fail(`byte ${i}: importato un file alterato`),
      (e) => e,
    );
    assert.ok(allowed.includes(err.name), `byte ${i}: ${err.name} ${err.message}`);
  }
  assert.deepEqual(await snapshot(target.db), before);
});

test('a header altered but with a matching digest is still checked field by field', async () => {
  const app = await makeApp();
  const target = await makeApp('otra contraseña totalmente distinta');
  const cases = {
    'setupComplete false': (p) => { p.header.vault.setupComplete = false; },
    'setupComplete missing': (p) => { delete p.header.vault.setupComplete; },
    'vault version 2': (p) => { p.header.vault.v = 2; },
    'kdf name': (p) => { p.header.vault.kdf.name = 'MD5'; },
    'recovery slot missing': (p) => { delete p.header.vault.recovery; },
    'password slot malformed': (p) => { p.header.vault.password.key.iv = 12; },
    'check missing': (p) => { delete p.header.vault.check; },
    'check altered': (p) => {
      const bytes = Uint8Array.from(atob(p.header.vault.check.ct), (c) => c.charCodeAt(0));
      bytes[0] ^= 1;
      p.header.vault.check.ct = btoa(String.fromCharCode(...bytes));
    },
    'vault id': (p) => { p.header.vault.id = 'otro'; },
    'vault is not an object': (p) => { p.header.vault = 'vault'; },
    'stores is not a list': (p) => { p.header.stores = {}; },
    'unknown store': (p) => { p.header.stores[0].name = 'inventado'; },
    'negative count': (p) => { p.header.stores[0].count = -1; },
    'repeated store': (p) => { p.header.stores[1].name = p.header.stores[0].name; },
  };
  for (const [name, change] of Object.entries(cases)) {
    await importFails(target.db, await crafted(app, change), PASSWORD, BackupFormatError).catch((e) => {
      e.message = `${name}: ${e.message}`;
      throw e;
    });
  }
});

test('PBKDF2 iterations above the cap are refused at once', async () => {
  const app = await makeApp();
  const target = await makeApp('otra contraseña totalmente distinta');
  const bytes = await crafted(app, (p) => { p.header.vault.kdf.iterations = 10_000_001; });
  const started = Date.now();
  await importFails(target.db, bytes, PASSWORD, BackupFormatError);
  assert.ok(Date.now() - started < 3000, 'non deve nemmeno provare a derivare la chiave');
  await importFails(target.db, await crafted(app, (p) => { p.header.vault.kdf.iterations = 0; }), PASSWORD, BackupFormatError);
  await importFails(target.db, await crafted(app, (p) => { p.header.vault.kdf.iterations = 1.5; }), PASSWORD, BackupFormatError);
});

test('the declared counts must match the records in the file', async () => {
  const app = await makeApp();
  const target = await makeApp('otra contraseña totalmente distinta');
  const more = await crafted(app, (p) => { p.header.stores[indexOfStore(p.header, 'ideas')].count += 1; });
  await importFails(target.db, more, PASSWORD, BackupFormatError);
  const fewer = await crafted(app, (p) => { p.header.stores[indexOfStore(p.header, 'ideas')].count -= 1; });
  await importFails(target.db, fewer, PASSWORD, BackupFormatError);
  // i record ci sono tutti ma sono assegnati a un archivio diverso da quello dichiarato
  const moved = await crafted(app, (p) => {
    const ideas = indexOfStore(p.header, 'ideas');
    const prompts = indexOfStore(p.header, 'prompts');
    p.frames.find((f) => f.index === ideas).index = prompts;
  });
  await importFails(target.db, moved, PASSWORD, BackupFormatError);
});

test('duplicate ids, an out-of-range store index, and a vault record among the meta records are refused', async () => {
  const app = await makeApp();
  const target = await makeApp('otra contraseña totalmente distinta');

  const duplicate = await crafted(app, (p) => {
    const ideas = indexOfStore(p.header, 'ideas');
    p.frames.push({ index: ideas, record: structuredClone(p.frames.find((f) => f.index === ideas).record) });
    p.header.stores[ideas].count += 1;
  });
  await importFails(target.db, duplicate, PASSWORD, BackupFormatError);

  const outOfRange = await crafted(app, (p) => { p.frames[0].index = 200; });
  await importFails(target.db, outOfRange, PASSWORD, BackupFormatError);

  // un record «vault» perfettamente cifrato e coerente: l'unico difetto è che il vault sta nell'intestazione
  const forged = await app.session.encryptJson({ id: 'vault', note: 'un secondo vault' });
  const vaultInMeta = await crafted(app, (p) => {
    const meta = indexOfStore(p.header, 'meta');
    p.frames.push({ index: meta, record: { id: 'vault', updatedAt: 'x', enc: forged } });
    p.header.stores[meta].count += 1;
  });
  await importFails(target.db, vaultInMeta, PASSWORD, BackupFormatError);
});

test('records that are not valid records are refused', async () => {
  const app = await makeApp();
  const target = await makeApp('otra contraseña totalmente distinta');
  const cases = {
    'without enc': (p) => { delete p.frames[0].record.enc; },
    'id not a string': (p) => { p.frames[0].record.id = 7; },
    'empty id': (p) => { p.frames[0].record.id = ''; },
    'not an object': (p) => { p.frames[0].record = ['x']; },
    'blob without info': (p) => { delete p.frames.find((f) => f.record.info).record.info; },
  };
  for (const [name, change] of Object.entries(cases)) {
    await importFails(target.db, await crafted(app, change), PASSWORD, BackupFormatError).catch((e) => {
      e.message = `${name}: ${e.message}`;
      throw e;
    });
  }
});

test('a blob whose info belongs to another blob is refused', async () => {
  const app = await makeApp();
  const target = await makeApp('otra contraseña totalmente distinta');
  const bytes = await crafted(app, (p) => {
    const blobs = p.frames.filter((f) => f.record.info);
    assert.equal(blobs.length, 2);
    [blobs[0].record.info, blobs[1].record.info] = [blobs[1].record.info, blobs[0].record.info];
  });
  await importFails(target.db, bytes, PASSWORD, BackupFormatError);
});

test('the version field is checked on its own: 0 is invalid, 2 is a future version', async () => {
  const app = await makeApp();
  const target = await makeApp('otra contraseña totalmente distinta');
  await importFails(target.db, await crafted(app, () => {}, 0), PASSWORD, BackupFormatError);
  await importFails(target.db, await crafted(app, () => {}, 2), PASSWORD, BackupVersionError);
});

test('a file whose records come from another vault is refused', async () => {
  const app = await makeApp();
  const stranger = await makeApp('la contraseña de otra app diferente');
  const target = await makeApp('otra contraseña totalmente distinta');
  const bytes = await crafted(app, (p) => { p.header.vault = stranger.vault; });
  await importFails(target.db, bytes, 'la contraseña de otra app diferente', BackupFormatError);
  await importFails(target.db, bytes, PASSWORD, WrongSecretError);
});

test('exportBackup refuses a vault whose recovery code was never confirmed', async () => {
  const db = await newDb();
  const { vault: unconfirmed } = await createVault({ password: PASSWORD, iterations: 1000 });
  await assert.rejects(exportBackup(db, unconfirmed), TypeError);
});

test('exportBackup rejects a vault that is not a vault record', async () => {
  const db = await newDb();
  await assert.rejects(exportBackup(db, null), TypeError);
  await assert.rejects(exportBackup(db, {}), TypeError);
});
