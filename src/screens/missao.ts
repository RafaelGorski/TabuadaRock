import type { ScreenFactory } from '../app';
import { PRIZES } from '../game/selos';
import type { RewardState } from '../data/store';
import { h } from '../ui/dom';
import { guard, safeAreas } from './kit';

const explanation = 'Você ganha Selos de Domínio quando mostra que aprendeu uma tabuada e consegue lembrar dela de novo depois de alguns dias. Treinar ajuda, mas repetir a mesma luta muitas vezes não dá mais selos. Errar não tira nenhum selo: a conta volta para você tentar e aprender. Não existe sequência obrigatória, e faltar um dia não faz você perder nada. Com 120 selos você pode pedir ao responsável o pacote de 800 V-Bucks; com 285, pode pedir o de 2.400. É só um pedido: o jogo não dá nem promete V-Bucks. A compra só acontece se o responsável aprovar.';

export const missao: ScreenFactory<'missao'> = (app) => {
  const alive = guard(app);
  const p = app.profile!;
  const root = h('section', { class: 'missao', 'aria-labelledby': 'missao-title' });
  const body = h('div', { class: 'missao__body plate plate--paper' });
  const status = h('p', { class: 'missao__status' });
  const meter = h('div', { class: 'missao__meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': PRIZES.large });
  const controls = h('div', { class: 'missao__controls' });
  let state: RewardState = { balance: 0, ledger: [], reviews: {}, pending: null, settings: { enabled: false, pin: '', budgetCents: 7899, paused: false, rollingSpendCents: 0, approvals: [] } };
  let parent = false;

  const button = (label: string, run: () => void, primary = false) => h('button', { type: 'button', class: `btn ${primary ? 'btn--primary' : ''}`, onclick: run }, label);
  const render = () => {
    controls.replaceChildren();
    body.replaceChildren(
      h('h1', { class: 'title', id: 'missao-title' }, 'MISSÃO ROCK'),
      h('p', { class: 'missao__balance' }, h('strong', null, `${state.balance} SELOS`), ' de Domínio'),
      meter,
      h('p', { class: 'missao__milestones' }, '25% · 50% · 75% · 120 · 285'),
      h('p', { class: 'missao__copy' }, explanation),
      h('div', { class: 'missao__prizes' },
        prize('800 V-BUCKS', PRIZES.small, 'small'),
        prize('2.400 V-BUCKS', PRIZES.large, 'large'),
      ),
      h('p', { class: 'missao__paper' }, h('b', null, 'PARA RESPONSÁVEIS'), h('br'), 'Os prêmios são combinados em família e entregues fora do jogo. Não há compra dentro do TabuadaRock. Selos não têm valor em dinheiro e não podem ser comprados.'),
      status,
      controls,
    );
    meter.setAttribute('aria-valuenow', String(Math.min(PRIZES.large, state.balance)));
    meter.style.setProperty('--value', String(Math.round(Math.min(1, state.balance / PRIZES.large) * 100)));
    meter.textContent = `${Math.round(Math.min(1, state.balance / PRIZES.large) * 100)}%`;
    controls.append(button(parent ? 'Sair da área do responsável' : 'Área do responsável', () => parent ? (parent = false, render()) : enterParent()));
    if (!state.settings.enabled) controls.append(button('Ativar recompensas', () => setup()));
    if (parent) status.textContent = `Ledger: ${state.ledger.length} entradas · Orçamento: R$ ${(state.settings.budgetCents / 100).toFixed(2).replace('.', ',')} · gasto móvel: R$ ${(state.settings.rollingSpendCents / 100).toFixed(2).replace('.', ',')}.`;
    if (state.pending) status.textContent = `Pedido pendente: ${state.pending.prize === 'small' ? '800' : '2.400'} V-BUCKS.`;
    if (parent && state.pending) {
      controls.append(button('Aprovar pedido', () => approve(), true), button('Adiar pedido', () => { state.pending = null; void app.store.saveRewards(p.id, state).then(() => render()); }));
    }
  };
  const prize = (name: string, threshold: number, key: 'small' | 'large') => {
    const can = state.balance >= threshold;
    const ask = button('PEDIR AO RESPONSÁVEL', () => {
      state.pending = { prize: key, requestedAt: Date.now() };
      void app.store.saveRewards(p.id, state).then(() => render());
    });
    ask.disabled = !can || !!state.pending;
    return h('article', { class: 'missao__prize plate plate--ink' }, h('h2', null, name), h('p', null, `${threshold} SELOS`), ask);
  };
  const setup = () => {
    const pin = window.prompt('Crie um PIN do responsável (4 dígitos):')?.trim() ?? '';
    if (!/^\d{4}$/.test(pin)) return app.toast('Use quatro números para criar o PIN.', 'erro');
    state.settings = { ...state.settings, enabled: true, pin };
    void app.store.saveRewards(p.id, state).then(() => render());
  };
  const enterParent = () => {
    const pin = window.prompt('Digite o PIN do responsável:')?.trim();
    if (pin !== state.settings.pin) return app.toast('PIN incorreto.', 'erro');
    parent = true;
    status.textContent = `Ledger: ${state.balance} selos. Orçamento: R$ ${(state.settings.budgetCents / 100).toFixed(2).replace('.', ',')}.`;
    render();
  };
  const approve = () => {
    if (!state.pending) return;
    const cost = state.pending.prize === 'small' ? PRIZES.small : PRIZES.large;
    if (state.balance < cost || state.settings.paused) return app.toast('O pedido não pode ser aprovado agora.', 'erro');
    const now = Date.now();
    if (state.settings.approvals.some((at) => now - at < 30 * 86400000) || state.settings.rollingSpendCents + (cost === 120 ? 3199 : 7899) > state.settings.budgetCents) return app.toast('O limite do responsável bloqueia este pedido.', 'erro');
    state.balance -= cost;
    state.settings.rollingSpendCents += cost === 120 ? 3199 : 7899;
    state.settings.approvals.push(now);
    state.pending = null;
    void app.store.saveRewards(p.id, state).then(() => render());
  };
  render();
  root.append(body);
  let off = () => {};
  return { el: root, enter() { off = safeAreas(app, { top: 0.06, bottom: 0.9 }, { top: 0.03, bottom: 0.94 }); void app.store.getRewards(p.id).then((s) => { if (!alive()) return; state = s; render(); }); }, leave() { off(); }, back() { app.go('torre'); } };
};
