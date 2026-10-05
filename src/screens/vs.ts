import type { ScreenFactory } from '../app';
import { CREATURES } from '../game/creatures';
import { levelById } from '../game/levels';
import { matchupText } from '../game/types';
import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { portrait, typeChip } from '../ui/parts';
import { guard, keys, safeAreas } from './kit';

export const vs: ScreenFactory<'vs'> = (app, { level, partner }) => {
  const alive = guard(app);
  const L = levelById(level);
  const p = app.profile!;
  const me = CREATURES[partner];
  const rv = CREATURES[L.rival];
  const m = matchupText(me.type, rv.type);
  let done = false;

  const side = (n: 1 | 2, img: HTMLElement, name: string, sub: string, chip: HTMLElement) =>
    h('div', { class: `vs__side vs__side--p${n} plate ${n === 1 ? 'plate--cobalto' : 'plate--brasa'}` }, img, h('div', { class: 'vs__who' }, h('p', { class: 'vs__name' }, name), h('p', { class: 'vs__sub' }, sub), chip));

  const taunt = h(
    'figure',
    { class: 'vs__taunt plate plate--ink', hidden: true },
    h('blockquote', { class: 'vs__quote' }, h('p', null, L.taunt)),
    h('figcaption', { class: 'vs__by' }, rv.name),
  );
  const fight = h('button', { type: 'button', class: 'btn btn--primary btn--big', 'data-autofocus': '' }, icon('swords'), 'Lutar');
  const go = () => {
    app.sound.ok();
    app.go('luta', { level, partner });
  };
  fight.addEventListener('click', () => {
    if (!done) return finish();
    go();
  });

  const el = h(
    'section',
    { 'aria-labelledby': 'vs-title', class: 'vs' },
    h('h1', { class: 'sr-only', id: 'vs-title' }, `${L.name}: ${me.name} contra ${rv.name}`),
    h(
      'div',
      { class: 'vs__bar' },
      side(1, portrait(app, partner, 'vs__img'), me.name, `Parceiro de ${p.name}`, typeChip(me.type)),
      h('p', { class: 'vs__mark', 'aria-hidden': 'true' }, 'VS'),
      side(2, portrait(app, L.rival, 'vs__img'), rv.name, `Guarda a ${L.name}`, typeChip(rv.type)),
    ),
    taunt,
    h(
      'div',
      { class: 'vs__go plate plate--paper' },
      h('p', { class: 'matchup', 'data-kind': m.kind }, h('b', null, m.title), ' ', m.text, ' ', h('span', { class: 'matchup__lives' }, m.lives)),
      h(
        'div',
        { class: 'actions' },
        fight,
        h('button', { type: 'button', class: 'btn', onclick: () => leave() }, icon('left'), 'Trocar de parceiro'),
      ),
    ),
    keys(['Enter', 'lutar'], ['Esc', 'voltar para a torre']),
  );

  function finish() {
    if (done) return;
    done = true;
    el.classList.add('is-in', 'is-done');
    taunt.hidden = false;
    app.world.frameFight(false, { yaw: 0.12, pitch: 0.08, speed: 2.2 });
    fight.focus({ preventScroll: true });
  }

  function leave() {
    app.sound.back();
    app.go('torre', { level });
  }

  async function intro() {
    const tw = app.world.tw;
    const [a, b] = app.world.setFighters(partner, L.rival);
    app.world.frameFight(true, { yaw: 0.08, pitch: 0.1 });
    if (app.reduced) {
      finish();
      void app.say(L.taunt);
      return;
    }
    await tw.wait(0.3);
    if (done) return;
    el.classList.add('is-in');
    app.sound.slam();
    app.world.rig.addTrauma(0.35);
    void a.cheer(tw, 1);
    await tw.wait(0.9);
    if (done || !b) return finish();
    app.world.frameClose(b, false, { speed: 3 });
    taunt.hidden = false;
    void b.cheer(tw, 2);
    const said = app.say(L.taunt);
    await Promise.race([said, tw.wait(4.5)]);
    if (!alive()) return;
    await tw.wait(0.3);
    finish();
  }

  let off = () => {};
  return {
    el,
    enter() {
      app.music.play(L.table === null ? 'chefe' : 'luta');
      off = safeAreas(app, { top: 0.2, bottom: 0.66 }, { top: 0.2, bottom: 0.56 });
      app.world.setStage(L.stage);
      void intro();
    },
    leave: () => off(),
    key(e) {
      if (!done && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        finish();
      }
    },
    back: leave,
  };
};
