import type { ScreenFactory } from '../app';
import { STARTERS } from '../game/creatures';
import { arrowNav, h } from '../ui/dom';
import { icon } from '../ui/icons';
import { ARROWS_UD, guard, keys, lineup, safeAreas } from './kit';

export const menu: ScreenFactory<'menu'> = (app) => {
  const alive = guard(app);
  let profiles: Promise<number> = Promise.resolve(0);

  const play = h('button', { type: 'button', class: 'btn btn--primary btn--big btn--wide', 'data-autofocus': '' }, icon('swords'), 'Jogar');
  const recs = h('button', { type: 'button', class: 'btn btn--big btn--wide' }, icon('trophy'), 'Recordes');
  const opts = h('button', { type: 'button', class: 'btn btn--big btn--wide' }, icon('sliders'), 'Opções');
  const items = [play, recs, opts];

  play.addEventListener('click', async () => {
    app.sound.ok();
    const n = await profiles;
    if (alive()) app.go(n ? 'perfis' : 'novo');
  });
  recs.addEventListener('click', () => {
    app.sound.ok();
    app.go('recordes', { from: 'menu' });
  });
  opts.addEventListener('click', () => {
    app.sound.ok();
    app.go('opcoes', { from: 'menu' });
  });

  const el = h(
    'section',
    { 'aria-labelledby': 'menu-title', class: 'split' },
    h(
      'div',
      { class: 'split__main menu__col' },
      h('h1', { class: 'title menu__title', id: 'menu-title' }, h('span', null, 'Tabuada'), h('span', null, 'Rock')),
      h('p', { class: 'lede' }, 'Cada conta certa vira um golpe. Treine, lute e suba a torre da tabuada do 2 ao 10.'),
      h('nav', { class: 'menu__nav', 'aria-label': 'Menu principal' }, items),
      keys([ARROWS_UD(), 'escolher'], ['Enter', 'confirmar']),
    ),
  );

  let off = () => {};
  return {
    el,
    enter() {
      app.music.play('menu');
      off = safeAreas(app, { top: 0.12, bottom: 0.94, left: 0.44, right: 1 }, { top: 0.04, bottom: 0.4 });
      const team = app.profile ? app.profile.team.slice(0, 4) : STARTERS;
      const cast = lineup(app, 'paodeacucar', team, 1.45, { yaw: -0.18 });
      void cast[0]?.cheer(app.world.tw, 1);
      profiles = app.store
        .listProfiles()
        .then((ps) => ps.length)
        .catch(() => 0);
    },
    leave: () => off(),
    key: (e) => {
      if (arrowNav(e, items)) app.sound.move();
    },
    back: () => {
      app.sound.back();
      app.go('attract');
    },
  };
};
