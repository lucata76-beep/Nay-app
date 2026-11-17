// Registro delle ripetizioni: una voce per coppia (testo controllato, pubblicazione trovata).
import { findSimilar } from './similarity.js';
import { foldText } from './text.js';

const STORE = 'repetitions';
const STATUSES = ['da_valutare', 'confermata', 'falso_allarme'];

// Chiave della coppia, senza ambiguità tra i pezzi. Per due pubblicazioni l'ordine non conta:
// controllare A contro B o B contro A è la stessa coppia.
export function pairKey(sourceType, sourceId, publicationId) {
  const parts = sourceType === 'publication' ? [sourceId, publicationId].sort() : [sourceId, publicationId];
  return JSON.stringify([sourceType, ...parts]);
}

// Registra le corrispondenze trovate per un testo (idea, prompt o post). Restituisce solo le
// voci nuove: una coppia già presente non si duplica e, se era stata segnata «falso allarme»,
// non viene segnalata di nuovo né cambia stato.
export async function registerMatches(store, { sourceType, sourceId }, matches) {
  if (matches.length === 0) return [];
  const known = new Set((await store.all(STORE)).map((rep) => rep.pairKey));
  const created = [];
  for (const match of matches) {
    const key = pairKey(sourceType, sourceId, match.publicationId);
    if (known.has(key)) continue;
    known.add(key);
    created.push(
      await store.save(STORE, {
        pairKey: key,
        sourceType,
        sourceId,
        publicationId: match.publicationId,
        score: match.score,
        sharedWords: [...match.sharedWords],
        status: 'da_valutare',
        checkedAt: new Date().toISOString(),
      }),
    );
  }
  return created;
}

// Confronta un post nuovo con quelli già presenti (non con sé stesso) e registra ciò che trova.
export async function checkNewPublication(store, pub, existing) {
  const others = existing.filter((other) => other.id !== pub.id);
  const matches = findSimilar(`${pub.title ?? ''} ${pub.description ?? ''}`, pub.lang, others);
  return registerMatches(store, { sourceType: 'publication', sourceId: pub.id }, matches);
}

export async function setStatus(store, id, status) {
  if (!STATUSES.includes(status)) throw new RangeError(`Stato non valido: ${status}`);
  const rep = await store.load(STORE, id);
  if (!rep) throw new Error(`Voce del registro non trovata: ${id}`);
  return store.save(STORE, { ...rep, status });
}

// Un valore «solo data» (2026-02-20) vale per tutto il giorno, in UTC; un orario completo
// o un oggetto Date valgono per quel preciso istante.
function boundary(value, isEnd) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Date.parse(`${value}${isEnd ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`);
  }
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  if (Number.isNaN(time)) throw new RangeError(`Data non valida: ${value}`);
  return time;
}

// Filtra per data del controllo (`checkedAt`) e per parola (tra le parole in comune,
// senza badare a maiuscole e accenti; servono tutte le parole cercate).
export function searchRepetitions(reps, { from, to, query } = {}) {
  const start = boundary(from, false);
  const end = boundary(to, true);
  const words = foldText(query).split(/\s+/).filter(Boolean);
  return reps.filter((rep) => {
    const time = Date.parse(rep.checkedAt);
    if (start !== null && !(time >= start)) return false;
    if (end !== null && !(time <= end)) return false;
    if (words.length === 0) return true;
    const shared = rep.sharedWords.map(foldText);
    return words.every((word) => shared.some((candidate) => candidate.includes(word)));
  });
}
