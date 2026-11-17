import { renderTemplate, LANGUAGE_NAMES, MEDIA_LABELS, EMPTY_HISTORY } from './templates.js';

function oneLine(text) {
  return String(text ?? '').replace(/\s*[\r\n]+\s*/g, ' ').trim();
}

// Storico per il segnaposto {storico}: prima i post più simili (nell'ordine di similarIds),
// poi i più recenti, senza ripetizioni e per un massimo di `max` righe.
export function formatHistory(pubs, { max, similarIds = [] } = {}) {
  const limit = Math.floor(max);
  if (!(limit > 0)) return '';
  const byId = new Map(pubs.map((pub) => [pub.id, pub]));
  const chosen = [];
  const seen = new Set();
  for (const id of similarIds) {
    if (chosen.length >= limit) break;
    const pub = byId.get(id);
    if (pub && !seen.has(id)) {
      seen.add(id);
      chosen.push(pub);
    }
  }
  const recent = pubs
    .filter((pub) => !seen.has(pub.id))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  for (const pub of recent) {
    if (chosen.length >= limit) break;
    chosen.push(pub);
  }
  return chosen
    .map((pub) => {
      const description = oneLine(pub.description);
      return description ? `- ${oneLine(pub.title)}: ${description}` : `- ${oneLine(pub.title)}`;
    })
    .join('\n');
}

// idea, storico e lingua vengono sempre dall'idea e dallo storico (non da `values`);
// se l'idea non ha testo (solo media) vale il testo scritto nel modulo. I segnaposto del
// modulo rimasti vuoti restano visibili nel testo, così si possono segnalare.
export function buildPrompt({ template, idea, values = {}, history = '' }) {
  const ideaText = idea.text && idea.text.trim() ? idea.text : values.idea;
  const merged = {
    tipo_media: MEDIA_LABELS[template.lang][template.kind],
    ...values,
    idea: ideaText,
    storico: history && history.trim() ? history : EMPTY_HISTORY[template.lang],
    lingua: LANGUAGE_NAMES[template.lang][idea.lang],
  };
  return { text: renderTemplate(template.body, merged), lang: idea.lang };
}
