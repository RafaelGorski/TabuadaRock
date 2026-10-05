import * as THREE from 'three';
import type { ScreenFactory } from '../app';
import { summarize } from '../data/store';
import { mastery } from '../game/facts';
import { LEVELS } from '../game/levels';
import { TYPES } from '../game/types';
import { CREATURES } from '../game/creatures';
import { fmt, h } from '../ui/dom';
import { guard, lineup, safeAreas } from './kit';
import { btn } from './luta-panels';

const CONFETTI = ['#FFD21F', '#2440FF', '#FF4A1C', '#22C493', '#FFFFFF'];

export const campeao: ScreenFactory<'campeao'> = (app) => {
  const alive = guard(app);
  const p = app.profile!;
  const s = summarize(p, mastery);
  const tw = app.world.tw;
  const stat = (label: string, value: string) => h('div', { class: 'stat' }, h('dt', null, label), h('dd', null, value));
  const minutes = Math.max(1, Math.round(p.totals.playMs / 60000));
  const played = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;

  const el = h(
    'section',
    { 'aria-labelledby': 'champ-title', class: 'split split--wide campeao' },
    h(
      'div',
      { class: 'split__main' },
      h('h1', { class: 'title campeao__title', id: 'champ-title' }, h('span', null, 'Campeão'), h('span', null, 'da Tabuada!')),
      h('p', { class: 'lede' }, `${p.name} venceu as tabuadas do 2 ao 10 e o desafio final no Monte Roraima. A equipe inteira veio comemorar.`),
      h(
        'dl',
        { class: 'stats' },
        stat('Estrelas', `${s.stars} de ${LEVELS.length * 3}`),
        stat('Contas dominadas', `${s.mastered} de 90`),
        stat('Pontos na torre', fmt(s.total)),
        stat('Tempo jogando', played),
      ),
      h('p', null, s.stars < LEVELS.length * 3 ? 'Ainda faltam estrelas: volte às tabuadas e tente lutar quase sem erros.' : 'Todas as estrelas da torre. Lenda absoluta.'),
      h(
        'div',
        { class: 'actions' },
        btn('Voltar para a torre', 'left', 'btn--primary btn--big', () => app.go('torre'), true),
        btn('Ver recordes', 'trophy', '', () => app.go('recordes', { tab: 'ranking', from: 'torre' })),
      ),
    ),
  );

  let unsub = () => {};
  let off = () => {};
  return {
    el,
    enter() {
      off = safeAreas(app, { top: 0.12, bottom: 0.95, left: 0.46, right: 1 }, { top: 0.03, bottom: 0.36 });
      app.music.play('final');
      app.music.jingle('campeao');
      const cast = lineup(app, 'roraima', p.team, 1.1, { pitch: 0.18 });
      cast.forEach((a, i) =>
        void tw.wait(0.15 * i).then(() => {
          if (alive()) void a.cheer(tw, 3);
        }),
      );
      void app.say(`Campeão da Tabuada! Parabéns, ${p.name}!`);
      const types = [...new Set(p.team.map((id) => TYPES[CREATURES[id].type].color))];
      const at = new THREE.Vector3();
      let t = 0;
      let left = app.reduced ? 1 : 14;
      unsub = app.world.onFrame((gdt) => {
        t -= gdt;
        if (t > 0 || left <= 0) return;
        t = 0.45;
        left--;
        at.set((Math.random() - 0.5) * 7, 4.2, (Math.random() - 0.5) * 1.5);
        app.world.fx.emit('square', at, { count: 26, color: [...CONFETTI, ...types], speed: 2.2, spread: 1, gravity: 2.4, drag: 0.6, life: 2.2, size: 0.12, spin: 6 });
      });
    },
    leave() {
      unsub();
      off();
    },
    back() {
      app.sound.back();
      app.go('torre');
    },
  };
};
