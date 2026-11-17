// Punto d'ingresso: registra il service worker, apre il database, mostra l'accesso e poi l'app
// (barra in alto, pagina, barra in basso). Quando l'app si blocca, tutto ciò che era in chiaro
// sullo schermo viene tolto e si ricomincia dall'accesso.
import { i18n } from './i18n/index.js';
import { openDb } from './core/db.js';
import { createSecureStore, StorageFullError } from './core/secure-store.js';
import { hashFor, parseHash } from './router.js';
import { renderTopbar } from './ui/topbar.js';
import { renderBottombar } from './ui/bottombar.js';
import { closeMenu, openMenu } from './ui/menu.js';
import { renderLock } from './ui/screens/lock.js';
import { renderIdeas } from './ui/screens/ideas.js';
import { renderDevelop } from './ui/screens/develop.js';
import { renderPublications } from './ui/screens/publications.js';
import { renderDashboard } from './ui/screens/dashboard.js';
import { closeDialogs } from './ui/dialog.js';
import { applyI18n, h } from './ui/dom.js';

// Tempo in secondo piano dopo il quale l'app si blocca (spec: «blocco automatico»).
export const AUTO_LOCK_MS = 60000;
// Tempo massimo per salvare le bozze prima di bloccare: un salvataggio appeso non deve lasciare
// i testi in chiaro sullo schermo.
const FLUSH_TIMEOUT_MS = 3000;

// Pagine. Ogni task sostituisce il suo segnaposto con la pagina vera.
function renderPlaceholder(view, ctx) {
  view.append(h('section', { class: 'card page-card' }, h('h2', { i18n: `title.${ctx.route}` })));
}
const SCREENS = {
  dashboard: renderDashboard,
  ideare: renderIdeas,
  sviluppare: renderDevelop,
  pubblicazioni: renderPublications,
  impostazioni: renderPlaceholder,
};

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  // type: 'module' perché sw.js importa version.js; updateViaCache: 'none' perché GitHub Pages
  // manda max-age=600 e il controllo degli aggiornamenti non deve usare la cache HTTP.
  navigator.serviceWorker.register('./sw.js', { type: 'module', updateViaCache: 'none' }).catch((err) => {
    console.error('Service worker non registrato:', err);
  });
}

function showFatal(root, key, retry) {
  root.replaceChildren(
    h(
      'main',
      { class: 'lock' },
      h(
        'section',
        { class: 'card lock__card' },
        h('p', { class: 'banner banner--error', role: 'alert', i18n: key }),
        h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'common.retry', onclick: retry }),
      ),
    ),
  );
  applyI18n(root);
}

// Un errore nel leggere i dati (store.all() fallisce per intero se un solo record è illeggibile)
// diventa un messaggio chiaro, mai una pagina vuota.
function renderScreenError(view, err, retry) {
  console.error(err);
  const key = err instanceof StorageFullError ? 'error.storageFull' : 'error.dataUnreadable';
  view.replaceChildren(
    h(
      'section',
      { class: 'card page-card' },
      h('p', { class: 'banner banner--error', role: 'alert', i18n: key }),
      h('button', { type: 'button', class: 'btn btn--secondary', i18n: 'common.retry', onclick: retry }),
    ),
  );
  applyI18n(view);
}

function runApp(root, { db, session }) {
  return new Promise((resolveLocked) => {
    const store = createSecureStore(db, session);
    const topbarHost = h('div', { class: 'app__top' });
    const bottombarHost = h('div', { class: 'app__bottom' });
    const main = h('main', { class: 'app__main', id: 'main' });
    root.replaceChildren(h('div', { class: 'app' }, topbarHost, main, bottombarHost));

    const flushers = new Set(); // salvano le bozze: si chiamano prima del blocco
    let scope = null; // pulizie della pagina in corso
    const langHooks = new Set();
    let currentRoute = 'dashboard';
    let renderToken = 0;
    let locked = false;
    let hiddenAt = null;
    let timer = null;

    function endScope() {
      if (!scope) return;
      scope.disposed = true;
      for (const fn of scope.disposers.splice(0)) {
        try {
          fn();
        } catch (err) {
          console.error(err);
        }
      }
      scope = null;
    }

    async function flushAll() {
      await Promise.allSettled([...flushers].map((fn) => fn()));
    }

    function flushWithTimeout() {
      return Promise.race([flushAll(), new Promise((resolve) => setTimeout(resolve, FLUSH_TIMEOUT_MS))]);
    }

    async function lock() {
      if (locked) return;
      locked = true;
      await flushWithTimeout(); // la bozza è già salvata prima del blocco (entro un tempo massimo)
      clearTimeout(timer);
      globalThis.removeEventListener('hashchange', renderRoute);
      globalThis.removeEventListener('langchange', onLangChange);
      document.removeEventListener('visibilitychange', onVisibility);
      globalThis.removeEventListener('pagehide', flushAll);
      closeMenu();
      closeDialogs();
      endScope();
      root.replaceChildren(); // via ogni testo in chiaro dallo schermo
      resolveLocked();
    }

    function baseCtx(routeName, params) {
      const mine = { disposers: [], disposed: false };
      scope = mine;
      return {
        route: routeName,
        params,
        db,
        store,
        session,
        i18n,
        lock,
        navigate: (name, query) => {
          globalThis.location.hash = hashFor(name, query);
        },
        onDispose: (fn) => (mine.disposed ? fn() : mine.disposers.push(fn)),
        // restituisce la funzione che toglie il salvataggio dall'elenco (per un modulo che si chiude prima della pagina)
        onBackground: (fn) => {
          flushers.add(fn);
          const off = () => flushers.delete(fn);
          mine.disposers.push(off);
          return off;
        },
        // pagine con testi calcolati (date, conteggi): si riscrivono quando cambia la lingua
        onLangChange: (fn) => {
          langHooks.add(fn);
          mine.disposers.push(() => langHooks.delete(fn));
        },
      };
    }

    function menuItems() {
      return [{ label: i18n.t('menu.lockNow'), onSelect: () => lock() }];
    }

    function reselect(name) {
      // la voce attiva si è toccata di nuovo: via i parametri dell'indirizzo (scheda, idea scelta...) e si riparte
      globalThis.history?.replaceState(null, '', hashFor(name));
      renderRoute();
    }

    // Barre in alto e in basso: non contengono ciò che l'utente digita, si ricostruiscono sempre.
    function renderChrome(name) {
      renderTopbar(topbarHost, {
        title: i18n.t(`title.${name}`),
        onHome: () => (globalThis.location.hash = hashFor('dashboard')),
        onMenu: (anchor) => openMenu(anchor, menuItems()),
      });
      renderBottombar(bottombarHost, { active: name, onReselect: () => reselect(name) });
    }

    // Cambio di lingua: si riscrivono i testi sul posto, la pagina non si ricostruisce
    // (ciò che l'utente ha digitato nei campi e le bozze non si toccano).
    function onLangChange() {
      if (locked) return;
      document.documentElement.lang = i18n.getLang();
      closeMenu();
      renderChrome(currentRoute);
      applyI18n(main);
      for (const fn of [...langHooks]) {
        try {
          fn();
        } catch (err) {
          console.error(err);
        }
      }
    }

    async function renderRoute() {
      if (locked) return;
      const token = ++renderToken;
      closeMenu();
      await flushWithTimeout(); // le bozze della pagina che si lascia si salvano prima di smontarla
      if (locked || token !== renderToken) return;
      endScope();
      const { name, params } = parseHash(globalThis.location.hash);
      currentRoute = name;
      document.documentElement.lang = i18n.getLang();
      renderChrome(name);
      const view = h('div', { class: 'view', dataset: { route: name } });
      main.replaceChildren(view);
      const ctx = baseCtx(name, params);
      try {
        await SCREENS[name](view, ctx);
      } catch (err) {
        if (token === renderToken) renderScreenError(view, err, renderRoute);
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        flushAll();
        clearTimeout(timer);
        timer = setTimeout(lock, AUTO_LOCK_MS);
      } else {
        clearTimeout(timer);
        // i timer possono fermarsi mentre l'app è in secondo piano: si controlla anche l'orologio
        if (hiddenAt !== null && Date.now() - hiddenAt >= AUTO_LOCK_MS) lock();
        hiddenAt = null;
      }
    }

    globalThis.addEventListener('hashchange', renderRoute);
    globalThis.addEventListener('langchange', onLangChange);
    document.addEventListener('visibilitychange', onVisibility);
    globalThis.addEventListener('pagehide', flushAll);
    // se l'app è già in secondo piano quando lo sblocco finisce (la derivazione della chiave
    // richiede un po'), il blocco automatico deve partire comunque
    if (document.visibilityState === 'hidden') onVisibility();
    renderRoute();
  });
}

async function boot() {
  const root = document.getElementById('app');
  document.documentElement.lang = i18n.getLang();
  globalThis.addEventListener('langchange', () => {
    document.documentElement.lang = i18n.getLang();
  });
  registerServiceWorker();
  let db;
  try {
    db = await openDb();
  } catch (err) {
    console.error(err);
    showFatal(root, 'error.dbUnavailable', () => globalThis.location.reload());
    return;
  }
  for (;;) {
    const session = await renderLock(root, { db });
    await runApp(root, { db, session });
  }
}

if (typeof document !== 'undefined') boot();
