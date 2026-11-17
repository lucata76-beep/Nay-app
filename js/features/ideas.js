// Idee: funzioni pure. Restituiscono sempre un nuovo oggetto, non modificano quello ricevuto.
import { foldText } from './text.js';

const LANGS = ['es', 'it'];

export class EmptyIdeaError extends Error {
  constructor() {
    super('Un’idea deve avere almeno un testo o un media');
    this.name = 'EmptyIdeaError';
  }
}

export function createIdea({ text, mediaIds, lang } = {}) {
  const cleanText = typeof text === 'string' ? text.trim() : '';
  if (mediaIds !== undefined && !Array.isArray(mediaIds)) throw new TypeError('mediaIds deve essere un elenco');
  const ids = mediaIds ? [...mediaIds] : [];
  if (!cleanText && ids.length === 0) throw new EmptyIdeaError();
  const language = lang === undefined ? 'es' : lang;
  if (!LANGS.includes(language)) throw new RangeError(`Lingua non supportata: ${language}`);
  const now = new Date().toISOString();
  return {
    id: globalThis.crypto.randomUUID(),
    text: cleanText,
    mediaIds: ids,
    lang: language,
    status: 'nuova',
    createdAt: now,
    updatedAt: now,
  };
}

// «in sviluppo» quando si genera un prompt. Un'idea già pubblicata non torna indietro.
export function markInDevelopment(idea) {
  if (idea.status === 'pubblicata') return { ...idea };
  return { ...idea, status: 'in_sviluppo', updatedAt: new Date().toISOString() };
}

// «pubblicata» quando l'idea viene collegata a una pubblicazione.
export function linkToPublication(idea, publicationId) {
  if (typeof publicationId !== 'string' || publicationId === '') throw new TypeError('publicationId non valido');
  return { ...idea, status: 'pubblicata', publicationId, updatedAt: new Date().toISOString() };
}

// Ricerca per parola: ogni parola cercata deve comparire nel testo, senza badare a maiuscole e accenti.
export function searchIdeas(ideas, query) {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...ideas];
  return ideas.filter((idea) => {
    const text = foldText(idea.text);
    return words.every((word) => text.includes(word));
  });
}
