import type { ScreenFactory } from '../app';
import { summarize, type Attempt, type Profile } from '../data/store';
import { mastery } from '../game/facts';
import { LEVELS, levelById } from '../game/levels';
import { fill, fmt, fmtDate, fmtSec, h, type Child } from '../ui/dom';
import { icon, stars, type IconName } from '../ui/icons';
import { portrait } from '../ui/parts';
import { backButton, emptyStage, guard } from './kit';
import type { RecordTab } from './routes';

const TABS: [RecordTab, string, IconName][] = [
  ['ranking', 'Ranking', 'trophy'],
  ['lutas', 'Melhores lutas', 'swords'],
  ['duelo', 'Duelo', 'users'],
  ['dominio', 'Domínio', 'grid'],
];
const MASTERY = ['Nunca viu', 'Viu', 'Aprendendo', 'Dominou'];
const short = (id: string) => {
  const l = levelById(id);
  return l.table === null ? 'Final' : `Tabuada do ${l.table}`;
};

export const recordes: ScreenFactory<'recordes'> = (app, params) => {
  const alive = guard(app);
  let tab: RecordTab = params?.tab ?? 'ranking';
  let profiles: Profile[] = [];
  let lutasLevel = '';
  let duel: [string, string] = ['', ''];
  let dominioId = '';

  const panel = h('div', { role: 'tabpanel', id: 'rec-panel', class: 'rec__panel', tabindex: 0, 'aria-labelledby': `tab-${tab}` });
  const tabs = TABS.map(([id, label, ic]) => {
    const b = h('button', { type: 'button', role: 'tab', id: `tab-${id}`, 'aria-controls': 'rec-panel', class: 'tabs__tab' }, icon(ic), label);
    b.addEventListener('click', () => void select(id));
    return b;
  });

  const leave = () => {
    app.sound.back();
    if (params?.from === 'menu' || !app.profile) app.go('menu');
    else app.go('torre');
  };

  const el = h(
    'section',
    { 'aria-labelledby': 'rec-title', class: 'board' },
    h('div', { class: 'topbar' }, backButton('Voltar', leave)),
    h(
      'div',
      { class: 'board__sheet plate plate--paper' },
      h('h1', { class: 'title board__title', id: 'rec-title' }, 'Recordes'),
      h('div', { role: 'tablist', 'aria-label': 'Tipo de recorde', class: 'tabs' }, tabs),
      panel,
    ),
  );

  const empty = (text: string, action?: HTMLElement) => h('div', { class: 'empty' }, h('p', null, text), action ?? null);
  const who = (p: Pick<Profile, 'starter' | 'name' | 'champion'>) =>
    h('span', { class: 'who' }, portrait(app, p.starter, 'who__img'), h('span', null, p.name), p.champion ? icon('crown', 'who__crown') : null);
  const pick = (label: string, value: string, opts: [string, string][], onChange: (v: string) => void) => {
    const id = `sel-${label.replace(/\W+/g, '')}`;
    const s = h('select', { id }, opts.map(([v, t]) => h('option', { value: v, selected: v === value }, t)));
    s.addEventListener('change', () => onChange(s.value));
    return h('div', { class: 'filter' }, h('label', { for: id, class: 'field__label' }, label), h('div', { class: 'field field--select' }, s));
  };
  /** Explicit table roles keep the semantics when phones restack each row as a card. */
  const table = (caption: string, head: string[], rows: Child[][], rowHead = 1) =>
    h(
      'div',
      { class: 'tablewrap' },
      h(
        'table',
        { class: 'data', role: 'table' },
        h('caption', { class: 'sr-only' }, caption),
        h('thead', { role: 'rowgroup' }, h('tr', { role: 'row' }, head.map((c) => h('th', { scope: 'col', role: 'columnheader' }, c)))),
        h(
          'tbody',
          { role: 'rowgroup' },
          rows.map((r) =>
            h(
              'tr',
              { role: 'row' },
              r.map((c, i) =>
                i === rowHead
                  ? h('th', { scope: 'row', role: 'rowheader' }, c)
                  : h('td', { role: 'cell', 'data-label': head[i], class: head[i] === 'Posição' ? 'data__pos' : null }, c),
              ),
            ),
          ),
        ),
      ),
    );
  const createBtn = () => h('button', { type: 'button', class: 'btn btn--primary', onclick: () => app.go('novo') }, icon('plus'), 'Criar lutador');

  async function ranking(): Promise<Child[]> {
    if (!profiles.length) return [empty('Ninguém lutou ainda. Crie um lutador e vença a primeira tabuada.', createBtn())];
    const rows = profiles
      .map((p) => ({ p, s: summarize(p, mastery) }))
      .sort((a, b) => b.s.total - a.s.total || b.s.stars - a.s.stars);
    return [
      h('p', { class: 'rec__note' }, 'Pontos na torre somam o melhor resultado de cada tabuada. Vencer de novo com mais pontos sobe a sua posição.'),
      table(
        'Ranking dos lutadores',
        ['Posição', 'Lutador', 'Pontos na torre', 'Estrelas', 'Contas dominadas', 'Acertos'],
        rows.map(({ p, s }, i) => [`${i + 1}º`, who(p), fmt(s.total), `${s.stars} de ${LEVELS.length * 3}`, `${s.mastered} de 90`, p.totals.answered ? `${Math.round(s.accuracy * 100)}%` : '–']),
      ),
    ];
  }

  async function lutas(): Promise<Child[]> {
    const list: Attempt[] = await app.store.topAttempts(20, lutasLevel || undefined);
    const byId = new Map(profiles.map((p) => [p.id, p]));
    const filter = pick('Tabuada', lutasLevel, [['', 'Todas'], ...LEVELS.map((l): [string, string] => [l.id, short(l.id)])], (v) => {
      lutasLevel = v;
      void render();
    });
    if (!list.length) return [filter, empty(lutasLevel ? `Ninguém venceu a ${short(lutasLevel)} ainda.` : 'Nenhuma luta vencida ainda. As vitórias aparecem aqui.')];
    return [
      filter,
      table(
        'Melhores lutas',
        ['Posição', 'Lutador', 'Tabuada', 'Pontos', 'Estrelas', 'Golpes levados', 'Tempo por acerto', 'Data'],
        list.map((a, i) => {
          const p = byId.get(a.profileId);
          return [`${i + 1}º`, p ? who(p) : a.name, short(a.levelId), fmt(a.score), stars(a.stars), String(a.mistakes), a.avgMs ? fmtSec(a.avgMs) : '–', fmtDate(a.at)];
        }),
      ),
    ];
  }

  async function duelo(): Promise<Child[]> {
    if (profiles.length < 2) return [empty('O duelo compara dois lutadores tabuada por tabuada. Crie mais um lutador para começar.', createBtn())];
    const [ia, ib] = duel;
    const A = profiles.find((p) => p.id === ia) ?? profiles[0];
    const B = profiles.find((p) => p.id === ib && p.id !== A.id) ?? profiles.find((p) => p.id !== A.id)!;
    duel = [A.id, B.id];
    const opts = profiles.map((p): [string, string] => [p.id, p.name]);
    let wa = 0;
    let wb = 0;
    const rows = LEVELS.map((l) => {
      const x = A.levels[l.id];
      const y = B.levels[l.id];
      const win = x.best === y.best ? null : x.best > y.best ? A : B;
      if (win === A) wa++;
      if (win === B) wb++;
      const cell = (v: typeof x) => (v.cleared ? h('span', { class: 'duel__cell' }, fmt(v.best), stars(v.stars)) : h('span', { class: 'duel__none' }, 'Ainda não venceu'));
      return [short(l.id), cell(x), cell(y), win ? h('b', null, win.name) : 'Empate'];
    });
    return [
      h(
        'div',
        { class: 'duel__pick' },
        pick('Lutador 1', A.id, opts, (v) => ((duel = [v, duel[1] === v ? duel[0] : duel[1]]), void render())),
        pick('Lutador 2', B.id, opts, (v) => ((duel = [duel[0] === v ? duel[1] : duel[0], v]), void render())),
      ),
      h('p', { class: 'duel__score', 'aria-live': 'polite' }, who(A), h('b', null, `${wa} × ${wb}`), who(B)),
      table('Duelo por tabuada', ['Tabuada', A.name, B.name, 'Melhor'], rows, 0),
    ];
  }

  async function dominio(): Promise<Child[]> {
    if (!profiles.length) return [empty('Crie um lutador para ver quais contas ele já domina.', createBtn())];
    const p = profiles.find((x) => x.id === dominioId) ?? profiles.find((x) => x.id === app.profile?.id) ?? profiles[0];
    dominioId = p.id;
    const cols = Array.from({ length: 10 }, (_, i) => i + 1);
    const grid = h(
      'div',
      { class: 'tablewrap' },
      h(
        'table',
        { class: 'mastery' },
        h('caption', { class: 'sr-only' }, `Domínio das contas de ${p.name}`),
        h('thead', null, h('tr', null, h('td'), cols.map((b) => h('th', { scope: 'col' }, `×${b}`)))),
        h(
          'tbody',
          null,
          [2, 3, 4, 5, 6, 7, 8, 9, 10].map((a) =>
            h(
              'tr',
              null,
              h('th', { scope: 'row' }, String(a)),
              cols.map((b) => {
                const m = mastery(p.facts[`${a}x${b}`]);
                return h('td', { 'data-m': m }, String(a * b), h('span', { class: 'sr-only' }, `, ${MASTERY[m]}`));
              }),
            ),
          ),
        ),
      ),
    );
    const s = summarize(p, mastery);
    return [
      pick('Lutador', p.id, profiles.map((x): [string, string] => [x.id, x.name]), (v) => ((dominioId = v), void render())),
      h('p', { class: 'rec__note' }, `${p.name} domina ${s.mastered} de 90 contas. Uma conta fica dominada depois de acertar várias vezes seguidas, rápido.`),
      grid,
      h('ul', { class: 'legend', 'aria-label': 'Legenda' }, MASTERY.map((t, m) => h('li', { 'data-m': m }, h('i', { 'aria-hidden': 'true' }), t))),
    ];
  }

  const BUILD: Record<RecordTab, () => Promise<Child[]>> = { ranking, lutas, duelo, dominio };

  async function render() {
    const focusId = document.activeElement?.id;
    panel.setAttribute('aria-busy', 'true');
    let body: Child[];
    try {
      body = await BUILD[tab]();
    } catch (err) {
      console.error(err);
      body = [empty('Não deu para ler os recordes salvos. Recarregue a página para tentar de novo.')];
    }
    if (!alive()) return;
    fill(panel, body);
    panel.removeAttribute('aria-busy');
    if (focusId?.startsWith('sel-')) document.getElementById(focusId)?.focus();
  }

  async function select(id: RecordTab) {
    if (id !== tab) app.sound.move();
    tab = id;
    tabs.forEach((b, i) => {
      const on = TABS[i][0] === id;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    await render();
  }

  return {
    el,
    async enter() {
      emptyStage(app, 'roraima');
      app.music.play('menu');
      tabs[TABS.findIndex((t) => t[0] === tab)].setAttribute('data-autofocus', '');
      try {
        profiles = await app.store.listProfiles();
      } catch (err) {
        console.error(err);
      }
      if (alive()) void select(tab);
    },
    key(e) {
      const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0) return;
      const moves: Record<string, number> = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
      const n = moves[e.key] as number | undefined;
      if (n === undefined) return;
      e.preventDefault();
      tabs[n].focus();
      void select(TABS[n][0]);
    },
    back: leave,
  };
};
