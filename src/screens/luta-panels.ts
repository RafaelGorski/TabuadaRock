import { explain, type Question } from '../game/facts';
import { fmt, h, type Child } from '../ui/dom';
import { icon, type IconName } from '../ui/icons';

export const btn = (label: string, ic: IconName, cls: string, run: () => void, auto = false): HTMLButtonElement =>
  h('button', { type: 'button', class: `btn ${cls}`, onclick: run, 'data-autofocus': auto ? '' : undefined }, icon(ic), label);

/** Text the narrator can read: symbols become words. */
export const speakable = (s: string): string =>
  s
    .replace(/×/g, ' vezes ')
    .replace(/−/g, ' menos ')
    .replace(/÷/g, ' dividido por ')
    .replace(/\+/g, ' mais ')
    .replace(/\s+/g, ' ')
    .trim();

const factLine = (q: Question): string => `${q.a} × ${q.b} = ${q.a * q.b}`;

/** After a mistake: the fact, the table's trick as a chain of steps, and what to type to go on. */
export function explainBody(q: Question, answer: number): { title: string; body: Child[]; say: string } {
  const e = explain(q);
  const shown = q.reverse ? `${q.a} × ${q.b} = ${q.a * q.b}` : q.flip ? `${q.b} × ${q.a} = ${q.a * q.b}` : e.fact;
  const chain = h(
    'ol',
    { class: 'chain', 'aria-label': 'Passo a passo' },
    e.chain.map((c, i) => h('li', { class: i === e.chain.length - 1 ? 'chain__step is-result' : 'chain__step' }, c)),
  );
  return {
    title: shown,
    body: [
      h('p', { class: 'fp__trick' }, icon('bulb'), h('b', null, e.title)),
      chain,
      h('p', null, e.text),
      e.swap ? h('p', { class: 'fp__swap' }, e.swap) : null,
      h('p', { class: 'fp__ask' }, 'Digite ', h('b', null, String(answer)), ' na conta para continuar.'),
    ],
    say: speakable(`${shown}. ${e.text}`),
  };
}

export interface RoundStats {
  round: number;
  score: number;
  mistakes: number;
  maxCombo: number;
  perfect: boolean;
}

const stat = (label: string, value: string) => h('div', { class: 'stat' }, h('dt', null, label), h('dd', null, value));

export function betweenBody(s: RoundStats, next: string, onNext: () => void, onTorre: () => void): Child[] {
  return [
    h(
      'dl',
      { class: 'stats' },
      stat('Pontos', fmt(s.score)),
      stat('Erros neste round', String(s.mistakes)),
      stat('Maior sequência', String(s.maxCombo)),
    ),
    s.perfect ? h('p', { class: 'fp__good' }, icon('star'), `Round perfeito! Mais 500 pontos.`) : null,
    h('p', null, next),
    h('div', { class: 'actions' }, btn('Próximo round', 'right', 'btn--primary btn--big', onNext, true), btn('Parar e voltar depois', 'left', '', onTorre)),
    h('p', { class: 'fp__note' }, 'Se parar agora, a torre guarda este ponto e você continua do próximo round.'),
  ];
}

export function lostBody(
  rival: string,
  missed: Question[],
  o: { retry: () => void; train: (() => void) | null; torre: () => void },
): Child[] {
  return [
    h('p', null, `${rival} venceu o duelo. Estas contas escaparam. Leia em voz alta antes de tentar de novo:`),
    h('ul', { class: 'missed' }, missed.map((q) => h('li', null, factLine(q)))),
    h(
      'div',
      { class: 'actions' },
      btn('Tentar o duelo de novo', 'restart', 'btn--primary btn--big', o.retry, true),
      o.train ? btn('Treinar esta tabuada', 'bulb', '', o.train) : null,
      btn('Voltar para a torre', 'left', '', o.torre),
    ),
  ];
}

export function pauseBox(onResume: () => void, onQuit: () => void): HTMLElement {
  return h(
    'div',
    { class: 'pause', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pause-title' },
    h(
      'div',
      { class: 'pause__box plate plate--paper' },
      h('h2', { class: 'fp__title', id: 'pause-title' }, 'Pausa'),
      h('p', null, 'A luta e o relógio estão parados.'),
      h('div', { class: 'actions' }, btn('Continuar a luta', 'play', 'btn--primary btn--big', onResume, true), btn('Sair da luta', 'close', '', onQuit)),
      h('p', { class: 'fp__note' }, 'Se sair agora, o duelo recomeça do início.'),
    ),
  );
}
