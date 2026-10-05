import type { LevelDef } from './levels';

export interface FactStat {
  seen: number;
  correct: number;
  wrong: number;
  streak: number;
  bestMs: number;
  lastMs: number;
}

export type FactStats = Record<string, FactStat>;

/** One question. The fact is always stored as a × b, where a is the table it belongs to. */
export interface Question {
  a: number;
  b: number;
  /** a × ? = a·b (the answer is b) */
  reverse: boolean;
  /** show it as b × a */
  flip: boolean;
  /** comes from a table learned earlier */
  review: boolean;
}

export type Rng = () => number;

export const factKey = (a: number, b: number): string => `${a}x${b}`;
export const keyOf = (q: Question): string => factKey(q.a, q.b);
export const answerOf = (q: Question): number => (q.reverse ? q.b : q.a * q.b);

export function makeQuestion(a: number, b: number, extra: Partial<Question> = {}): Question {
  return { a, b, reverse: false, flip: false, review: false, ...extra };
}

export function display(q: Question): { x: string; y: string; result: string } {
  if (q.reverse) return { x: String(q.a), y: '?', result: String(q.a * q.b) };
  return q.flip ? { x: String(q.b), y: String(q.a), result: '?' } : { x: String(q.a), y: String(q.b), result: '?' };
}

export function spoken(q: Question): string {
  if (q.reverse) return `${q.a} vezes quanto dá ${q.a * q.b}?`;
  const [x, y] = q.flip ? [q.b, q.a] : [q.a, q.b];
  return `${x} vezes ${y}`;
}

export interface Explanation {
  fact: string;
  title: string;
  chain: string[];
  text: string;
  swap?: string;
}

function skipCount(a: number, b: number): string[] {
  return Array.from({ length: b }, (_, i) => String(a * (i + 1)));
}

/** The table's own trick, applied to a × b. */
export function explainFact(a: number, b: number): Explanation {
  const p = a * b;
  const fact = `${a} × ${b} = ${p}`;
  if (b === 1) return { fact, title: 'Vezes 1', chain: [String(a)], text: `Uma vez o ${a} é o próprio ${a}.` };
  if (b === 10) return { fact, title: 'Vezes 10', chain: [String(a), `${a}0`], text: `Vezes 10: coloque um zero no final do ${a}.` };
  let e: Pick<Explanation, 'title' | 'chain' | 'text'>;
  switch (a) {
    case 2:
      e = { title: 'Dobrar', chain: [String(b), String(p)], text: `A tabuada do 2 é o dobro: ${b} + ${b} = ${p}.` };
      break;
    case 3:
      e = { title: 'Dobro e mais um', chain: [String(2 * b), `+${b}`, String(p)], text: `O dobro de ${b} é ${2 * b}. Mais ${b}: ${p}.` };
      break;
    case 4:
      e = { title: 'Dobro do dobro', chain: [String(b), String(2 * b), String(p)], text: `Dobre o ${b}: ${2 * b}. Dobre de novo: ${p}.` };
      break;
    case 5:
      e = { title: 'Metade do 10', chain: [String(10 * b), '÷2', String(p)], text: `10 × ${b} = ${10 * b}. A metade é ${p}.` };
      break;
    case 6:
      e = { title: '5 vezes e mais 1', chain: [String(5 * b), `+${b}`, String(p)], text: `5 × ${b} = ${5 * b}. Mais um ${b}: ${p}.` };
      break;
    case 7:
      e = {
        title: '5 vezes e mais 2',
        chain: [String(5 * b), `+${2 * b}`, String(p)],
        text: `5 × ${b} = ${5 * b}. 2 × ${b} = ${2 * b}. Juntos: ${p}.`,
      };
      break;
    case 8:
      e = {
        title: 'Dobro, dobro, dobro',
        chain: [String(b), String(2 * b), String(4 * b), String(p)],
        text: `Dobre o ${b} três vezes: ${2 * b}, ${4 * b}, ${p}.`,
      };
      break;
    case 9:
      e = { title: '10 vezes menos 1', chain: [String(10 * b), `−${b}`, String(p)], text: `10 × ${b} = ${10 * b}. Tire um ${b}: ${p}.` };
      break;
    case 10:
      e = { title: 'Coloque um zero', chain: [String(b), String(p)], text: `Vezes 10: coloque um zero no final do ${b}.` };
      break;
    default:
      e = { title: `Conte de ${a} em ${a}`, chain: skipCount(a, b), text: `Conte de ${a} em ${a}, ${b} vezes.` };
  }
  const swap = b >= 2 && b < a ? `Ou troque a ordem: ${b} × ${a} é a mesma conta, e você já aprendeu na tabuada do ${b}.` : undefined;
  return { fact, ...e, swap };
}

export function explain(q: Question): Explanation {
  if (!q.reverse) return explainFact(q.a, q.b);
  const p = q.a * q.b;
  return {
    fact: `${q.a} × ${q.b} = ${p}`,
    title: 'Golpe reverso',
    chain: skipCount(q.a, q.b),
    text: `Conte de ${q.a} em ${q.a} até chegar no ${p}: foram ${q.b} vezes.`,
  };
}

/** Skip-count hint used while training: the previous total plus one more n. */
export function trainingHint(n: number, b: number): string {
  if (b === 1) return `uma vez o ${n}`;
  return `${n * (b - 1)} + ${n}`;
}

export function makeRng(seed = Date.now()): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Moves items so the same fact never shows up twice in a row (when possible). */
export function spreadRepeats(qs: Question[]): Question[] {
  const out = qs.slice();
  const same = (x: number, y: number) => y >= 0 && y < out.length && keyOf(out[x]) === keyOf(out[y]);
  const clash = (i: number) => same(i, i - 1) || same(i, i + 1);
  for (let i = 1; i < out.length; i++) {
    if (!same(i, i - 1)) continue;
    // Look ahead first, then behind, for a swap that leaves no neighbors equal.
    const spots = [...out.keys()].filter((j) => j > i).concat([...out.keys()].filter((j) => j < i - 1));
    for (const j of spots) {
      [out[i], out[j]] = [out[j], out[i]];
      if (!clash(i) && !clash(j)) break;
      [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

/** Higher means the kid needs this fact more. */
export function weakness(s?: FactStat): number {
  if (!s || s.seen === 0) return 2;
  let w = 1 + s.wrong * 1.2 - Math.min(s.streak, 4) * 0.35;
  if (s.lastMs > 8000) w += 0.6;
  return Math.max(0.25, w);
}

/** 0 = never seen, 1 = seen, 2 = learning, 3 = mastered. */
export function mastery(s?: FactStat): 0 | 1 | 2 | 3 {
  if (!s || s.seen === 0) return 0;
  if (s.streak >= 3 && s.correct >= 3 && s.lastMs > 0 && s.lastMs <= 8000) return 3;
  if (s.correct >= 2 && s.correct / s.seen >= 0.6) return 2;
  return 1;
}

function pickWeighted<T>(items: T[], weight: (t: T) => number, count: number, rng: Rng): T[] {
  const pool = items.slice();
  const out: T[] = [];
  while (out.length < count && pool.length) {
    const total = pool.reduce((sum, it) => sum + weight(it), 0);
    let roll = rng() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      roll -= weight(pool[idx]);
      if (roll <= 0) break;
    }
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function factPool(from: number, to: number): Question[] {
  const out: Question[] = [];
  for (let a = from; a <= to; a++) for (let b = 2; b <= 9; b++) out.push(makeQuestion(a, b));
  return out;
}

export type RoundNumber = 1 | 2 | 3;

/**
 * Round 1 goes in order, round 2 is shuffled, round 3 is shuffled with review facts,
 * reverse questions and the weakest fact again. The final challenge mixes every table.
 */
export function buildRound(level: LevelDef, round: RoundNumber, stats: FactStats, rng: Rng): Question[] {
  const w = (q: Question) => weakness(stats[keyOf(q)]) + 0.5;
  if (level.table !== null) {
    const n = level.table;
    if (round === 1) return range(1, 10).map((b) => makeQuestion(n, b));
    if (round === 2) return spreadRepeats(shuffle(range(1, 10).map((b) => makeQuestion(n, b)), rng));
    const core = range(2, 9).map((b) => makeQuestion(n, b));
    if (n >= 4) {
      for (const i of shuffle(range(0, core.length - 1), rng).slice(0, 3)) core[i] = { ...core[i], reverse: true };
    }
    const items = [...core];
    if (n === 2) {
      items.push(makeQuestion(2, 1), makeQuestion(2, 10));
    } else {
      const pool: Question[] = [];
      for (let a = 2; a < n; a++) for (let b = 2; b <= 9; b++) pool.push(makeQuestion(a, b, { review: true, flip: rng() < 0.5 }));
      items.push(...pickWeighted(pool, w, 2, rng));
    }
    const weakest = range(2, 9)
      .map((b) => makeQuestion(n, b))
      .sort((x, y) => weakness(stats[keyOf(y)]) - weakness(stats[keyOf(x)]))[0];
    if ((stats[keyOf(weakest)]?.wrong ?? 0) > 0) items.push(weakest);
    return spreadRepeats(shuffle(items, rng));
  }
  if (round === 1) return spreadRepeats(pickWeighted(factPool(2, 5), w, 12, rng).map((q) => ({ ...q, flip: rng() < 0.4 })));
  if (round === 2) return spreadRepeats(pickWeighted(factPool(6, 10), w, 12, rng).map((q) => ({ ...q, flip: rng() < 0.4 })));
  const picks = pickWeighted(factPool(2, 10), w, 14, rng);
  const reverseIdx = new Set(shuffle(range(0, picks.length - 1), rng).slice(0, 4));
  return spreadRepeats(
    shuffle(
      picks.map((q, i) => (reverseIdx.has(i) ? { ...q, reverse: true } : { ...q, flip: rng() < 0.4 })),
      rng,
    ),
  );
}

/** Seconds per question, or null when there is no clock. */
export function roundTimer(level: LevelDef, round: RoundNumber): number | null {
  if (round < 3) return null;
  if (level.table === null) return 15;
  if (level.table <= 5) return 20;
  if (level.table <= 8) return 18;
  return 16;
}

export const hintsAllowed = (round: RoundNumber): boolean => round < 3;

/**
 * The rival attacks with a fact the kid already answered this round, so defending is review,
 * never a spoiler. The fact just answered sits out, and missed facts come back more often.
 */
export function rivalQuestion(answered: readonly Question[], missed: ReadonlySet<string>, round: RoundNumber, rng: Rng): Question {
  if (!answered.length) throw new Error('O rival só ataca depois do primeiro golpe');
  const byKey = new Map(answered.map((q) => [keyOf(q), q]));
  const last = keyOf(answered[answered.length - 1]);
  const pool = byKey.size > 1 ? [...byKey.values()].filter((q) => keyOf(q) !== last) : [...byKey.values()];
  const weight = (q: Question) => (missed.has(keyOf(q)) ? 3 : q.b === 1 || q.b === 10 ? 0.35 : 1);
  const pick = pickWeighted(pool, weight, 1, rng)[0];
  return makeQuestion(pick.a, pick.b, { review: pick.review, flip: round > 1 && pick.a !== pick.b && rng() < 0.5 });
}

/** Seconds to answer before the rival's attack lands. */
export const defenseTimer = (round: RoundNumber): number => [12, 10, 8][round - 1];

/** A block is worth 50 points, up to 100 when it comes fast. */
export function blockPoints(ms: number, limitMs: number): number {
  return 50 + Math.round(50 * Math.max(0, Math.min(1, 1 - ms / limitMs)));
}

/** Every hit taken counts, from a wrong attack or a failed block. */
export function starsFor(mistakes: number): 1 | 2 | 3 {
  if (mistakes <= 2) return 3;
  if (mistakes <= 6) return 2;
  return 1;
}

export const PERFECT_ROUND_BONUS = 500;

/** Points for one correct answer: base, speed, combo and a bonus for reverse questions. */
export function pointsFor(ms: number, combo: number, reverse: boolean, hinted: boolean): number {
  const speed = Math.round(Math.max(0, Math.min(1, (10000 - ms) / 8000)) * 100);
  const base = hinted ? 50 : 100;
  return base + (hinted ? 0 : speed) + Math.min(combo, 10) * 10 + (reverse ? 50 : 0);
}

export function record(stats: FactStats, q: Question, correct: boolean, ms: number): FactStat {
  const k = keyOf(q);
  const s = stats[k] ?? (stats[k] = { seen: 0, correct: 0, wrong: 0, streak: 0, bestMs: 0, lastMs: 0 });
  s.seen++;
  s.lastMs = Math.round(ms);
  if (correct) {
    s.correct++;
    s.streak++;
    if (!s.bestMs || ms < s.bestMs) s.bestMs = Math.round(ms);
  } else {
    s.wrong++;
    s.streak = 0;
  }
  return s;
}

/** A queue entry. Only one entry per original question carries the damage. */
export interface Slot {
  q: Question;
  damage: boolean;
}

/** A missed question comes back a little later, carrying its damage with it. */
export function requeue(queue: Slot[], pos: number): void {
  const slot = queue[pos];
  const copy: Slot = { q: { ...slot.q }, damage: slot.damage };
  slot.damage = false;
  const at = Math.min(queue.length, pos + 3);
  queue.splice(at, 0, copy);
}
