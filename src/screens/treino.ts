import * as THREE from 'three';
import type { ScreenFactory } from '../app';
import type { Actor } from '../engine/world';
import { CREATURES } from '../game/creatures';
import { trainingHint } from '../game/facts';
import { levelById } from '../game/levels';
import { announce, fill, h, type Child } from '../ui/dom';
import { icon, type IconName } from '../ui/icons';
import { Announcer, Pins } from '../ui/parts';
import { QuestionPlate } from '../ui/question';
import { backButton, guard, isWide, keys, progressOf } from './kit';

type Phase = 'intro' | 'ask' | 'summary' | 'fire' | 'done';

export const treino: ScreenFactory<'treino'> = (app, { level, partner }) => {
  const alive = guard(app);
  const L = levelById(level);
  const n = L.table ?? 2;
  const p = app.profile!;
  const me = CREATURES[partner];
  const rival = CREATURES[L.rival];
  const tw = app.world.tw;
  const pins = new Pins(app);
  const ann = new Announcer(app);
  const plate = new QuestionPlate(app, { hintKey: false });
  const panel = h('section', { class: 'coach plate plate--paper', 'aria-labelledby': 'coach-title' });
  const step = h('p', { class: 'coach__step plate plate--ink', hidden: true });
  let phase: Phase = 'intro';
  let b = 0;
  let misses = 0;
  let busy = false;
  let actors: Actor[] = [];
  const P = (k: number) => n * k;

  const btn = (label: string, ic: IconName, cls: string, run: () => void, auto = false) =>
    h('button', { type: 'button', class: `btn ${cls}`, onclick: run, 'data-autofocus': auto ? '' : undefined }, icon(ic), label);

  const toTorre = () => {
    app.sound.back();
    app.go('torre', { level });
  };

  const el = h(
    'section',
    { 'aria-labelledby': 'treino-title', class: 'treino' },
    h('div', { class: 'topbar' }, backButton('Torre', toTorre), h('h1', { class: 'topbar__title', id: 'treino-title' }, `Treino da tabuada do ${n}`)),
    pins.el,
    step,
    ann.el,
    panel,
    plate.el,
    keys(['Enter', 'confirmar'], ['Esc', 'voltar para a torre']),
  );

  el.addEventListener('pointerdown', (e) => {
    if (phase === 'ask' && !(e.target as Element).closest('input, button, a, label')) e.preventDefault();
  });

  function setPanel(title: string | null, ...body: Child[]) {
    panel.hidden = !title;
    if (!title) return panel.replaceChildren();
    fill(panel, h('h2', { class: 'coach__title', id: 'coach-title' }, title), body);
    layout();
    app.focusStart(panel);
  }

  /** Wide screens: plate below or panel to the right. Narrow: 3D on top, UI below. */
  function layout() {
    const side = !panel.hidden;
    if (isWide()) app.world.setSafeArea(side ? { top: 0.12, bottom: 0.95, left: 0, right: 0.6 } : { top: 0.12, bottom: 0.66 });
    else app.world.setSafeArea(side ? { top: 0.08, bottom: 0.42 } : { top: 0.1, bottom: 0.5 });
    frame(false);
  }

  function frame(cut: boolean) {
    app.world.rig.frame({ points: [...app.orbs.bounds(), ...app.world.pointsOf(actors)], pitch: 0.06, pad: 0.05, speed: 2.2 }, cut);
  }

  const guide = (k: number) =>
    k === 1 ? `1 fileira de ${n} bolinhas: uma vez o ${n}.` : `${k} fileiras de ${n}. Pegue o total de antes e some mais ${n}: ${trainingHint(n, k)}.`;

  function intro() {
    phase = 'intro';
    setPanel(
      'Como funciona',
      h('p', null, `Cada fileira tem ${n} bolinhas. A cada conta, aparece mais uma fileira. Digite quantas bolinhas tem ao todo.`),
      h('p', null, `No fim, ${me.name} solta todas as bolinhas no boneco de treino.`),
      h('div', { class: 'actions' }, btn('Começar o treino', 'play', 'btn--primary btn--big', start, true)),
    );
  }

  function start() {
    app.sound.ok();
    b = 0;
    pins.clear();
    app.orbs.setTable(n);
    setPanel(null);
    phase = 'ask';
    step.hidden = false;
    layout();
    ask();
  }

  function ask() {
    b++;
    misses = 0;
    app.orbs.showRows(b);
    app.sound.orb(b);
    step.textContent = `Fileira ${b} de 10`;
    plate.show({ x: String(n), y: String(b), result: '?' }, `${n} vezes ${b}`);
    plate.setHint(guide(b));
    if (app.settings.readAloud) void app.say(`${n} vezes ${b}`);
  }

  plate.onSubmit = (v) => {
    if (busy || phase !== 'ask') return;
    if (v === P(b)) return void right();
    misses++;
    plate.flash('erro');
    app.sound.wrong();
    plate.clear();
    if (misses === 1 && b > 1) plate.setHint(`Ainda não. Antes eram ${P(b - 1)}. Some mais ${n}: ${P(b - 1)} + ${n}.`);
    else plate.setHint(`${n} × ${b} = ${P(b)}. Digite ${P(b)} para seguir.`, 'pedido');
    announce(plate.el.querySelector('.qplate__hint')?.textContent ?? '');
    plate.focus();
  };

  async function right() {
    busy = true;
    plate.lock(true);
    plate.flash('ok');
    app.sound.correct();
    announce(`Isso! ${n} vezes ${b} é ${P(b)}.`);
    pins.add(app.orbs.rowEnd(b - 1), String(P(b)), 'pin pin--total');
    if (b % 3 === 0) void actors[0]?.cheer(tw, 1);
    await tw.wait(0.5);
    if (!alive()) return;
    busy = false;
    if (b < 10) ask();
    else summary();
  }

  function summary() {
    phase = 'summary';
    plate.hide();
    step.hidden = true;
    void actors[0]?.cheer(tw, 2);
    app.sound.sparkle();
    const known = Math.max(0, n - 2);
    const rows = Array.from({ length: 10 }, (_, i) => i + 1).map((k) =>
      h(
        'li',
        { class: k > 1 && k < n ? 'tab__row is-known' : 'tab__row' },
        h('span', { class: 'tab__fact' }, `${n} × ${k} = `, h('b', null, String(P(k)))),
        k > 1 && k < n ? h('span', { class: 'chip chip--menta' }, icon('check'), 'Já sabe') : null,
      ),
    );
    setPanel(
      `Tabuada do ${n} completa!`,
      h('ol', { class: 'tab' }, rows),
      h(
        'p',
        null,
        known
          ? `Trocar a ordem não muda o resultado: ${n} × 3 é igual a 3 × ${n}. ${known === 1 ? 'A conta marcada você já aprendeu' : `As ${known} contas marcadas você já aprendeu`} nas tabuadas de antes.`
          : 'É a primeira tabuada da torre: todas as contas são novas.',
      ),
      h('div', { class: 'trick' }, h('h3', { class: 'trick__title' }, `Truque: ${L.trickName}`), h('p', null, L.trick)),
      h('div', { class: 'actions' }, btn('Soltar as bolinhas!', 'bolt', 'btn--primary btn--big', fire, true)),
    );
  }

  async function fire() {
    if (phase !== 'summary') return;
    phase = 'fire';
    const [hero, dummy] = actors;
    setPanel(null);
    layout();
    pins.clear();
    app.sound.charge();
    void hero.cheer(tw, 1);
    await tw.wait(0.6);
    if (!alive()) return;
    const target = dummy.worldCenter(new THREE.Vector3());
    let landed = 0;
    await app.orbs.barrage(target, (row) => {
      landed++;
      if (landed % 3 === 1) app.sound.pop();
      app.world.fx.emit('dot', target, { count: 3, color: [row % 2 ? '#FFD21F' : '#2440FF', '#FFFFFF'], speed: 3, life: 0.35, size: 0.12, sizeEnd: 0 });
      if (landed % 8 === 0) {
        void dummy.hurt(tw, 0.5);
        app.world.rig.addTrauma(0.08);
      }
    });
    if (!alive()) return;
    app.sound.impact(me.type, 2);
    app.world.rig.addTrauma(0.5);
    app.sound.knockout();
    await dummy.knockout(tw);
    if (!alive()) return;
    progressOf(p, L.id).trained = true;
    void app.saveProfile();
    void hero.cheer(tw, 2);
    await ann.show('Treino completo!', { sub: `${10 * n} bolinhas de uma vez`, tone: 'menta' });
    if (!alive()) return;
    done();
  }

  function done() {
    phase = 'done';
    setPanel(
      'Pronto para lutar',
      h('p', null, `Agora enfrente ${rival.name} na ${L.name}. Na luta as contas vêm fora de ordem, e cada acerto vira um golpe.`),
      h(
        'div',
        { class: 'actions' },
        btn('Lutar agora', 'swords', 'btn--primary btn--big', () => {
          app.sound.ok();
          app.go('vs', { level, partner });
        }, true),
        btn('Treinar de novo', 'restart', '', () => {
          actors[1]?.reset();
          start();
        }),
      ),
    );
  }

  let unsub = () => {};
  const mq = matchMedia('(min-width: 860px)');
  return {
    el,
    enter() {
      if (L.table === null) return app.go('torre', { level });
      app.music.play('treino');
      app.world.setStage('treino');
      actors = app.world.setCast([
        { id: partner, x: -3.3, dir: 1, turn: 0.35 },
        { id: 'boneco', x: 3.3, dir: -1, turn: 0.35 },
      ]);
      app.orbs.setTable(n);
      app.world.scene.add(app.orbs.group);
      unsub = app.world.onFrame((gdt) => {
        app.orbs.update(gdt);
        pins.update();
      });
      mq.addEventListener('change', layout);
      frame(true);
      intro();
    },
    leave() {
      unsub();
      mq.removeEventListener('change', layout);
      app.orbs.clear();
      app.orbs.group.removeFromParent();
    },
    key(e) {
      if (phase === 'ask' && /^\d$/.test(e.key) && document.activeElement !== plate.input) plate.focus();
    },
    back: toTorre,
  };
};
