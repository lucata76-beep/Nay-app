// Pubblicazioni salvate e registro delle ripetizioni (T14): salvataggio veloce con lo screenshot,
// modifica, eliminazione, filtri, e le funzioni che preparano le voci del registro per la pagina.
// Come in idea-save.js, le scritture multiple (blob → Media → pubblicazione → idea) sono tutto o niente.
import { linkToPublication } from './ideas.js';
import { removeMedia, saveMedia, withRollback } from './idea-save.js';
import { checkNewPublication } from './repetitions.js';
import { tokenize } from './similarity.js';
import { foldText } from './text.js';

export const TYPES = ['foto', 'video', 'testo'];
const LANGS = ['es', 'it'];
const OPTIONAL = ['views', 'comments', 'note', 'ideaId'];
const FIELDS = ['title', 'description', 'type', 'lang', 'publishedAt', ...OPTIONAL];

// Un dato del modulo non valido: `field` dice quale (per mostrare il messaggio vicino al campo).
export class PublicationInputError extends Error {
  constructor(field) {
    super(`Dato non valido: ${field}`);
    this.name = 'PublicationInputError';
    this.field = field;
  }
}

const text = (value) => (typeof value === 'string' ? value.trim() : '');

function count(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number.parseInt(value.trim(), 10);
  throw new PublicationInputError(field);
}

// Titolo e descrizione obbligatori; tipo `foto`, lingua `es` e data «adesso» se mancano;
// visualizzazioni, commenti (0 è un dato vero), nota e idea collegata facoltativi.
export function normalizePublicationInput(input, { requireScreenshot }) {
  const title = text(input.title);
  const description = text(input.description);
  if (!title) throw new PublicationInputError('title');
  if (!description) throw new PublicationInputError('description');
  const screenshot = input.screenshot;
  if (screenshot) {
    if (!screenshot.blob || !String(screenshot.blob.type).startsWith('image/')) throw new PublicationInputError('screenshot');
  } else if (requireScreenshot) {
    throw new PublicationInputError('screenshot');
  }
  const type = input.type ?? 'foto';
  if (!TYPES.includes(type)) throw new PublicationInputError('type');
  const lang = input.lang ?? 'es';
  if (!LANGS.includes(lang)) throw new PublicationInputError('lang');
  const when = input.publishedAt === undefined || input.publishedAt === '' ? new Date().toISOString() : input.publishedAt;
  if (Number.isNaN(Date.parse(when))) throw new PublicationInputError('publishedAt');
  const clean = { title, description, type, lang, publishedAt: new Date(when).toISOString() };
  const views = count(input.views, 'views');
  const comments = count(input.comments, 'comments');
  if (views !== undefined) clean.views = views;
  if (comments !== undefined) clean.comments = comments;
  if (text(input.note)) clean.note = text(input.note);
  if (text(input.ideaId)) clean.ideaId = text(input.ideaId);
  if (screenshot) clean.screenshot = screenshot;
  return clean;
}

// Nuova pubblicazione. Poi il confronto con le precedenti: le voci nuove entrano nel registro da sole.
// Un confronto che fallisce non annulla la pubblicazione (checkFailed).
export async function savePublication(store, input) {
  const clean = normalizePublicationInput(input, { requireScreenshot: true });
  const existing = await store.all('publications');
  let idea = null;
  if (clean.ideaId) {
    idea = await store.load('ideas', clean.ideaId);
    if (!idea) throw new PublicationInputError('ideaId');
  }
  const { screenshot, ...fields } = clean;
  const saved = await withRollback(store, async (created) => {
    const [media] = await saveMedia(store, [screenshot], created);
    const publication = await store.save('publications', { ...fields, screenshotMediaId: media.id });
    created.publicationIds.push(publication.id);
    if (idea) await store.save('ideas', linkToPublication(idea, publication.id));
    return { publication, media };
  });
  return { ...saved, ...(await compare(store, saved.publication, existing)) };
}

async function compare(store, publication, existing) {
  try {
    return { created: await checkNewPublication(store, publication, existing), checkFailed: false };
  } catch {
    return { created: [], checkFailed: true };
  }
}

// Modifica. `changes` si sovrappone ai campi attuali (una stringa vuota toglie un dato facoltativo);
// `screenshot` (facoltativo) sostituisce lo screenshot. Il vecchio screenshot si toglie solo a salvataggio riuscito.
export async function updatePublication(store, publication, changes = {}) {
  const current = Object.fromEntries(FIELDS.filter((key) => publication[key] !== undefined).map((key) => [key, publication[key]]));
  const clean = normalizePublicationInput({ ...current, ...changes }, { requireScreenshot: false });
  const existing = (await store.all('publications')).filter((other) => other.id !== publication.id);
  let newIdea = null;
  let oldIdea = null;
  if (clean.ideaId && clean.ideaId !== publication.ideaId) {
    newIdea = await store.load('ideas', clean.ideaId);
    if (!newIdea) throw new PublicationInputError('ideaId');
  }
  if (publication.ideaId && publication.ideaId !== clean.ideaId) oldIdea = await store.load('ideas', publication.ideaId);
  const textChanged = clean.title !== publication.title || clean.description !== publication.description || clean.lang !== publication.lang;
  const { screenshot, ...fields } = clean;

  const saved = await withRollback(store, async (created) => {
    let screenshotMediaId = publication.screenshotMediaId;
    if (screenshot) [{ id: screenshotMediaId }] = await saveMedia(store, [screenshot], created);
    if (newIdea) {
      created.restore.push({ store: 'ideas', record: newIdea });
      await store.save('ideas', linkToPublication(newIdea, publication.id));
    }
    if (oldIdea) {
      const { publicationId, ...rest } = oldIdea; // eslint-disable-line no-unused-vars
      created.restore.push({ store: 'ideas', record: oldIdea });
      await store.save('ideas', rest);
    }
    const base = { ...publication };
    for (const key of OPTIONAL) delete base[key];
    // la pubblicazione si salva per ultima: se fallisce non è cambiata, restano da rimettere solo le idee
    return store.save('publications', { ...base, ...fields, screenshotMediaId });
  });

  let leftovers = 0;
  if (screenshot && publication.screenshotMediaId) leftovers += (await removeMedia(store, publication.screenshotMediaId)).length;
  const check = textChanged ? await compare(store, saved, existing) : { created: [], checkFailed: false };
  return { publication: saved, leftovers, ...check };
}

// Elimina una pubblicazione, il suo screenshot, le voci del registro che la riguardano e il collegamento
// dell'idea (lo stato dell'idea non cambia: si corregge a mano in Ideare). Prima la pubblicazione.
export async function deletePublication(store, publication) {
  await store.remove('publications', publication.id);
  let leftovers = 0;
  if (publication.screenshotMediaId) leftovers += (await removeMedia(store, publication.screenshotMediaId)).length;
  try {
    for (const rep of await store.all('repetitions')) {
      if (rep.publicationId === publication.id || (rep.sourceType === 'publication' && rep.sourceId === publication.id)) {
        await store.remove('repetitions', rep.id);
      }
    }
    for (const idea of await store.all('ideas')) {
      if (idea.publicationId !== publication.id) continue;
      const { publicationId, ...rest } = idea; // eslint-disable-line no-unused-vars
      await store.save('ideas', rest);
    }
  } catch (err) {
    console.error(err);
    leftovers++;
  }
  return { leftovers };
}

// ---------- date: i giorni scelti nei campi data sono giorni del telefono (non UTC) ----------
const pad = (n) => String(n).padStart(2, '0');

export function toLocalInputValue(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value ?? '');
  if (!m) return undefined;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Da «2026-03-10» e «2026-03-20» (giorni locali) a due istanti che coprono i giorni interi.
export function dayRange(fromDay, toDay) {
  const parse = (day, end) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? '');
    if (!m) return undefined;
    const date = end ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999) : new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  };
  return { from: parse(fromDay, false), to: parse(toDay, true) };
}

function inRange(iso, { from, to }) {
  const time = Date.parse(iso);
  if (from !== undefined && !(time >= Date.parse(from))) return false;
  if (to !== undefined && !(time <= Date.parse(to))) return false;
  return true;
}

// Elenco delle pubblicazioni: filtri per giorno e tipo, dalla più recente. Non cambia l'elenco ricevuto.
export function filterPublications(pubs, { from, to, type } = {}) {
  const range = dayRange(from, to);
  return pubs
    .filter((pub) => (!type || pub.type === type) && inRange(pub.publishedAt, range))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

// ---------- registro ----------
// Unisce a ogni voce la pubblicazione trovata (titolo, data, screenshot) e il testo controllato
// (idea, prompt o post), dal controllo più recente. Una fonte o una pubblicazione cancellate restano null.
export function enrichRepetitions(reps, { publications = [], ideas = [], prompts = [] } = {}) {
  const pubs = new Map(publications.map((pub) => [pub.id, pub]));
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea]));
  const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  const sourceOf = (rep) => {
    if (rep.sourceType === 'idea') {
      const idea = ideaById.get(rep.sourceId);
      return idea ? { type: 'idea', text: idea.text ?? '', lang: idea.lang } : null;
    }
    if (rep.sourceType === 'prompt') {
      const prompt = promptById.get(rep.sourceId);
      return prompt ? { type: 'prompt', text: prompt.text ?? '', lang: prompt.lang } : null;
    }
    const pub = pubs.get(rep.sourceId);
    return pub ? { type: 'publication', text: `${pub.title}\n${pub.description}`.trimEnd(), lang: pub.lang } : null;
  };
  return reps
    .map((rep) => {
      const publication = pubs.get(rep.publicationId) ?? null;
      const source = sourceOf(rep);
      return { rep, publication, source, lang: source?.lang ?? publication?.lang ?? 'es' };
    })
    .sort((a, b) => Date.parse(b.rep.checkedAt) - Date.parse(a.rep.checkedAt));
}

// Filtri del registro: data del controllo, data della pubblicazione trovata (una voce senza pubblicazione
// non passa un filtro per data), stato, e parola (servono tutte le parole, senza badare a maiuscole e accenti,
// tra parole in comune, testo controllato e titolo e descrizione della pubblicazione trovata).
export function filterRegistry(entries, { checkFrom, checkTo, pubFrom, pubTo, status, query } = {}) {
  const check = dayRange(checkFrom, checkTo);
  const found = dayRange(pubFrom, pubTo);
  const words = foldText(query ?? '').split(/\s+/).filter(Boolean);
  const foundFiltered = found.from !== undefined || found.to !== undefined;
  return entries.filter((entry) => {
    if (status && entry.rep.status !== status) return false;
    if (!inRange(entry.rep.checkedAt, check)) return false;
    if (foundFiltered && (!entry.publication || !inRange(entry.publication.publishedAt, found))) return false;
    if (words.length === 0) return true;
    const haystack = foldText(
      [...(entry.rep.sharedWords ?? []), entry.publication?.title, entry.publication?.description, entry.source?.text].filter(Boolean).join(' '),
    );
    return words.every((word) => haystack.includes(word));
  });
}

// Divide un testo in pezzi, marcando le parole che hanno la stessa radice di una parola in comune
// (così «cuori» si evidenzia anche se la parola in comune è «cuore»). Il testo non cambia.
export function highlightParts(source, sharedWords, lang) {
  if (!source) return [];
  const stems = new Set(sharedWords.flatMap((word) => tokenize(word, lang)));
  if (stems.size === 0) return [{ text: source, match: false }];
  return source
    .split(/(\p{L}+)/u)
    .filter((piece) => piece !== '')
    .map((piece) => ({ text: piece, match: /^\p{L}+$/u.test(piece) && tokenize(piece, lang).some((stem) => stems.has(stem)) }));
}

export function reviewCount(reps) {
  return reps.filter((rep) => rep.status === 'da_valutare').length;
}
