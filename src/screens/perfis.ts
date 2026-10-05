import type { ScreenFactory } from '../app';
import { summarize, type Profile } from '../data/store';
import { STARTERS, type CreatureId } from '../game/creatures';
import { mastery } from '../game/facts';
import { LEVELS } from '../game/levels';
import { arrowNav, fmtDate, h } from '../ui/dom';
import { icon } from '../ui/icons';
import { portrait } from '../ui/parts';
import { ARROWS, ARROWS_UD, backButton, guard, keys, lineup, safeAreas } from './kit';

export const perfis: ScreenFactory<'perfis'> = (app) => {
  const alive = guard(app);
  const grid = h('ul', { class: 'cards', role: 'list' });
  const lede = h('p', { class: 'lede', role: 'status' }, 'Carregando lutadores…');
  let buttons: HTMLButtonElement[] = [];
  let timer = 0;
  let shown = '';

  const preview = (ids: CreatureId[]) => {
    const k = ids.join();
    clearTimeout(timer);
    if (k === shown) return;
    timer = window.setTimeout(() => {
      if (!alive()) return;
      shown = k;
      const cast = lineup(app, 'treino', ids, 1.5, { yaw: -0.22 }, false);
      if (ids.length === 1) void cast[0].cheer(app.world.tw, 1);
    }, 160);
  };

  const choose = async (p: Profile) => {
    app.sound.ok();
    await app.setProfile(p);
    if (alive()) app.go('torre');
  };

  const card = (p: Profile): HTMLButtonElement => {
    const s = summarize(p, mastery);
    const last = app.profile?.id === p.id;
    const b = h(
      'button',
      { type: 'button', class: 'card', 'aria-current': last ? 'true' : undefined },
      portrait(app, p.starter, 'card__img'),
      h('span', { class: 'card__name' }, p.name, p.champion ? icon('crown', 'card__crown') : null),
      h('span', { class: 'card__meta' }, icon('star'), `${s.stars} de ${LEVELS.length * 3} estrelas`),
      h('span', { class: 'card__meta' }, p.champion ? 'Campeão da tabuada' : s.highestTable ? `Venceu até a tabuada do ${s.highestTable}` : 'Começando a torre'),
      h('span', { class: 'card__foot' }, last ? 'Jogou por último' : `Jogou em ${fmtDate(p.updatedAt)}`),
    );
    b.addEventListener('click', () => void choose(p));
    b.addEventListener('focus', () => preview([p.starter]));
    b.addEventListener('pointerenter', () => preview([p.starter]));
    return b;
  };

  const fresh = h(
    'button',
    { type: 'button', class: 'card card--new' },
    h('span', { class: 'card__plus' }, icon('plus')),
    h('span', { class: 'card__name' }, 'Novo lutador'),
    h('span', { class: 'card__meta' }, 'Cada pessoa da casa cria o seu.'),
  );
  fresh.addEventListener('click', () => {
    app.sound.ok();
    app.go('novo');
  });
  fresh.addEventListener('focus', () => preview(STARTERS));
  fresh.addEventListener('pointerenter', () => preview(STARTERS));

  const el = h(
    'section',
    { 'aria-labelledby': 'perfis-title', class: 'split split--wide' },
    h(
      'div',
      { class: 'split__main' },
      h('div', { class: 'topbar' }, backButton('Menu', () => app.go('menu'))),
      h('h1', { class: 'title', id: 'perfis-title' }, 'Quem vai lutar?'),
      lede,
      grid,
      keys([[ARROWS(), ARROWS_UD()], 'escolher'], ['Enter', 'lutar']),
    ),
  );

  const cols = () => getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;

  async function load() {
    let list: Profile[] = [];
    try {
      list = await app.store.listProfiles();
    } catch (err) {
      console.error(err);
      lede.textContent = 'Não deu para ler os lutadores salvos. Recarregue a página para tentar de novo.';
    }
    if (!alive()) return;
    buttons = [...list.map(card), fresh];
    grid.replaceChildren(...buttons.map((b) => h('li', null, b)));
    if (!list.length) lede.textContent = 'Ninguém se inscreveu ainda. Crie o primeiro lutador para começar a torre.';
    else if (list.length === 1) lede.textContent = 'Escolha seu lutador. Quer competir com alguém da casa? Crie outro lutador.';
    else lede.textContent = 'Escolha quem vai lutar agora. Cada lutador tem sua torre e seus recordes.';
    const first = buttons.find((b) => b.getAttribute('aria-current') === 'true') ?? buttons[0];
    first.focus({ preventScroll: true });
    preview(list.length ? [list.find((p) => p.id === app.profile?.id)?.starter ?? list[0].starter] : STARTERS);
  }

  let off = () => {};
  return {
    el,
    enter() {
      app.music.play('menu');
      off = safeAreas(app, { top: 0.1, bottom: 0.92, left: 0.6, right: 1 }, { top: 0.03, bottom: 0.3 });
      void load();
    },
    leave() {
      off();
      clearTimeout(timer);
    },
    key: (e) => {
      if (arrowNav(e, buttons, cols())) app.sound.move();
    },
    back: () => {
      app.sound.back();
      app.go('menu');
    },
  };
};
