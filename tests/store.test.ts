import { beforeEach, describe, expect, it } from 'vitest';
import { LS_PREFIX, MapBackend, type Backend } from '../src/data/db';
import { Store, type Attempt, type Profile } from '../src/data/store';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

/** Stands in for IndexedDB: same behavior as the map backend, reported as the real thing. */
function fakeIdb(): Backend {
  const m = new MapBackend('memory');
  return {
    kind: 'indexeddb',
    getAll: (s) => m.getAll(s),
    get: (s, k) => m.get(s, k),
    put: (s, v) => m.put(s, v),
    delete: (s, k) => m.delete(s, k),
    clear: (s) => m.clear(s),
  };
}

const attempt = (p: Profile, levelId: string, score: number, at: number): Attempt => ({
  profileId: p.id,
  name: p.name,
  levelId,
  score,
  stars: 3,
  mistakes: 0,
  correct: 30,
  ms: 60000,
  avgMs: 2000,
  maxCombo: 12,
  partner: p.starter,
  at,
});

describe('Store', () => {
  let store: Store;
  beforeEach(() => {
    store = new Store(new MapBackend('memory'));
  });

  it('registers fighters with unique names', async () => {
    const filho = await store.createProfile('  Davi  ', 'capibolha');
    expect(filho.name).toBe('Davi');
    await store.createProfile('Pai', 'brasonca');
    await expect(store.createProfile('davi', 'folhandua')).rejects.toThrow('Já existe');
    await expect(store.createProfile('   ', 'folhandua')).rejects.toThrow();
    expect((await store.listProfiles()).map((p) => p.name).sort()).toEqual(['Davi', 'Pai']);
  });

  it('keeps every level for each fighter, even the ones not played yet', async () => {
    const p = await store.createProfile('Davi', 'capibolha');
    const back = await store.getProfile(p.id);
    expect(Object.keys(back!.levels)).toHaveLength(10);
    expect(back!.team).toEqual(['capibolha']);
  });

  it('ranks the top attempts by score, oldest first on a tie, and filters by level', async () => {
    const a = await store.createProfile('Davi', 'capibolha');
    const b = await store.createProfile('Pai', 'brasonca');
    await store.addAttempt(attempt(a, 't2', 3000, 1));
    await store.addAttempt(attempt(b, 't2', 4200, 2));
    await store.addAttempt(attempt(a, 't3', 4200, 3));
    await store.addAttempt(attempt(b, 't3', 1000, 4));
    const top = await store.topAttempts(3);
    expect(top.map((x) => [x.name, x.score])).toEqual([
      ['Pai', 4200],
      ['Davi', 4200],
      ['Davi', 3000],
    ]);
    expect((await store.topAttempts(10, 't3')).map((x) => x.score)).toEqual([4200, 1000]);
  });

  it('reset starts the tower again but keeps the name and the records', async () => {
    const p = await store.createProfile('Davi', 'capibolha');
    p.levels.t2 = { trained: true, cleared: true, stars: 3, best: 5000, plays: 2 };
    p.champion = true;
    await store.saveProfile(p);
    await store.addAttempt(attempt(p, 't2', 5000, 1));
    const fresh = await store.resetProgress(p.id);
    expect(fresh!.id).toBe(p.id);
    expect(fresh!.name).toBe('Davi');
    expect(fresh!.levels.t2.cleared).toBe(false);
    expect(fresh!.champion).toBe(false);
    expect(await store.topAttempts()).toHaveLength(1);
  });

  it('deleting a fighter removes its attempts too', async () => {
    const a = await store.createProfile('Davi', 'capibolha');
    const b = await store.createProfile('Pai', 'brasonca');
    await store.addAttempt(attempt(a, 't2', 3000, 1));
    await store.addAttempt(attempt(b, 't2', 4000, 2));
    await store.setActiveProfileId(a.id);
    await store.deleteProfile(a.id);
    expect((await store.listProfiles()).map((p) => p.name)).toEqual(['Pai']);
    expect((await store.topAttempts()).map((x) => x.name)).toEqual(['Pai']);
    expect(await store.getActiveProfileId()).toBeNull();
  });

  it('a backup round-trips and importing it twice changes nothing', async () => {
    const p = await store.createProfile('Davi', 'capibolha');
    await store.addAttempt(attempt(p, 't2', 3000, 1));
    const file = JSON.parse(JSON.stringify(await store.exportData()));

    const other = new Store(new MapBackend('memory'));
    expect(await other.importData(file)).toEqual({ profiles: 1, attempts: 1 });
    expect(await other.importData(file)).toEqual({ profiles: 1, attempts: 0 });
    expect(await other.topAttempts()).toHaveLength(1);
    expect((await other.getProfile(p.id))!.name).toBe('Davi');
  });

  it('importing an older backup never loses newer progress', async () => {
    const p = await store.createProfile('Davi', 'capibolha');
    const old = JSON.parse(JSON.stringify(await store.exportData()));
    p.levels.t2 = { trained: true, cleared: true, stars: 2, best: 4000, plays: 1 };
    p.facts['2x7'] = { seen: 5, correct: 5, wrong: 0, hints: 0, streak: 5, bestMs: 1500, lastMs: 1800 };
    await store.saveProfile(p);
    old.profiles[0].levels.t3 = { trained: true, cleared: false, stars: 0, best: 0, plays: 0 };
    await store.importData(old);
    const merged = (await store.getProfile(p.id))!;
    expect(merged.levels.t2).toMatchObject({ cleared: true, stars: 2, best: 4000 });
    expect(merged.levels.t3.trained).toBe(true);
    expect(merged.facts['2x7'].streak).toBe(5);
  });

  it('rejects files that are not a backup', async () => {
    await expect(store.importData({ hello: 'world' })).rejects.toThrow('não é um backup');
    await expect(store.importData(null)).rejects.toThrow();
  });

  it('fills defaults for old or broken saves', async () => {
    const be = new MapBackend('memory');
    await be.put('profiles', { id: 'x', name: 'Antigo', starter: 'nao-existe', levels: { t2: { cleared: true, stars: 9 } } });
    const s = new Store(be);
    const p = (await s.getProfile('x'))!;
    expect(p.starter).toBe('capibolha');
    expect(p.levels.t2).toMatchObject({ cleared: true, stars: 3 });
    expect(p.levels.final.cleared).toBe(false);
    expect(p.totals.answered).toBe(0);
  });
});

describe('recuperação', () => {
  it('restores from the localStorage mirror when IndexedDB comes back empty', async () => {
    const ls = new MemoryStorage();
    const first = new Store(fakeIdb(), ls);
    const p = await first.createProfile('Davi', 'capibolha');
    await first.addAttempt(attempt(p, 't2', 3000, 1));
    await first.flush();
    expect(ls.getItem(LS_PREFIX + 'espelho')).toContain('Davi');

    const wiped = new Store(fakeIdb(), ls);
    await wiped.recover(ls);
    expect((await wiped.listProfiles()).map((x) => x.name)).toEqual(['Davi']);
    expect(await wiped.topAttempts()).toHaveLength(1);
  });

  it('folds progress saved by a session without IndexedDB back in, once', async () => {
    const ls = new MemoryStorage();
    const idb = fakeIdb();
    const main = new Store(idb, ls);
    const p = await main.createProfile('Davi', 'capibolha');

    const fallback = new Store(new MapBackend('localstorage', ls));
    const copy = (await main.getProfile(p.id))!;
    copy.levels.t2 = { trained: true, cleared: true, stars: 3, best: 5200, plays: 1 };
    await fallback.saveProfile(copy);
    await fallback.createProfile('Pai', 'brasonca');
    await fallback.addAttempt(attempt(copy, 't2', 5200, 9));

    const next = new Store(idb, ls);
    await next.recover(ls);
    expect((await next.listProfiles()).map((x) => x.name).sort()).toEqual(['Davi', 'Pai']);
    expect((await next.getProfile(p.id))!.levels.t2.best).toBe(5200);
    expect(await next.topAttempts()).toHaveLength(1);
    expect(JSON.parse(ls.getItem(LS_PREFIX + 'profiles')!)).toEqual([]);

    await next.recover(ls);
    expect(await next.topAttempts()).toHaveLength(1);
  });
});
