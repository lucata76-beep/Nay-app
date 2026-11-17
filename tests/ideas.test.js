import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIdea, markInDevelopment, linkToPublication, searchIdeas } from '../js/features/ideas.js';
import { saveDraft, loadDraft, clearDraft } from '../js/features/drafts.js';
import { openDb } from '../js/core/db.js';
import { createSecureStore } from '../js/core/secure-store.js';
import { createVault } from '../js/core/vault.js';

test('createIdea rejects an idea with no text and no media', () => {
  assert.throws(() => createIdea(), /testo|media/i);
  assert.throws(() => createIdea({}));
  assert.throws(() => createIdea({ text: '' }));
  assert.throws(() => createIdea({ text: '   \n ' }));
  assert.throws(() => createIdea({ text: '', mediaIds: [] }));
});

test('createIdea accepts text only, media only, or both', () => {
  assert.equal(createIdea({ text: 'Ánimo' }).text, 'Ánimo');
  assert.deepEqual(createIdea({ mediaIds: ['m1', 'm2'] }).mediaIds, ['m1', 'm2']);
  const both = createIdea({ text: 'foto del parque', mediaIds: ['m1'] });
  assert.equal(both.text, 'foto del parque');
  assert.deepEqual(both.mediaIds, ['m1']);
});

test('default lang is es', () => {
  assert.equal(createIdea({ text: 'hola' }).lang, 'es');
  assert.equal(createIdea({ text: 'ciao', lang: 'it' }).lang, 'it');
});

test('createIdea rejects an unsupported lang', () => {
  assert.throws(() => createIdea({ text: 'bonjour', lang: 'fr' }), RangeError);
});

test('createIdea fills id, status, dates and copies mediaIds', () => {
  const mediaIds = ['m1'];
  const idea = createIdea({ text: '  hola  ', mediaIds });
  assert.match(idea.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.equal(idea.text, 'hola');
  assert.equal(idea.status, 'nuova');
  assert.equal(new Date(idea.createdAt).toISOString(), idea.createdAt);
  assert.equal(idea.updatedAt, idea.createdAt);
  mediaIds.push('m2');
  assert.deepEqual(idea.mediaIds, ['m1'], 'mediaIds deve essere una copia');
  assert.notEqual(createIdea({ text: 'hola' }).id, createIdea({ text: 'hola' }).id);
});

test('status changes follow the rules', () => {
  const idea = createIdea({ text: 'hola' });
  assert.equal(idea.status, 'nuova');

  const developing = markInDevelopment(idea);
  assert.equal(developing.status, 'in_sviluppo');
  assert.equal(idea.status, 'nuova', 'non modifica l’originale');
  assert.equal(markInDevelopment(developing).status, 'in_sviluppo');

  const published = linkToPublication(developing, 'pub-1');
  assert.equal(published.status, 'pubblicata');
  assert.equal(published.publicationId, 'pub-1');
  assert.equal(developing.status, 'in_sviluppo');

  // generare un altro prompt non fa tornare indietro un'idea già pubblicata
  assert.equal(markInDevelopment(published).status, 'pubblicata');

  // collegare una pubblicazione funziona anche da «nuova»
  assert.equal(linkToPublication(idea, 'pub-2').status, 'pubblicata');
  assert.throws(() => linkToPublication(idea, ''));
});

test('searchIdeas finds words ignoring case and accents', () => {
  const ideas = [
    createIdea({ text: 'Ánimo valiente' }),
    createIdea({ text: 'Mañana será otro día' }),
    createIdea({ text: 'corazón de madre' }),
  ];
  assert.deepEqual(searchIdeas(ideas, 'animo'), [ideas[0]]);
  assert.deepEqual(searchIdeas(ideas, 'ÁNIMO'), [ideas[0]]);
  assert.deepEqual(searchIdeas(ideas, 'manana'), [ideas[1]]);
  assert.deepEqual(searchIdeas(ideas, 'corazon'), [ideas[2]]);
  assert.deepEqual(searchIdeas(ideas, 'valiente animo'), [ideas[0]]);
  assert.deepEqual(searchIdeas(ideas, 'animo madre'), []);
  assert.deepEqual(searchIdeas(ideas, 'zzz'), []);
});

test('searchIdeas matches the same word typed as NFC or NFD', () => {
  const ideas = [createIdea({ text: 'Ánimo'.normalize('NFD') }), createIdea({ text: 'Señora'.normalize('NFC') })];
  assert.deepEqual(searchIdeas(ideas, 'Ánimo'.normalize('NFC')), [ideas[0]]);
  assert.deepEqual(searchIdeas(ideas, 'señora'.normalize('NFD')), [ideas[1]]);
});

test('searchIdeas returns everything for an empty query and keeps the order', () => {
  const ideas = [createIdea({ text: 'b' }), createIdea({ text: 'a' })];
  assert.deepEqual(searchIdeas(ideas, ''), ideas);
  assert.deepEqual(searchIdeas(ideas, '   '), ideas);
  assert.deepEqual(searchIdeas(ideas, undefined), ideas);
  assert.notEqual(searchIdeas(ideas, ''), ideas, 'deve restituire un nuovo array');
});

async function newStore() {
  const db = await openDb(`nay-drafts-${Math.random().toString(36).slice(2)}`);
  const { session } = await createVault({ password: 'una contraseña larga', iterations: 1000 });
  return { db, store: createSecureStore(db, session) };
}

test('draft roundtrip and clear', async () => {
  const { store } = await newStore();
  assert.equal(await loadDraft(store, 'idea-form'), null);

  await saveDraft(store, 'idea-form', { text: '¿Qué tal, señorita?', lang: 'es' });
  assert.deepEqual(await loadDraft(store, 'idea-form'), { text: '¿Qué tal, señorita?', lang: 'es' });

  // una nuova bozza sostituisce la precedente; un altro modulo non si tocca
  await saveDraft(store, 'idea-form', { text: 'segunda versión' });
  await saveDraft(store, 'post-form', { title: 'otro' });
  assert.deepEqual(await loadDraft(store, 'idea-form'), { text: 'segunda versión' });
  assert.deepEqual(await loadDraft(store, 'post-form'), { title: 'otro' });

  await clearDraft(store, 'idea-form');
  assert.equal(await loadDraft(store, 'idea-form'), null);
  assert.deepEqual(await loadDraft(store, 'post-form'), { title: 'otro' });
  await clearDraft(store, 'idea-form'); // cancellare due volte non fa danni
});

test('drafts are stored encrypted', async () => {
  const { db, store } = await newStore();
  await saveDraft(store, 'idea-form', { text: 'Borrador privado ñandú' });
  const raws = await db.list('meta');
  assert.equal(raws.length, 1);
  assert.ok(!JSON.stringify(raws[0]).includes('Borrador'), JSON.stringify(raws[0]));
  assert.deepEqual(Object.keys(raws[0]).sort(), ['enc', 'id', 'updatedAt']);
});
