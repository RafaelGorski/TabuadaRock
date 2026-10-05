import { describe, expect, it } from 'vitest';
import { DAY, capAllows, canFinal, classifyReview, eligiblePayout, masteryAfter, nextDue, payout, reviewDue } from '../src/game/selos';

describe('Selos de Domínio', () => {
  it('pays only the exact first-try thresholds', () => {
    expect(payout(7)).toBe(0);
    expect(payout(8)).toBe(3);
    expect(payout(9)).toBe(4);
    expect(payout(10)).toBe(5);
    expect(eligiblePayout('48h', 8, true)).toBe(0);
    expect(eligiblePayout('48h', 9, true)).toBe(4);
  });

  it('schedules 48h, 7d and maintenance reviews', () => {
    expect(nextDue('novo', 0)).toBe(2 * DAY);
    expect(nextDue('48h', 0)).toBe(7 * DAY);
    expect(nextDue('7d', 0)).toBe(14 * DAY);
    expect(reviewDue({ credited: 1, dueAt: 2 * DAY, mastered: false }, 2 * DAY - 1)).toBe(false);
    expect(reviewDue({ credited: 1, dueAt: 2 * DAY, mastered: false }, 2 * DAY)).toBe(true);
    expect(classifyReview({ firstClearAt: 0, credited: 1, mastered: false }, 2 * DAY)).toBe('48h');
    expect(classifyReview({ firstClearAt: 2 * DAY, credited: 2, mastered: false }, 9 * DAY)).toBe('7d');
  });

  it('requires three credited accurate sessions for mastery', () => {
    expect(masteryAfter(2, 10)).toBe(false);
    expect(masteryAfter(3, 7)).toBe(false);
    expect(masteryAfter(3, 8)).toBe(true);
  });

  it('enforces two sessions, ten daily and thirty weekly seals', () => {
    const at = new Date('2026-01-07T12:00:00Z').getTime();
    const entry = (n: number, seals: number, offset = 0) => ({ eventId: String(n), profileId: 'p', table: 2, kind: 'novo' as const, firstTry: 10, seals, at: at + offset });
    expect(capAllows([entry(1, 5)], at, 6)).toBe(false);
    expect(capAllows([entry(1, 5), entry(2, 4)], at, 1)).toBe(false);
    expect(capAllows([entry(1, 28, -DAY)], at, 3)).toBe(false);
    expect(capAllows([entry(1, 5, -2 * DAY)], at, 5)).toBe(true);
  });

  it('blocks final challenge until all tables and seven days have passed', () => {
    expect(canFinal(undefined, 0, false)).toBe(false);
    expect(canFinal(0, 7 * DAY - 1, true)).toBe(false);
    expect(canFinal(0, 7 * DAY, true)).toBe(true);
  });
});
