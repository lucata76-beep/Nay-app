// Somiglianza per parole tra testi della stessa lingua: radice delle parole (Snowball) e
// coefficiente di Dice sugli insiemi di radici. Non trova lo stesso significato detto con altre parole.
import { SpanishStemmer } from '../../vendor/snowball-es.js';
import { ItalianStemmer } from '../../vendor/snowball-it.js';
import { foldText } from './text.js';

// Da calibrare sui 50 post veri (spec, sezione 5).  [Da provare]
export const SIMILARITY_THRESHOLD = 0.5;

const STEMMERS = { es: new SpanishStemmer(), it: new ItalianStemmer() };

// Parole vuote di almeno 3 lettere (le più corte si tolgono comunque). Elenchi scritti a mano,
// da affinare sui testi veri; si confrontano senza accenti.
const STOPWORDS = {
  es: new Set(
    `para como pero por con sin sobre entre hasta desde hacia durante contra segun tras los las del una uno unos unas
    que sus mis tus nos les mas muy ser son soy eres fue era han hay sea esta este esto estos estas esa ese eso esos
    esas aquel aquella todo toda todos todas algo otro otra otros otras cada donde cuando quien quienes cual cuales
    porque pues tambien tanto tan aqui alli asi cuyo mio mia tuyo tuya suyo suya nuestro nuestra vuestro vuestra
    estar estoy estan tengo tiene tienes tienen puede pueden nada siempre nunca sino aun aunque mientras despues
    antes ante bajo`
      .split(/\s+/)
      .map(foldText),
  ),
  it: new Set(
    `che chi cui con per tra fra una uno del dello della dei degli delle nel nello nella nei negli nelle sul sullo
    sulla sui sugli sulle dal dallo dalla dai dagli dalle alla allo alle agli non piu come anche sono era essere
    sei siamo siete questo questa questi queste quello quella quelli quelle suo sua suoi sue mio mia miei mie tuo
    tua tuoi tue nostro nostra loro noi voi lui lei poi molto tutto tutti tutta tutte ogni dove quando perche
    quindi pero mentre sempre mai gia ancora ecco dopo prima sotto sopra verso senza cosa cose hai hanno abbiamo
    avete avere sia sta stai stanno`
      .split(/\s+/)
      .map(foldText),
  ),
};

function stemmerFor(lang) {
  const stemmer = STEMMERS[lang];
  if (!stemmer) throw new RangeError(`Lingua non supportata: ${lang}`);
  return stemmer;
}

// Parole del testo con la loro radice. Prima NFC (la stessa lettera digitata in modi diversi
// diventa uguale), poi solo lettere Unicode in minuscolo; si tolgono parole vuote e parole
// sotto le 3 lettere; la radice si calcola senza accenti, così «valentía» e «valentia»
// danno lo stesso risultato. `word` è la parola com'era scritta (minuscola, con gli accenti).
function analyze(text, lang) {
  const stemmer = stemmerFor(lang);
  const words = String(text ?? '')
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{M}]+/u)
    .filter(Boolean);
  const result = [];
  for (const word of words) {
    const folded = foldText(word);
    if ([...folded].length < 3 || STOPWORDS[lang].has(folded)) continue;
    result.push({ word, stem: stemmer.stem(folded) });
  }
  return result;
}

export function tokenize(text, lang) {
  return analyze(text, lang).map((entry) => entry.stem);
}

// Coefficiente di Dice sugli insiemi di radici: da 0 (niente in comune) a 1 (stesse radici).
export function similarity(a, b) {
  const first = new Set(a);
  const second = new Set(b);
  if (first.size === 0 || second.size === 0) return 0;
  let shared = 0;
  for (const token of first) if (second.has(token)) shared++;
  return (2 * shared) / (first.size + second.size);
}

// Post della stessa lingua simili al testo, dal più simile; a parità il più recente.
// Il confronto usa titolo e descrizione. `sharedWords` sono le parole del testo controllato
// (minuscole, come scritte) la cui radice compare nel post.
export function findSimilar(text, lang, pubs, { threshold = SIMILARITY_THRESHOLD, limit = Infinity } = {}) {
  const query = analyze(text, lang);
  const queryStems = query.map((entry) => entry.stem);
  const found = [];
  for (const pub of pubs) {
    if (pub.lang !== lang) continue;
    const stems = tokenize(`${pub.title ?? ''} ${pub.description ?? ''}`, lang);
    const score = similarity(queryStems, stems);
    if (score <= 0 || score < threshold) continue;
    const inPost = new Set(stems);
    const seen = new Set();
    const sharedWords = [];
    for (const { word, stem } of query) {
      if (inPost.has(stem) && !seen.has(stem)) {
        seen.add(stem);
        sharedWords.push(word);
      }
    }
    found.push({ match: { publicationId: pub.id, score, sharedWords }, time: Date.parse(pub.publishedAt) || 0 });
  }
  found.sort((x, y) => y.match.score - x.match.score || y.time - x.time);
  return found.slice(0, Math.max(0, Math.floor(limit))).map((entry) => entry.match);
}
