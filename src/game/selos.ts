export type SessionKind = 'novo' | '48h' | '7d' | 'manutenção' | 'final';
export type PrizeId = 'small' | 'large';

export interface RewardFacts {
  original: number;
  firstTryCorrect: number;
  hinted: number;
  requeuedCorrect: number;
}

export interface FactAttempt {
  fact: string;
  correct: boolean;
  hinted: boolean;
}

export interface RewardLedgerEntry {
  eventId: string;
  profileId: string;
  table: number | 'final';
  kind: SessionKind;
  firstTry: number;
  correctFacts: string[];
  seals: number;
  at: number;
}

export interface ReviewSchedule {
  firstClearAt?: number;
  dueAt?: number;
  credited: number;
  factCredits: Record<string, number>;
  mastered: boolean;
}

export interface Approval {
  prize: PrizeId;
  seals: number;
  priceCents: number;
  at: number;
}

export interface RewardSettings {
  enabled: boolean;
  acknowledged: boolean;
  pin: string;
  budgetCents: number;
  paused: boolean;
  approvals: Approval[];
}

export interface PrizeRequest {
  prize: PrizeId;
  requestedAt: number;
}

export interface RewardState {
  balance: number;
  ledger: RewardLedgerEntry[];
  reviews: Record<string, ReviewSchedule>;
  settings: RewardSettings;
  pending: PrizeRequest | null;
  finalLastAt?: number;
}

export interface SessionAward {
  eventId: string;
  profileId: string;
  table: number | 'final';
  trained: boolean;
  firstClear: boolean;
  allTablesCleared: boolean;
  won: boolean;
  firstTry: number;
  correctFacts: string[];
  at: number;
}

export interface AwardResult {
  state: RewardState;
  entry?: RewardLedgerEntry;
  reason: 'credited' | 'disabled' | 'paused' | 'duplicate' | 'not-eligible' | 'cap';
}

export const DAY = 24 * 60 * 60 * 1000;
export const PRIZES = {
  small: { seals: 120, priceCents: 3199, label: '800 V-Bucks' },
  large: { seals: 285, priceCents: 7899, label: '2.400 V-Bucks' },
} as const;
export const DEFAULT_BUDGET_CENTS = 7899;

export function emptyRewardState(): RewardState {
  return {
    balance: 0,
    ledger: [],
    reviews: {},
    settings: { enabled: false, acknowledged: false, pin: '', budgetCents: DEFAULT_BUDGET_CENTS, paused: false, approvals: [] },
    pending: null,
  };
}

export function firstTryAccuracy(facts: RewardFacts): number {
  return Math.max(0, Math.min(facts.original, facts.firstTryCorrect));
}

export function firstTryFromAttempts(attempts: FactAttempt[]): { correct: number; facts: string[] } {
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const attempt of attempts) {
    if (seen.has(attempt.fact)) continue;
    seen.add(attempt.fact);
    if (attempt.correct && !attempt.hinted) facts.push(attempt.fact);
  }
  return { correct: facts.length, facts };
}

export function payout(firstTry: number): number {
  if (firstTry >= 10) return 5;
  if (firstTry === 9) return 4;
  if (firstTry === 8) return 3;
  return 0;
}

export function reviewDue(schedule: ReviewSchedule, now: number): boolean {
  return schedule.credited > 0 && schedule.dueAt !== undefined && now >= schedule.dueAt;
}

export function nextDue(kind: SessionKind, at: number): number | undefined {
  if (kind === 'novo') return at + 2 * DAY;
  if (kind === '48h') return at + 7 * DAY;
  if (kind === '7d' || kind === 'manutenção') return at + 14 * DAY;
  return undefined;
}

export function classifyReview(schedule: ReviewSchedule): SessionKind {
  if (schedule.credited === 0) return 'novo';
  if (schedule.credited === 1) return '48h';
  if (schedule.credited === 2) return '7d';
  return 'manutenção';
}

export function eligiblePayout(kind: SessionKind, firstTry: number, won: boolean): number {
  if (!won || (kind !== 'novo' && firstTry < 9)) return 0;
  return payout(firstTry);
}

function localDayKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function localWeekStart(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

export function capState(entries: RewardLedgerEntry[], at: number): { sessionsToday: number; sealsToday: number; sealsWeek: number } {
  const day = localDayKey(at);
  const week = localWeekStart(at);
  const today = entries.filter((entry) => localDayKey(entry.at) === day);
  return {
    sessionsToday: today.length,
    sealsToday: today.reduce((sum, entry) => sum + entry.seals, 0),
    sealsWeek: entries.filter((entry) => entry.at >= week && entry.at <= at).reduce((sum, entry) => sum + entry.seals, 0),
  };
}

export function capAllows(entries: RewardLedgerEntry[], at: number, seals: number): boolean {
  const cap = capState(entries, at);
  return cap.sessionsToday < 2 && cap.sealsToday + seals <= 10 && cap.sealsWeek + seals <= 30;
}

export function masteryAfter(factCredits: Record<string, number>): boolean {
  return Object.values(factCredits).filter((count) => count >= 3).length >= 8;
}

export function canFinal(lastAt: number | undefined, at: number, allCleared: boolean): boolean {
  return allCleared && (lastAt === undefined || at >= lastAt + 7 * DAY);
}

function sessionKind(state: RewardState, session: SessionAward): SessionKind | undefined {
  if (!session.won) return undefined;
  if (session.table === 'final') return canFinal(state.finalLastAt, session.at, session.allTablesCleared) ? 'final' : undefined;
  const schedule = state.reviews[String(session.table)];
  if (!schedule) return session.trained && session.firstClear ? 'novo' : undefined;
  return reviewDue(schedule, session.at) ? classifyReview(schedule) : undefined;
}

function updateReview(schedule: ReviewSchedule | undefined, entry: RewardLedgerEntry): ReviewSchedule {
  const next: ReviewSchedule = schedule
    ? { ...schedule, factCredits: { ...schedule.factCredits } }
    : { credited: 0, factCredits: {}, mastered: false };
  next.firstClearAt ??= entry.at;
  next.credited++;
  for (const fact of new Set(entry.correctFacts)) next.factCredits[fact] = (next.factCredits[fact] ?? 0) + 1;
  next.dueAt = nextDue(entry.kind, entry.at);
  next.mastered = masteryAfter(next.factCredits);
  return next;
}

export function awardSession(current: RewardState, session: SessionAward): AwardResult {
  const state = structuredClone(current);
  if (!state.settings.enabled) return { state, reason: 'disabled' };
  if (state.settings.paused) return { state, reason: 'paused' };
  if (state.ledger.some((entry) => entry.eventId === session.eventId)) return { state, reason: 'duplicate' };
  const kind = sessionKind(state, session);
  if (!kind) return { state, reason: 'not-eligible' };
  const seals = eligiblePayout(kind, session.firstTry, session.won);
  if (!capAllows(state.ledger, session.at, seals)) return { state, reason: 'cap' };
  const entry: RewardLedgerEntry = {
    eventId: session.eventId,
    profileId: session.profileId,
    table: session.table,
    kind,
    firstTry: session.firstTry,
    correctFacts: [...new Set(session.correctFacts)],
    seals,
    at: session.at,
  };
  state.ledger.push(entry);
  state.balance += seals;
  if (session.table === 'final') state.finalLastAt = session.at;
  else state.reviews[String(session.table)] = updateReview(state.reviews[String(session.table)], entry);
  return { state, entry, reason: 'credited' };
}

export function removeLedgerEntry(current: RewardState, eventId: string): RewardState {
  const removed = current.ledger.find((entry) => entry.eventId === eventId);
  if (!removed) return structuredClone(current);
  const state = structuredClone(current);
  state.ledger = state.ledger.filter((entry) => entry.eventId !== eventId);
  state.balance = Math.max(0, state.balance - removed.seals);
  state.reviews = {};
  state.finalLastAt = undefined;
  for (const entry of [...state.ledger].sort((a, b) => a.at - b.at)) {
    if (entry.table === 'final') state.finalLastAt = Math.max(state.finalLastAt ?? 0, entry.at);
    else state.reviews[String(entry.table)] = updateReview(state.reviews[String(entry.table)], entry);
  }
  return state;
}

export function rollingSpend(settings: RewardSettings, at: number): number {
  return settings.approvals
    .filter((approval) => approval.at <= at && approval.at >= at - 90 * DAY)
    .reduce((sum, approval) => sum + approval.priceCents, 0);
}

export function approvalBlock(state: RewardState, prize: PrizeId, at: number): 'paused' | 'balance' | 'budget' | '30-days' | undefined {
  const target = PRIZES[prize];
  if (state.settings.paused || state.settings.budgetCents === 0) return 'paused';
  if (state.balance < target.seals) return 'balance';
  if (state.settings.approvals.some((approval) => approval.at <= at && approval.at > at - 30 * DAY)) return '30-days';
  if (rollingSpend(state.settings, at) + target.priceCents > state.settings.budgetCents) return 'budget';
  return undefined;
}

export function approvePrize(current: RewardState, prize: PrizeId, at: number): RewardState {
  const state = structuredClone(current);
  if (!state.pending || state.pending.prize !== prize) throw new Error('Não há este pedido pendente.');
  const block = approvalBlock(state, prize, at);
  if (block) throw new Error(block);
  const target = PRIZES[prize];
  state.balance -= target.seals;
  state.settings.approvals.push({ prize, seals: target.seals, priceCents: target.priceCents, at });
  state.pending = null;
  return state;
}
