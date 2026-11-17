// T14: pubblicazioni salvate e registro delle ripetizioni (logica; l'interfaccia è provata in Chromium).
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, STORES } from '../js/core/db.js';
import { createSecureStore, StorageFullError } from '../js/core/secure-store.js';
import { createVault } from '../js/core/vault.js';
import { createIdeaWithMedia } from '../js/features/idea-save.js';
import {
  PublicationInputError,
  dayRange,
  deletePublication,
  enrichRepetitions,
  filterPublications,
  filterRegistry,
  fromLocalInputValue,
  highlightParts,
  normalizePublicationInput,
  reviewCount,
  savePublication,
  toLocalInputValue,
  updatePublication,
} from '../js/features/publications.js';

let counter = 0;
async function setup(wrap = (db) => db) {
  const db = await openDb(`nay-publications-${++counter}`);
  const { session } = await createVault({ password: 'una contraseña larga', iterations: 1000 });
  return { db, store: createSecureStore(wrap(db), session), plain: createSecureStore(db, session) };
}
const shot = (name = 'captura.png', bytes = [1, 2, 3, 4]) => ({ blob: new Blob([new Uint8Array(bytes)], { type: 'image/png' }), name });
const base = (extra = {}) => ({ title: 'Ánimo valiente', description: 'siempre adelante, hoy empezamos', screenshot: shot(), ...extra });
const empty = { meta: 0, ideas: 0, media: 0, blobs: 0, templates: 0, prompts: 0, publications: 0, repetitions: 0 };
async function counts(db) {
  const out = {};
  for (const name of STORES) out[name] = (await db.list(name)).length;
  return out;
}
const flaky = (when) => (db) => {
  let n = 0;
  return {
    ...db,
    put: async (store, record) => {
      n++;
      if (when(store, n)) throw new DOMException('quota', 'QuotaExceededError');
      return db.put(store, record);
    },
  };
};

test('normalizePublicationInput requires screenshot, title and description and trims them', () => {
  assert.throws(() => normalizePublicationInput({ ...base(), screenshot: undefined }, { requireScreenshot: true }), (e) => e instanceof PublicationInputError && e.field === 'screenshot');
  assert.throws(() => normalizePublicationInput(base({ title: '   ' }), { requireScreenshot: true }), (e) => e.field === 'title');
  assert.throws(() => normalizePublicationInput(base({ description: '' }), { requireScreenshot: true }), (e) => e.field === 'description');
  const clean = normalizePublicationInput(base({ title: '  Hola  ', description: ' mundo ' }), { requireScreenshot: true });
  assert.equal(clean.title, 'Hola');
  assert.equal(clean.description, 'mundo');
  // in modifica lo screenshot non è obbligatorio
  assert.doesNotThrow(() => normalizePublicationInput({ title: 'a', description: 'b' }, { requireScreenshot: false }));
});

test('normalizePublicationInput refuses a screenshot that is not an image', () => {
  const notImage = { blob: new Blob(['x'], { type: 'application/pdf' }), name: 'x.pdf' };
  assert.throws(() => normalizePublicationInput(base({ screenshot: notImage }), { requireScreenshot: true }), (e) => e.field === 'screenshot');
  assert.throws(() => normalizePublicationInput(base({ screenshot: { name: 'sin blob' } }), { requireScreenshot: true }), (e) => e.field === 'screenshot');
});

test('normalizePublicationInput applies the defaults: type foto, language es, date now', () => {
  const before = Date.now();
  const clean = normalizePublicationInput(base(), { requireScreenshot: true });
  assert.equal(clean.type, 'foto');
  assert.equal(clean.lang, 'es');
  assert.ok(Date.parse(clean.publishedAt) >= before - 1000 && Date.parse(clean.publishedAt) <= Date.now() + 1000);
  assert.throws(() => normalizePublicationInput(base({ type: 'audio' }), { requireScreenshot: true }), (e) => e.field === 'type');
  assert.throws(() => normalizePublicationInput(base({ lang: 'fr' }), { requireScreenshot: true }), (e) => e.field === 'lang');
  assert.throws(() => normalizePublicationInput(base({ publishedAt: 'ieri' }), { requireScreenshot: true }), (e) => e.field === 'publishedAt');
});

test('normalizePublicationInput accepts empty views and comments, refuses negative or fractional numbers', () => {
  const ok = normalizePublicationInput(base({ views: '', comments: undefined, note: '  ', ideaId: '' }), { requireScreenshot: true });
  assert.equal(ok.views, undefined);
  assert.equal(ok.comments, undefined);
  assert.equal(ok.note, undefined);
  assert.equal(ok.ideaId, undefined);
  const zero = normalizePublicationInput(base({ views: '0', comments: 12 }), { requireScreenshot: true });
  assert.equal(zero.views, 0, 'zero è un dato vero');
  assert.equal(normalizePublicationInput(base({ views: 0, comments: 0 }), { requireScreenshot: true }).comments, 0);
  assert.equal(zero.comments, 12);
  for (const bad of ['-1', '2.5', 'mucho', -3]) {
    assert.throws(() => normalizePublicationInput(base({ views: bad }), { requireScreenshot: true }), (e) => e.field === 'views', String(bad));
  }
});

test('savePublication stores the screenshot blob, a Media record and the publication, all encrypted', async () => {
  const { db, store } = await setup();
  const { publication, media } = await savePublication(store, base({ views: 120, comments: 7, note: 'nota privada' }));
  assert.equal(publication.screenshotMediaId, media.id);
  assert.equal(media.kind, 'foto');
  assert.equal(media.mime, 'image/png');
  assert.deepEqual(await counts(db), { ...empty, publications: 1, media: 1, blobs: 1 });
  const back = await store.loadBlob(media.blobId);
  assert.deepEqual([...new Uint8Array(await back.arrayBuffer())], [1, 2, 3, 4]);
  const raw = JSON.stringify(await db.list('publications'));
  assert.ok(!raw.includes('valiente') && !raw.includes('privada'));
  assert.equal(publication.views, 120);
});

test('savePublication links the chosen idea and marks it pubblicata', async () => {
  const { store } = await setup();
  const { idea } = await createIdeaWithMedia(store, { text: 'mi idea', lang: 'es', files: [] });
  const { publication } = await savePublication(store, base({ ideaId: idea.id }));
  assert.equal(publication.ideaId, idea.id);
  const linked = await store.load('ideas', idea.id);
  assert.equal(linked.status, 'pubblicata');
  assert.equal(linked.publicationId, publication.id);
});

test('savePublication registers similar earlier posts in the registry without further steps', async () => {
  const { store } = await setup();
  await savePublication(store, base({ title: 'Ánimo valiente', description: 'siempre adelante', publishedAt: '2026-01-02T10:00:00.000Z' }));
  await savePublication(store, base({ title: 'Cena de pasta', description: 'receta fácil', publishedAt: '2026-01-03T10:00:00.000Z' }));
  const out = await savePublication(store, base({ title: 'animo valiente', description: 'siempre adelante amigas', publishedAt: '2026-01-04T10:00:00.000Z' }));
  assert.equal(out.created.length, 1);
  assert.equal(out.created[0].status, 'da_valutare');
  assert.equal(out.created[0].sourceType, 'publication');
  assert.equal(out.created[0].sourceId, out.publication.id);
  assert.ok(out.created[0].sharedWords.length > 0);
  assert.equal((await store.all('repetitions')).length, 1);
});

test('a post in the other language is never reported as a repetition', async () => {
  const { store } = await setup();
  await savePublication(store, base({ title: 'Ánimo valiente', description: 'siempre adelante', lang: 'es' }));
  const out = await savePublication(store, base({ title: 'Animo valiente', description: 'siempre adelante', lang: 'it' }));
  assert.deepEqual(out.created, []);
});

test('savePublication: running out of memory after the blob removes everything it wrote', async () => {
  for (const [label, when] of [
    ['al record Media', (s) => s === 'media'],
    ['alla pubblicazione', (s) => s === 'publications'],
  ]) {
    const { db, store } = await setup(flaky(when));
    await assert.rejects(savePublication(store, base()), (e) => e instanceof StorageFullError, label);
    assert.deepEqual(await counts(db), empty, label);
  }
});

test('savePublication: if linking the idea fails, the publication, screenshot and Media are removed again', async () => {
  const state = { fail: false };
  const { db, store, plain } = await setup((real) => ({
    ...real,
    put: async (s, r) => {
      if (state.fail && s === 'ideas') throw new DOMException('quota', 'QuotaExceededError');
      return real.put(s, r);
    },
  }));
  const { idea } = await createIdeaWithMedia(store, { text: 'mi idea', files: [] });
  state.fail = true;
  await assert.rejects(savePublication(store, base({ ideaId: idea.id })), (e) => e instanceof StorageFullError);
  assert.deepEqual(await counts(db), { ...empty, ideas: 1 });
  assert.equal((await plain.load('ideas', idea.id)).status, 'nuova');
});

test('savePublication refuses a missing idea or a missing screenshot before writing anything', async () => {
  let writes = 0;
  const { db, store } = await setup((real) => ({ ...real, put: async (...a) => (writes++, real.put(...a)) }));
  await assert.rejects(savePublication(store, base({ ideaId: 'non-esiste' })), (e) => e instanceof PublicationInputError && e.field === 'ideaId');
  await assert.rejects(savePublication(store, { title: 'a', description: 'b' }), (e) => e.field === 'screenshot');
  assert.equal(writes, 0);
  assert.deepEqual(await counts(db), empty);
});

test('a failing similarity check does not undo the saved publication', async () => {
  const state = { fail: false };
  const { plain, store } = await setup((real) => ({
    ...real,
    list: async (s) => {
      if (state.fail && s === 'repetitions') throw new Error('illeggibile');
      return real.list(s);
    },
  }));
  await savePublication(store, base({ title: 'Ánimo valiente', description: 'siempre adelante' }));
  state.fail = true;
  const out = await savePublication(store, base({ title: 'Ánimo valiente', description: 'siempre adelante' }));
  assert.equal(out.checkFailed, true);
  assert.equal((await plain.all('publications')).length, 2);
});

test('updatePublication changes fields and keeps the rest', async () => {
  const { store } = await setup();
  const { publication } = await savePublication(store, base({ views: 10, note: 'vieja' }));
  const { publication: next } = await updatePublication(store, publication, { title: ' Nuevo título ', description: 'otra descripción', type: 'video', lang: 'it', views: '25', comments: '', note: '' });
  assert.equal(next.id, publication.id);
  assert.equal(next.title, 'Nuevo título');
  assert.equal(next.type, 'video');
  assert.equal(next.lang, 'it');
  assert.equal(next.views, 25);
  assert.equal(next.comments, undefined);
  assert.equal(next.note, undefined);
  assert.equal(next.screenshotMediaId, publication.screenshotMediaId);
  assert.equal(next.publishedAt, publication.publishedAt);
  assert.deepEqual(await store.load('publications', publication.id), next);
});

test('updatePublication re-checks similarity when the text changes and does not duplicate known pairs', async () => {
  const { store } = await setup();
  await savePublication(store, base({ title: 'Ánimo valiente', description: 'siempre adelante' }));
  const { publication } = await savePublication(store, base({ title: 'Cena de pasta', description: 'receta fácil' }));
  assert.equal((await store.all('repetitions')).length, 0);
  const first = await updatePublication(store, publication, { title: 'Ánimo valiente', description: 'siempre adelante' });
  assert.equal(first.created.length, 1);
  const second = await updatePublication(store, first.publication, { title: 'Ánimo valiente', description: 'siempre adelante' });
  assert.equal(second.created.length, 0);
  assert.equal((await store.all('repetitions')).length, 1);
});

test('updatePublication replaces the screenshot and removes the old one only after saving', async () => {
  const { db, store } = await setup();
  const { publication, media } = await savePublication(store, base());
  const out = await updatePublication(store, publication, { title: publication.title, description: publication.description, screenshot: shot('nueva.png', [9, 9]) });
  assert.notEqual(out.publication.screenshotMediaId, media.id);
  assert.deepEqual(await counts(db), { ...empty, publications: 1, media: 1, blobs: 1 });
  assert.equal(await store.load('media', media.id), null);
  const blob = await store.loadBlob((await store.load('media', out.publication.screenshotMediaId)).blobId);
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [9, 9]);
});

test('updatePublication keeps the old screenshot and removes the new one when saving fails', async () => {
  const state = { fail: false };
  const { db, store, plain } = await setup((real) => ({
    ...real,
    put: async (s, r) => {
      if (state.fail && s === 'publications') throw new DOMException('quota', 'QuotaExceededError');
      return real.put(s, r);
    },
  }));
  const { publication, media } = await savePublication(store, base());
  state.fail = true;
  await assert.rejects(updatePublication(store, publication, { title: 'x', description: 'y', screenshot: shot('nueva.png') }), (e) => e instanceof StorageFullError);
  assert.deepEqual(await counts(db), { ...empty, publications: 1, media: 1, blobs: 1 });
  assert.equal((await plain.load('publications', publication.id)).screenshotMediaId, media.id);
});

test('updatePublication moves the idea link: the old idea loses publicationId, the new one becomes pubblicata', async () => {
  const { store } = await setup();
  const a = (await createIdeaWithMedia(store, { text: 'idea a', files: [] })).idea;
  const b = (await createIdeaWithMedia(store, { text: 'idea b', files: [] })).idea;
  const { publication } = await savePublication(store, base({ ideaId: a.id }));
  await updatePublication(store, publication, { title: publication.title, description: publication.description, ideaId: b.id });
  assert.equal((await store.load('ideas', a.id)).publicationId, undefined);
  assert.equal((await store.load('ideas', b.id)).status, 'pubblicata');
  assert.equal((await store.load('ideas', b.id)).publicationId, publication.id);
  const out = await updatePublication(store, { ...publication, ideaId: b.id }, { title: publication.title, description: publication.description, ideaId: '' });
  assert.equal(out.publication.ideaId, undefined);
  assert.equal((await store.load('ideas', b.id)).publicationId, undefined);
});

test('updatePublication puts the idea links back when the publication cannot be saved', async () => {
  const state = { fail: false };
  const { store, plain } = await setup((real) => ({
    ...real,
    put: async (s, r) => {
      if (state.fail && s === 'publications') throw new DOMException('quota', 'QuotaExceededError');
      return real.put(s, r);
    },
  }));
  const a = (await createIdeaWithMedia(store, { text: 'idea a', files: [] })).idea;
  const b = (await createIdeaWithMedia(store, { text: 'idea b', files: [] })).idea;
  const { publication } = await savePublication(store, base({ ideaId: a.id }));
  state.fail = true;
  await assert.rejects(updatePublication(store, publication, { title: publication.title, description: publication.description, ideaId: b.id }), (e) => e instanceof StorageFullError);
  assert.equal((await plain.load('ideas', a.id)).publicationId, publication.id, 'la vecchia idea è ancora collegata');
  assert.equal((await plain.load('ideas', b.id)).status, 'nuova', 'la nuova idea non è stata collegata');
  assert.equal((await plain.load('publications', publication.id)).ideaId, a.id);
});

test('deletePublication removes the publication, its screenshot, its registry entries and the idea link, nothing else', async () => {
  const { db, store } = await setup();
  const idea = (await createIdeaWithMedia(store, { text: 'mi idea', files: [] })).idea;
  const keep = (await savePublication(store, base({ title: 'Ánimo valiente', description: 'siempre adelante' }))).publication;
  const gone = (await savePublication(store, base({ title: 'Ánimo valiente', description: 'siempre adelante hoy', ideaId: idea.id }))).publication;
  await store.save('repetitions', { sourceType: 'idea', sourceId: 'otra', publicationId: gone.id, pairKey: 'k-found', status: 'da_valutare', sharedWords: [], score: 1, checkedAt: 'x' });
  await store.save('repetitions', { sourceType: 'idea', sourceId: 'otra', publicationId: keep.id, pairKey: 'k-keep', status: 'da_valutare', sharedWords: [], score: 1, checkedAt: 'x' });
  const result = await deletePublication(store, gone);
  assert.equal(result.leftovers, 0);
  assert.deepEqual((await store.all('publications')).map((p) => p.id), [keep.id]);
  assert.deepEqual(await counts(db), { ...empty, ideas: 1, publications: 1, media: 1, blobs: 1, repetitions: 1 });
  assert.deepEqual((await store.all('repetitions')).map((r) => r.pairKey), ['k-keep']);
  assert.equal((await store.load('ideas', idea.id)).publicationId, undefined);
});

test('filterPublications filters by day range in local time and by type, newest first', () => {
  const local = (y, m, d, h = 12) => new Date(y, m - 1, d, h).toISOString();
  const pubs = [
    { id: 'a', type: 'foto', publishedAt: local(2026, 3, 1) },
    { id: 'b', type: 'video', publishedAt: local(2026, 3, 10) },
    { id: 'c', type: 'foto', publishedAt: local(2026, 3, 20, 23) },
    { id: 'd', type: 'testo', publishedAt: local(2026, 4, 2) },
  ];
  assert.deepEqual(filterPublications(pubs, {}).map((p) => p.id), ['d', 'c', 'b', 'a']);
  assert.deepEqual(filterPublications(pubs, { from: '2026-03-10', to: '2026-03-20' }).map((p) => p.id), ['c', 'b']);
  assert.deepEqual(filterPublications(pubs, { from: '2026-03-20' }).map((p) => p.id), ['d', 'c']);
  assert.deepEqual(filterPublications(pubs, { to: '2026-03-01' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterPublications(pubs, { type: 'foto' }).map((p) => p.id), ['c', 'a']);
  assert.deepEqual(filterPublications(pubs, { type: '' , from: '', to: '' }).length, 4);
  assert.deepEqual(pubs.map((p) => p.id), ['a', 'b', 'c', 'd'], 'l’elenco ricevuto non cambia');
});

test('enrichRepetitions joins the found publication and the checked text; a missing source is labelled', () => {
  const publications = [{ id: 'p1', title: 'Ánimo valiente', description: 'siempre', publishedAt: '2026-03-02T10:00:00.000Z', lang: 'es', screenshotMediaId: 'm1' }];
  const ideas = [{ id: 'i1', text: 'una idea\nsegunda línea', lang: 'es' }];
  const prompts = [{ id: 'q1', ideaId: 'i1', text: 'PROMPT', lang: 'es' }];
  const reps = [
    { id: 'r1', sourceType: 'idea', sourceId: 'i1', publicationId: 'p1', sharedWords: ['ánimo'], status: 'da_valutare', checkedAt: '2026-03-03T10:00:00.000Z', score: 0.6 },
    { id: 'r2', sourceType: 'publication', sourceId: 'p1', publicationId: 'p1', sharedWords: [], status: 'confermata', checkedAt: '2026-03-04T10:00:00.000Z', score: 1 },
    { id: 'r3', sourceType: 'idea', sourceId: 'borrada', publicationId: 'p1', sharedWords: [], status: 'da_valutare', checkedAt: '2026-03-05T10:00:00.000Z', score: 0.5 },
    { id: 'r4', sourceType: 'prompt', sourceId: 'q1', publicationId: 'no-existe', sharedWords: [], status: 'da_valutare', checkedAt: '2026-03-06T10:00:00.000Z', score: 0.5 },
  ];
  const entries = enrichRepetitions(reps, { publications, ideas, prompts });
  assert.deepEqual(entries.map((e) => e.rep.id), ['r4', 'r3', 'r2', 'r1'], 'dal controllo più recente');
  const byId = Object.fromEntries(entries.map((e) => [e.rep.id, e]));
  assert.equal(byId.r1.publication.id, 'p1');
  assert.equal(byId.r1.source.type, 'idea');
  assert.equal(byId.r1.source.text, 'una idea\nsegunda línea');
  assert.equal(byId.r1.lang, 'es');
  assert.equal(byId.r2.source.text, 'Ánimo valiente\nsiempre');
  assert.equal(byId.r3.source, null);
  assert.equal(byId.r4.publication, null);
  assert.equal(byId.r4.source.text, 'PROMPT');
});

function entriesFor(...specs) {
  return specs.map(([id, checkedAt, publishedAt, status, shared]) => ({
    rep: { id, checkedAt, status, sharedWords: shared, publicationId: `p-${id}` },
    publication: publishedAt ? { id: `p-${id}`, publishedAt } : null,
    source: null,
  }));
}

test('filterRegistry filters by check date, publication date, status and word', () => {
  const local = (y, m, d) => new Date(y, m - 1, d, 12).toISOString();
  const all = entriesFor(
    ['a', local(2026, 3, 1), local(2026, 1, 10), 'da_valutare', ['ánimo', 'valiente']],
    ['b', local(2026, 3, 10), local(2026, 2, 5), 'confermata', ['corazón']],
    ['c', local(2026, 3, 20), local(2026, 2, 20), 'falso_allarme', ['sueños']],
    ['d', local(2026, 3, 25), null, 'da_valutare', ['ánimo']],
  );
  const ids = (filters) => filterRegistry(all, filters).map((e) => e.rep.id);
  assert.deepEqual(ids({}), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids({ checkFrom: '2026-03-10', checkTo: '2026-03-20' }), ['b', 'c']);
  assert.deepEqual(ids({ pubFrom: '2026-02-01', pubTo: '2026-02-28' }), ['b', 'c']);
  assert.deepEqual(ids({ pubFrom: '2026-02-10' }), ['c'], 'una voce senza pubblicazione non passa un filtro per data');
  assert.deepEqual(ids({ status: 'da_valutare' }), ['a', 'd']);
  assert.deepEqual(ids({ query: 'ANIMO' }), ['a', 'd'], 'maiuscole e accenti ignorati');
  assert.deepEqual(ids({ query: 'valiente animo' }), ['a'], 'servono tutte le parole');
  assert.deepEqual(ids({ status: '', query: '  ', checkFrom: '', pubTo: '' }), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids({ status: 'da_valutare', query: 'ánimo', checkFrom: '2026-03-20' }), ['d']);
});

test('highlightParts marks the shared words in a text, even in other forms of the same word', () => {
  const text = 'El corazón de las mujeres. Tu ÁNIMO vale.';
  const parts = highlightParts(text, ['animo', 'corazones'], 'es');
  assert.equal(parts.map((p) => p.text).join(''), text, 'il testo non cambia');
  assert.deepEqual(parts.filter((p) => p.match).map((p) => p.text), ['corazón', 'ÁNIMO']);
  const it = highlightParts('Il mio cuore è forte, i cuori no', ['cuore'], 'it');
  assert.deepEqual(it.filter((p) => p.match).map((p) => p.text), ['cuore', 'cuori']);
  assert.deepEqual(highlightParts('niente', [], 'es'), [{ text: 'niente', match: false }]);
  assert.deepEqual(highlightParts('', ['x'], 'es'), []);
  const noStopwords = highlightParts('de la en', ['de'], 'es');
  assert.ok(noStopwords.every((p) => !p.match), 'le parole vuote non si evidenziano');
});

test('date helpers: datetime-local values round-trip and a day range covers the whole local day', () => {
  const iso = new Date(2026, 10, 17, 9, 5).toISOString();
  const value = toLocalInputValue(iso);
  assert.match(value, /^2026-11-17T09:05$/);
  assert.equal(fromLocalInputValue(value), iso);
  assert.equal(fromLocalInputValue(''), undefined);
  assert.equal(fromLocalInputValue('boh'), undefined);
  const { from, to } = dayRange('2026-11-17', '2026-11-17');
  const morning = new Date(2026, 10, 17, 0, 1).getTime();
  const night = new Date(2026, 10, 17, 23, 58).getTime();
  assert.ok(Date.parse(from) <= morning && night <= Date.parse(to));
  assert.ok(Date.parse(to) < new Date(2026, 10, 18, 0, 0).getTime() && Date.parse(from) >= new Date(2026, 10, 16, 23, 59).getTime());
  assert.deepEqual(dayRange('', undefined), { from: undefined, to: undefined });
});

test('reviewCount counts the registry entries still to evaluate', () => {
  assert.equal(reviewCount([]), 0);
  assert.equal(reviewCount([{ status: 'da_valutare' }, { status: 'confermata' }, { status: 'falso_allarme' }, { status: 'da_valutare' }]), 2);
});
