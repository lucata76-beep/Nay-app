// Nome della cache del service worker e regola per cancellare quelle vecchie.
// Separato da sw.js per poterlo provare con i test.
const PREFIX = 'nay-';
const OWN_CACHE = /^nay-\d+\.\d+\.\d+$/;

export function cacheName(version) {
  return `${PREFIX}${version}`;
}

// Cache da cancellare all'attivazione: solo quelle col nome delle nostre (nay-<versione>) e
// di un'altra versione. Su github.io l'origine è condivisa con gli altri progetti dello stesso
// utente: una cache con un altro nome non è nostra e non si tocca.
export function staleCaches(names, version) {
  const current = cacheName(version);
  return names.filter((name) => OWN_CACHE.test(name) && name !== current);
}
