// Barra in basso con 4 icone: Dashboard, Ideare, Sviluppare, Pubblicazioni.
import { h } from './dom.js';
import { icon } from './icons.js';
import { hashFor } from '../router.js';

const ITEMS = [
  { name: 'dashboard', icon: 'home', label: 'nav.dashboard' },
  { name: 'ideare', icon: 'bulb', label: 'nav.ideare' },
  { name: 'sviluppare', icon: 'wand', label: 'nav.sviluppare' },
  { name: 'pubblicazioni', icon: 'archive', label: 'nav.pubblicazioni' },
];

export function renderBottombar(root, { active } = {}) {
  const links = ITEMS.map((item) =>
    h(
      'a',
      {
        class: 'bottombar__item',
        href: hashFor(item.name),
        'aria-current': item.name === active ? 'page' : null,
      },
      icon(item.icon),
      h('span', { class: 'bottombar__label', i18n: item.label }),
    ),
  );
  const nav = h('nav', { class: 'bottombar', i18nAria: 'nav.label' }, ...links);
  root.replaceChildren(nav);
  return nav;
}
