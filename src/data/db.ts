/**
 * Tiny promise wrapper over IndexedDB with a localStorage or in-memory fallback.
 * The database name is namespaced because every GitHub Pages site of the same
 * account shares one origin (and so one IndexedDB space).
 */
export type StoreName = 'profiles' | 'attempts' | 'meta';
export type BackendKind = 'indexeddb' | 'localstorage' | 'memory';
type Key = string | number;
type Rec = Record<string, unknown>;

export interface Backend {
  readonly kind: BackendKind;
  getAll<T>(store: StoreName): Promise<T[]>;
  get<T>(store: StoreName, key: Key): Promise<T | undefined>;
  /** Writes and resolves with the record key once the write is durable. */
  put<T extends object>(store: StoreName, value: T): Promise<Key>;
  delete(store: StoreName, key: Key): Promise<void>;
  clear(store: StoreName): Promise<void>;
}

export const DB_NAME = 'tabuadarock';
export const DB_VERSION = 1;
export const LS_PREFIX = 'tabuadarock:';
const STORES: StoreName[] = ['profiles', 'attempts', 'meta'];
const KEY_PATH: Record<StoreName, string> = { profiles: 'id', attempts: 'id', meta: 'key' };

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Transação cancelada'));
  });
}

class IdbBackend implements Backend {
  readonly kind = 'indexeddb' as const;
  constructor(private db: IDBDatabase) {}

  private tx(store: StoreName, mode: IDBTransactionMode): IDBTransaction {
    return mode === 'readwrite'
      ? this.db.transaction(store, mode, { durability: 'strict' })
      : this.db.transaction(store, mode);
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    return request(this.tx(store, 'readonly').objectStore(store).getAll()) as Promise<T[]>;
  }

  async get<T>(store: StoreName, key: Key): Promise<T | undefined> {
    return request(this.tx(store, 'readonly').objectStore(store).get(key)) as Promise<T | undefined>;
  }

  async put<T extends object>(store: StoreName, value: T): Promise<Key> {
    const tx = this.tx(store, 'readwrite');
    const key = request(tx.objectStore(store).put(value));
    await done(tx);
    return (await key) as Key;
  }

  async delete(store: StoreName, key: Key): Promise<void> {
    const tx = this.tx(store, 'readwrite');
    tx.objectStore(store).delete(key);
    await done(tx);
  }

  async clear(store: StoreName): Promise<void> {
    const tx = this.tx(store, 'readwrite');
    tx.objectStore(store).clear();
    await done(tx);
  }
}

/** Keeps every store as a plain object; optionally saves each store to localStorage. */
export class MapBackend implements Backend {
  private data: Record<StoreName, Map<Key, Rec>> = { profiles: new Map(), attempts: new Map(), meta: new Map() };
  private seq = 0;

  constructor(
    readonly kind: 'localstorage' | 'memory',
    private storage?: Storage,
  ) {
    if (!storage) return;
    for (const s of STORES) {
      try {
        const raw = storage.getItem(LS_PREFIX + s);
        if (!raw) continue;
        const list = JSON.parse(raw) as Rec[];
        for (const rec of list) {
          const key = rec[KEY_PATH[s]] as Key;
          this.data[s].set(key, rec);
          if (typeof key === 'number') this.seq = Math.max(this.seq, key);
        }
      } catch {
        // A broken store is ignored; the other stores still load.
      }
    }
  }

  private save(store: StoreName): void {
    this.storage?.setItem(LS_PREFIX + store, JSON.stringify([...this.data[store].values()]));
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    return [...this.data[store].values()].map((r) => structuredClone(r)) as T[];
  }

  async get<T>(store: StoreName, key: Key): Promise<T | undefined> {
    const r = this.data[store].get(key);
    return r ? (structuredClone(r) as T) : undefined;
  }

  async put<T extends object>(store: StoreName, value: T): Promise<Key> {
    const rec = structuredClone(value) as Rec;
    const kp = KEY_PATH[store];
    if (rec[kp] === undefined) {
      if (store !== 'attempts') throw new Error(`Registro sem chave em ${store}`);
      rec[kp] = ++this.seq;
      (value as Rec)[kp] = rec[kp];
    } else if (typeof rec[kp] === 'number') {
      this.seq = Math.max(this.seq, rec[kp] as number);
    }
    this.data[store].set(rec[kp] as Key, rec);
    this.save(store);
    return rec[kp] as Key;
  }

  async delete(store: StoreName, key: Key): Promise<void> {
    this.data[store].delete(key);
    this.save(store);
  }

  async clear(store: StoreName): Promise<void> {
    this.data[store].clear();
    this.save(store);
  }
}

function openIdb(timeoutMs: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let late = false;
    const timer = setTimeout(() => {
      late = true;
      reject(new Error('IndexedDB demorou demais para abrir'));
    }, timeoutMs);
    let r: IDBOpenDBRequest;
    try {
      r = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      clearTimeout(timer);
      reject(err);
      return;
    }
    // Only ever add stores or indexes here. Never delete user data in an upgrade.
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('attempts')) {
        const s = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
        s.createIndex('byProfile', 'profileId');
        s.createIndex('byLevel', 'levelId');
        s.createIndex('byScore', 'score');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    r.onsuccess = () => {
      clearTimeout(timer);
      const db = r.result;
      // This session already moved on to the fallback; don't hold a connection open.
      if (late) return db.close();
      db.onversionchange = () => db.close();
      resolve(db);
    };
    r.onerror = () => {
      clearTimeout(timer);
      reject(r.error);
    };
    // An older tab still holds the previous version. It closes itself on versionchange,
    // and the timeout above covers a tab that never lets go.
    r.onblocked = () => console.warn('IndexedDB esperando outra aba liberar a versão antiga');
  });
}

function usableLocalStorage(): Storage | undefined {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return undefined;
    ls.setItem(LS_PREFIX + 'teste', '1');
    ls.removeItem(LS_PREFIX + 'teste');
    return ls;
  } catch {
    return undefined;
  }
}

export async function openBackend(): Promise<Backend> {
  if (typeof indexedDB !== 'undefined') {
    try {
      return new IdbBackend(await openIdb(5000));
    } catch (err) {
      console.warn('IndexedDB indisponível, usando alternativa:', err);
    }
  }
  const ls = usableLocalStorage();
  return ls ? new MapBackend('localstorage', ls) : new MapBackend('memory');
}
