import type { ScreenFactory } from '../app';
import type { RewardState } from '../game/selos';
import { DEFAULT_BUDGET_CENTS, PRIZES, approvePrize, capState, emptyRewardState, reviewDue, rollingSpend } from '../game/selos';
import { h } from '../ui/dom';
import { guard, safeAreas } from './kit';

const explanation = 'Você ganha Selos de Domínio quando mostra que aprendeu uma tabuada e consegue lembrar dela de novo depois de alguns dias. Treinar ajuda, mas repetir a mesma luta muitas vezes não dá mais selos. Errar não tira nenhum selo: a conta volta para você tentar e aprender. Não existe sequência obrigatória, e faltar um dia não faz você perder nada. Com 120 selos você pode pedir ao responsável o pacote de 800 V-Bucks; com 285, pode pedir o de 2.400. É só um pedido: o jogo não dá nem promete V-Bucks. A compra só acontece se o responsável aprovar.';
const PARENT_PIN = '676767';
const money = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
const date = (at: number) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(at);

export const missao: ScreenFactory<'missao'> = (app) => {
  const alive = guard(app);
  const profile = app.profile!;
  const root = h('section', { class: 'missao', 'aria-labelledby': 'missao-title' });
  const body = h('div', { class: 'missao__body' });
  let state: RewardState = emptyRewardState();
  let parent = false;

  const button = (label: string, run: () => void, primary = false) =>
    h('button', { type: 'button', class: `btn ${primary ? 'btn--primary' : ''}`, onclick: run }, label);

  const save = async (next = state) => {
    state = next;
    await app.store.saveRewards(profile.id, state);
    if (alive()) render();
  };

  const request = (prize: 'small' | 'large') => {
    state.pending = { prize, requestedAt: Date.now() };
    void save();
  };

  const prizeCard = (prize: 'small' | 'large') => {
    const target = PRIZES[prize];
    const ask = button('PEDIR AO RESPONSÁVEL', () => request(prize), true);
    ask.disabled = state.balance < target.seals || !!state.pending;
    return h(
      'article',
      { class: 'missao__prize plate plate--ink' },
      h('span', { class: 'missao__bolt', 'aria-hidden': 'true' }, '⚡'),
      h('h2', null, target.label.toUpperCase()),
      h('p', { class: 'missao__target' }, `META: ${target.seals} SELOS`),
      h('p', null, state.balance >= target.seals ? 'Você já pode fazer o pedido.' : `Próximo passo: faltam ${target.seals - state.balance} selos.`),
      ask,
    );
  };

  const childView = (): HTMLElement => {
    const shown = Math.min(state.balance, PRIZES.large.seals);
    const percent = Math.round(shown / PRIZES.large.seals * 100);
    const meter = h(
      'div',
      {
        class: 'missao__meter',
        role: 'progressbar',
        'aria-label': 'Progresso de Selos de Domínio',
        'aria-valuemin': 0,
        'aria-valuenow': state.balance,
        'aria-valuemax': PRIZES.large.seals,
        style: `--value:${percent}`,
      },
      h('span', null, `${state.balance} de ${PRIZES.large.seals} selos · ${percent}%`),
    );
    return h(
      'section',
      { class: 'missao__child plate plate--paper', 'aria-labelledby': 'missao-title' },
      h('h1', { class: 'title', id: 'missao-title' }, 'MISSÃO ROCK'),
      h('p', { class: 'missao__balance' }, h('strong', null, `${state.balance} SELOS`), ' de Domínio'),
      meter,
      h('div', { class: 'missao__milestones', 'aria-hidden': 'true' }, h('span', null, '25%'), h('span', null, '50%'), h('span', null, '75%'), h('span', null, '120'), h('span', null, '285')),
      state.pending ? h('p', { class: 'missao__notice plate plate--ink' }, `Pedido de ${PRIZES[state.pending.prize].label} aguardando o responsável. Seus selos continuam guardados.`) : null,
      h('p', { class: 'missao__copy' }, explanation),
      h('div', { class: 'missao__prizes' }, prizeCard('small'), prizeCard('large')),
      h('aside', { class: 'missao__paper' }, h('strong', null, 'PARA RESPONSÁVEIS'), h('br'), 'Os prêmios são combinados em família e entregues fora do jogo. Não há compra dentro do TabuadaRock. Selos não têm valor em dinheiro e não podem ser comprados.'),
      h('div', { class: 'missao__controls' }, button('Área do responsável', enterParent)),
    );
  };

  const parentView = (): HTMLElement => {
    const now = Date.now();
    const cap = capState(state.ledger, now);
    const due = Object.entries(state.reviews).filter(([, schedule]) => reviewDue(schedule, now));
    const pending = state.pending;
    const ledger = h(
      'div',
      { class: 'missao__ledger' },
      state.ledger.length
        ? [...state.ledger].reverse().map((entry) =>
            h(
              'article',
              { class: 'missao__entry' },
              h('p', null, h('strong', null, entry.table === 'final' ? 'Desafio final' : `Tabuada do ${entry.table}`), ` · ${entry.kind} · ${entry.firstTry}/10 · ${entry.seals} selos`),
              h('small', null, `${date(entry.at)} · evento ${entry.eventId.slice(0, 8)}`),
              button('Excluir entrada suspeita', () => deleteEntry(entry.eventId)),
            ),
          )
        : h('p', null, 'Ainda não há sessões creditadas.'),
    );
    const requestControls = pending
      ? h(
          'section',
          { class: 'missao__request plate plate--paper' },
          h('h2', null, 'Pedido pendente'),
          h('p', null, `${PRIZES[pending.prize].label} · ${PRIZES[pending.prize].seals} selos · ${money(PRIZES[pending.prize].priceCents)}`),
          h('div', { class: 'missao__controls' },
            button('Aprovar', () => approve(pending.prize), true),
            button('Adiar', () => decideRequest('adiado')),
            button('Recusar', () => decideRequest('recusado')),
          ),
        )
      : h('p', null, 'Nenhum pedido pendente.');
    return h(
      'section',
      { class: 'missao__parent plate plate--ink', 'aria-labelledby': 'parent-title' },
      h('h1', { class: 'title', id: 'parent-title' }, 'ÁREA DO RESPONSÁVEL'),
      h('p', null, 'O PIN é apenas uma barreira de convivência neste aparelho; não é segurança forte. Nenhum pagamento acontece no jogo.'),
      h('div', { class: 'missao__summary' },
        h('p', null, h('strong', null, `${state.balance} selos`), ' disponíveis'),
        h('p', null, `${cap.sessionsToday}/2 sessões hoje · ${cap.sealsToday}/10 selos hoje · ${cap.sealsWeek}/30 selos nesta semana`),
        h('p', null, `Gasto nos últimos 90 dias: ${money(rollingSpend(state.settings, now))} de ${money(state.settings.budgetCents)}`),
        h('p', null, due.length ? `Revisões disponíveis: ${due.map(([table]) => `tabuada do ${table}`).join(', ')}.` : 'Nenhuma revisão disponível agora.'),
      ),
      requestControls,
      h('h2', null, 'Configuração'),
      h('div', { class: 'missao__controls' },
        button(state.settings.paused ? 'Retomar aprovações' : 'Pausar aprovações', () => { state.settings.paused = !state.settings.paused; void save(); }),
        button('Alterar orçamento', changeBudget),
        button('Sair da área do responsável', () => { parent = false; render(); }),
      ),
      h('h2', null, 'Ledger de sessões'),
      ledger,
    );
  };

  function setup() {
    if (!window.confirm('Os Selos apenas permitem um pedido. Qualquer compra e entrega acontecem fora do TabuadaRock e dependem do responsável. Deseja ativar?')) return;
    state.settings = { ...state.settings, enabled: true, acknowledged: true, pin: PARENT_PIN };
    parent = true;
    void save();
  }

  function enterParent() {
    const pin = window.prompt('Digite o PIN do responsável:')?.trim();
    if (pin !== PARENT_PIN) return app.toast('PIN incorreto.', 'erro');
    parent = true;
    render();
  }

  function approve(prize: 'small' | 'large') {
    const target = PRIZES[prize];
    if (!window.confirm(`Confirmar aprovação de ${target.label} por ${money(target.priceCents)}? A entrega acontece fora do jogo e pode depender de disponibilidade.`)) return;
    const pin = window.prompt('Digite novamente o PIN do responsável para aprovar:')?.trim();
    if (pin !== PARENT_PIN) return app.toast('PIN incorreto. Nada foi alterado.', 'erro');
    try {
      void save(approvePrize(state, prize, Date.now()));
    } catch {
      app.toast('O orçamento, o intervalo de 30 dias ou o saldo bloqueia esta aprovação. Os selos continuam intactos.', 'erro');
    }
  }

  function decideRequest(decision: 'adiado' | 'recusado') {
    if (decision === 'recusado') state.pending = null;
    app.toast(`Pedido ${decision}. Nenhum selo foi gasto.`);
    if (decision === 'recusado') void save();
  }

  function changeBudget() {
    const raw = window.prompt('Novo orçamento máximo em reais para 90 dias (use 0 para pausar):', (state.settings.budgetCents / 100).toFixed(2).replace('.', ','));
    if (raw === null) return;
    const cents = Math.round(Number(raw.replace(',', '.')) * 100);
    if (!Number.isFinite(cents) || cents < 0) return app.toast('Informe um valor válido.', 'erro');
    if (cents > DEFAULT_BUDGET_CENTS && !window.confirm(`Este valor supera o padrão de ${money(DEFAULT_BUDGET_CENTS)}. Confirmar aumento do limite?`)) return;
    state.settings.budgetCents = cents;
    state.settings.paused = cents === 0;
    void save();
  }

  function deleteEntry(eventId: string) {
    if (!window.confirm('Excluir esta entrada suspeita? O saldo e as revisões serão recalculados.')) return;
    void app.store.deleteRewardEntry(profile.id, eventId).then((next) => {
      state = next;
      if (alive()) render();
    });
  }

  function render() {
    if (!state.settings.enabled) {
      body.replaceChildren(
        h(
          'section',
          { class: 'missao__setup plate plate--paper', 'aria-labelledby': 'missao-title' },
          h('h1', { class: 'title', id: 'missao-title' }, 'MISSÃO ROCK'),
          h('p', null, 'As recompensas estão desligadas. Um responsável pode ativar os Selos de Domínio e definir um PIN local.'),
          h('p', null, 'Não há compra dentro do jogo, dados de pagamento nem promessa de prêmio. A combinação e a entrega acontecem em família, fora do TabuadaRock.'),
          button('CONFIGURAR COM RESPONSÁVEL', setup, true),
        ),
      );
      return;
    }
    body.replaceChildren(parent ? parentView() : childView());
  }

  root.append(body);
  let off = () => {};
  return {
    el: root,
    enter() {
      off = safeAreas(app, { top: 0.06, bottom: 0.92 }, { top: 0.03, bottom: 0.96 });
      void app.store.getRewards(profile.id).then((loaded) => {
        if (!alive()) return;
        state = loaded;
        render();
      });
    },
    leave() { off(); },
    back() {
      if (parent) {
        parent = false;
        render();
      } else app.go('torre');
    },
  };
};
