// Scheda di un elenco (idea, prompt, post): anteprima, titolo, sottotitolo, etichette e menu ⋮.
// Le anteprime delle foto si caricano solo quando la scheda si avvicina allo schermo e a due alla volta:
// ogni foto va decifrata per intero e un elenco lungo non deve decifrarle tutte insieme.
import { h } from './dom.js';
import { icon } from './icons.js';
import { openMenu } from './menu.js';

const MAX_PARALLEL_THUMBS = 2;
const waiting = [];
let running = 0;

function runNext() {
  while (running < MAX_PARALLEL_THUMBS && waiting.length > 0) {
    const job = waiting.shift();
    running++;
    job().finally(() => {
      running--;
      runNext();
    });
  }
}

function enqueue(job) {
  waiting.push(job);
  runNext();
}

let observer = null;
const watched = new WeakMap();
function visibilityObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const start = watched.get(entry.target);
        observer.unobserve(entry.target);
        watched.delete(entry.target);
        if (start) start();
      }
    },
    { rootMargin: '250px 0px' },
  );
  return observer;
}

// Anteprima di un blob dentro `thumb` (un elemento che contiene già l'icona di ripiego). Se c'è `blob` si mostra subito;
// altrimenti `loader()` (→ Promise<Blob|null>) parte quando l'elemento si avvicina allo schermo, due alla volta.
// Restituisce dispose(): libera l'indirizzo temporaneo e ferma i caricamenti non ancora partiti.
export function lazyThumb(thumb, { blob, loader, fallbackIcon = 'image' } = {}) {
  let url = null;
  let disposed = false;

  function show(data) {
    if (disposed || !data) return;
    url = URL.createObjectURL(data);
    const img = h('img', { class: 'item__img', src: url, alt: '', decoding: 'async' });
    img.addEventListener('error', () => thumb.replaceChildren(icon(fallbackIcon, { size: 28 })));
    thumb.replaceChildren(img);
  }

  if (blob) show(blob);
  else if (loader) {
    const load = () =>
      enqueue(async () => {
        if (disposed) return;
        try {
          show(await loader());
        } catch (err) {
          console.error(err); // resta l'icona
        }
      });
    const obs = visibilityObserver();
    if (obs) {
      watched.set(thumb, load);
      obs.observe(thumb);
    } else load();
  }

  return () => {
    disposed = true;
    if (observer) observer.unobserve(thumb);
    watched.delete(thumb);
    if (url) URL.revokeObjectURL(url);
    url = null;
  };
}

// item: {title, subtitle?, thumb?: Blob, thumbLoader?: () => Promise<Blob|null>, placeholder?: 'image'|'video'|'note',
//        badges?: [{icon?, text}], menu: [{label, onSelect, danger?}], onOpen?: () => void}
// Restituisce {element, dispose}: dispose libera gli indirizzi temporanei delle anteprime.
export function renderCard(root, item) {
  const thumb = h('span', { class: 'item__thumb', 'aria-hidden': 'true' }, icon(item.placeholder ?? 'note', { size: 28 }));
  const disposeThumb = lazyThumb(thumb, { blob: item.thumb, loader: item.thumbLoader });

  const body = h(
    'span',
    { class: 'item__body' },
    h('span', { class: 'item__title', text: item.title }),
    item.subtitle ? h('span', { class: 'item__subtitle muted', text: item.subtitle }) : null,
    item.badges?.length
      ? h(
          'span',
          { class: 'item__badges' },
          ...item.badges.map((badge) =>
            h('span', { class: 'badge' }, badge.icon ? icon(badge.icon, { size: 14 }) : null, h('span', { text: badge.text })),
          ),
        )
      : null,
  );
  const main = h('button', { type: 'button', class: 'item__main', onclick: () => item.onOpen?.() }, thumb, body);
  const menuButton = h(
    'button',
    {
      type: 'button',
      class: 'icon-btn item__menu',
      i18nAria: 'card.menu',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      onclick: () => openMenu(menuButton, item.menu),
    },
    icon('dots'),
  );
  const element = h('article', { class: 'item' }, main, item.menu?.length ? menuButton : null);
  root.append(element);

  return { element, dispose: disposeThumb };
}
