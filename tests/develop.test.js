// T13: logica della pagina Sviluppare (tipo suggerito, template, modulo, prompt con storico,
// salvataggio del prompt, file da condividere, nome dello ZIP, editor dei template).
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../js/core/db.js';
import { createSecureStore, StorageFullError } from '../js/core/secure-store.js';
import { createVault } from '../js/core/vault.js';
import { DEFAULT_TEMPLATES } from '../js/features/templates.js';
import { createIdea } from '../js/features/ideas.js';
import { createIdeaWithMedia } from '../js/features/idea-save.js';
import {
  DEFAULT_HISTORY_MAX,
  buildDevelopPrompt,
  copyOfTemplate,
  deleteTemplate,
  insertAtCursor,
  loadFormValues,
  loadMediaFiles,
  loadStyleGuide,
  mediaValues,
  neededFields,
  newTemplate,
  saveFormValues,
  saveGeneratedPrompt,
  saveStyleGuide,
  saveTemplate,
  suggestKind,
  templatesFor,
  validateTemplate,
  zipFileName,
} from '../js/features/develop.js';

let counter = 0;
async function setup(wrap = (db) => db) {
  const db = await openDb(`nay-develop-${++counter}`);
  const { session } = await createVault({ password: 'una contraseña larga', iterations: 1000 });
  return { db, store: createSecureStore(wrap(db), session), plain: createSecureStore(db, session) };
}
const pub = (id, title, description, lang = 'es', publishedAt = '2026-01-01T10:00:00.000Z') => ({ id, title, description, type: 'foto', lang, publishedAt });
const photo = (name = 'foto.jpg', bytes = [1, 2, 3]) => ({ blob: new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }), name });
const video = (name = 'video.mp4', extra = {}) => ({ blob: new Blob([new Uint8Array([9, 8, 7])], { type: 'video/mp4' }), name, ...extra });
const TEMPLATE = { id: 't1', name: 'T', kind: 'foto', lang: 'es', builtin: false, body: 'Idea: {idea}\nTono: {tono}\nHistorial:\n{storico}\nEstilo: {stile}\nIdioma: {lingua}' };

test('suggestKind picks video, then foto, then testo from the idea media', () => {
  assert.equal(suggestKind([]), 'testo');
  assert.equal(suggestKind([{ kind: 'foto' }]), 'foto');
  assert.equal(suggestKind([{ kind: 'foto' }, { kind: 'video' }]), 'video');
});

test('templatesFor lists the builtin template and the custom ones of that kind and language only', () => {
  const mine = [
    { id: 'a', name: 'Mía', kind: 'foto', lang: 'es', builtin: false, body: 'x' },
    { id: 'b', name: 'Otra lengua', kind: 'foto', lang: 'it', builtin: false, body: 'x' },
    { id: 'c', name: 'Otro tipo', kind: 'video', lang: 'es', builtin: false, body: 'x' },
  ];
  const list = templatesFor(mine, 'foto', 'es');
  assert.deepEqual(list.map((t) => t.id), ['builtin-foto-es', 'a']);
  assert.equal(templatesFor([], 'frase', 'it')[0].id, 'builtin-frase-it');
  assert.equal(templatesFor(mine, 'testo', 'es').length, 1);
});

test('neededFields lists the form fields the template body uses, and idea when the idea has no text', () => {
  const body = 'Tono {tono} {descrizione_media} {durata_video} {hashtag} {obiettivo} {lunghezza} {idea} {storico}';
  const idea = createIdea({ text: 'algo' });
  assert.deepEqual(neededFields({ body }, idea), ['tono', 'obiettivo', 'lunghezza', 'hashtag', 'descrizione_media', 'durata_video']);
  assert.deepEqual(neededFields({ body: 'solo {tono}' }, idea), ['tono']);
  const onlyMedia = createIdea({ text: '', mediaIds: ['m'] });
  assert.deepEqual(neededFields({ body: '{idea} {tono}' }, onlyMedia), ['idea', 'tono']);
  assert.deepEqual(neededFields({ body: '{idea} {tono}' }, idea), ['tono']);
  assert.deepEqual(neededFields({ body: 'niente' }, idea), []);
});

test('mediaValues joins the descriptions and the video durations written by the user', () => {
  assert.deepEqual(mediaValues([]), { descrizione_media: '', durata_video: '' });
  const values = mediaValues([
    { kind: 'foto', description: 'una puerta azul' },
    { kind: 'video', description: '  ', durationSec: 75.4 },
    { kind: 'video', description: 'olas', durationSec: 9 },
    { kind: 'foto', description: '' },
  ]);
  assert.equal(values.descrizione_media, 'una puerta azul; olas');
  assert.equal(values.durata_video, '1:15, 0:09');
});

test('buildDevelopPrompt fills idea, style guide, language and a history of the same language only', () => {
  const idea = createIdea({ text: 'ánimo valiente siempre', lang: 'es' });
  const publications = [
    pub('p1', 'Ánimo valiente', 'siempre adelante', 'es', '2026-01-02T10:00:00.000Z'),
    pub('p2', 'Cena de pasta', 'receta', 'es', '2026-01-05T10:00:00.000Z'),
    pub('p3', 'Coraggio', 'sempre avanti', 'it', '2026-01-09T10:00:00.000Z'),
  ];
  const out = buildDevelopPrompt({ template: TEMPLATE, idea, media: [], form: { tono: 'cálido' }, publications, styleGuide: 'frases cortas' });
  assert.equal(out.lang, 'es');
  assert.match(out.text, /Idea: ánimo valiente siempre/);
  assert.match(out.text, /Tono: cálido/);
  assert.match(out.text, /Estilo: frases cortas/);
  assert.match(out.text, /Idioma: español/);
  assert.match(out.text, /- Ánimo valiente: siempre adelante/);
  assert.match(out.text, /- Cena de pasta: receta/);
  assert.doesNotMatch(out.text, /Coraggio/, 'nessun post dell’altra lingua');
  assert.equal(out.historyCount, 2);
  assert.deepEqual(out.unfilled, []);
  // il più simile viene prima, anche se è il meno recente
  assert.ok(out.text.indexOf('Ánimo valiente: siempre') < out.text.indexOf('Cena de pasta'));
});

test('buildDevelopPrompt lists the placeholders left unfilled and leaves them visible', () => {
  const idea = createIdea({ text: 'algo', lang: 'es' });
  const out = buildDevelopPrompt({ template: TEMPLATE, idea, media: [], form: {}, publications: [], styleGuide: '   ' });
  assert.deepEqual(out.unfilled, ['tono', 'stile']);
  assert.match(out.text, /\{tono\}/);
  assert.match(out.text, /\{stile\}/);
  assert.match(out.text, /\(Todavía no hay publicaciones guardadas\.\)/);
  assert.equal(out.historyCount, 0);
});

test('buildDevelopPrompt ignores braces that belong to the idea text, not to the template', () => {
  const idea = createIdea({ text: 'una idea con {llaves} dentro', lang: 'es' });
  const out = buildDevelopPrompt({ template: TEMPLATE, idea, media: [], form: { tono: 'x' }, publications: [], styleGuide: 'y' });
  assert.match(out.text, /\{llaves\}/);
  assert.deepEqual(out.unfilled, []);
});

test('buildDevelopPrompt respects the history size and takes media values unless the form overrides them', () => {
  const idea = createIdea({ text: 'tema', lang: 'it' });
  const publications = Array.from({ length: 6 }, (_, i) => pub(`p${i}`, `Titolo ${i}`, '', 'it', `2026-01-0${i + 1}T10:00:00.000Z`));
  const tpl = { ...TEMPLATE, lang: 'it', body: '{storico}\n{descrizione_media}|{durata_video}' };
  const out = buildDevelopPrompt({ template: tpl, idea, media: [{ kind: 'video', description: 'mare', durationSec: 5 }], form: {}, publications, historyMax: 3 });
  assert.equal(out.historyCount, 3);
  assert.match(out.text, /mare\|0:05/);
  const over = buildDevelopPrompt({ template: tpl, idea, media: [{ kind: 'video', description: 'mare', durationSec: 5 }], form: { descrizione_media: 'scritto a mano' }, publications, historyMax: 3 });
  assert.match(over.text, /scritto a mano\|0:05/);
  assert.equal(DEFAULT_HISTORY_MAX, 30);
});

test('buildDevelopPrompt uses the text of the form when the idea has only media', () => {
  const idea = createIdea({ text: '', mediaIds: ['m1'], lang: 'es' });
  const out = buildDevelopPrompt({ template: TEMPLATE, idea, media: [], form: { idea: 'la frase escrita aquí', tono: 't' }, publications: [], styleGuide: 's' });
  assert.match(out.text, /Idea: la frase escrita aquí/);
});

test('saveGeneratedPrompt saves the prompt, moves the idea to in_sviluppo and returns the similar posts', async () => {
  const { plain, store } = await setup();
  await plain.save('publications', pub('x', 'Ánimo valiente', 'siempre adelante'));
  const { idea } = await createIdeaWithMedia(store, { text: 'ánimo valiente siempre adelante', lang: 'es', files: [] });
  const out = await saveGeneratedPrompt(store, { idea, template: TEMPLATE, text: 'TESTO DEL PROMPT' });
  assert.equal(out.prompt.ideaId, idea.id);
  assert.equal(out.prompt.templateId, 't1');
  assert.equal(out.prompt.lang, 'es');
  assert.equal(out.prompt.text, 'TESTO DEL PROMPT');
  assert.ok(Date.parse(out.prompt.createdAt));
  assert.equal(out.idea.status, 'in_sviluppo');
  assert.equal((await plain.load('ideas', idea.id)).status, 'in_sviluppo');
  assert.deepEqual((await plain.all('prompts')).map((p) => p.id), [out.prompt.id]);
  assert.equal(out.matches.length, 1);
  assert.equal((await plain.all('repetitions')).length, 1);
});

test('saveGeneratedPrompt does not move a published idea back, and keeps one record per generation', async () => {
  const { store } = await setup();
  const { idea } = await createIdeaWithMedia(store, { text: 'hola', lang: 'es', files: [] });
  const published = await store.save('ideas', { ...idea, status: 'pubblicata' });
  const first = await saveGeneratedPrompt(store, { idea: published, template: TEMPLATE, text: 'uno' });
  const second = await saveGeneratedPrompt(store, { idea: first.idea, template: TEMPLATE, text: 'dos' });
  assert.equal(second.idea.status, 'pubblicata');
  assert.equal((await store.all('prompts')).length, 2);
});

test('saveGeneratedPrompt removes the prompt again when the idea cannot be saved (nothing half-done)', async () => {
  const state = { fail: false };
  const { plain, store } = await setup((real) => ({
    ...real,
    put: async (s, r) => {
      if (state.fail && s === 'ideas') throw new DOMException('quota', 'QuotaExceededError');
      return real.put(s, r);
    },
  }));
  const { idea } = await createIdeaWithMedia(store, { text: 'hola', lang: 'es', files: [] });
  state.fail = true;
  await assert.rejects(saveGeneratedPrompt(store, { idea, template: TEMPLATE, text: 'x' }), (e) => e instanceof StorageFullError);
  assert.deepEqual(await plain.all('prompts'), []);
  assert.equal((await plain.load('ideas', idea.id)).status, 'nuova');
});

test('a failing similarity check does not undo a saved prompt', async () => {
  const { plain, store } = await setup((real) => ({
    ...real,
    list: async (s) => {
      if (s === 'publications') throw new Error('illeggibile');
      return real.list(s);
    },
  }));
  const { idea } = await createIdeaWithMedia(store, { text: 'hola', lang: 'es', files: [] });
  const out = await saveGeneratedPrompt(store, { idea, template: TEMPLATE, text: 'x' });
  assert.equal(out.checkFailed, true);
  assert.equal((await plain.all('prompts')).length, 1);
});

test('loadMediaFiles returns File objects with the stored name, type and bytes', async () => {
  const { store } = await setup();
  const { media } = await createIdeaWithMedia(store, { text: 'x', files: [photo('uno.jpg', [5, 6, 7]), video('dos.mp4')] });
  const files = await loadMediaFiles(store, media);
  assert.deepEqual(files.map((f) => [f.name, f.type, f.size]), [['uno.jpg', 'image/jpeg', 3], ['dos.mp4', 'video/mp4', 3]]);
  assert.deepEqual([...new Uint8Array(await files[0].arrayBuffer())], [5, 6, 7]);
  assert.ok(files[0] instanceof File);
});

test('zipFileName is a safe name from the idea and the date', () => {
  const when = new Date('2026-11-17T08:00:00.000Z');
  assert.equal(zipFileName({ text: 'Ánimo valiente, siempre adelante hoy' }, when), 'nay-animo-valiente-siempre-adelante-2026-11-17.zip');
  assert.equal(zipFileName({ text: '' }, when), 'nay-idea-2026-11-17.zip');
  assert.equal(zipFileName({ text: '¡¡¿?!! ///' }, when), 'nay-idea-2026-11-17.zip');
  assert.ok(zipFileName({ text: 'x'.repeat(200) }, when).length < 60);
});

test('insertAtCursor puts a placeholder at the cursor or over the selection', () => {
  assert.deepEqual(insertAtCursor('hola mundo', 4, 4, '{tono}'), { text: 'hola{tono} mundo', caret: 10 });
  assert.deepEqual(insertAtCursor('hola mundo', 5, 10, '{idea}'), { text: 'hola {idea}', caret: 11 });
  assert.deepEqual(insertAtCursor('', 0, 0, '{idea}'), { text: '{idea}', caret: 6 });
  assert.deepEqual(insertAtCursor('abc', 99, 99, '{x}'), { text: 'abc{x}', caret: 6 });
});

test('validateTemplate asks for a name and a body', () => {
  assert.equal(validateTemplate({ name: ' ', body: 'x' }), 'name');
  assert.equal(validateTemplate({ name: 'a', body: '  ' }), 'body');
  assert.equal(validateTemplate({ name: 'a', body: 'x' }), null);
});

test('newTemplate and copyOfTemplate make editable, non builtin templates; the original is untouched', () => {
  const created = newTemplate({ kind: 'foto', lang: 'es', name: 'Nueva', body: 'x {idea}' });
  assert.equal(created.builtin, false);
  assert.ok(created.id);
  const builtin = DEFAULT_TEMPLATES[0];
  const copy = copyOfTemplate(builtin, 'Mi versión');
  assert.equal(copy.builtin, false);
  assert.equal(copy.name, 'Mi versión');
  assert.equal(copy.body, builtin.body);
  assert.notEqual(copy.id, builtin.id);
  assert.equal(builtin.builtin, true);
});

test('saveTemplate stores a custom template encrypted; deleteTemplate refuses a builtin one', async () => {
  const { db, plain } = await setup();
  const tpl = newTemplate({ kind: 'video', lang: 'it', name: 'Segreto', body: 'cuerpo secreto {idea}' });
  const saved = await saveTemplate(plain, tpl);
  assert.equal(saved.id, tpl.id);
  assert.ok(!JSON.stringify(await db.list('templates')).includes('secreto'));
  assert.deepEqual((await plain.all('templates')).map((t) => t.id), [tpl.id]);
  await assert.rejects(deleteTemplate(plain, DEFAULT_TEMPLATES[0]), TypeError);
  await deleteTemplate(plain, saved);
  assert.deepEqual(await plain.all('templates'), []);
  await assert.rejects(saveTemplate(plain, DEFAULT_TEMPLATES[0]), TypeError);
});

test('form values and the style guide are remembered encrypted in the meta store', async () => {
  const { db, plain } = await setup();
  assert.deepEqual(await loadFormValues(plain), { tono: '', obiettivo: '', lunghezza: '', hashtag: '', historyMax: DEFAULT_HISTORY_MAX });
  await saveFormValues(plain, { tono: 'cálido', obiettivo: 'inspirar', lunghezza: 'corta', hashtag: '#nay', historyMax: 12 });
  assert.deepEqual(await loadFormValues(plain), { tono: 'cálido', obiettivo: 'inspirar', lunghezza: 'corta', hashtag: '#nay', historyMax: 12 });
  assert.equal(await loadStyleGuide(plain), '');
  await saveStyleGuide(plain, 'frases cortas y cálidas');
  assert.equal(await loadStyleGuide(plain), 'frases cortas y cálidas');
  const raw = JSON.stringify(await db.list('meta'));
  assert.ok(!raw.includes('cálido') && !raw.includes('frases cortas'));
});

test('saved form values are cleaned: unknown fields dropped and a bad history size falls back to the default', async () => {
  const { plain } = await setup();
  await saveFormValues(plain, { tono: 'a', intruso: 'x', historyMax: -5 });
  const values = await loadFormValues(plain);
  assert.equal(values.intruso, undefined);
  assert.equal(values.historyMax, DEFAULT_HISTORY_MAX);
});
