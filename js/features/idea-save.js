// Salvataggio di idee con foto e video (pagina Ideare, T12).
//
// Un'idea con file è fatta di più scritture: blob → record Media → record Idea. T5 non le rende
// atomiche insieme: se una fallisce (anche StorageFullError dopo saveBlob) qui si cancella ciò che
// si era già scritto, così non restano né blob né media né idee a metà.
import { EmptyIdeaError, createIdea } from './ideas.js';
import { findSimilar } from './similarity.js';
import { registerMatches } from './repetitions.js';

const LANGS = ['es', 'it'];
const STATUSES = ['nuova', 'in_sviluppo', 'pubblicata'];

export class UnsupportedMediaError extends Error {
  constructor(files) {
    super(`Tipo di file non supportato: ${files.join(', ')}`);
    this.name = 'UnsupportedMediaError';
    this.files = files;
  }
}

export function mediaKind(mime) {
  if (typeof mime !== 'string') return null;
  if (mime.startsWith('image/')) return 'foto';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

const nameOf = (file) => file.name ?? file.blob.name ?? '';

// Scrive blob e record Media dei file; ciò che crea lo annota in `created` per poterlo annullare.
export async function saveMedia(store, files, created) {
  const unsupported = files.filter((file) => mediaKind(file.blob.type) === null);
  if (unsupported.length > 0) throw new UnsupportedMediaError(unsupported.map(nameOf));
  const saved = [];
  for (const file of files) {
    const blobId = await store.saveBlob(file.blob);
    created.blobIds.push(blobId);
    const media = await store.save('media', {
      kind: mediaKind(file.blob.type),
      mime: file.blob.type,
      name: nameOf(file),
      size: file.blob.size,
      ...(Number.isFinite(file.durationSec) ? { durationSec: file.durationSec } : {}),
      description: file.description ?? '',
      blobId,
    });
    created.mediaIds.push(media.id);
    saved.push(media);
  }
  return saved;
}

// Cancella ciò che è stato scritto. Un errore nella pulizia non nasconde l'errore vero:
// si raccoglie e lo si allega a quello.
async function rollback(store, created) {
  const failures = [];
  for (const id of created.publicationIds ?? []) {
    try {
      await store.remove('publications', id);
    } catch (err) {
      failures.push(err);
    }
  }
  for (const id of created.mediaIds) {
    try {
      await store.remove('media', id);
    } catch (err) {
      failures.push(err);
    }
  }
  for (const id of created.blobIds) {
    try {
      await store.remove('blobs', id);
    } catch (err) {
      failures.push(err);
    }
  }
  // record modificati prima del guasto: si rimettono com'erano ({store, record})
  for (const { store: name, record } of created.restore) {
    try {
      await store.save(name, record);
    } catch (err) {
      failures.push(err);
    }
  }
  return failures;
}

export async function withRollback(store, operation) {
  const created = { blobIds: [], mediaIds: [], publicationIds: [], restore: [] };
  try {
    return await operation(created);
  } catch (err) {
    const failures = await rollback(store, created);
    if (failures.length > 0 && err && typeof err === 'object') err.rollbackFailures = failures;
    throw err;
  }
}

// Nuova idea con i suoi file, tutto o niente.
export async function createIdeaWithMedia(store, { text, lang, files = [] } = {}) {
  // validazione prima di scrivere qualsiasi cosa (testo e lingua)
  const checked = createIdea({ text, lang, mediaIds: files.map((_, i) => `in-attesa-${i}`) });
  return withRollback(store, async (created) => {
    const media = await saveMedia(store, files, created);
    const idea = await store.save('ideas', { ...checked, mediaIds: media.map((m) => m.id) });
    return { idea, media };
  });
}

// Modifica un'idea: testo, lingua, stato, descrizioni, file aggiunti e tolti.
// Ordine: file nuovi → descrizioni → idea; solo a idea salvata si cancellano i media tolti
// (se il salvataggio fallisce l'idea resta com'era, con tutti i suoi media).
export async function updateIdeaWithMedia(store, idea, { text, lang, status, addFiles = [], removeMediaIds = [], descriptions = {} } = {}) {
  const nextLang = lang ?? idea.lang;
  const nextStatus = status ?? idea.status;
  if (!LANGS.includes(nextLang)) throw new RangeError(`Lingua non supportata: ${nextLang}`);
  if (!STATUSES.includes(nextStatus)) throw new RangeError(`Stato non valido: ${nextStatus}`);
  const nextText = typeof (text ?? idea.text) === 'string' ? (text ?? idea.text).trim() : '';
  const removing = new Set(removeMediaIds.filter((id) => idea.mediaIds.includes(id)));
  const kept = idea.mediaIds.filter((id) => !removing.has(id));
  if (!nextText && kept.length + addFiles.length === 0) throw new EmptyIdeaError();

  const outcome = await withRollback(store, async (created) => {
    const added = await saveMedia(store, addFiles, created);
    for (const [id, description] of Object.entries(descriptions)) {
      if (!kept.includes(id)) continue;
      const current = await store.load('media', id);
      if (current && current.description !== description) {
        created.restore.push({ store: 'media', record: current });
        await store.save('media', { ...current, description });
      }
    }
    const saved = await store.save('ideas', {
      ...idea,
      text: nextText,
      lang: nextLang,
      status: nextStatus,
      mediaIds: [...kept, ...added.map((m) => m.id)],
    });
    return { idea: saved };
  });

  // idea salvata: ora si tolgono i media scartati (se qualcosa va storto resta spazio sprecato, non dati rotti)
  let leftovers = 0;
  for (const id of removing) leftovers += (await removeMedia(store, id)).length;
  return { ...outcome, removed: removing.size, leftovers };
}

// Toglie un record Media e il suo blob. Restituisce gli errori incontrati (la pulizia prosegue).
export async function removeMedia(store, mediaId) {
  const failures = [];
  let blobId = null;
  try {
    blobId = (await store.load('media', mediaId))?.blobId ?? null;
  } catch (err) {
    failures.push(err);
  }
  for (const [name, id] of [
    ['blobs', blobId],
    ['media', mediaId],
  ]) {
    if (id === null) continue;
    try {
      await store.remove(name, id);
    } catch (err) {
      failures.push(err);
    }
  }
  return failures;
}

// Elimina un'idea con i suoi file, i prompt generati da essa e le voci del registro che la riguardano.
// Prima l'idea: se qualcosa si interrompe restano al massimo dati senza padrone (spazio sprecato),
// mai un'idea con file mancanti.
export async function deleteIdea(store, idea) {
  await store.remove('ideas', idea.id);
  let leftovers = 0;
  for (const id of idea.mediaIds) leftovers += (await removeMedia(store, id)).length;
  try {
    const prompts = (await store.all('prompts')).filter((prompt) => prompt.ideaId === idea.id);
    const promptIds = new Set(prompts.map((prompt) => prompt.id));
    for (const prompt of prompts) await store.remove('prompts', prompt.id);
    for (const rep of await store.all('repetitions')) {
      const ofIdea = rep.sourceType === 'idea' && rep.sourceId === idea.id;
      const ofPrompt = rep.sourceType === 'prompt' && promptIds.has(rep.sourceId);
      if (ofIdea || ofPrompt) await store.remove('repetitions', rep.id);
    }
  } catch (err) {
    console.error(err);
    leftovers++;
  }
  return { leftovers };
}

// Controllo di somiglianza dopo il salvataggio. Restituisce tutte le pubblicazioni simili (per
// l'avviso) e le voci nuove entrate nel registro (una coppia già vista non si duplica).
export async function checkIdeaSimilarity(store, idea) {
  if (!idea.text) return { matches: [], created: [] };
  const publications = await store.all('publications');
  const found = findSimilar(idea.text, idea.lang, publications);
  const created = await registerMatches(store, { sourceType: 'idea', sourceId: idea.id }, found);
  const byId = new Map(publications.map((pub) => [pub.id, pub]));
  return { matches: found.map((match) => ({ ...match, publication: byId.get(match.publicationId) })), created };
}
