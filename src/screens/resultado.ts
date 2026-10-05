import type { ScreenFactory } from '../app';
import { CREATURES } from '../game/creatures';
import { levelById } from '../game/levels';
import { fmt, fmtSec, h } from '../ui/dom';
import { icon } from '../ui/icons';
import { portrait } from '../ui/parts';
import { guard, lineup, nextLevel, safeAreas } from './kit';
import { btn } from './luta-panels';

const WIDE = { top: 0.1, bottom: 0.95, left: 0.5, right: 1 };
const NARROW = { top: 0.03, bottom: 0.32 };

export const resultado: ScreenFactory<'resultado'> = (app, r) => {
  const alive = guard(app);
  const L = levelById(r.level);
  const rival = CREATURES[L.rival];
  const next = nextLevel(L.id);
  const tw = app.world.tw;
  const record = r.prevBest > 0 && r.score > r.prevBest;

  const starEls = [0, 1, 2].map((i) => h('span', { class: 'bigstar', 'data-i': i }, icon('star')));
  const badge = r.firstClear ? 'Primeira vitória nesta tabuada!' : record ? 'Novo recorde pessoal!' : null;
  const stat = (label: string, value: string) => h('div', { class: 'stat' }, h('dt', null, label), h('dd', null, value));

  const recruit = r.recruited
    ? h(
        'figure',
        { class: 'recruit plate plate--ink', hidden: true },
        portrait(app, L.rival, 'recruit__img'),
        h('figcaption', null, h('p', { class: 'recruit__title' }, `${rival.name} entrou para a sua equipe!`), h('blockquote', { class: 'recruit__quote' }, h('p', null, L.join))),
      )
    : null;

  const go = (label: string, ic: Parameters<typeof icon>[0], primary: boolean, run: () => void) =>
    btn(label, ic, primary ? 'btn--primary btn--big' : '', () => {
      app.sound.ok();
      run();
    }, primary);

  const actions = r.crowned
    ? [go('Ver a festa de campeão', 'crown', true, () => app.go('campeao')), go('Voltar para a torre', 'left', false, () => app.go('torre', { level: L.id }))]
    : [
        next ? go(`Próximo oponente: ${next.name}`, 'right', true, () => app.go('mapa', { level: next.id, partner: r.partner })) : null,
        go('Jogar de novo', 'restart', !next, () => app.go('vs', { level: L.id, partner: r.partner })),
        go('Ver recordes', 'trophy', false, () => app.go('recordes', { tab: 'lutas', from: 'torre' })),
      ];

  const el = h(
    'section',
    { 'aria-labelledby': 'res-title', class: 'split split--wide resultado' },
    h(
      'div',
      { class: 'split__main' },
      h('h1', { class: 'title res__title', id: 'res-title' }, h('span', null, L.name), h('span', { class: 'sr-only' }, ': '), h('span', null, 'Vitória!')),
      h(
        'div',
        { class: 'res__hero' },
        h('div', { class: 'bigstars', role: 'img', 'aria-label': `${r.stars} de 3 estrelas` }, starEls),
        h('p', { class: 'res__score' }, h('b', null, fmt(r.score)), ' pontos'),
      ),
      badge ? h('p', { class: 'chip chip--ouro res__badge' }, icon('star'), badge) : null,
      r.rank ? h('p', { class: 'res__rank' }, icon('trophy'), `${r.rank}º lugar entre as 10 melhores lutas da casa.`) : null,
      h(
        'dl',
        { class: 'stats' },
        stat('Acertos', String(r.correct)),
        stat('Erros', String(r.mistakes)),
        stat('Tempo por acerto', r.correct ? fmtSec(r.ms / r.correct) : '–'),
        stat('Maior sequência', String(r.maxCombo)),
        stat('Round perfeito', r.perfect ? 'Sim' : 'Não'),
      ),
      h('p', { class: 'res__tip' }, r.stars < 3 ? `Para ganhar 3 estrelas, complete o duelo sem errar. Desta vez foram ${r.mistakes} erros.` : 'Três estrelas! Você venceu sem nenhum erro.'),
      recruit,
      h('div', { class: 'actions' }, actions),
    ),
  );

  async function reveal() {
    const cast = lineup(app, L.stage, [r.partner], 1.5, { yaw: -0.2 });
    void cast[0].cheer(tw, 3);
    void tw.wait(2.6).then(() => {
      if (alive()) app.music.play('menu');
    });
    if (app.reduced) {
      starEls.forEach((s, i) => s.classList.toggle('is-on', i < r.stars));
    } else {
      for (let i = 0; i < 3; i++) {
        await tw.wait(i ? 0.32 : 0.5);
        if (!alive()) return;
        if (i < r.stars) {
          starEls[i].classList.add('is-on');
          app.sound.star(i);
        }
      }
    }
    void app.say(`${fmt(r.score)} pontos. ${r.stars} ${r.stars === 1 ? 'estrela' : 'estrelas'}.`);
    if (!recruit) return;
    await tw.wait(0.9);
    if (!alive()) return;
    // On wide screens the card docks under the cast, so the pair is framed above it.
    off();
    off = safeAreas(app, { ...WIDE, bottom: 0.7 }, NARROW);
    const both = lineup(app, L.stage, [r.partner, L.rival], 1.7, { yaw: -0.2 }, false);
    void both[1].enter(tw, 5).then(() => {
      if (alive()) void both[1].cheer(tw, 2);
    });
    recruit.hidden = false;
    app.music.jingle('recruta');
    void app.say(`${rival.name} entrou para a sua equipe! ${L.join}`);
  }

  let off = () => {};
  return {
    el,
    enter() {
      off = safeAreas(app, WIDE, NARROW);
      void reveal();
    },
    leave: () => off(),
    back() {
      app.sound.back();
      app.go('torre', { level: L.id });
    },
  };
};
