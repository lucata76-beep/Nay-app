// T12: salvataggio di idee con foto e video. Se la memoria finisce (o qualunque scrittura fallisce)
// in mezzo ai passaggi (blob, media, idea) non deve restare niente a metà.
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, STORES } from '../js/core/db.js';
import { createSecureStore, StorageFullError } from '../js/core/secure-store.js';
import { createVault } from '../js/core/vault.js';
import { EmptyIdeaError } from '../js/features/ideas.js';
import {
  UnsupportedMediaError,
  checkIdeaSimilarity,
  createIdeaWithMedia,
  deleteIdea,
  mediaKind,
  updateIdeaWithMedia,
} from '../js/features/idea-save.js';

let counter = 0;
async function setup(wrap = (db) => db) {
  const db = await openDb(`nay-idea-save-${++counter}`);
  const { session } = await createVault({ password: 'una contraseña larga', iterations: 1000 });
  return { db, store: createSecureStore(wrap(db), session), plain: createSecureStore(db, session) };
}

// db che lancia QuotaExceededError alla n-esima scrittura che soddisfa `when(store, n)`
function flaky(when) {
  return (db) => {
    let n = 0;
    return {
      ...db,
      put: async (store, record) => {
        n++;
        if (when(store, n)) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        return db.put(store, record);
      },
    };
  };
}

const photo = (name = 'foto.jpg', bytes = [1, 2, 3]) => ({ blob: new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }), name });
const video = (name = 'video.mp4', bytes = [9, 8, 7, 6], extra = {}) => ({ blob: new Blob([new Uint8Array(bytes)], { type: 'video/mp4' }), name, ...extra });

async function counts(db) {
  const out = {};
  for (const name of STORES) out[name] = (await db.list(name)).length;
  return out;
}
const empty = { meta: 0, ideas: 0, media: 0, blobs: 0, templates: 0, prompts: 0, publications: 0, repetitions: 0 };

test('mediaKind maps image and video mime types', () => {
  assert.equal(mediaKind('image/jpeg'), 'foto');
  assert.equal(mediaKind('image/png'), 'foto');
  assert.equal(mediaKind('video/mp4'), 'video');
  assert.equal(mediaKind('video/webm'), 'video');
  assert.equal(mediaKind('application/zip'), null);
  assert.equal(mediaKind(''), null);
});

test('createIdeaWithMedia saves a note without files as an idea with no media', async () => {
  const { db, store } = await setup();
  const { idea, media } = await createIdeaWithMedia(store, { text: '  Ánimo valiente  ', lang: 'es', files: [] });
  assert.deepEqual(media, []);
  assert.equal(idea.text, 'Ánimo valiente');
  assert.equal(idea.status, 'nuova');
  assert.equal(idea.lang, 'es');
  assert.deepEqual(idea.mediaIds, []);
  assert.deepEqual(await counts(db), { ...empty, ideas: 1 });
});

test('createIdeaWithMedia saves the idea, a Media record per file and an encrypted blob per file', async () => {
  const { db, store } = await setup();
  const { idea, media } = await createIdeaWithMedia(store, {
    text: 'dal media alla frase',
    lang: 'it',
    files: [photo('a.jpg'), video('b.mp4', [1, 2, 3, 4, 5], { durationSec: 12.5, description: 'una spiaggia' })],
  });
  assert.equal(idea.lang, 'it');
  assert.deepEqual(idea.mediaIds, media.map((m) => m.id));
  assert.deepEqual(media.map((m) => [m.kind, m.mime, m.name, m.size]), [
    ['foto', 'image/jpeg', 'a.jpg', 3],
    ['video', 'video/mp4', 'b.mp4', 5],
  ]);
  assert.equal(media[0].durationSec, undefined);
  assert.equal(media[1].durationSec, 12.5);
  assert.equal(media[1].description, 'una spiaggia');
  assert.equal(media[0].description, '');
  assert.deepEqual(await counts(db), { ...empty, ideas: 1, media: 2, blobs: 2 });
  const back = await store.loadBlob(media[1].blobId);
  assert.deepEqual([...new Uint8Array(await back.arrayBuffer())], [1, 2, 3, 4, 5]);
  assert.equal(back.type, 'video/mp4');
  // niente di leggibile nel database
  const raw = JSON.stringify([await db.list('ideas'), await db.list('media')]);
  assert.ok(!raw.includes('dal media') && !raw.includes('spiaggia') && !raw.includes('a.jpg'));
});

test('an idea with no text and no files is refused before anything is written', async () => {
  const { db, store } = await setup();
  await assert.rejects(createIdeaWithMedia(store, { text: '   ', files: [] }), EmptyIdeaError);
  assert.deepEqual(await counts(db), empty);
});

test('unsupported files are refused before anything is written, and the error names them', async () => {
  const { db, store } = await setup();
  const zip = { blob: new Blob(['x'], { type: 'application/zip' }), name: 'x.zip' };
  const err = await createIdeaWithMedia(store, { text: 'ok', files: [photo(), zip] }).then(() => null, (e) => e);
  assert.ok(err instanceof UnsupportedMediaError, String(err));
  assert.deepEqual(err.files, ['x.zip']);
  assert.deepEqual(await counts(db), empty);
});

test('StorageFullError on the second blob removes the first blob and writes no media or idea', async () => {
  // scritture: blob 1, media 1, blob 2 ← fallisce
  const { db, store } = await setup(flaky((s, n) => n === 3));
  await assert.rejects(
    createIdeaWithMedia(store, { text: 'x', files: [photo('1.jpg'), photo('2.jpg')] }),
    (e) => e instanceof StorageFullError,
  );
  assert.deepEqual(await counts(db), empty);
});

test('StorageFullError while saving a Media record removes its blob and the earlier media and blobs', async () => {
  // scritture: blob 1, media 1, blob 2, media 2 ← fallisce
  const { db, store } = await setup(flaky((s, n) => n === 4));
  await assert.rejects(
    createIdeaWithMedia(store, { text: 'x', files: [photo('1.jpg'), video('2.mp4')] }),
    (e) => e instanceof StorageFullError,
  );
  assert.deepEqual(await counts(db), empty);
});

test('StorageFullError while saving the idea removes every blob and Media record', async () => {
  const { db, store } = await setup(flaky((s) => s === 'ideas'));
  await assert.rejects(
    createIdeaWithMedia(store, { text: 'x', files: [photo('1.jpg'), video('2.mp4')] }),
    (e) => e instanceof StorageFullError,
  );
  assert.deepEqual(await counts(db), empty);
});

test('a note whose save runs out of memory leaves nothing and reports StorageFullError', async () => {
  const { db, store } = await setup(flaky((s) => s === 'ideas'));
  await assert.rejects(createIdeaWithMedia(store, { text: 'solo testo', files: [] }), (e) => e instanceof StorageFullError);
  assert.deepEqual(await counts(db), empty);
});

test('any other error also rolls back, and a failing rollback does not hide the original error', async () => {
  const { db, store } = await setup((real) => ({
    ...real,
    put: async (s, r) => {
      if (s === 'ideas') throw new Error('guasto vero');
      return real.put(s, r);
    },
    remove: async () => {
      throw new Error('anche la pulizia fallisce');
    },
  }));
  const err = await createIdeaWithMedia(store, { text: 'x', files: [photo()] }).then(() => null, (e) => e);
  assert.equal(err && err.message, 'guasto vero');
  assert.equal(err.rollbackFailures.length, 2); // il media e il blob rimasti
  assert.deepEqual(await counts(db), { ...empty, media: 1, blobs: 1 }); // è il massimo che si può dire: lo si segnala
});

test('updateIdeaWithMedia changes text, language and status and keeps the other fields', async () => {
  const { store } = await setup();
  const { idea } = await createIdeaWithMedia(store, { text: 'prima', lang: 'es', files: [] });
  const { idea: next } = await updateIdeaWithMedia(store, { ...idea, publicationId: 'p1' }, { text: ' dopo ', lang: 'it', status: 'in_sviluppo' });
  assert.equal(next.id, idea.id);
  assert.equal(next.text, 'dopo');
  assert.equal(next.lang, 'it');
  assert.equal(next.status, 'in_sviluppo');
  assert.equal(next.createdAt, idea.createdAt);
  assert.equal(next.publicationId, 'p1');
  assert.deepEqual(await store.load('ideas', idea.id), next);
});

test('updateIdeaWithMedia rejects an unknown language or status without writing', async () => {
  const { store } = await setup();
  const { idea } = await createIdeaWithMedia(store, { text: 'prima', files: [] });
  await assert.rejects(updateIdeaWithMedia(store, idea, { text: 'x', lang: 'fr' }), RangeError);
  await assert.rejects(updateIdeaWithMedia(store, idea, { text: 'x', status: 'boh' }), RangeError);
  assert.equal((await store.load('ideas', idea.id)).text, 'prima');
});

test('updateIdeaWithMedia adds new files and removes the chosen media with their blobs only after the idea is saved', async () => {
  const { db, store } = await setup();
  const { idea, media } = await createIdeaWithMedia(store, { text: 'x', files: [photo('vecchia.jpg'), video('tieni.mp4')] });
  const result = await updateIdeaWithMedia(store, idea, { text: 'x', addFiles: [photo('nuova.jpg')], removeMediaIds: [media[0].id] });
  assert.deepEqual(result.idea.mediaIds.length, 2);
  assert.equal(result.idea.mediaIds[0], media[1].id); // l'ordine: prima quelli che restano, poi i nuovi
  assert.equal(result.removed, 1);
  assert.equal(result.leftovers, 0);
  assert.deepEqual(await counts(db), { ...empty, ideas: 1, media: 2, blobs: 2 });
  assert.equal(await store.load('media', media[0].id), null);
  await assert.rejects(store.loadBlob(media[0].blobId));
});

test('updateIdeaWithMedia keeps the old media and removes the new ones when saving fails', async () => {
  const state = { failIdeas: false };
  const { db, store, plain } = await setup((real) => ({
    ...real,
    put: async (s, r) => {
      if (state.failIdeas && s === 'ideas') throw new DOMException('quota', 'QuotaExceededError');
      return real.put(s, r);
    },
  }));
  const { idea, media } = await createIdeaWithMedia(store, { text: 'x', files: [photo('tieni.jpg'), photo('togli.jpg')] });
  state.failIdeas = true;
  await assert.rejects(
    updateIdeaWithMedia(store, idea, {
      text: 'cambiato',
      addFiles: [photo('nuova.jpg'), video()],
      removeMediaIds: [media[1].id],
      descriptions: { [media[0].id]: 'nuova descrizione' },
    }),
    (e) => e instanceof StorageFullError,
  );
  assert.deepEqual(await counts(db), { ...empty, ideas: 1, media: 2, blobs: 2 });
  assert.equal((await plain.load('ideas', idea.id)).text, 'x');
  assert.equal((await plain.load('media', media[0].id)).description, '', 'la descrizione cambiata va ripristinata');
  await plain.loadBlob(media[1].blobId); // il blob che si voleva togliere è ancora lì
});

test('an invalid language is refused before any file is written', async () => {
  let writes = 0;
  const { db, store } = await setup((real) => ({ ...real, put: async (...args) => (writes++, real.put(...args)) }));
  await assert.rejects(createIdeaWithMedia(store, { text: 'x', lang: 'fr', files: [photo(), video()] }), RangeError);
  assert.equal(writes, 0, 'nessuna scrittura, nemmeno da annullare dopo');
  assert.deepEqual(await counts(db), empty);
});

test('an idea left with no text and no media is refused and nothing changes', async () => {
  const { db, store } = await setup();
  const { idea, media } = await createIdeaWithMedia(store, { text: 'x', files: [photo()] });
  await assert.rejects(updateIdeaWithMedia(store, idea, { text: ' ', removeMediaIds: [media[0].id] }), EmptyIdeaError);
  assert.deepEqual(await counts(db), { ...empty, ideas: 1, media: 1, blobs: 1 });
});

test('descriptions are saved on the media (new and existing)', async () => {
  const { store } = await setup();
  const { idea, media } = await createIdeaWithMedia(store, { text: 'x', files: [photo('a.jpg')] });
  const { idea: next } = await updateIdeaWithMedia(store, idea, {
    text: 'x',
    addFiles: [{ ...photo('b.jpg'), description: 'una porta blu' }],
    descriptions: { [media[0].id]: 'un albero' },
  });
  assert.equal((await store.load('media', media[0].id)).description, 'un albero');
  assert.equal((await store.load('media', next.mediaIds[1])).description, 'una porta blu');
});

test('deleteIdea removes the idea, its media and blobs, its prompts and its registry entries, and nothing else', async () => {
  const { db, store } = await setup();
  const a = await createIdeaWithMedia(store, { text: 'da cancellare', files: [photo('a.jpg'), video('a.mp4')] });
  const b = await createIdeaWithMedia(store, { text: 'resta', files: [photo('b.jpg')] });
  const promptA = await store.save('prompts', { ideaId: a.idea.id, text: 'prompt a' });
  const promptB = await store.save('prompts', { ideaId: b.idea.id, text: 'prompt b' });
  await store.save('repetitions', { sourceType: 'idea', sourceId: a.idea.id, publicationId: 'p', pairKey: 'k1', status: 'da_valutare', sharedWords: [], score: 1, checkedAt: 'x' });
  await store.save('repetitions', { sourceType: 'prompt', sourceId: promptA.id, publicationId: 'p', pairKey: 'k2', status: 'da_valutare', sharedWords: [], score: 1, checkedAt: 'x' });
  await store.save('repetitions', { sourceType: 'idea', sourceId: b.idea.id, publicationId: 'p', pairKey: 'k3', status: 'da_valutare', sharedWords: [], score: 1, checkedAt: 'x' });
  await store.save('repetitions', { sourceType: 'prompt', sourceId: promptB.id, publicationId: 'p', pairKey: 'k4', status: 'da_valutare', sharedWords: [], score: 1, checkedAt: 'x' });
  const result = await deleteIdea(store, a.idea);
  assert.equal(result.leftovers, 0);
  assert.deepEqual(await counts(db), { ...empty, ideas: 1, media: 1, blobs: 1, prompts: 1, repetitions: 2 });
  assert.equal((await store.load('ideas', b.idea.id)).text, 'resta');
  assert.deepEqual((await store.all('repetitions')).map((r) => r.pairKey).sort(), ['k3', 'k4']);
});

test('deleteIdea removes the idea first so a failure never leaves an idea with missing media', async () => {
  const { db, store } = await setup((real) => ({
    ...real,
    remove: async (s, id) => {
      if (s === 'media') throw new Error('guasto');
      return real.remove(s, id);
    },
  }));
  const { idea } = await createIdeaWithMedia(store, { text: 'x', files: [photo()] });
  const result = await deleteIdea(store, idea);
  assert.ok(result.leftovers > 0);
  assert.equal((await db.list('ideas')).length, 0);
});

test('checkIdeaSimilarity registers new matches once and returns every current match with its publication', async () => {
  const { store } = await setup();
  const pub = await store.save('publications', { title: 'Ánimo valiente', description: 'siempre adelante', type: 'foto', lang: 'es', publishedAt: '2026-01-02T10:00:00.000Z' });
  await store.save('publications', { title: 'Cena de pasta', description: 'receta', type: 'foto', lang: 'es', publishedAt: '2026-01-03T10:00:00.000Z' });
  const { idea } = await createIdeaWithMedia(store, { text: 'ánimo valiente siempre adelante', lang: 'es', files: [] });
  const first = await checkIdeaSimilarity(store, idea);
  assert.equal(first.matches.length, 1);
  assert.equal(first.matches[0].publication.id, pub.id);
  assert.ok(first.matches[0].sharedWords.length > 0);
  assert.equal(first.created.length, 1);
  assert.equal(first.created[0].status, 'da_valutare');
  const second = await checkIdeaSimilarity(store, idea);
  assert.equal(second.matches.length, 1, 'l’avviso si mostra ancora');
  assert.equal(second.created.length, 0, 'ma la voce del registro non si duplica');
  assert.equal((await store.all('repetitions')).length, 1);
});

test('checkIdeaSimilarity only compares texts of the same language and ignores ideas with no text', async () => {
  const { store } = await setup();
  await store.save('publications', { title: 'Ánimo valiente', description: 'siempre', type: 'foto', lang: 'es', publishedAt: '2026-01-02T10:00:00.000Z' });
  const it = await createIdeaWithMedia(store, { text: 'animo valiente siempre', lang: 'it', files: [] });
  assert.deepEqual((await checkIdeaSimilarity(store, it.idea)).matches, []);
  const onlyMedia = await createIdeaWithMedia(store, { text: '', lang: 'es', files: [photo()] });
  assert.deepEqual((await checkIdeaSimilarity(store, onlyMedia.idea)).matches, []);
});
