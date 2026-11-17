// Bozza di un modulo (idea, template, ...): si salva cifrata dopo una pausa nella digitazione e
// subito quando l'app va in secondo piano, prima di cambiare pagina e prima del blocco.
// Uscire dal modulo senza salvare non cancella la bozza; la cancellano il salvataggio e «Scarta».
import { clearDraft, loadDraft, saveDraft } from '../features/drafts.js';

const PAUSE_MS = 400;

// collect() → i dati da salvare; apply(draft) rimette i dati nel modulo.
export function createFormDraft({ ctx, store, formId, collect, apply }) {
  let dirty = false;
  let touched = false;
  let closed = false;
  let timer = null;

  async function flush() {
    clearTimeout(timer);
    timer = null;
    if (!dirty || closed) return;
    try {
      await saveDraft(store, formId, collect());
    } catch (err) {
      console.error(err); // la bozza non si salva (memoria piena?): ciò che si scrive resta nel modulo
    }
  }

  const off = ctx.onBackground(flush);

  return {
    flush,
    // da chiamare a ogni modifica del modulo
    schedule() {
      dirty = true;
      touched = true;
      clearTimeout(timer);
      timer = setTimeout(flush, PAUSE_MS);
    },
    // Rimette la bozza nel modulo, se c'è e se l'utente non ha già cominciato a scrivere. → true se l'ha rimessa.
    async restore() {
      let draft;
      try {
        draft = await loadDraft(store, formId);
      } catch (err) {
        console.error(err); // bozza illeggibile: il modulo si apre com'è e la sovrascrive
        return false;
      }
      if (closed || touched || !draft || typeof draft !== 'object') return false;
      apply(draft);
      return true;
    },
    // «Scarta la bozza»: il modulo è già stato rimesso com'era dal chiamante
    async discard() {
      clearTimeout(timer);
      dirty = false;
      touched = true; // se la bozza non fosse ancora stata letta, non deve più rimettersi
      try {
        await clearDraft(store, formId);
      } catch (err) {
        console.error(err);
      }
    },
    // dopo il salvataggio del modulo
    async clear() {
      closed = true;
      clearTimeout(timer);
      try {
        await clearDraft(store, formId);
      } catch (err) {
        console.error(err);
      }
    },
    dispose() {
      closed = true;
      clearTimeout(timer);
      off?.();
    },
  };
}
