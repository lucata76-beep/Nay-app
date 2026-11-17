import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pairKey,
  registerMatches,
  checkNewPublication,
  setStatus,
  searchRepetitions,
} from '../js/features/repetitions.js';
import { openDb } from '../js/core/db.js';
import { createSecureStore } from '../js/core/secure-store.js';
import { createVault } from '../js/core/vault.js';

async function newStore() {
  const db = await openDb(`nay-rep-${Math.random().toString(36).slice(2)}`);
  const { session } = await createVault({ password: 'una contraseña larga', iterations: 1000 });
  return { db, store: createSecureStore(db, session) };
}

const IDEA = { sourceType: 'idea', sourceId: 'idea-1' };
const match = (publicationId, extra = {}) => ({ publicationId, score: 0.75, sharedWords: ['amor', 'vida'], ...extra });

function pub(id, description, extra = {}) {
  return { id, title: '', description, type: 'foto', lang: 'es', publishedAt: '2026-01-01T10:00:00.000Z', ...extra };
}

test('pairKey is stable, distinguishes its parts and ignores the order of a publication pair', () => {
  assert.equal(pairKey('idea', 'i1', 'p1'), pairKey('idea', 'i1', 'p1'));
  assert.notEqual(pairKey('idea', 'i1', 'p1'), pairKey('prompt', 'i1', 'p1'));
  assert.notEqual(pairKey('idea', 'i1', 'p1'), pairKey('idea', 'i1', 'p2'));
  assert.notEqual(pairKey('idea', 'a', 'b:c'), pairKey('idea', 'a:b', 'c'), 'nessuna ambiguità tra i pezzi');
  // due post confrontati in ordine diverso sono la stessa coppia
  assert.equal(pairKey('publication', 'p1', 'p2'), pairKey('publication', 'p2', 'p1'));
});

test('registerMatches creates one entry per match with status da_valutare', async () => {
  const { store } = await newStore();
  const created = await registerMatches(store, IDEA, [match('p1'), match('p2', { score: 0.5, sharedWords: ['paz'] })]);
  assert.equal(created.length, 2);
  const first = created.find((r) => r.publicationId === 'p1');
  assert.equal(first.status, 'da_valutare');
  assert.equal(first.sourceType, 'idea');
  assert.equal(first.sourceId, 'idea-1');
  assert.equal(first.score, 0.75);
  assert.deepEqual(first.sharedWords, ['amor', 'vida']);
  assert.equal(first.pairKey, pairKey('idea', 'idea-1', 'p1'));
  assert.equal(new Date(first.checkedAt).toISOString(), first.checkedAt);
  assert.equal(typeof first.id, 'string');
  assert.equal((await store.all('repetitions')).length, 2);
});

test('registerMatches with no matches does nothing', async () => {
  const { store } = await newStore();
  assert.deepEqual(await registerMatches(store, IDEA, []), []);
  assert.deepEqual(await store.all('repetitions'), []);
});

test('registerMatches is idempotent per pair', async () => {
  const { store } = await newStore();
  const first = await registerMatches(store, IDEA, [match('p1')]);
  assert.equal(first.length, 1);
  // stessa coppia, anche con punteggio diverso: nessuna voce nuova
  const again = await registerMatches(store, IDEA, [match('p1', { score: 0.9 })]);
  assert.deepEqual(again, []);
  assert.equal((await store.all('repetitions')).length, 1);
  // la stessa pubblicazione trovata da un'altra fonte è una coppia diversa
  const other = await registerMatches(store, { sourceType: 'prompt', sourceId: 'prompt-1' }, [match('p1')]);
  assert.equal(other.length, 1);
  assert.equal((await store.all('repetitions')).length, 2);
  // dentro la stessa chiamata una coppia ripetuta conta una volta sola
  const dup = await registerMatches(store, { sourceType: 'idea', sourceId: 'idea-2' }, [match('p9'), match('p9')]);
  assert.equal(dup.length, 1);
});

test('falso_allarme is not signalled again', async () => {
  const { store } = await newStore();
  const [rep] = await registerMatches(store, IDEA, [match('p1')]);
  await setStatus(store, rep.id, 'falso_allarme');
  const again = await registerMatches(store, IDEA, [match('p1', { score: 0.95 })]);
  assert.deepEqual(again, [], 'un falso allarme non viene segnalato di nuovo');
  const all = await store.all('repetitions');
  assert.equal(all.length, 1);
  assert.equal(all[0].status, 'falso_allarme', 'e non riprende lo stato da_valutare');
  assert.equal(all[0].score, 0.75, 'la voce non viene modificata');
});

test('setStatus changes and returns the entry, and rejects unknown statuses and ids', async () => {
  const { store } = await newStore();
  const [rep] = await registerMatches(store, IDEA, [match('p1')]);
  const confirmed = await setStatus(store, rep.id, 'confermata');
  assert.equal(confirmed.status, 'confermata');
  assert.equal(confirmed.id, rep.id);
  assert.equal(confirmed.publicationId, 'p1');
  assert.equal((await store.load('repetitions', rep.id)).status, 'confermata');
  const back = await setStatus(store, rep.id, 'da_valutare');
  assert.equal(back.status, 'da_valutare');
  await assert.rejects(setStatus(store, rep.id, 'boh'), RangeError);
  await assert.rejects(setStatus(store, 'non-esiste', 'confermata'));
  assert.equal((await store.load('repetitions', rep.id)).status, 'da_valutare');
});

test('registry entries are stored encrypted', async () => {
  const { db, store } = await newStore();
  await registerMatches(store, IDEA, [match('p1', { sharedWords: ['palabrasecreta'] })]);
  const [raw] = await db.list('repetitions');
  assert.deepEqual(Object.keys(raw).sort(), ['enc', 'id', 'updatedAt']);
  assert.ok(!JSON.stringify(raw).includes('palabrasecreta'));
  assert.ok(!JSON.stringify(raw).includes('idea-1'), 'nemmeno l’id dell’idea');
});

function rep(id, checkedAt, sharedWords, extra = {}) {
  return { id, pairKey: id, sourceType: 'idea', sourceId: 's', publicationId: 'p', score: 0.6, sharedWords, status: 'da_valutare', checkedAt, ...extra };
}

test('searchRepetitions filters by date and by word', () => {
  const reps = [
    rep('a', '2026-01-10T10:00:00.000Z', ['ánimo', 'valiente']),
    rep('b', '2026-02-20T10:00:00.000Z', ['corazón']),
    rep('c', '2026-03-05T23:30:00.000Z', ['mañana', 'animo']),
  ];
  const ids = (list) => list.map((r) => r.id);

  assert.deepEqual(ids(searchRepetitions(reps, {})), ['a', 'b', 'c']);
  assert.deepEqual(ids(searchRepetitions(reps, { from: '2026-02-01' })), ['b', 'c']);
  assert.deepEqual(ids(searchRepetitions(reps, { to: '2026-02-20' })), ['a', 'b'], 'to include tutto il giorno indicato');
  assert.deepEqual(ids(searchRepetitions(reps, { from: '2026-02-01', to: '2026-03-05' })), ['b', 'c']);
  assert.deepEqual(ids(searchRepetitions(reps, { from: '2026-04-01' })), []);

  // per parola: senza badare a maiuscole e accenti
  assert.deepEqual(ids(searchRepetitions(reps, { query: 'animo' })), ['a', 'c']);
  assert.deepEqual(ids(searchRepetitions(reps, { query: 'ÁNIMO' })), ['a', 'c']);
  assert.deepEqual(ids(searchRepetitions(reps, { query: 'corazon' })), ['b']);
  assert.deepEqual(ids(searchRepetitions(reps, { query: 'zzz' })), []);

  // data e parola insieme
  assert.deepEqual(ids(searchRepetitions(reps, { from: '2026-03-01', query: 'animo' })), ['c']);
  assert.deepEqual(ids(searchRepetitions(reps, { query: '  ' })), ['a', 'b', 'c']);
});

test('searchRepetitions accepts Date objects and full timestamps, and does not change its input', () => {
  const reps = [rep('a', '2026-01-10T10:00:00.000Z', ['x']), rep('b', '2026-01-10T12:00:00.000Z', ['x'])];
  const copy = JSON.parse(JSON.stringify(reps));
  assert.deepEqual(searchRepetitions(reps, { from: new Date('2026-01-10T11:00:00.000Z') }).map((r) => r.id), ['b']);
  assert.deepEqual(searchRepetitions(reps, { to: '2026-01-10T11:00:00.000Z' }).map((r) => r.id), ['a']);
  assert.deepEqual(reps, copy);
});

test('checkNewPublication compares a new post with the existing ones, in its own language only', async () => {
  const { store } = await newStore();
  const existing = [
    pub('old1', 'amor vida fuerza coraje'),
    pub('old2', 'cena con amigas en la playa'),
    pub('old3', 'amor vida fuerza coraje', { lang: 'it' }),
  ];
  const fresh = pub('new1', 'amor vida fuerza coraje', { title: '' });
  const created = await checkNewPublication(store, fresh, [...existing, fresh]);
  assert.equal(created.length, 1);
  assert.equal(created[0].publicationId, 'old1');
  assert.equal(created[0].sourceType, 'publication');
  assert.equal(created[0].sourceId, 'new1');
  assert.equal(created[0].status, 'da_valutare');
  assert.deepEqual(created[0].sharedWords.sort(), ['amor', 'coraje', 'fuerza', 'vida']);
  // ripetere il controllo non crea voci nuove
  assert.deepEqual(await checkNewPublication(store, fresh, existing), []);
});

test('checkNewPublication does not repeat a pair already seen from the other side', async () => {
  const { store } = await newStore();
  const a = pub('pa', 'amor vida fuerza coraje');
  const b = pub('pb', 'amor vida fuerza coraje');
  assert.equal((await checkNewPublication(store, b, [a])).length, 1);
  // se poi si rimodifica il vecchio post e lo si ricontrolla contro l'altro, la coppia è la stessa
  assert.deepEqual(await checkNewPublication(store, a, [b]), []);
  assert.equal((await store.all('repetitions')).length, 1);
});
