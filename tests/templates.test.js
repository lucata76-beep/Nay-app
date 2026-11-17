import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACEHOLDERS,
  DEFAULT_TEMPLATES,
  renderTemplate,
  findUnfilled,
  duplicateTemplate,
} from '../js/features/templates.js';

test('PLACEHOLDERS lists the placeholders of the spec', () => {
  assert.deepEqual(PLACEHOLDERS, [
    'idea',
    'tipo_media',
    'descrizione_media',
    'durata_video',
    'tono',
    'obiettivo',
    'lunghezza',
    'hashtag',
    'storico',
    'stile',
    'lingua',
  ]);
});

test('there are 4 kinds in 2 languages, all builtin, with unique ids', () => {
  assert.equal(DEFAULT_TEMPLATES.length, 8);
  const combos = DEFAULT_TEMPLATES.map((t) => `${t.kind}/${t.lang}`).sort();
  assert.deepEqual(combos, [
    'foto/es', 'foto/it', 'frase/es', 'frase/it', 'testo/es', 'testo/it', 'video/es', 'video/it',
  ]);
  assert.equal(new Set(DEFAULT_TEMPLATES.map((t) => t.id)).size, 8);
  for (const t of DEFAULT_TEMPLATES) {
    assert.equal(t.builtin, true);
    assert.ok(t.name && t.body, t.id);
  }
});

test('every default template contains {lingua} and {idea}', () => {
  for (const t of DEFAULT_TEMPLATES) {
    assert.ok(t.body.includes('{lingua}'), `${t.id} senza {lingua}`);
    assert.ok(t.body.includes('{idea}'), `${t.id} senza {idea}`);
  }
});

test('every default template asks for hook and caption separately', () => {
  for (const t of DEFAULT_TEMPLATES) {
    assert.match(t.body, /hook/i, `${t.id} senza hook`);
    assert.match(t.body, /caption/i, `${t.id} senza caption`);
    // due richieste distinte: «hook» e «caption» non stanno sulla stessa riga
    const lines = t.body.split('\n');
    const hookLine = lines.findIndex((l) => /hook/i.test(l));
    const captionLine = lines.findIndex((l) => /caption/i.test(l));
    assert.notEqual(hookLine, captionLine, `${t.id}: hook e caption nella stessa riga`);
  }
});

test('default templates use only known placeholders and the history/style ones', () => {
  for (const t of DEFAULT_TEMPLATES) {
    const used = [...t.body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    for (const name of used) assert.ok(PLACEHOLDERS.includes(name), `${t.id}: segnaposto sconosciuto {${name}}`);
    assert.ok(used.includes('storico'), `${t.id} senza {storico}`);
    assert.ok(used.includes('stile'), `${t.id} senza {stile}`);
  }
});

test('video templates ask for the video length and photo templates do not', () => {
  for (const t of DEFAULT_TEMPLATES.filter((x) => x.kind === 'video')) {
    assert.ok(t.body.includes('{durata_video}'), t.id);
  }
  for (const t of DEFAULT_TEMPLATES.filter((x) => x.kind === 'foto')) {
    assert.ok(!t.body.includes('{durata_video}'), t.id);
  }
});

test('renderTemplate replaces all placeholders', () => {
  const body = 'Idea: {idea}. Otra vez: {idea}. Tono {tono} en {lingua}.';
  const out = renderTemplate(body, { idea: 'alegría', tono: 'cálido', lingua: 'español' });
  assert.equal(out, 'Idea: alegría. Otra vez: alegría. Tono cálido en español.');
});

test('renderTemplate treats values literally', () => {
  const out = renderTemplate('A {idea} B {tono}', { idea: "$& $1 {tono}", tono: 'x' });
  assert.equal(out, 'A $& $1 {tono} B x');
});

test('renderTemplate leaves placeholders without a value untouched', () => {
  assert.equal(renderTemplate('{idea} y {tono}', { idea: 'paz' }), 'paz y {tono}');
  assert.equal(renderTemplate('{idea}', {}), '{idea}');
  assert.equal(renderTemplate('sin segnaposto', { idea: 'x' }), 'sin segnaposto');
});

test('findUnfilled lists missing placeholders', () => {
  const body = '{idea} {tono} {idea} {hashtag} {lingua}';
  assert.deepEqual(findUnfilled(body, { idea: 'x', lingua: 'es' }), ['tono', 'hashtag']);
  assert.deepEqual(findUnfilled(body, { idea: 'x', tono: 'a', hashtag: 'b', lingua: 'es' }), []);
  // vuoto o solo spazi = non riempito
  assert.deepEqual(findUnfilled('{idea} {tono}', { idea: '', tono: '   ' }), ['idea', 'tono']);
  assert.deepEqual(findUnfilled('sin segnaposto', {}), []);
});

test('duplicateTemplate makes an editable copy', () => {
  const original = DEFAULT_TEMPLATES[0];
  const copy = duplicateTemplate(original);
  assert.notEqual(copy.id, original.id);
  assert.equal(copy.builtin, false);
  assert.equal(copy.body, original.body);
  assert.equal(copy.kind, original.kind);
  assert.equal(copy.lang, original.lang);
  assert.equal(original.builtin, true, 'l’originale non cambia');
  assert.notEqual(duplicateTemplate(original).id, copy.id);
});

test('renderTemplate leaves placeholders with an empty value untouched', () => {
  assert.equal(renderTemplate('{idea} {tono}', { idea: '', tono: '   ' }), '{idea} {tono}');
  assert.equal(renderTemplate('{idea}', { idea: null }), '{idea}');
});
