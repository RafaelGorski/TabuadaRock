import { ALL_CREATURES, STARTERS, type CreatureId } from '../game/creatures';
import type { FactStat, FactStats } from '../game/facts';
import { LEVELS } from '../game/levels';
import { LS_PREFIX, MapBackend, openBackend, type Backend, type BackendKind } from './db';
import {
  DEFAULT_BUDGET_CENTS,
  awardSession,
  removeLedgerEntry,
  type Approval,
  type AwardResult,
  type RewardLedgerEntry,
  type RewardState,
  type SessionAward,
} from '../game/selos';

export interface LevelProgress {
  trained: boolean;
  cleared: boolean;
  /** Best stars, 0 to 3. */
  stars: number;
  /** Best score of a full winning match. */
  best: number;
  plays: number;
}

export interface Totals {
  answered: number;
  correct: number;
  playMs: number;
  matches: number;
  wins: number;
}

export interface Profile {
  v: 1;
  id: string;
  name: string;
  starter: CreatureId;
  team: CreatureId[];
  levels: Record<string, LevelProgress>;
  facts: FactStats;
  totals: Totals;
  champion: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Attempt {
  id?: number;
  profileId: string;
  name: string;
  levelId: string;
  score: number;
  stars: number;
  mistakes: number;
  correct: number;
  ms: number;
  avgMs: number;
  maxCombo: number;
  partner: CreatureId;
  at: number;
}

export interface Settings {
  sfx: boolean;
  music: boolean;
  narrator: boolean;
  readAloud: boolean;
  /** Answer the times table out loud instead of typing. */
  speak: boolean;
  shake: boolean;
  keypad: boolean;
  volume: number;
}

export function normalizeRewardState(v: unknown): RewardState {
  const x = isObj(v) ? v : {};
  const s = isObj(x.settings) ? x.settings : {};
  const reviews: RewardState['reviews'] = {};
  if (isObj(x.reviews)) for (const [k, raw] of Object.entries(x.reviews)) {
    const r = isObj(raw) ? raw : {};
    const factCredits: Record<string, number> = {};
    if (isObj(r.factCredits)) for (const [fact, count] of Object.entries(r.factCredits)) factCredits[fact] = Math.max(0, num(count));
    reviews[k] = {
      firstClearAt: num(r.firstClearAt) || undefined,
      dueAt: num(r.dueAt) || undefined,
      credited: Math.max(0, num(r.credited)),
      factCredits,
      mastered: bool(r.mastered),
    };
  }
  const ledger = Array.isArray(x.ledger) ? x.ledger.filter(isObj).map((e) => ({
    ...e,
    at: num(e.at),
    firstTry: Math.max(0, num(e.firstTry)),
    seals: Math.max(0, num(e.seals)),
    correctFacts: Array.isArray(e.correctFacts) ? e.correctFacts.filter((fact): fact is string => typeof fact === 'string') : [],
  })) as RewardLedgerEntry[] : [];
  const approvals: Approval[] = Array.isArray(s.approvals) ? s.approvals.flatMap((raw) => {
    if (typeof raw === 'number') return [{ prize: 'large' as const, seals: 285, priceCents: DEFAULT_BUDGET_CENTS, at: raw }];
    if (!isObj(raw) || (raw.prize !== 'small' && raw.prize !== 'large')) return [];
    return [{ prize: raw.prize, seals: Math.max(0, num(raw.seals)), priceCents: Math.max(0, num(raw.priceCents)), at: num(raw.at) }];
  }) : [];
  return {
    balance: Math.max(0, num(x.balance)),
    ledger,
    reviews,
    settings: {
      enabled: bool(s.enabled),
      acknowledged: bool(s.acknowledged, bool(s.enabled)),
      pin: typeof s.pin === 'string' ? s.pin : '',
      budgetCents: Math.max(0, num(s.budgetCents, DEFAULT_BUDGET_CENTS)),
      paused: bool(s.paused),
      approvals,
    },
    pending: isObj(x.pending) && (x.pending.prize === 'small' || x.pending.prize === 'large') ? { prize: x.pending.prize, requestedAt: num(x.pending.requestedAt) } : null,
    finalLastAt: num(x.finalLastAt) || undefined,
  };
}

export const DEFAULT_SETTINGS: Settings = {
  sfx: true,
  music: true,
  narrator: true,
  readAloud: true,
  speak: false,
  shake: true,
  keypad: false,
  volume: 0.8,
};

export interface BackupFile {
  app: 'tabuadarock';
  version: 1;
  exportedAt: number;
  profiles: Profile[];
  attempts: Attempt[];
  settings: Settings;
}

export type PersistStatus = 'persistente' | 'normal' | 'indisponivel';

export const NAME_MAX = 14;

const now = () => Date.now();
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const bool = (v: unknown, d = false): boolean => (typeof v === 'boolean' ? v : d);
const isCreature = (v: unknown): v is CreatureId => typeof v === 'string' && (ALL_CREATURES as string[]).includes(v);

function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `p-${now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyLevel(): LevelProgress {
  return { trained: false, cleared: false, stars: 0, best: 0, plays: 0 };
}

function normalizeLevel(v: unknown): LevelProgress {
  const l = isObj(v) ? v : {};
  const out: LevelProgress = {
    trained: bool(l.trained),
    cleared: bool(l.cleared),
    stars: Math.max(0, Math.min(3, num(l.stars))),
    best: Math.max(0, num(l.best)),
    plays: Math.max(0, num(l.plays)),
  };
  return out;
}

function normalizeFacts(v: unknown): FactStats {
  const out: FactStats = {};
  if (!isObj(v)) return out;
  for (const [k, s] of Object.entries(v)) {
    if (!/^\d{1,2}x\d{1,2}$/.test(k) || !isObj(s)) continue;
    out[k] = {
      seen: num(s.seen),
      correct: num(s.correct),
      wrong: num(s.wrong),
      hints: num(s.hints),
      streak: num(s.streak),
      bestMs: num(s.bestMs),
      lastMs: num(s.lastMs),
    };
  }
  return out;
}

/**
 * Fills defaults for anything missing. Every read goes through here, so older saves keep
 * working after a redeploy that adds new fields.
 */
export function normalizeProfile(v: unknown): Profile | null {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.name !== 'string') return null;
  const starter = isCreature(v.starter) ? v.starter : STARTERS[0];
  const team = Array.isArray(v.team) ? v.team.filter(isCreature) : [];
  if (!team.includes(starter)) team.unshift(starter);
  const levels: Record<string, LevelProgress> = {};
  const rawLevels = isObj(v.levels) ? v.levels : {};
  for (const l of LEVELS) levels[l.id] = normalizeLevel(rawLevels[l.id]);
  const t = isObj(v.totals) ? v.totals : {};
  return {
    v: 1,
    id: v.id,
    name: v.name.slice(0, NAME_MAX),
    starter,
    team: [...new Set(team)],
    levels,
    facts: normalizeFacts(v.facts),
    totals: {
      answered: num(t.answered),
      correct: num(t.correct),
      playMs: num(t.playMs),
      matches: num(t.matches),
      wins: num(t.wins),
    },
    champion: bool(v.champion) || levels.final.cleared,
    createdAt: num(v.createdAt, now()),
    updatedAt: num(v.updatedAt, now()),
  };
}

export function normalizeAttempt(v: unknown): Attempt | null {
  if (!isObj(v) || typeof v.profileId !== 'string' || typeof v.levelId !== 'string') return null;
  if (!LEVELS.some((l) => l.id === v.levelId)) return null;
  const a: Attempt = {
    profileId: v.profileId,
    name: typeof v.name === 'string' ? v.name.slice(0, NAME_MAX) : '?',
    levelId: v.levelId,
    score: Math.max(0, num(v.score)),
    stars: Math.max(0, Math.min(3, num(v.stars))),
    mistakes: num(v.mistakes),
    correct: num(v.correct),
    ms: num(v.ms),
    avgMs: num(v.avgMs),
    maxCombo: num(v.maxCombo),
    partner: isCreature(v.partner) ? v.partner : STARTERS[0],
    at: num(v.at, now()),
  };
  if (typeof v.id === 'number') a.id = v.id;
  return a;
}

export function normalizeSettings(v: unknown): Settings {
  const s = isObj(v) ? v : {};
  return {
    sfx: bool(s.sfx, DEFAULT_SETTINGS.sfx),
    music: bool(s.music, DEFAULT_SETTINGS.music),
    narrator: bool(s.narrator, DEFAULT_SETTINGS.narrator),
    readAloud: bool(s.readAloud, DEFAULT_SETTINGS.readAloud),
    speak: bool(s.speak, DEFAULT_SETTINGS.speak),
    shake: bool(s.shake, DEFAULT_SETTINGS.shake),
    keypad: bool(s.keypad, DEFAULT_SETTINGS.keypad),
    volume: Math.max(0, Math.min(1, num(s.volume, DEFAULT_SETTINGS.volume))),
  };
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

export function newProfile(name: string, starter: CreatureId): Profile {
  const t = now();
  const p = normalizeProfile({ id: newId(), name: cleanName(name), starter, team: [starter], createdAt: t, updatedAt: t });
  if (!p) throw new Error('Não deu para criar o lutador');
  return p;
}

function mergeFact(a: FactStat | undefined, b: FactStat): FactStat {
  if (!a) return b;
  return a.seen >= b.seen ? a : b;
}

/** Merges two copies of the same profile and keeps the best of each. */
export function mergeProfiles(a: Profile, b: Profile): Profile {
  const levels: Record<string, LevelProgress> = {};
  for (const l of LEVELS) {
    const x = a.levels[l.id];
    const y = b.levels[l.id];
    levels[l.id] = {
      trained: x.trained || y.trained,
      cleared: x.cleared || y.cleared,
      stars: Math.max(x.stars, y.stars),
      best: Math.max(x.best, y.best),
      plays: Math.max(x.plays, y.plays),
    };
  }
  const facts: FactStats = { ...a.facts };
  for (const [k, s] of Object.entries(b.facts)) facts[k] = mergeFact(facts[k], s);
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  return {
    ...newer,
    team: [...new Set([...a.team, ...b.team])],
    levels,
    facts,
    totals: {
      answered: Math.max(a.totals.answered, b.totals.answered),
      correct: Math.max(a.totals.correct, b.totals.correct),
      playMs: Math.max(a.totals.playMs, b.totals.playMs),
      matches: Math.max(a.totals.matches, b.totals.matches),
      wins: Math.max(a.totals.wins, b.totals.wins),
    },
    champion: a.champion || b.champion,
    createdAt: Math.min(a.createdAt, b.createdAt),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

const attemptKey = (a: Attempt) => `${a.profileId}|${a.levelId}|${a.at}|${a.score}`;

export function levelUnlocked(p: Profile, index: number): boolean {
  return index === 0 || !!p.levels[LEVELS[index - 1].id]?.cleared;
}

export interface ProfileSummary {
  total: number;
  stars: number;
  cleared: number;
  highestTable: number | null;
  mastered: number;
  accuracy: number;
}

export function summarize(p: Profile, masteryOf: (s?: FactStat) => number): ProfileSummary {
  let total = 0;
  let stars = 0;
  let cleared = 0;
  let highestTable: number | null = null;
  for (const l of LEVELS) {
    const lp = p.levels[l.id];
    total += lp.best;
    stars += lp.stars;
    if (lp.cleared) {
      cleared++;
      if (l.table !== null) highestTable = Math.max(highestTable ?? 0, l.table);
    }
  }
  let mastered = 0;
  for (let a = 2; a <= 10; a++) for (let b = 1; b <= 10; b++) if (masteryOf(p.facts[`${a}x${b}`]) === 3) mastered++;
  const accuracy = p.totals.answered ? p.totals.correct / p.totals.answered : 0;
  return { total, stars, cleared, highestTable, mastered, accuracy };
}

const MIRROR_KEY = LS_PREFIX + 'espelho';

export class Store {
  private mirrorTimer: ReturnType<typeof setTimeout> | undefined;
  private rewardWrites: Promise<void> = Promise.resolve();

  constructor(
    private be: Backend,
    private mirrorTo?: Storage,
  ) {}

  static async open(): Promise<Store> {
    const be = await openBackend();
    let ls: Storage | undefined;
    try {
      ls = globalThis.localStorage;
    } catch {
      ls = undefined;
    }
    const store = new Store(be, be.kind === 'indexeddb' ? ls : undefined);
    if (ls) await store.recover(ls);
    return store;
  }

  get kind(): BackendKind {
    return this.be.kind;
  }

  /**
   * Brings back data kept outside the main store: the mirror when the store came back empty,
   * and anything a session that could not open IndexedDB saved straight to localStorage.
   */
  async recover(ls: Storage): Promise<void> {
    try {
      const raw = ls.getItem(MIRROR_KEY);
      if (raw && !(await this.be.getAll('profiles')).length) await this.importData(JSON.parse(raw), false);
    } catch (err) {
      console.warn('Espelho de segurança ignorado:', err);
    }
    if (this.be.kind !== 'indexeddb') return;
    try {
      const fallback = new MapBackend('localstorage', ls);
      const [profiles, attempts] = await Promise.all([fallback.getAll('profiles'), fallback.getAll('attempts')]);
      if (!profiles.length && !attempts.length) return;
      await this.importData({ app: 'tabuadarock', profiles, attempts }, false);
      await Promise.all([fallback.clear('profiles'), fallback.clear('attempts')]);
    } catch (err) {
      console.warn('Dados salvos fora do IndexedDB ignorados:', err);
    }
  }

  private scheduleMirror(): void {
    if (!this.mirrorTo) return;
    clearTimeout(this.mirrorTimer);
    this.mirrorTimer = setTimeout(() => void this.writeMirror(), 300);
  }

  private async writeMirror(): Promise<void> {
    try {
      this.mirrorTo?.setItem(MIRROR_KEY, JSON.stringify(await this.exportData()));
    } catch {
      // The mirror is best effort; IndexedDB stays the source of truth.
    }
  }

  async listProfiles(): Promise<Profile[]> {
    const raw = await this.be.getAll<unknown>('profiles');
    return raw
      .map(normalizeProfile)
      .filter((p): p is Profile => !!p)
      .sort((x, y) => y.updatedAt - x.updatedAt);
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    return normalizeProfile(await this.be.get('profiles', id)) ?? undefined;
  }

  async nameTaken(name: string, exceptId?: string): Promise<boolean> {
    const n = cleanName(name).toLocaleLowerCase('pt-BR');
    return (await this.listProfiles()).some((p) => p.id !== exceptId && p.name.toLocaleLowerCase('pt-BR') === n);
  }

  async createProfile(name: string, starter: CreatureId): Promise<Profile> {
    const clean = cleanName(name);
    if (!clean) throw new Error('Escreva um nome para o lutador.');
    if (await this.nameTaken(clean)) throw new Error(`Já existe um lutador chamado ${clean}.`);
    const p = newProfile(clean, starter);
    await this.saveProfile(p);
    return p;
  }

  async saveProfile(p: Profile): Promise<void> {
    p.updatedAt = Math.max(now(), p.updatedAt + 1);
    await this.be.put('profiles', structuredClone(p));
    this.scheduleMirror();
  }

  async deleteProfile(id: string): Promise<void> {
    await this.be.delete('profiles', id);
    const attempts = await this.listAttempts();
    for (const a of attempts) if (a.profileId === id && a.id !== undefined) await this.be.delete('attempts', a.id);
    if ((await this.getActiveProfileId()) === id) await this.setActiveProfileId(null);
    this.scheduleMirror();
  }

  /** Starts the tower again but keeps the name, the starter and the past records. */
  async resetProgress(id: string): Promise<Profile | undefined> {
    const p = await this.getProfile(id);
    if (!p) return undefined;
    const fresh = newProfile(p.name, p.starter);
    const reset: Profile = { ...fresh, id: p.id, createdAt: p.createdAt };
    await this.saveProfile(reset);
    return reset;
  }

  async addAttempt(a: Attempt): Promise<Attempt> {
    const copy = { ...a };
    delete copy.id;
    const key = await this.be.put('attempts', copy);
    this.scheduleMirror();
    return { ...copy, id: key as number };
  }

  async listAttempts(): Promise<Attempt[]> {
    const raw = await this.be.getAll<unknown>('attempts');
    return raw.map(normalizeAttempt).filter((a): a is Attempt => !!a);
  }

  async topAttempts(limit = 10, levelId?: string): Promise<Attempt[]> {
    return (await this.listAttempts())
      .filter((a) => !levelId || a.levelId === levelId)
      .sort((x, y) => y.score - x.score || x.at - y.at)
      .slice(0, limit);
  }

  async getSettings(): Promise<Settings> {
    const rec = await this.be.get<{ key: string; value: unknown }>('meta', 'settings');
    return normalizeSettings(rec?.value);
  }

  async saveSettings(s: Settings): Promise<void> {
    await this.be.put('meta', { key: 'settings', value: normalizeSettings(s) });
    this.scheduleMirror();
  }

  async getRewards(profileId: string): Promise<RewardState> {
    const rec = await this.be.get<{ key: string; value: unknown }>('meta', `rewards:${profileId}`);
    return normalizeRewardState(rec?.value);
  }

  async saveRewards(profileId: string, state: RewardState): Promise<void> {
    await this.be.put('meta', { key: `rewards:${profileId}`, value: normalizeRewardState(state) });
    this.scheduleMirror();
  }

  async creditRewards(profileId: string, entry: RewardLedgerEntry): Promise<RewardState> {
    const state = await this.getRewards(profileId);
    if (state.ledger.some((e) => e.eventId === entry.eventId)) return state;
    state.ledger.push(entry);
    state.balance += entry.seals;
    await this.saveRewards(profileId, state);
    return state;
  }

  async applyRewardSession(profileId: string, session: SessionAward): Promise<AwardResult> {
    let result!: AwardResult;
    this.rewardWrites = this.rewardWrites.then(async () => {
      const state = await this.getRewards(profileId);
      result = awardSession(state, session);
      if (result.reason === 'credited') await this.saveRewards(profileId, result.state);
    });
    await this.rewardWrites;
    return result;
  }

  async deleteRewardEntry(profileId: string, eventId: string): Promise<RewardState> {
    const state = removeLedgerEntry(await this.getRewards(profileId), eventId);
    await this.saveRewards(profileId, state);
    return state;
  }

  async getActiveProfileId(): Promise<string | null> {
    const rec = await this.be.get<{ key: string; value: unknown }>('meta', 'activeProfile');
    return typeof rec?.value === 'string' ? rec.value : null;
  }

  async setActiveProfileId(id: string | null): Promise<void> {
    await this.be.put('meta', { key: 'activeProfile', value: id });
  }

  async getLastBackup(): Promise<number | null> {
    const rec = await this.be.get<{ key: string; value: unknown }>('meta', 'lastBackup');
    return typeof rec?.value === 'number' ? rec.value : null;
  }

  async markBackup(): Promise<void> {
    await this.be.put('meta', { key: 'lastBackup', value: now() });
  }

  async exportData(): Promise<BackupFile> {
    return {
      app: 'tabuadarock',
      version: 1,
      exportedAt: now(),
      profiles: await this.listProfiles(),
      attempts: await this.listAttempts(),
      settings: await this.getSettings(),
    };
  }

  /** Merges a backup into what is already saved. Nothing saved here is ever thrown away. */
  async importData(json: unknown, withSettings = true): Promise<{ profiles: number; attempts: number }> {
    if (!isObj(json) || json.app !== 'tabuadarock' || !Array.isArray(json.profiles)) {
      throw new Error('Esse arquivo não é um backup do Tabuada Rock.');
    }
    let profiles = 0;
    for (const raw of json.profiles) {
      const incoming = normalizeProfile(raw);
      if (!incoming) continue;
      const existing = await this.getProfile(incoming.id);
      const merged = existing ? mergeProfiles(existing, incoming) : incoming;
      await this.be.put('profiles', structuredClone(merged));
      profiles++;
    }
    let attempts = 0;
    if (Array.isArray(json.attempts)) {
      const known = new Set((await this.listAttempts()).map(attemptKey));
      for (const raw of json.attempts) {
        const a = normalizeAttempt(raw);
        if (!a || known.has(attemptKey(a))) continue;
        known.add(attemptKey(a));
        delete a.id;
        await this.be.put('attempts', a);
        attempts++;
      }
    }
    if (withSettings && json.settings) await this.saveSettings(normalizeSettings(json.settings));
    this.scheduleMirror();
    return { profiles, attempts };
  }

  async persistStatus(): Promise<PersistStatus> {
    const s = globalThis.navigator?.storage;
    if (!s?.persisted) return 'indisponivel';
    try {
      return (await s.persisted()) ? 'persistente' : 'normal';
    } catch {
      return 'indisponivel';
    }
  }

  /** Asks the browser not to evict our data when the disk gets full. */
  async requestPersistence(): Promise<PersistStatus> {
    const s = globalThis.navigator?.storage;
    if (!s?.persist) return 'indisponivel';
    try {
      return (await s.persist()) ? 'persistente' : 'normal';
    } catch {
      return 'indisponivel';
    }
  }

  /** Waits for a pending mirror write, used before the page hides. */
  async flush(): Promise<void> {
    if (this.mirrorTimer === undefined) return;
    clearTimeout(this.mirrorTimer);
    this.mirrorTimer = undefined;
    await this.writeMirror();
  }
}
