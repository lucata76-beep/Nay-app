import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHistory, buildPrompt } from '../js/features/prompts.js';
import { DEFAULT_TEMPLATES, findUnfilled } from '../js/features/templates.js';
import { createIdea } from '../js/features/ideas.js';

function pub(n, extra = {}) {
  return {
    id: `p${n}`,
    title: `Título ${n}`,
    description: `Descripción ${n}`,
    type: 'foto',
    lang: 'es',
    publishedAt: `2026-0${n}-01T10:00:00.000Z`,
    ...extra,
  };
}

const PUBS = [1, 2, 3, 4, 5, 6].map((n) => pub(n));

test('formatHistory keeps similarIds first and respects max', () => {
  const out = formatHistory(PUBS, { max: 4, similarIds: ['p2', 'p5'] });
  assert.equal(
    out,
    ['- Título 2: Descripción 2', '- Título 5: Descripción 5', '- Título 6: Descripción 6', '- Título 4: Descripción 4'].join('\n'),
  );
});

test('formatHistory takes the most recent posts first when there are no similar ones', () => {
  const out = formatHistory([...PUBS].reverse(), { max: 3 });
  assert.equal(out.split('\n').length, 3);
  assert.deepEqual(
    out.split('\n'),
    ['- Título 6: Descripción 6', '- Título 5: Descripción 5', '- Título 4: Descripción 4'],
  );
});

test('formatHistory never exceeds max, even with more similar posts than max', () => {
  const out = formatHistory(PUBS, { max: 2, similarIds: ['p1', 'p2', 'p3'] });
  assert.deepEqual(out.split('\n'), ['- Título 1: Descripción 1', '- Título 2: Descripción 2']);
});

test('formatHistory returns an empty string without posts or with max 0', () => {
  assert.equal(formatHistory([], { max: 5 }), '');
  assert.equal(formatHistory(PUBS, { max: 0 }), '');
});

test('formatHistory skips unknown similarIds and does not repeat a post', () => {
  const out = formatHistory(PUBS, { max: 10, similarIds: ['nope', 'p3', 'p3'] });
  const lines = out.split('\n');
  assert.equal(lines.length, 6);
  assert.equal(lines[0], '- Título 3: Descripción 3');
  assert.equal(new Set(lines).size, 6);
});

test('formatHistory writes each post on a single line', () => {
  const out = formatHistory([pub(1, { description: 'primera línea\nsegunda línea\r\ntercera' }), pub(2, { description: '' })], {
    max: 5,
  });
  assert.deepEqual(out.split('\n'), ['- Título 2', '- Título 1: primera línea segunda línea tercera']);
});

test('formatHistory does not change the posts it receives', () => {
  const copy = JSON.parse(JSON.stringify(PUBS));
  formatHistory(PUBS, { max: 3, similarIds: ['p1'] });
  assert.deepEqual(PUBS, copy);
});

const SPANISH_PHOTO = DEFAULT_TEMPLATES.find((t) => t.kind === 'foto' && t.lang === 'es');
const ITALIAN_VIDEO = DEFAULT_TEMPLATES.find((t) => t.kind === 'video' && t.lang === 'it');

test('buildPrompt fills idea, history and language', () => {
  const idea = createIdea({ text: 'El valor de empezar de nuevo', lang: 'es' });
  const history = '- Título 1: Descripción 1';
  const { text, lang } = buildPrompt({
    template: SPANISH_PHOTO,
    idea,
    values: { tono: 'cálido', obiettivo: 'inspirar', lunghezza: 'corta', hashtag: '3', descrizione_media: 'un parque en otoño', stile: 'cercano' },
    history,
  });
  assert.equal(lang, 'es');
  assert.ok(text.includes('El valor de empezar de nuevo'));
  assert.ok(text.includes(history));
  assert.ok(text.includes('español'));
  assert.ok(text.includes('un parque en otoño'));
  assert.deepEqual(findUnfilled(text, {}), [], 'nessun segnaposto deve restare nel testo');
});

test('buildPrompt writes the language name in the template language', () => {
  const values = { tono: 'x', obiettivo: 'x', lunghezza: 'x', hashtag: 'x', descrizione_media: 'x', durata_video: '10 s', stile: 'x' };
  const spanishIdea = createIdea({ text: 'idea', lang: 'es' });
  const italianIdea = createIdea({ text: 'idea', lang: 'it' });

  const a = buildPrompt({ template: ITALIAN_VIDEO, idea: spanishIdea, values, history: 'h' });
  assert.equal(a.lang, 'es');
  assert.ok(a.text.includes('spagnolo'), a.text);

  const b = buildPrompt({ template: SPANISH_PHOTO, idea: italianIdea, values, history: 'h' });
  assert.equal(b.lang, 'it');
  assert.ok(b.text.includes('italiano'), b.text);
});

test('buildPrompt uses a neutral line when there is no history', () => {
  const idea = createIdea({ text: 'idea' });
  const values = { tono: 'x', obiettivo: 'x', lunghezza: 'x', hashtag: 'x', descrizione_media: 'x', stile: 'x' };
  const { text } = buildPrompt({ template: SPANISH_PHOTO, idea, values, history: '' });
  assert.ok(!text.includes('{storico}'));
  assert.deepEqual(findUnfilled(text, {}), []);
});

test('buildPrompt: the idea, history and language come from the idea, not from values', () => {
  const idea = createIdea({ text: 'la idea verdadera', lang: 'es' });
  const { text } = buildPrompt({
    template: SPANISH_PHOTO,
    idea,
    values: { idea: 'otra cosa', lingua: 'klingon', storico: 'intruso' },
    history: '- real',
  });
  assert.ok(text.includes('la idea verdadera'));
  assert.ok(!text.includes('otra cosa'));
  assert.ok(!text.includes('klingon'));
  assert.ok(!text.includes('intruso'));
});

test('buildPrompt leaves unfilled form placeholders visible so they can be flagged', () => {
  const idea = createIdea({ text: 'idea' });
  const { text } = buildPrompt({ template: SPANISH_PHOTO, idea, values: {}, history: 'h' });
  assert.ok(findUnfilled(text, {}).includes('tono'));
});

test('buildPrompt uses the idea text from the form only when the idea has no text', () => {
  const mediaOnly = createIdea({ mediaIds: ['m1'] });
  const { text } = buildPrompt({
    template: SPANISH_PHOTO,
    idea: mediaOnly,
    values: { idea: 'contexto escrito en el formulario' },
    history: 'h',
  });
  assert.ok(text.includes('contexto escrito en el formulario'));
  const none = buildPrompt({ template: SPANISH_PHOTO, idea: mediaOnly, values: {}, history: 'h' });
  assert.ok(findUnfilled(none.text, {}).includes('idea'), 'senza testo né modulo {idea} resta visibile');
});
