// Prototipo di prova (usa e getta): formato dei risultati da incollare in chat.
// Una riga per esito: id | OK/KO/? | ms | details

function label(ok) {
  if (ok === true) return 'OK';
  if (ok === false) return 'KO';
  return '?';
}

function formatMs(ms) {
  return ms == null ? '-' : String(Math.round(ms * 10) / 10);
}

function oneLine(text) {
  return String(text).replace(/\s*[\r\n]+\s*/g, ' ');
}

export function formatResults(results) {
  return results
    .map((r) => `${r.id} | ${label(r.ok)} | ${formatMs(r.ms)} | ${oneLine(r.details)}`)
    .join('\n');
}
