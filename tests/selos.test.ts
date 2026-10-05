import { describe, expect, it } from 'vitest';
import { MapBackend } from '../src/data/db';
import { Store, normalizeRewardState } from '../src/data/store';
import {
  DAY,
  PRIZES,
  approvalBlock,
  approvePrize,
  awardSession,
  capAllows,
  classifyReview,
  emptyRewardState,
  firstTryFromAttempts,
  masteryAfter,
  nextDue,
  payout,
  removeLedgerEntry,
  reviewDue,
  rollingSpend,
  type RewardLedgerEntry,
  type RewardState,
  type SessionAward,
} from '../src/game/selos';

const facts = (count = 10) => Array.from({ length: count }, (_, index) => `2x${index + 1}`);

function enabledState(): RewardState {
  const state = emptyRewardState();
  state.settings.enabled = true;
  state.settings.acknowledged = true;
  state.settings.pin = '1234';
  return state;
}

function session(patch: Partial<SessionAward> = {}): SessionAward {
  return {
    eventId: 'event-1',
    profileId: 'profile-1',
    table: 2,
    trained: true,
    firstClear: true,
    allTablesCleared: false,
    won: true,
    firstTry: 10,
    correctFacts: facts(),
    at: new Date('2026-01-05T12:00:00').getTime(),
    ...patch,
  };
}

describe('pontuação dos Selos de Domínio', () => {
  it('paga exatamente 0, 3, 4 e 5 selos nos limiares', () => {
    expect([7, 8, 9, 10].map(payout)).toEqual([0, 3, 4, 5]);
  });

  it('dica invalida o primeiro golpe correto', () => {
    expect(firstTryFromAttempts([{ fact: '2x2', correct: true, hinted: true }])).toEqual({ correct: 0, facts: [] });
  });

  it('correção reencaminhada não adiciona uma nova tentativa', () => {
    expect(firstTryFromAttempts([
      { fact: '2x2', correct: false, hinted: false },
      { fact: '2x2', correct: true, hinted: false },
      { fact: '2x3', correct: true, hinted: false },
    ])).toEqual({ correct: 1, facts: ['2x3'] });
  });

  it('exige 9/10 para pagar uma revisão', () => {
    const first = awardSession(enabledState(), session());
    const due = first.state.reviews['2'].dueAt!;
    const eight = awardSession(first.state, session({ eventId: 'review-8', firstClear: false, firstTry: 8, correctFacts: facts(8), at: due }));
    expect(eight.reason).toBe('credited');
    expect(eight.entry?.seals).toBe(0);
    const base = awardSession(enabledState(), session());
    const nine = awardSession(base.state, session({ eventId: 'review-9', firstClear: false, firstTry: 9, correctFacts: facts(9), at: base.state.reviews['2'].dueAt }));
    expect(nine.entry?.seals).toBe(4);
  });
});

describe('agenda, elegibilidade e domínio', () => {
  it('agenda revisões absolutas em 48h, 7d e 14d', () => {
    expect(nextDue('novo', 100)).toBe(100 + 2 * DAY);
    expect(nextDue('48h', 100)).toBe(100 + 7 * DAY);
    expect(nextDue('7d', 100)).toBe(100 + 14 * DAY);
    expect(nextDue('manutenção', 100)).toBe(100 + 14 * DAY);
    expect(classifyReview({ credited: 1, factCredits: {}, mastered: false })).toBe('48h');
    expect(classifyReview({ credited: 2, factCredits: {}, mastered: false })).toBe('7d');
  });

  it('mudança do relógio não libera antes do instante armazenado', () => {
    const schedule = { credited: 1, dueAt: 10_000, factCredits: {}, mastered: false };
    expect(reviewDue(schedule, -1_000_000)).toBe(false);
    expect(reviewDue(schedule, 9_999)).toBe(false);
    expect(reviewDue(schedule, 10_000)).toBe(true);
  });

  it('só domina quando oito fatos têm crédito em três sessões, incluindo 48h e 7d', () => {
    let result = awardSession(enabledState(), session({ firstTry: 8, correctFacts: facts(8) }));
    result = awardSession(result.state, session({
      eventId: '48h',
      firstClear: false,
      firstTry: 8,
      correctFacts: facts(8),
      at: result.state.reviews['2'].dueAt,
    }));
    expect(result.state.reviews['2'].mastered).toBe(false);
    result = awardSession(result.state, session({
      eventId: '7d',
      firstClear: false,
      firstTry: 8,
      correctFacts: facts(8),
      at: result.state.reviews['2'].dueAt,
    }));
    expect(masteryAfter(result.state.reviews['2'].factCredits)).toBe(true);
    expect(result.state.reviews['2'].mastered).toBe(true);
  });

  it('não credita replay arbitrário nem sessão enquanto pausada', () => {
    const first = awardSession(enabledState(), session());
    expect(awardSession(first.state, session({ eventId: 'replay', firstClear: false, at: session().at + DAY })).reason).toBe('not-eligible');
    const paused = enabledState();
    paused.settings.paused = true;
    expect(awardSession(paused, session()).reason).toBe('paused');
  });
});

describe('ledger e caps', () => {
  const at = new Date('2026-01-07T12:00:00').getTime();
  const entry = (eventId: string, seals: number, offset = 0): RewardLedgerEntry => ({
    eventId,
    profileId: 'profile-1',
    table: 2,
    kind: 'novo',
    firstTry: 10,
    correctFacts: facts(),
    seals,
    at: at + offset,
  });

  it('impõe duas sessões, dez selos diários e trinta semanais', () => {
    expect(capAllows([entry('1', 5)], at, 6)).toBe(false);
    expect(capAllows([entry('1', 5), entry('2', 0)], at, 1)).toBe(false);
    expect(capAllows([entry('1', 28, -DAY)], at, 3)).toBe(false);
    expect(capAllows([entry('1', 5, -2 * DAY)], at, 5)).toBe(true);
  });

  it('trata eventId duplicado como idempotente no motor e no Store', async () => {
    const first = awardSession(enabledState(), session());
    const duplicate = awardSession(first.state, session());
    expect(duplicate.reason).toBe('duplicate');
    expect(duplicate.state.balance).toBe(5);
    expect(duplicate.state.ledger).toHaveLength(1);

    const store = new Store(new MapBackend('memory'));
    await store.saveRewards('profile-1', enabledState());
    await store.applyRewardSession('profile-1', session());
    const stored = await store.applyRewardSession('profile-1', session());
    expect(stored.reason).toBe('duplicate');
    expect((await store.getRewards('profile-1')).ledger).toHaveLength(1);
  });

  it('excluir entrada suspeita recalcula saldo e agenda', async () => {
    const first = awardSession(enabledState(), session());
    const second = awardSession(first.state, session({
      eventId: 'review',
      firstClear: false,
      at: first.state.reviews['2'].dueAt,
    }));
    const removed = removeLedgerEntry(second.state, 'review');
    expect(removed.balance).toBe(5);
    expect(removed.reviews['2'].credited).toBe(1);

    const store = new Store(new MapBackend('memory'));
    await store.saveRewards('profile-1', second.state);
    expect((await store.deleteRewardEntry('profile-1', 'review')).ledger).toHaveLength(1);
  });
});

describe('pedidos, orçamento e compatibilidade', () => {
  it('subtrai exatamente 120 ou 285 e preserva o restante', () => {
    const small = enabledState();
    small.balance = 150;
    small.pending = { prize: 'small', requestedAt: 0 };
    expect(approvePrize(small, 'small', 1).balance).toBe(30);

    const large = enabledState();
    large.balance = 300;
    large.pending = { prize: 'large', requestedAt: 0 };
    expect(approvePrize(large, 'large', 1).balance).toBe(15);
  });

  it('calcula gasto móvel de 90 dias e impõe intervalo de 30 dias', () => {
    const now = 100 * DAY;
    const state = enabledState();
    state.balance = 500;
    state.settings.approvals = [
      { prize: 'large', seals: 285, priceCents: PRIZES.large.priceCents, at: now - 91 * DAY },
      { prize: 'small', seals: 120, priceCents: PRIZES.small.priceCents, at: now - 29 * DAY },
    ];
    expect(rollingSpend(state.settings, now)).toBe(PRIZES.small.priceCents);
    expect(approvalBlock(state, 'small', now)).toBe('30-days');
    state.settings.approvals[1].at = now - 31 * DAY;
    expect(approvalBlock(state, 'large', now)).toBe('budget');
    state.settings.budgetCents = PRIZES.small.priceCents + PRIZES.large.priceCents;
    expect(approvalBlock(state, 'large', now)).toBeUndefined();
  });

  it('normaliza saves antigos com defaults seguros', () => {
    const state = normalizeRewardState({
      balance: 12,
      ledger: [{ eventId: 'old', profileId: 'p', table: 2, kind: 'novo', firstTry: 8, seals: 3, at: 1 }],
      reviews: { 2: { credited: 1, mastered: false, dueAt: 2 } },
      settings: { enabled: true, pin: '1234', approvals: [3] },
    });
    expect(state.ledger[0].correctFacts).toEqual([]);
    expect(state.reviews['2'].factCredits).toEqual({});
    expect(state.settings.acknowledged).toBe(true);
    expect(state.settings.approvals[0].at).toBe(3);
    expect(state.settings.budgetCents).toBe(7899);
  });
});
