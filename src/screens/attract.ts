import type { ScreenFactory } from '../app';
import { CREATURES, type CreatureId } from '../game/creatures';
import type { Actor } from '../engine/world';
import { h } from '../ui/dom';
import { pop } from '../ui/parts';
import { guard, safeAreas } from './kit';

const PAIRS: [CreatureId, CreatureId][] = [
  ['capibolha', 'tesourada'],
  ['brasonca', 'jacarock'],
  ['folhandua', 'rolachoque'],
];

/** Cold open: a demo fight lands 6 × 7 = 42, the lockup slams in, any key starts. */
export const attract: ScreenFactory<'attract'> = (app) => {
  const alive = guard(app);
  const w = app.world;
  const x = h('span', { class: 'qplate__n' });
  const y = h('span', { class: 'qplate__n' });
  const box = h('span', { class: 'qplate__box qplate__box--demo' });
  const demo = h(
    'div',
    { class: 'qplate qplate--demo', 'aria-hidden': 'true', 'data-state': 'idle', hidden: true },
    h('div', { class: 'qplate__main' }, h('div', { class: 'qplate__eq' }, x, h('span', { class: 'qplate__op' }, '×'), y, h('span', { class: 'qplate__op' }, '='), box)),
  );
  const layer = h('div', { class: 'pops', 'aria-hidden': 'true' });
  const lockup = h(
    'div',
    { class: 'attract__lockup' },
    h('h1', { class: 'lockup' }, h('span', { class: 'lockup__a' }, 'Tabuada'), h('span', { class: 'lockup__b' }, 'Rock')),
    h('p', { class: 'lockup__tag' }, 'A luta da tabuada, do 2 ao 10'),
  );
  const touch = matchMedia('(pointer: coarse)').matches;
  const start = h('button', { type: 'button', class: 'btn btn--primary btn--big attract__start', 'data-autofocus': '' }, touch ? 'Toque para jogar' : 'Aperte Enter ou clique para jogar');
  const el = h('section', { 'aria-label': 'Tabuada Rock', class: 'attract' }, layer, lockup, demo, start);
  let left = false;
  let off = () => {};

  const begin = () => {
    if (left) return;
    left = true;
    app.sound.ok();
    app.go('menu');
  };
  el.addEventListener('click', begin);

  const slam = () => {
    if (lockup.classList.contains('is-in')) return;
    lockup.classList.add('is-in');
    el.classList.add('is-ready');
    app.sound.slam();
    w.rig.addTrauma(0.45);
  };

  /** One question, typed by the demo player, and the hit it becomes. */
  async function exchange(att: Actor, def: Actor, a: number, b: number, o: { super?: boolean; ko?: boolean } = {}) {
    const ans = a * b;
    x.textContent = String(a);
    y.textContent = String(b);
    box.textContent = '';
    demo.dataset.state = 'idle';
    demo.hidden = false;
    await w.tw.wait(0.55);
    for (const d of String(ans)) {
      box.textContent += d;
      app.sound.key();
      await w.tw.wait(0.24);
    }
    demo.dataset.state = 'ok';
    app.sound.correct();
    const type = CREATURES[att.id as CreatureId].type;
    const power = o.super ? 2 : 1;
    if (power > 1) app.sound.charge();
    else app.sound.whoosh();
    await app.moves.strike(att, def, type, {
      power,
      ko: o.ko,
      onHit: () => {
        app.sound.impact(type, power);
        if (o.ko) app.sound.knockout();
        pop(app, layer, def.worldHead(), String(ans), 'pop pop--hit');
      },
    });
  }

  async function run() {
    let pair = 0;
    const cast = () => {
      const [L, R] = w.setFighters(PAIRS[pair][0], PAIRS[pair][1]);
      w.frameFight(true, { yaw: 0.16, pitch: 0.1 });
      return [L, R as Actor] as const;
    };
    w.setStage('copacabana');
    let [L, R] = cast();
    app.music.play('menu');
    if (app.reduced) {
      slam();
      return;
    }
    await w.tw.wait(0.7);
    await exchange(L, R, 6, 7);
    if (!alive()) return;
    slam();
    await w.tw.wait(1.2);
    let n = 0;
    while (alive()) {
      n++;
      const rightTurn = n % 2 === 1;
      const a = 2 + Math.floor(Math.random() * 8);
      const b = 2 + Math.floor(Math.random() * 8);
      const finish = n % 5 === 0;
      if (finish) {
        await exchange(L, R, a, b, { super: true, ko: true });
        if (!alive()) return;
        await L.cheer(w.tw, 2);
        await w.tw.wait(0.6);
        pair = (pair + 1) % PAIRS.length;
        [L, R] = cast();
        demo.hidden = true;
        await Promise.all([L.enter(w.tw, 4), R.enter(w.tw, 4)]);
        app.sound.slam();
        await w.tw.wait(0.6);
        continue;
      }
      if (rightTurn) await exchange(R, L, a, b);
      else await exchange(L, R, a, b);
      if (!alive()) return;
      await w.tw.wait(0.9);
    }
  }

  return {
    el,
    enter: () => {
      off = safeAreas(app, { top: 0.42, bottom: 0.8 }, { top: 0.4, bottom: 0.76 });
      void run();
    },
    key: (e) => {
      if (e.key === 'Tab' || e.key === 'Shift') return;
      e.preventDefault();
      begin();
    },
    leave: () => {
      left = true;
      off();
    },
  };
};
