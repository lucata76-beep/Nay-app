// Template di prompt. I corpi dei template pronti sono testo per l'IA (spagnolo e italiano):
// li scrive Claude, li rivede lei (spagnolo) e Luca (italiano) in T19; da tarare nel test con lei.
export const PLACEHOLDERS = [
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
];

// Nome della lingua del post scritto nella lingua del template: LANGUAGE_NAMES[lingua del template][lingua del post].
export const LANGUAGE_NAMES = {
  es: { es: 'español', it: 'italiano' },
  it: { es: 'spagnolo', it: 'italiano' },
};

// {tipo_media} di partenza, secondo il tipo di template e la sua lingua.
export const MEDIA_LABELS = {
  es: { foto: 'foto', video: 'vídeo', testo: 'solo texto', frase: 'foto o vídeo' },
  it: { foto: 'foto', video: 'video', testo: 'solo testo', frase: 'foto o video' },
};

// Riga neutra per {storico} quando non ci sono ancora pubblicazioni.
export const EMPTY_HISTORY = {
  es: '(Todavía no hay publicaciones guardadas.)',
  it: '(Non ci sono ancora pubblicazioni salvate.)',
};

const COMMON_ES = `Tono: {tono}
Objetivo: {obiettivo}
Longitud de la caption: {lunghezza}
Hashtags: {hashtag}
Escribe todo en {lingua}.

Guía de estilo que debes seguir:
{stile}

Publicaciones anteriores de la página. No repitas sus ideas, frases ni estructuras, y mantén el mismo estilo:
{storico}`;

const COMMON_IT = `Tono: {tono}
Obiettivo: {obiettivo}
Lunghezza della caption: {lunghezza}
Hashtag: {hashtag}
Scrivi tutto in {lingua}.

Guida di stile da seguire:
{stile}

Pubblicazioni precedenti della pagina. Non ripetere le loro idee, frasi o strutture e mantieni lo stesso stile:
{storico}`;

const ROLE_ES = 'Actúa como especialista en redacción de contenido motivacional y de estilo de vida para una página de Facebook.';
const ROLE_IT = 'Agisci come specialista nella scrittura di contenuti motivazionali e di stile di vita per una pagina Facebook.';

const BODIES = {
  foto: {
    es: `${ROLE_ES}

Parto de una {tipo_media}. Lo que se ve: {descrizione_media}
Idea o contexto: {idea}

${COMMON_ES}

Dame dos respuestas separadas, cada una con varias variantes para que yo elija:
1) HOOK: 5 variantes de un hook muy breve (máximo 8 palabras), pensado para escribirlo encima de la foto.
2) CAPTION: 3 variantes de caption para acompañar la publicación.`,
    it: `${ROLE_IT}

Parto da una {tipo_media}. Cosa si vede: {descrizione_media}
Idea o contesto: {idea}

${COMMON_IT}

Dammi due risposte separate, ognuna con più varianti tra cui scegliere:
1) HOOK: 5 varianti di un hook brevissimo (massimo 8 parole), pensato per essere scritto sopra la foto.
2) CAPTION: 3 varianti di caption per accompagnare il post.`,
  },
  video: {
    es: `${ROLE_ES}

Parto de un {tipo_media} de {durata_video}. Lo que se ve y se oye: {descrizione_media}
Idea o contexto: {idea}

${COMMON_ES}

Dame dos respuestas separadas, cada una con varias variantes para que yo elija:
1) HOOK: 5 variantes de un hook breve (máximo 8 palabras), para los primeros segundos del vídeo o para escribirlo en pantalla.
2) CAPTION: 3 variantes de caption para acompañar la publicación.`,
    it: `${ROLE_IT}

Parto da un {tipo_media} di {durata_video}. Cosa si vede e si sente: {descrizione_media}
Idea o contesto: {idea}

${COMMON_IT}

Dammi due risposte separate, ognuna con più varianti tra cui scegliere:
1) HOOK: 5 varianti di un hook breve (massimo 8 parole), per i primi secondi del video o da scrivere sullo schermo.
2) CAPTION: 3 varianti di caption per accompagnare il post.`,
  },
  testo: {
    es: `${ROLE_ES}

Esta publicación es solo texto, sin foto ni vídeo.
Idea o contexto: {idea}

${COMMON_ES}

Dame dos respuestas separadas, cada una con varias variantes para que yo elija:
1) HOOK: 5 variantes de la primera línea (máximo 12 palabras), que invite a seguir leyendo.
2) CAPTION: 3 variantes del texto completo de la publicación.`,
    it: `${ROLE_IT}

Questo post è solo testo, senza foto né video.
Idea o contesto: {idea}

${COMMON_IT}

Dammi due risposte separate, ognuna con più varianti tra cui scegliere:
1) HOOK: 5 varianti della prima riga (massimo 12 parole), che invogli a continuare a leggere.
2) CAPTION: 3 varianti del testo completo del post.`,
  },
  frase: {
    es: `${ROLE_ES}

Ya tengo la frase de la publicación: {idea}
Quiero acompañarla con {tipo_media}.

${COMMON_ES}

Dame tres respuestas separadas, cada una con varias variantes para que yo elija:
1) IDEAS DE IMAGEN: 5 ideas de foto o de vídeo que acompañen la frase (qué se ve, ambiente, luz).
2) HOOK: 5 variantes de un hook muy breve (máximo 8 palabras), para escribirlo encima de la imagen elegida.
3) CAPTION: 3 variantes de caption para acompañar la publicación.`,
    it: `${ROLE_IT}

Ho già la frase del post: {idea}
Voglio abbinarla a {tipo_media}.

${COMMON_IT}

Dammi tre risposte separate, ognuna con più varianti tra cui scegliere:
1) IDEE PER L'IMMAGINE: 5 idee di foto o di video che accompagnino la frase (cosa si vede, atmosfera, luce).
2) HOOK: 5 varianti di un hook brevissimo (massimo 8 parole), da scrivere sopra l'immagine scelta.
3) CAPTION: 3 varianti di caption per accompagnare il post.`,
  },
};

const NAMES = {
  foto: { es: 'Foto → frase', it: 'Foto → frase' },
  video: { es: 'Vídeo → frase', it: 'Video → frase' },
  testo: { es: 'Solo texto', it: 'Solo testo' },
  frase: { es: 'Frase → ideas para foto o vídeo', it: 'Frase → idee per foto o video' },
};

export const DEFAULT_TEMPLATES = ['foto', 'video', 'testo', 'frase'].flatMap((kind) =>
  ['es', 'it'].map((lang) => ({
    id: `builtin-${kind}-${lang}`,
    name: NAMES[kind][lang],
    kind,
    lang,
    body: BODIES[kind][lang],
    builtin: true,
  })),
);

// Un segnaposto è «riempito» se ha un valore che non è vuoto né fatto di soli spazi.
function isFilled(values, name) {
  if (!Object.hasOwn(values, name)) return false;
  const value = values[name];
  return value !== undefined && value !== null && String(value).trim() !== '';
}

// Sostituisce tutte le occorrenze dei segnaposto che hanno un valore (valori letterali, in un solo
// passaggio: un valore che contiene {tono} non viene espanso di nuovo). Gli altri restano com'erano.
export function renderTemplate(body, values) {
  return body.replace(/\{(\w+)\}/g, (whole, name) => (isFilled(values, name) ? String(values[name]) : whole));
}

// Segnaposto presenti nel testo che non hanno un valore, senza ripetizioni, nell'ordine in cui compaiono.
export function findUnfilled(body, values) {
  const missing = [];
  for (const [, name] of body.matchAll(/\{(\w+)\}/g)) {
    if (!isFilled(values, name) && !missing.includes(name)) missing.push(name);
  }
  return missing;
}

export function duplicateTemplate(template) {
  return { ...template, id: globalThis.crypto.randomUUID(), builtin: false };
}
