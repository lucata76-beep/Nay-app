import { es } from './es.js';
import { it } from './it.js';

const DICTIONARIES = { es, it };
const LANGS = Object.keys(DICTIONARIES);
const DEFAULT_LANG = 'es';
export const LANG_STORAGE_KEY = 'nay.lang';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

// localStorage può mancare o lanciare (finestra privata, dati del sito bloccati):
// in quel caso la lingua vale solo per la sessione.
function defaultStorage() {
  try {
    if (globalThis.localStorage) return globalThis.localStorage;
  } catch {
    // ignora
  }
  return memoryStorage();
}

export function createI18n(storage = defaultStorage()) {
  function getLang() {
    let stored = null;
    try {
      stored = storage.getItem(LANG_STORAGE_KEY);
    } catch {
      // ignora
    }
    return LANGS.includes(stored) ? stored : DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!LANGS.includes(lang)) throw new RangeError(`Lingua non supportata: ${lang}`);
    try {
      storage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignora: la lingua non resta salvata, ma l'interfaccia cambia comunque
    }
    if (typeof globalThis.dispatchEvent === 'function') {
      const event =
        typeof CustomEvent === 'function'
          ? new CustomEvent('langchange', { detail: { lang } })
          : new Event('langchange');
      globalThis.dispatchEvent(event);
    }
  }

  function t(key, params = {}) {
    const text = DICTIONARIES[getLang()][key];
    if (text === undefined) return key;
    return text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole));
  }

  return { t, getLang, setLang };
}

export const i18n = createI18n();
