// Menu a tendina (un solo livello) ancorato a un pulsante: il ⋮ della barra e quello di ogni scheda.
import { h } from './dom.js';

let current = null;

export function closeMenu() {
  if (!current) return;
  const { menu, backdrop, anchor, onKey, onResize } = current;
  current = null;
  document.removeEventListener('keydown', onKey, true);
  globalThis.removeEventListener('resize', onResize);
  menu.remove();
  backdrop.remove();
  if (anchor?.isConnected) {
    anchor.setAttribute('aria-expanded', 'false');
    anchor.focus?.();
  }
}

// items: [{label, onSelect, danger?}]. Restituisce la funzione che chiude il menu.
export function openMenu(anchor, items) {
  closeMenu();
  const entries = items.map((item) =>
    h('button', {
      type: 'button',
      role: 'menuitem',
      class: `menu__item${item.danger ? ' menu__item--danger' : ''}`,
      text: item.label,
      onclick: () => {
        closeMenu();
        item.onSelect?.();
      },
    }),
  );
  const menu = h('div', { class: 'menu', role: 'menu' }, ...entries);
  const backdrop = h('div', { class: 'menu-backdrop', onclick: () => closeMenu() });

  const place = () => {
    const rect = anchor.getBoundingClientRect();
    menu.style.right = `${Math.max(8, document.documentElement.clientWidth - rect.right)}px`;
    const height = menu.offsetHeight;
    const below = rect.bottom + 6;
    const fits = below + height <= globalThis.innerHeight - 8;
    menu.style.top = `${fits ? below : Math.max(8, rect.top - height - 6)}px`;
  };

  const onKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const at = entries.indexOf(document.activeElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      entries[(at + step + entries.length) % entries.length].focus();
    }
  };

  document.body.append(backdrop, menu);
  place();
  anchor.setAttribute('aria-expanded', 'true');
  document.addEventListener('keydown', onKey, true);
  globalThis.addEventListener('resize', place);
  current = { menu, backdrop, anchor, onKey, onResize: place };
  entries[0]?.focus();
  return closeMenu;
}
