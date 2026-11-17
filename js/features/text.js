// Confronto di testi senza badare a maiuscole e accenti: minuscole e senza segni diacritici
// («Ánimo» e «animo» sono la stessa parola; anche «ñ» vale «n»). Passa da NFD, così la stessa
// lettera digitata come carattere unico o come lettera + accento si confronta uguale.
export function foldText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}
