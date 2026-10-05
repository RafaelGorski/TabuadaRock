import { describe, expect, it } from 'vitest';
import {
  answerOf,
  buildDuel,
  buildRound,
  display,
  explain,
  explainFact,
  keyOf,
  makeQuestion,
  makeRng,
  mastery,
  pointsFor,
  record,
  requeue,
  spreadRepeats,
  starsFor,
  type FactStats,
  type Question,
  type Slot,
} from '../src/game/facts';
import { LEVELS, levelById } from '../src/game/levels';
import { MISTAKES_ALLOWED, matchupText } from '../src/game/types';

const noAdjacentRepeats = (qs: Question[]) => qs.every((q, i) => i === 0 || keyOf(q) !== keyOf(qs[i - 1]));

describe('explicações', () => {
  it('every chain from 2×1 to 10×10 ends on the product', () => {
    for (let a = 2; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const e = explainFact(a, b);
        expect(e.fact).toBe(`${a} × ${b} = ${a * b}`);
        expect(e.chain.at(-1)).toBe(String(a * b));
        expect(e.text).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('offers the swap only for facts learned in an earlier table', () => {
    expect(explainFact(7, 3).swap).toContain('tabuada do 3');
    expect(explainFact(3, 7).swap).toBeUndefined();
    expect(explainFact(5, 1).swap).toBeUndefined();
  });

  it('reverse questions count up to the product', () => {
    const e = explain(makeQuestion(6, 4, { reverse: true }));
    expect(e.chain).toEqual(['6', '12', '18', '24']);
    expect(e.title).toBe('Golpe reverso');
  });

  it('shows and answers reverse and flipped questions correctly', () => {
    const rev = makeQuestion(8, 7, { reverse: true });
    expect(display(rev)).toEqual({ x: '8', y: '?', result: '56' });
    expect(answerOf(rev)).toBe(7);
    const flip = makeQuestion(8, 7, { flip: true });
    expect(display(flip)).toEqual({ x: '7', y: '8', result: '?' });
    expect(answerOf(flip)).toBe(56);
  });
});

describe('rounds', () => {
  const tables = LEVELS.filter((l) => l.table !== null);

  it('round 1 walks the table in order', () => {
    for (const l of tables) {
      const qs = buildRound(l, 1, {}, makeRng(1));
      expect(qs.map((q) => q.b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(qs.every((q) => q.a === l.table && !q.reverse)).toBe(true);
    }
  });

  it('round 2 shuffles the same ten facts', () => {
    for (const l of tables) {
      for (let seed = 1; seed <= 20; seed++) {
        const qs = buildRound(l, 2, {}, makeRng(seed));
        expect(qs.map((q) => q.b).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(noAdjacentRepeats(qs)).toBe(true);
      }
    }
  });

  it('round 3 keeps the core facts, adds review, and brings back the weakest fact', () => {
    for (const l of tables) {
      const n = l.table!;
      const stats: FactStats = { [`${n}x7`]: { seen: 3, correct: 1, wrong: 2, streak: 0, bestMs: 4000, lastMs: 9000 } };
      for (let seed = 1; seed <= 20; seed++) {
        const qs = buildRound(l, 3, stats, makeRng(seed));
        const own = qs.filter((q) => q.a === n);
        for (let b = 2; b <= 9; b++) expect(own.some((q) => q.b === b)).toBe(true);
        expect(own.filter((q) => q.b === 7).length).toBe(2);
        expect(qs.filter((q) => q.reverse).length).toBe(n >= 4 ? 3 : 0);
        if (n > 2) {
          const review = qs.filter((q) => q.review);
          expect(review.length).toBe(2);
          expect(review.every((q) => q.a < n)).toBe(true);
        }
        expect(noAdjacentRepeats(qs)).toBe(true);
      }
    }
  });

  it('the final challenge mixes the small tables, then the big ones, then everything', () => {
    const final = levelById('final');
    for (let seed = 1; seed <= 20; seed++) {
      const r1 = buildRound(final, 1, {}, makeRng(seed));
      const r2 = buildRound(final, 2, {}, makeRng(seed));
      const r3 = buildRound(final, 3, {}, makeRng(seed));
      expect(r1).toHaveLength(12);
      expect(r1.every((q) => q.a >= 2 && q.a <= 5)).toBe(true);
      expect(r2).toHaveLength(12);
      expect(r2.every((q) => q.a >= 6 && q.a <= 10)).toBe(true);
      expect(r3).toHaveLength(14);
      expect(r3.filter((q) => q.reverse)).toHaveLength(4);
    }
  });

  it('builds one complete duel per opponent', () => {
    for (const l of tables) {
      const qs = buildDuel(l, {}, makeRng(1));
      expect(qs).toHaveLength(10);
      expect(qs.map((q) => q.b).sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(qs.every((q) => q.a === l.table)).toBe(true);
    }
    const final = buildDuel(levelById('final'), {}, makeRng(1));
    expect(final).toHaveLength(14);
    expect(new Set(final.map((q) => q.a)).size).toBeGreaterThan(5);
  });

  it('spreads a repeated fact apart', () => {
    const q = (b: number) => makeQuestion(3, b);
    const out = spreadRepeats([q(4), q(4), q(5), q(6)]);
    expect(noAdjacentRepeats(out)).toBe(true);
    expect(out.map((x) => x.b).sort()).toEqual([4, 4, 5, 6]);
    const tail = spreadRepeats([q(5), q(6), q(4), q(4)]);
    expect(noAdjacentRepeats(tail)).toBe(true);
    expect(tail.map((x) => x.b).sort()).toEqual([4, 4, 5, 6]);
  });
});

describe('pontos, estrelas e domínio', () => {
  it('stars follow the mistakes', () => {
    expect([0, 1, 2, 3, 4, 9].map(starsFor)).toEqual([3, 2, 2, 2, 1, 1]);
  });

  it('fast, combo and reverse answers earn more; hinted answers earn less', () => {
    expect(pointsFor(1000, 0, false, false)).toBe(200);
    expect(pointsFor(12000, 0, false, false)).toBe(100);
    expect(pointsFor(12000, 25, true, false)).toBe(250);
    expect(pointsFor(1000, 0, false, true)).toBe(50);
  });

  it('a fact is mastered after a quick streak and falls back after a miss', () => {
    const stats: FactStats = {};
    const q = makeQuestion(7, 8);
    expect(mastery(stats[keyOf(q)])).toBe(0);
    record(stats, q, false, 9000);
    expect(mastery(stats[keyOf(q)])).toBe(1);
    record(stats, q, true, 5000);
    record(stats, q, true, 4000);
    expect(mastery(stats[keyOf(q)])).toBe(2);
    record(stats, q, true, 3000);
    expect(mastery(stats[keyOf(q)])).toBe(3);
    expect(stats[keyOf(q)].bestMs).toBe(3000);
    record(stats, q, false, 7000);
    expect(mastery(stats[keyOf(q)])).toBe(2);
  });

  it('a missed question comes back once, and only one copy deals damage', () => {
    const queue: Slot[] = [2, 3, 4, 5, 6].map((b) => ({ q: makeQuestion(4, b), damage: true }));
    requeue(queue, 1);
    expect(queue).toHaveLength(6);
    expect(queue[1].damage).toBe(false);
    expect(queue[4].q.b).toBe(3);
    expect(queue[4].damage).toBe(true);
    expect(queue.filter((s) => s.q.b === 3 && s.damage)).toHaveLength(1);
  });

  it('the type matchup sets how many mistakes a round allows', () => {
    const adv = matchupText('agua', 'fogo');
    expect(adv.kind).toBe('vantagem');
    expect(adv.lives).toContain(String(MISTAKES_ALLOWED.vantagem));
    const bad = matchupText('fogo', 'agua');
    expect(bad.kind).toBe('desvantagem');
    expect(bad.lives).toContain(`só ${MISTAKES_ALLOWED.desvantagem}`);
  });
});
