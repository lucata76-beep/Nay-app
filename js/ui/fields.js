// Campi di modulo condivisi: campo con etichetta (e occhio per mostrare la password), indicatore di
// robustezza della password, riquadro dell'errore. Usati dalla schermata di accesso e dalle Impostazioni.
import { i18n } from '../i18n/index.js';
import { passwordStrength } from '../core/password.js';
import { h } from './dom.js';
import { icon } from './icons.js';

export function field({ id, labelKey, type = 'password', autocomplete = 'off', hintKey, hintParams, toggle = false, mono = false }) {
  const input = h('input', {
    id,
    class: `field__input${mono ? ' field__input--mono' : ''}`,
    type,
    autocomplete,
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go',
  });
  const row = h('div', { class: 'field__row' }, input);
  if (toggle) {
    const eye = h('button', { type: 'button', class: 'icon-btn field__toggle', i18nAria: 'lock.showPassword', 'aria-pressed': 'false' }, icon('eye'));
    eye.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.setAttribute('aria-pressed', String(show));
      eye.setAttribute('data-i18n-aria', show ? 'lock.hidePassword' : 'lock.showPassword');
      eye.setAttribute('aria-label', i18n.t(show ? 'lock.hidePassword' : 'lock.showPassword'));
      eye.replaceChildren(icon(show ? 'eyeOff' : 'eye'));
    });
    row.append(eye);
  }
  const wrap = h(
    'div',
    { class: 'field' },
    h('label', { class: 'field__label', for: id, i18n: labelKey }),
    row,
    hintKey ? h('p', { class: 'field__hint muted', i18n: hintKey, i18nParams: hintParams }) : null,
  );
  return { wrap, input };
}

// Barra e parola («Débil», «Media», «Buena») che seguono ciò che si scrive nel campo.
export function strengthMeter(input) {
  const fill = h('span', { class: 'meter__fill' });
  const label = h('span', { class: 'meter__label' });
  const element = h('div', { class: 'meter', 'aria-live': 'polite' }, h('span', { class: 'meter__bar' }, fill), label);
  function refresh() {
    if (input.value === '') {
      // campo vuoto: nessuna etichetta, e nessuna chiave che un cambio di lingua riscriverebbe
      element.dataset.level = '';
      label.removeAttribute('data-i18n');
      label.textContent = '';
      return;
    }
    const level = passwordStrength(input.value);
    element.dataset.level = level;
    label.setAttribute('data-i18n', `lock.strength.${level}`);
    label.textContent = i18n.t(`lock.strength.${level}`);
  }
  input.addEventListener('input', refresh);
  return { element, refresh };
}

export function errorBox() {
  return h('p', { class: 'banner banner--error', role: 'alert', hidden: true });
}

export function showError(box, key, params) {
  box.setAttribute('data-i18n', key);
  if (params) box.dataset.i18nParams = JSON.stringify(params);
  else delete box.dataset.i18nParams;
  box.textContent = i18n.t(key, params ?? {});
  box.hidden = false;
}

export function clearError(box) {
  box.hidden = true;
  box.removeAttribute('data-i18n');
  box.textContent = '';
}
