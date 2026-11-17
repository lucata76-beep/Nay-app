import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpanishStemmer as RefSpanish, ItalianStemmer as RefItalian } from 'snowball-stem';
import { SpanishStemmer } from '../vendor/snowball-es.js';
import { ItalianStemmer } from '../vendor/snowball-it.js';
import { SIMILARITY_THRESHOLD, tokenize, similarity, findSimilar } from '../js/features/similarity.js';

function pub(id, description, extra = {}) {
  return { id, title: '', description, type: 'foto', lang: 'es', publishedAt: '2026-01-01T10:00:00.000Z', ...extra };
}

test('SIMILARITY_THRESHOLD is 0.5 (to be calibrated on the real posts)', () => {
  assert.equal(SIMILARITY_THRESHOLD, 0.5);
});

test('identical texts score 1 and disjoint texts score 0', () => {
  const a = tokenize('La valentía de empezar de nuevo cada mañana', 'es');
  assert.ok(a.length > 0);
  assert.equal(similarity(a, tokenize('La valentía de empezar de nuevo cada mañana', 'es')), 1);
  assert.equal(similarity(a, tokenize('Cena con amigas en la playa', 'es')), 0);
  assert.equal(similarity([], a), 0);
  assert.equal(similarity(a, []), 0);
  assert.equal(similarity([], []), 0);
});

test('similarity is symmetric, ignores repeated words and stays between 0 and 1', () => {
  const a = ['uno', 'dos', 'tres'];
  const b = ['dos', 'tres', 'cuatro', 'cinco'];
  assert.equal(similarity(a, b), similarity(b, a));
  assert.equal(similarity(['uno', 'uno', 'dos'], ['uno', 'dos']), 1);
  const s = similarity(a, b);
  assert.ok(s > 0 && s < 1);
});

test('accented and unaccented words match', () => {
  // esempio del piano: parole accentate e no; «valiente» e «valentía» hanno radici diverse
  // (valient, valent), quindi qui il punteggio è 0,5 (una parola su due in comune)
  const matches = findSimilar('Ánimo valiente', 'es', [pub('p1', 'animo y valentía')]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].publicationId, 'p1');
  assert.equal(matches[0].score, 0.5);
  assert.deepEqual(matches[0].sharedWords, ['ánimo']);

  // con le stesse parole, accentate o no, il punteggio è 1
  const same = findSimilar('Ánimo valiente', 'es', [pub('p2', 'animo y valiente')]);
  assert.equal(same[0].score, 1);

  assert.deepEqual(tokenize('Ánimo', 'es'), tokenize('animo', 'es'));
  assert.deepEqual(tokenize('valentía', 'es'), tokenize('valentia', 'es'));
  assert.deepEqual(tokenize('corazón', 'es'), tokenize('corazon', 'es'));
  assert.deepEqual(tokenize('corazón', 'es'), tokenize('corazones', 'es'));
  assert.deepEqual(tokenize('sueños', 'es'), tokenize('suenos', 'es'));
  assert.deepEqual(tokenize('perché', 'it'), tokenize('perche', 'it'));
  assert.deepEqual(tokenize('felicità', 'it'), tokenize('felicita', 'it'));
});

test('the same text typed as NFC or NFD matches', () => {
  const nfc = '¡Ánimo, valiente señorita!';
  const nfd = nfc.normalize('NFD');
  assert.notEqual(nfc, nfd);
  assert.deepEqual(tokenize(nfd, 'es'), tokenize(nfc, 'es'));
  assert.deepEqual(tokenize('Ánimo'.normalize('NFD'), 'es'), tokenize('animo', 'es'));
  const matches = findSimilar(nfd, 'es', [pub('p1', nfc.toLowerCase().normalize('NFC'))]);
  assert.equal(matches[0].score, 1);
  const reverse = findSimilar(nfc, 'es', [pub('p1', nfd)]);
  assert.equal(reverse[0].score, 1);
});

test('cuore and cuori share a stem', () => {
  assert.deepEqual(tokenize('cuore', 'it'), ['cuor']);
  assert.deepEqual(tokenize('cuori', 'it'), ['cuor']);
  assert.equal(similarity(tokenize('cuore', 'it'), tokenize('cuori', 'it')), 1);
});

test('tokenize lowercases, splits on punctuation and drops stopwords and short words', () => {
  assert.deepEqual(tokenize('¿Qué es el AMOR? ¡Es la vida, y los sueños!', 'es'), ['amor', 'vid', 'suen']);
  assert.deepEqual(tokenize("L'amore è un dono, per tutti", 'it'), ['amor', 'don']);
  assert.deepEqual(tokenize('', 'es'), []);
  assert.deepEqual(tokenize('a y o de la', 'es'), []);
  assert.deepEqual(tokenize('2026 100%', 'es'), [], 'i numeri non sono parole');
});

test('known limits of the stemmer: amar and amando, valiente and valentía are different words', () => {
  // come scritto nella spec (sezione 3): l'algoritmo non unisce tutte le forme
  assert.notDeepEqual(tokenize('amar', 'es'), tokenize('amando', 'es'));
  assert.notDeepEqual(tokenize('valiente', 'es'), tokenize('valentía', 'es'));
});

test('tokenize rejects an unsupported language', () => {
  assert.throws(() => tokenize('hola', 'fr'), RangeError);
});

test('texts in different languages are never compared', () => {
  const text = 'Ánimo valiente corazón';
  const italianPost = pub('it1', 'Ánimo valiente corazón', { lang: 'it' });
  assert.deepEqual(findSimilar(text, 'es', [italianPost]), []);
  assert.equal(findSimilar(text, 'it', [italianPost]).length, 1);
  const mixed = findSimilar(text, 'es', [italianPost, pub('es1', 'Ánimo valiente corazón')]);
  assert.deepEqual(mixed.map((m) => m.publicationId), ['es1']);
});

test('findSimilar respects the threshold and the limit', () => {
  const pubs = [
    pub('full', 'amor vida fuerza coraje'), // 4 su 4
    pub('three', 'amor vida fuerza paz'), // 3 su 4: Dice 0,75
    pub('half', 'amor vida paz luz'), // 2 su 4: Dice 0,5
    pub('one', 'amor paz luz sol'), // 1 su 4: Dice 0,25
    pub('none', 'playa cena amigas'),
  ];
  const text = 'amor vida fuerza coraje';

  const byDefault = findSimilar(text, 'es', pubs);
  assert.deepEqual(byDefault.map((m) => m.publicationId), ['full', 'three', 'half']);
  assert.deepEqual(byDefault.map((m) => m.score), [1, 0.75, 0.5]);

  assert.deepEqual(findSimilar(text, 'es', pubs, { threshold: 0.8 }).map((m) => m.publicationId), ['full']);
  assert.deepEqual(findSimilar(text, 'es', pubs, { threshold: 0.2 }).map((m) => m.publicationId), ['full', 'three', 'half', 'one']);
  assert.deepEqual(findSimilar(text, 'es', pubs, { limit: 2 }).map((m) => m.publicationId), ['full', 'three']);
  assert.deepEqual(findSimilar(text, 'es', pubs, { threshold: 0.2, limit: 1 }).map((m) => m.publicationId), ['full']);
  assert.deepEqual(findSimilar(text, 'es', pubs, { limit: 0 }), []);
  // con soglia 0 non entrano comunque i post senza nessuna parola in comune
  assert.ok(!findSimilar(text, 'es', pubs, { threshold: 0 }).some((m) => m.publicationId === 'none'));
});

test('findSimilar sorts by score and breaks ties with the most recent post', () => {
  const pubs = [
    pub('old', 'amor vida', { publishedAt: '2026-01-01T00:00:00.000Z' }),
    pub('new', 'amor vida', { publishedAt: '2026-06-01T00:00:00.000Z' }),
    pub('best', 'amor vida', { publishedAt: '2026-03-01T00:00:00.000Z', title: '' }),
  ];
  assert.deepEqual(findSimilar('amor vida', 'es', pubs).map((m) => m.publicationId), ['new', 'best', 'old']);
});

test('findSimilar compares title and description and reports the shared words', () => {
  const post = pub('p1', 'una mañana de paz', { title: 'Ánimo valiente' });
  const [match] = findSimilar('Mañana de ÁNIMO y valentía', 'es', [post], { threshold: 0.1 });
  assert.equal(match.publicationId, 'p1');
  assert.deepEqual(match.sharedWords, ['mañana', 'ánimo']);
  assert.deepEqual(Object.keys(match).sort(), ['publicationId', 'score', 'sharedWords']);
});

test('findSimilar does not change its input', () => {
  const pubs = [pub('p1', 'amor vida'), pub('p2', 'amor paz')];
  const copy = JSON.parse(JSON.stringify(pubs));
  findSimilar('amor', 'es', pubs, { threshold: 0.1 });
  assert.deepEqual(pubs, copy);
});

test('findSimilar handles posts without title or description', () => {
  assert.deepEqual(findSimilar('amor', 'es', [{ id: 'x', lang: 'es', publishedAt: '2026-01-01T00:00:00.000Z' }]), []);
  assert.deepEqual(findSimilar('', 'es', [pub('p1', 'amor')]), []);
  assert.deepEqual(findSimilar('amor', 'es', []), []);
});

test('vendor stemmers give the same stems as snowball-stem 1.1.1', () => {
  const es = new SpanishStemmer();
  const refEs = new RefSpanish();
  const it = new ItalianStemmer();
  const refIt = new RefItalian();
  const spanish = ['animo', 'ánimo', 'corazón', 'corazones', 'valiente', 'valentía', 'sueños', 'amando', 'mañana', 'esperanza', 'felicidad', 'caminando', 'abrazos', 'siempre'];
  const italian = ['cuore', 'cuori', 'amore', 'felicità', 'coraggio', 'coraggiosa', 'vivere', 'sogni', 'domani', 'speranza', 'camminando', 'abbracci', 'perché'];
  for (const word of spanish) assert.equal(es.stem(word), refEs.stem(word), word);
  for (const word of italian) assert.equal(it.stem(word), refIt.stem(word), word);
});
