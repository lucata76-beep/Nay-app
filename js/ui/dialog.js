// Finestra di conferma. Sta fuori da #app: il blocco dell'app la chiude (closeDialogs), così nessun
// testo in chiaro resta sullo schermo.
import { i18n } from '../i18n/index.js';
import { h } from './dom.js';

const open = new Set();

// Il focus resta dentro la finestra: Tab e Maiusc+Tab girano tra gli elementi attivi.
function keepFocusInside(event, elements) {
  const focusable = elements.filter((element) => !element.disabled);
  event.preventDefault();
  if (focusable.length === 0) return;
  const at = focusable.indexOf(document.activeElement);
  focusable[(at + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
}

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
        keepFocusInside(event, [confirm, cancel]);
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

// Finestra con un campo (per esempio la password di un backup). `onSubmit(valore)` fa il lavoro e restituisce null se è
// andato bene, oppure {key, params} con il messaggio da mostrare DENTRO la finestra, che resta aperta per riprovare.
// Il valore non si «trimma» (gli spazi fanno parte di una password). → Promise<boolean>: true se onSubmit è riuscita.
export function promptDialog({ title, message, label, confirmLabel, type = 'password', onSubmit }) {
  return new Promise((resolve) => {
    const previous = document.activeElement;
    const uid = `prompt-${open.size}-${Date.now()}`;
    let busy = false;
    const input = h('input', { id: `${uid}-input`, class: 'field__input', type, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go' });
    const error = h('p', { class: 'banner banner--error', role: 'alert', hidden: true });
    const cancel = h('button', { type: 'button', class: 'btn btn--secondary', text: i18n.t('common.cancel') });
    const confirm = h('button', { type: 'button', class: 'btn btn--primary', text: confirmLabel ?? i18n.t('common.confirm') });
    const panel = h(
      'div',
      { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${uid}-title` },
      h('h2', { id: `${uid}-title`, class: 'dialog__title', text: title }),
      message ? h('p', { class: 'dialog__message', text: message }) : null,
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: `${uid}-input`, text: label }), input),
      error,
      h('div', { class: 'dialog__actions' }, confirm, cancel),
    );
    const backdrop = h('div', { class: 'dialog-backdrop' }, panel);

    function close(answer) {
      if (!open.has(close)) return;
      open.delete(close);
      document.removeEventListener('keydown', onKey, true);
      input.value = '';
      backdrop.remove();
      if (previous && previous.isConnected) previous.focus?.();
      resolve(answer);
    }
    function setBusy(value) {
      busy = value;
      confirm.disabled = value;
      cancel.disabled = value;
      input.disabled = value;
    }
    async function submit() {
      if (busy) return; // un secondo Invio mentre si sta già lavorando
      error.hidden = true;
      setBusy(true);
      let result;
      try {
        result = await onSubmit(input.value);
      } catch (err) {
        console.error(err);
        result = { key: 'error.unexpected' };
      }
      if (!open.has(close)) return; // intanto l'app si è bloccata e la finestra è stata chiusa
      if (result === null || result === undefined) return close(true);
      setBusy(false);
      error.textContent = i18n.t(result.key, result.params ?? {});
      error.setAttribute('data-i18n', result.key);
      error.hidden = false;
      input.focus();
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busy) close(false);
      } else if (event.key === 'Tab') {
        keepFocusInside(event, [input, confirm, cancel]);
      } else if (event.key === 'Enter' && document.activeElement === input) {
        event.preventDefault();
        submit();
      }
    }
    confirm.addEventListener('click', submit);
    cancel.addEventListener('click', () => !busy && close(false));
    open.add(close);
    document.addEventListener('keydown', onKey, true);
    document.body.append(backdrop);
    input.focus();
  });
}

// Finestra informativa (testo e un pulsante per chiudere).
export function infoDialog({ title, children = [], closeLabel = i18n.t('common.close') }) {
  return new Promise((resolve) => {
    const previous = document.activeElement;
    const titleId = `info-${open.size}-${Date.now()}`;
    const closeButton = h('button', { type: 'button', class: 'btn btn--secondary', text: closeLabel });
    const panel = h(
      'div',
      { class: 'dialog dialog--info', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      h('h2', { id: titleId, class: 'dialog__title', text: title }),
      ...children,
      h('div', { class: 'dialog__actions' }, closeButton),
    );
    const backdrop = h('div', { class: 'dialog-backdrop' }, panel);
    function close() {
      if (!open.has(close)) return;
      open.delete(close);
      document.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      if (previous && previous.isConnected) previous.focus?.();
      resolve();
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') {
        keepFocusInside(event, [closeButton]);
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
  });
}

// Avviso breve sopra la barra in basso (esito di un'azione lanciata dal menu, che può partire da qualsiasi pagina).
// Si chiude da solo dopo 9 secondi o toccandolo; il blocco dell'app lo toglie come le finestre.
let toast = null;
export function showToast({ text, level = 'ok' }) {
  toast?.close();
  const element = h('div', { class: `toast banner banner--${level}`, role: level === 'error' ? 'alert' : 'status', 'data-testid': 'toast', text });
  let timer = null;
  const close = () => {
    clearTimeout(timer);
    open.delete(close);
    element.remove();
    if (toast?.close === close) toast = null;
  };
  element.addEventListener('click', close);
  timer = setTimeout(close, 9000);
  open.add(close);
  toast = { close };
  document.body.append(element);
  return close;
}
