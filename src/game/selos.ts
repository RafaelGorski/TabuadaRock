export type SessionKind = 'novo' | '48h' | '7d' | 'manutenção' | 'final';

export interface RewardFacts {
  original: number;
  firstTryCorrect: number;
  hinted: number;
  requeuedCorrect: number;
}

export interface RewardLedgerEntry {
  eventId: string;
  profileId: string;
  table: number | 'final';
  kind: SessionKind;
  firstTry: number;
  seals: number;
  at: number;
  dueAt?: number;
}

export interface ReviewSchedule {
  firstClearAt?: number;
  dueAt?: number;
  credited: number;
  mastered: boolean;
}

export const DAY = 24 * 60 * 60 * 1000;
export const PRIZES = { small: 120, large: 285 } as const;
export const DEFAULT_BUDGET_CENTS = 7899;

export function firstTryAccuracy(facts: RewardFacts): number {
  return Math.max(0, Math.min(facts.original, facts.firstTryCorrect));
}

export function payout(firstTry: number): number {
  if (firstTry >= 10) return 5;
  if (firstTry === 9) return 4;
  if (firstTry === 8) return 3;
  return 0;
}

export function reviewDue(schedule: ReviewSchedule, now: number): boolean {
  return schedule.credited > 0 && !!schedule.dueAt && now >= schedule.dueAt;
}

export function nextDue(kind: SessionKind, at: number): number | undefined {
  if (kind === 'novo') return at + 2 * DAY;
  if (kind === '48h') return at + 7 * DAY;
  if (kind === '7d' || kind === 'manutenção') return at + 14 * DAY;
  return undefined;
}

export function classifyReview(schedule: ReviewSchedule, at: number): SessionKind {
  if (schedule.firstClearAt === undefined) return 'novo';
  const elapsed = at - schedule.firstClearAt;
  if (schedule.credited === 1 && elapsed >= 2 * DAY) return '48h';
  if (schedule.credited === 2 && elapsed >= 7 * DAY) return '7d';
  return 'manutenção';
}

export function eligiblePayout(kind: SessionKind, firstTry: number, won: boolean): number {
  if (!won || (kind !== 'novo' && kind !== 'final' && firstTry < 9)) return 0;
  return payout(firstTry);
}

export function capAllows(entries: RewardLedgerEntry[], at: number, seals: number): boolean {
  const dayStart = new Date(at).setHours(0, 0, 0, 0);
  const weekStart = dayStart - new Date(at).getDay() * DAY;
  const dayEntries = entries.filter((e) => e.at >= dayStart);
  const weekEntries = entries.filter((e) => e.at >= weekStart);
  return dayEntries.length < 2 && dayEntries.reduce((n, e) => n + e.seals, 0) + seals <= 10 && weekEntries.reduce((n, e) => n + e.seals, 0) + seals <= 30;
}

export function masteryAfter(credited: number, firstTry: number): boolean {
  return credited >= 3 && firstTry >= 8;
}

export function canFinal(lastAt: number | undefined, at: number, allCleared: boolean): boolean {
  return allCleared && (lastAt === undefined || at - lastAt >= 7 * DAY);
}
