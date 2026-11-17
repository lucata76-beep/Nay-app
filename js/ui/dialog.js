// Finestra di conferma. Sta fuori da #app: il blocco dell'app la chiude (closeDialogs), così nessun
// testo in chiaro resta sullo schermo.
import { i18n } from '../i18n/index.js';
import { h } from './dom.js';

const open = new Set();

export function closeDialogs() {
  for (const close of [...open]) close(false);
}

// → Promise<boolean>: true se l'utente conferma. Il focus parte su «Annulla» (azioni che cancellano).
export function confirmDialog({ title, message, confirmLabel, cancelLabel = i18n.t('common.cancel'), danger = false }) {
  return new Promise((resolve) => {
    const previous = document.activeElement;
    const titleId = `dialog-title-${open.size}-${Date.now()}`;
    const cancel = h('button', { type: 'button', class: 'btn btn--secondary', text: cancelLabel });
    const confirm = h('button', { type: 'button', class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`, text: confirmLabel ?? i18n.t('common.confirm') });
    const panel = h(
      'div',
      { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      h('h2', { id: titleId, class: 'dialog__title', text: title }),
      message ? h('p', { class: 'dialog__message', text: message }) : null,
      h('div', { class: 'dialog__actions' }, confirm, cancel),
    );
    const backdrop = h('div', { class: 'dialog-backdrop' }, panel);

    function close(answer) {
      if (!open.has(close)) return;
      open.delete(close);
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      if (previous && previous.isConnected) previous.focus?.();
      resolve(answer);
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
      } else if (event.key === 'Tab') {
        // il focus resta dentro la finestra
        const focusable = [confirm, cancel];
        const at = focusable.indexOf(document.activeElement);
        event.preventDefault();
        focusable[(at + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
      }
    }
    confirm.addEventListener('click', () => close(true));
    cancel.addEventListener('click', () => close(false));
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) close(false);
    });
    open.add(close);
    document.addEventListener('keydown', onKey, true);
    document.body.append(backdrop);
    cancel.focus();
  });
}

// Immagine a tutto schermo (lo screenshot di un post). Sta fuori da #app come le finestre di conferma:
// il blocco dell'app la chiude. Si chiude con il pulsante, toccando fuori o con Esc.
export function showImage({ blob, title = '' }) {
  const previous = document.activeElement;
  const url = URL.createObjectURL(blob);
  const closeButton = h('button', { type: 'button', class: 'btn btn--secondary viewer__close', text: i18n.t('common.close') });
  const img = h('img', { class: 'viewer__img', src: url, alt: title });
  const backdrop = h('div', { class: 'dialog-backdrop viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': title || i18n.t('common.close') }, img, closeButton);

  function close() {
    if (!open.has(close)) return;
    open.delete(close);
    document.removeEventListener('keydown', onKey, true);
    backdrop.remove();
    URL.revokeObjectURL(url);
    if (previous && previous.isConnected) previous.focus?.();
  }
  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  open.add(close);
  document.addEventListener('keydown', onKey, true);
  document.body.append(backdrop);
  closeButton.focus();
  return close;
}
