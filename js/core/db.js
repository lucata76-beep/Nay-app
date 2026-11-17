// Archivio locale: IndexedDB con un archivio per tipo di record.
export const STORES = ['meta', 'ideas', 'media', 'blobs', 'templates', 'prompts', 'publications', 'repetitions'];
export const DB_NAME = 'nay';
const DB_VERSION = 1;

// Scelta del piano (la spec dice solo «quasi pieno»): da 80% di spazio usato.
export const NEAR_FULL_RATIO = 0.8;

// Esegue una sola operazione in una transazione: se qualcosa va storto (anche
// QuotaExceededError, che IndexedDB segnala annullando la transazione) la
// transazione si annulla per intero e la promessa fallisce con l'errore vero.
function run(idb, storeName, mode, operation) {
  return new Promise((resolve, reject) => {
    let tx;
    try {
      tx = idb.transaction(storeName, mode);
      const request = operation(tx.objectStore(storeName));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onabort = () => reject(tx.error || new DOMException('Transazione annullata', 'AbortError'));
    } catch (err) {
      try {
        if (tx) tx.abort();
      } catch {
        // la transazione era già chiusa
      }
      reject(err);
    }
  });
}

// Sostituisce il contenuto di tutti gli archivi in una sola transazione: o cambia tutto o non
// cambia niente (anche se la memoria finisce a metà). `data` è {nome archivio: [record]};
// gli archivi che non compaiono si svuotano. Serve all'importazione del backup.
function replaceAll(idb, data) {
  return new Promise((resolve, reject) => {
    let tx;
    try {
      const unknown = Object.keys(data).filter((name) => !STORES.includes(name));
      if (unknown.length > 0) throw new TypeError(`Archivi sconosciuti: ${unknown.join(', ')}`);
      tx = idb.transaction(STORES, 'readwrite');
      for (const name of STORES) {
        const store = tx.objectStore(name);
        store.clear();
        for (const record of data[name] ?? []) store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new DOMException('Transazione annullata', 'AbortError'));
    } catch (err) {
      try {
        if (tx) tx.abort();
      } catch {
        // la transazione era già chiusa
      }
      reject(err);
    }
  });
}

function makeDb(idb) {
  return {
    put: (store, record) => run(idb, store, 'readwrite', (s) => s.put(record)).then(() => undefined),
    get: (store, id) => run(idb, store, 'readonly', (s) => s.get(id)).then((value) => (value === undefined ? null : value)),
    list: (store) => run(idb, store, 'readonly', (s) => s.getAll()),
    remove: (store, id) => run(idb, store, 'readwrite', (s) => s.delete(id)).then(() => undefined),
    replaceAll: (data) => replaceAll(idb, data),
  };
}

export function openDb(name = DB_NAME) {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      const idb = request.result;
      for (const store of STORES) {
        if (!idb.objectStoreNames.contains(store)) idb.createObjectStore(store, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(makeDb(request.result));
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Apertura del database bloccata da un’altra scheda'));
  });
}

// Spazio usato e disponibile. Se il browser non offre l'API, valori a zero e nessun allarme.
export async function storageStatus(nav = globalThis.navigator) {
  const storage = nav && nav.storage;
  if (!storage || typeof storage.estimate !== 'function') {
    return { usage: 0, quota: 0, persisted: false, nearFull: false };
  }
  const { usage = 0, quota = 0 } = await storage.estimate();
  const persisted = typeof storage.persisted === 'function' ? Boolean(await storage.persisted()) : false;
  return { usage, quota, persisted, nearFull: quota > 0 && usage / quota >= NEAR_FULL_RATIO };
}
