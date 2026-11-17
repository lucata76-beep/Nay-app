// Archivio cifrato: nel database restano in chiaro solo `id` e `updatedAt`.
export class StorageFullError extends Error {
  constructor(cause) {
    super('Spazio insufficiente nel telefono');
    this.name = 'StorageFullError';
    this.cause = cause;
  }
}

function isQuotaError(err) {
  return Boolean(err) && (err.name === 'QuotaExceededError' || err.code === 22);
}

export function createSecureStore(db, session) {
  // La scrittura è una sola operazione per record: se fallisce, il record
  // precedente resta com'era. Memoria piena → StorageFullError.
  async function write(store, record) {
    try {
      await db.put(store, record);
    } catch (err) {
      throw isQuotaError(err) ? new StorageFullError(err) : err;
    }
  }

  async function open(raw) {
    if (!raw.enc) throw new TypeError('Record non cifrato');
    const value = await session.decryptJson(raw.enc);
    // un record copiato sotto un altro id non deve essere accettato
    if (value.id !== raw.id) throw new Error('Record non coerente con il suo identificativo');
    return value;
  }

  return {
    async save(store, record) {
      if (record.id !== undefined && (typeof record.id !== 'string' || record.id === '')) {
        throw new TypeError('id non valido');
      }
      const id = record.id ?? globalThis.crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      const saved = { ...record, id, updatedAt };
      await write(store, { id, updatedAt, enc: await session.encryptJson(saved) });
      return saved;
    },

    async load(store, id) {
      const raw = await db.get(store, id);
      return raw ? open(raw) : null;
    },

    async all(store) {
      return Promise.all((await db.list(store)).map(open));
    },

    remove(store, id) {
      return db.remove(store, id);
    },

    async saveBlob(blob) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const id = globalThis.crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      const enc = await session.encryptBytes(bytes);
      // il tipo MIME è un dato come gli altri: va cifrato anche lui
      const info = await session.encryptJson({ id, type: blob.type, size: bytes.length });
      await write('blobs', { id, updatedAt, enc, info });
      return id;
    },

    async loadBlob(id) {
      const raw = await db.get('blobs', id);
      if (!raw) throw new Error(`Blob non trovato: ${id}`);
      const info = await session.decryptJson(raw.info);
      if (info.id !== raw.id) throw new Error('Blob non coerente con il suo identificativo');
      const bytes = await session.decryptBytes(raw.enc);
      return new Blob([bytes], { type: info.type });
    },
  };
}
