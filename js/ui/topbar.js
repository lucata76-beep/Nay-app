// Barra in alto: logo su tessera crema con la versione accanto (tocco = Dashboard), titolo,
// bandierine ES e IT (lingua attiva evidenziata) e menu ⋮.
import { APP_VERSION } from '../version.js';
import { i18n } from '../i18n/index.js';
import { h, applyI18n } from './dom.js';
import { icon } from './icons.js';

export const LANG_CODES = ['es', 'it'];

// Le due bandierine. Cambiano la lingua dell'interfaccia (non quella di idee e post).
export function renderLangFlags(container, instance = i18n) {
  const buttons = LANG_CODES.map((lang) =>
    h(
      'button',
      {
        type: 'button',
        class: 'flag',
        dataset: { lang },
        i18nAria: `lang.${lang}`,
        onclick: () => instance.setLang(lang),
      },
      h('img', { class: 'flag__img', src: `./assets/flags/${lang}.svg`, alt: '', width: 22, height: 15 }),
      h('span', { class: 'flag__code', text: lang.toUpperCase() }),
    ),
  );
  const group = h('div', { class: 'flags', role: 'group', i18nAria: 'topbar.language' }, ...buttons);
  const refresh = () => {
    const current = instance.getLang();
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.lang === current));
    applyI18n(group, instance);
  };
  refresh();
  const onChange = () => {
    // il gruppo può essere stato tolto dalla pagina (blocco, cambio schermata): ci si stacca
    if (!group.isConnected) globalThis.removeEventListener?.('langchange', onChange);
    else refresh();
  };
  globalThis.addEventListener?.('langchange', onChange);
  container.append(group);
  return group;
}

export function renderTopbar(root, { title, onHome, onMenu } = {}) {
  const version = `v${APP_VERSION}`;
  const menuButton = h(
    'button',
    {
      type: 'button',
      class: 'icon-btn topbar__menu',
      i18nAria: 'topbar.menu',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      onclick: () => onMenu?.(menuButton),
    },
    icon('dots'),
  );
  const brand = h(
    'button',
    { type: 'button', class: 'topbar__brand', i18nAria: 'topbar.home', onclick: () => onHome?.() },
    h('span', { class: 'topbar__logo' }, h('img', { src: './assets/icons/icon-192.png', alt: '', width: 40, height: 40 })),
    h('span', { class: 'topbar__version', text: version }),
  );
  const right = h('div', { class: 'topbar__right' });
  renderLangFlags(right);
  right.append(menuButton);
  const bar = h('header', { class: 'topbar' }, brand, h('h1', { class: 'topbar__title', text: title ?? '' }), right);
  root.replaceChildren(bar);
  return bar;
}
