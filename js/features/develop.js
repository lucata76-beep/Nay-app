// Logica della pagina Sviluppare (T13): dal tipo di contenuto al prompt pronto da copiare, condividere
// o impacchettare. La pagina (js/ui/screens/develop.js) usa solo queste funzioni, che hanno i loro test.
import { createIdea, markInDevelopment } from './ideas.js';
import { checkIdeaSimilarity } from './idea-save.js';
import { findSimilar } from './similarity.js';
import { buildPrompt, formatHistory } from './prompts.js';
import { DEFAULT_TEMPLATES, duplicateTemplate, findUnfilled } from './templates.js';
import { foldText } from './text.js';

export const KINDS = ['foto', 'video', 'testo', 'frase'];
const LANGS = ['es', 'it'];

// Campi del modulo (in quest'ordine). «idea» si aggiunge da sé quando l'idea ha solo media.
export const FORM_FIELDS = ['tono', 'obiettivo', 'lunghezza', 'hashtag', 'descrizione_media', 'durata_video'];

// Quanti post dello storico entrano nel prompt: parametro da tarare con lei **[Da provare]**
// (la spec: la lunghezza massima del messaggio non è verificata). Si può cambiare nel modulo.
export const DEFAULT_HISTORY_MAX = 30;
// I post più simili all'idea (per parole) vengono messi per primi nello storico.
export const SIMILAR_FIRST = 10;

const tokensOf = (body) => new Set([...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
const clean = (value) => (value === undefined || value === null ? '' : String(value).trim());

// Tipo di partenza proposto dai media dell'idea: video, poi foto, poi solo testo.
export function suggestKind(media) {
  if (media.some((m) => m.kind === 'video')) return 'video';
  if (media.some((m) => m.kind === 'foto')) return 'foto';
  return 'testo';
}

// Template del tipo e della lingua scelti: prima quello pronto, poi i propri (per nome).
export function templatesFor(custom, kind, lang) {
  const builtin = DEFAULT_TEMPLATES.filter((t) => t.kind === kind && t.lang === lang);
  const mine = custom
    .filter((t) => !t.builtin && t.kind === kind && t.lang === lang)
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  return [...builtin, ...mine];
}

// Campi del modulo che il template usa davvero.
export function neededFields(template, idea) {
  const tokens = tokensOf(template.body);
  const fields = FORM_FIELDS.filter((name) => tokens.has(name));
  return tokens.has('idea') && !clean(idea.text) ? ['idea', ...fields] : fields;
}

export function formatDurationValue(seconds) {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Valori di partenza per {descrizione_media} e {durata_video}: quelli scritti e misurati sui media dell'idea.
export function mediaValues(media) {
  const descriptions = media.map((m) => clean(m.description)).filter(Boolean);
  const durations = media
    .filter((m) => m.kind === 'video' && Number.isFinite(m.durationSec))
    .map((m) => formatDurationValue(m.durationSec));
  return { descrizione_media: descriptions.join('; '), durata_video: durations.join(', ') };
}

// Prompt completo. Lo storico contiene solo post della lingua dell'idea (i confronti non attraversano le
// lingue), con prima i più simili all'idea. I segnaposto senza valore restano visibili nel testo e si
// elencano in `unfilled` (solo quelli del template: eventuali graffe nel testo dell'idea non contano).
export function buildDevelopPrompt({ template, idea, media = [], form = {}, publications = [], styleGuide = '', historyMax = DEFAULT_HISTORY_MAX }) {
  const sameLang = publications.filter((pub) => pub.lang === idea.lang);
  const similarIds = clean(idea.text)
    ? findSimilar(idea.text, idea.lang, sameLang, { limit: SIMILAR_FIRST }).map((match) => match.publicationId)
    : [];
  const history = formatHistory(sameLang, { max: historyMax, similarIds });
  const fromMedia = mediaValues(media);
  const pick = (name) => (clean(form[name]) !== '' ? form[name] : (fromMedia[name] ?? ''));
  const values = {
    tono: pick('tono'),
    obiettivo: pick('obiettivo'),
    lunghezza: pick('lunghezza'),
    hashtag: pick('hashtag'),
    descrizione_media: pick('descrizione_media'),
    durata_video: pick('durata_video'),
    stile: styleGuide,
    idea: form.idea,
  };
  const { text, lang } = buildPrompt({ template, idea, values, history });
  const inBody = tokensOf(template.body);
  return {
    text,
    lang,
    unfilled: findUnfilled(text, {}).filter((name) => inBody.has(name)),
    historyCount: history ? history.split('\n').length : 0,
  };
}

// Salva il prompt generato e porta l'idea a «in sviluppo»; poi controlla per somiglianza il testo
// dell'idea (non quello del prompt: contiene lo storico e somiglierebbe sempre ai post). Se l'idea non
// si può salvare il prompt si toglie di nuovo (niente a metà); un controllo che fallisce non annulla nulla.
export async function saveGeneratedPrompt(store, { idea, template, text }) {
  const prompt = await store.save('prompts', {
    ideaId: idea.id,
    templateId: template.id,
    lang: idea.lang,
    text,
    createdAt: new Date().toISOString(),
  });
  let saved = idea;
  const next = markInDevelopment(idea);
  if (next.status !== idea.status) {
    try {
      saved = await store.save('ideas', next);
    } catch (err) {
      await store.remove('prompts', prompt.id).catch(() => {});
      throw err;
    }
  }
  let matches = [];
  let checkFailed = false;
  try {
    ({ matches } = await checkIdeaSimilarity(store, saved));
  } catch {
    checkFailed = true;
  }
  return { prompt, idea: saved, matches, checkFailed };
}

// File dell'idea pronti per la condivisione o lo ZIP (decifrati in memoria).
export async function loadMediaFiles(store, media) {
  const files = [];
  for (const item of media) {
    const blob = await store.loadBlob(item.blobId);
    files.push(new File([blob], item.name || 'file', { type: item.mime || blob.type }));
  }
  return files;
}

export function zipFileName(idea, now = new Date()) {
  const slug = foldText(idea.text ?? '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 4)
    .join('-')
    .slice(0, 40)
    .replace(/-+$/, '');
  return `nay-${slug || 'idea'}-${now.toISOString().slice(0, 10)}.zip`;
}

// Editor dei template: inserisce un segnaposto dove sta il cursore (o al posto della selezione).
export function insertAtCursor(text, start, end, token) {
  const from = Math.min(Math.max(0, start), text.length);
  const to = Math.min(Math.max(from, end), text.length);
  return { text: text.slice(0, from) + token + text.slice(to), caret: from + token.length };
}

// → null se va bene, altrimenti il campo da correggere.
export function validateTemplate({ name, body }) {
  if (!clean(name)) return 'name';
  if (!clean(body)) return 'body';
  return null;
}

export function newTemplate({ kind, lang, name = '', body = '' }) {
  if (!KINDS.includes(kind)) throw new RangeError(`Tipo non valido: ${kind}`);
  if (!LANGS.includes(lang)) throw new RangeError(`Lingua non supportata: ${lang}`);
  return { id: globalThis.crypto.randomUUID(), name, kind, lang, body, builtin: false };
}

// Un template pronto non si modifica: si lavora su una copia con un altro nome.
export function copyOfTemplate(template, name) {
  return { ...duplicateTemplate(template), name };
}

export async function saveTemplate(store, template) {
  if (template.builtin) throw new TypeError('Un template pronto non si salva: va copiato');
  return store.save('templates', template);
}

export async function deleteTemplate(store, template) {
  if (template.builtin) throw new TypeError('Un template pronto non si elimina');
  return store.remove('templates', template.id);
}

// Ultimi valori del modulo e guida di stile: record cifrati nell'archivio `meta`.
const VALUES_ID = 'develop:values';
const STYLE_ID = 'develop:style';
const TEXT_FIELDS = ['tono', 'obiettivo', 'lunghezza', 'hashtag'];

function cleanValues(raw = {}) {
  const values = {};
  for (const name of TEXT_FIELDS) values[name] = typeof raw[name] === 'string' ? raw[name] : '';
  values.historyMax = Number.isInteger(raw.historyMax) && raw.historyMax > 0 ? raw.historyMax : DEFAULT_HISTORY_MAX;
  return values;
}

export async function loadFormValues(store) {
  return cleanValues((await store.load('meta', VALUES_ID)) ?? {});
}

export async function saveFormValues(store, values) {
  await store.save('meta', { id: VALUES_ID, ...cleanValues(values) });
}

export async function loadStyleGuide(store) {
  const record = await store.load('meta', STYLE_ID);
  return typeof record?.text === 'string' ? record.text : '';
}

export async function saveStyleGuide(store, text) {
  await store.save('meta', { id: STYLE_ID, text: String(text ?? '') });
}
