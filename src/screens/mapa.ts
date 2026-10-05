import type { ScreenFactory } from '../app';
import { CREATURES } from '../game/creatures';
import { levelById, STAGE_NAMES } from '../game/levels';
import { MAP_H, MAP_SPOTS, MAP_W, outlinePoints, project, type MapSpot } from '../game/mapa';
import { announce, fill, h } from '../ui/dom';
import { icon } from '../ui/icons';
import { portrait, typeChip } from '../ui/parts';
import { backButton, guard, keys, safeAreas } from './kit';

const NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** Pick where the fight happens: a map of Brazil with one pin per arena. */
export const mapa: ScreenFactory<'mapa'> = (app, { level, partner }) => {
  const alive = guard(app);
  const L = levelById(level);
  const rv = CREATURES[L.rival];
  const me = CREATURES[partner];
  const home = MAP_SPOTS.find((s) => s.stage === L.stage) ?? MAP_SPOTS[0];
  let sel: MapSpot = home;
  let timer = 0;
  let staged = '';

  const card = h('div', { class: 'mapa__card plate plate--paper', 'aria-live': 'polite' });
  const pins = new Map<MapSpot, SVGGElement>();

  const board = svg('svg', {
    viewBox: `0 0 ${MAP_W} ${MAP_H.toFixed(2)}`,
    class: 'mapa__svg',
    role: 'presentation',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  board.appendChild(svg('polygon', { points: outlinePoints(), class: 'mapa__land' }));
  for (const s of MAP_SPOTS) {
    const p = project(s.lon, s.lat);
    const g = svg('g', { class: 'mapa__pin', transform: `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})` });
    g.appendChild(svg('circle', { r: 3.4, class: 'mapa__pin-halo' }));
    g.appendChild(svg('circle', { r: 1.7, class: 'mapa__pin-dot' }));
    board.appendChild(g);
    pins.set(s, g);
  }

  const buttons = MAP_SPOTS.map((s) => {
    const b = h(
      'button',
      { type: 'button', class: 'mapa__spot', 'data-region': s.region, tabindex: -1 },
      h('span', { class: 'mapa__spot-name' }, s.short),
      h('span', { class: 'mapa__spot-uf' }, `${s.region} · ${s.uf}`),
    );
    b.addEventListener('focus', () => select(s, false));
    b.addEventListener('click', () => {
      const again = s === sel;
      select(s, true);
      if (again) fight();
    });
    return b;
  });

  function paint() {
    for (const [s, g] of pins) g.classList.toggle('is-on', s === sel);
    buttons.forEach((b, i) => {
      const on = MAP_SPOTS[i] === sel;
      b.tabIndex = on ? 0 : -1;
      b.toggleAttribute('data-autofocus', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function stage(now: boolean) {
    clearTimeout(timer);
    const run = () => {
      if (!alive() || staged === sel.stage) return;
      const first = !staged;
      staged = sel.stage;
      app.world.setStage(sel.stage);
      app.world.setFighters(partner, L.rival);
      app.world.frameFight(first, { yaw: 0.12, pitch: 0.1, speed: 2.6 });
    };
    if (now) run();
    else timer = window.setTimeout(run, 200);
  }

  function select(s: MapSpot, now: boolean) {
    if (s !== sel) app.sound.move();
    sel = s;
    paint();
    fill(
      card,
      h('h2', { class: 'mapa__card-title' }, STAGE_NAMES[s.stage]),
      h('p', { class: 'mapa__card-sub' }, `${s.region} · ${s.uf}`),
      h('p', { class: 'mapa__card-blurb' }, s.blurb),
      s.stage === L.stage ? h('p', { class: 'mapa__card-home' }, icon('crown'), `Arena de ${rv.name}`) : null,
      h('button', { type: 'button', class: 'btn btn--primary btn--big', onclick: fight }, icon('swords'), `Lutar em ${s.short}`),
    );
    announce(`${STAGE_NAMES[s.stage]}. ${s.blurb}`);
    stage(now);
  }

  function fight() {
    app.sound.ok();
    app.go('vs', { level, partner, stage: sel.stage });
  }

  function leave() {
    app.sound.back();
    app.go('torre', { level });
  }

  const el = h(
    'section',
    { 'aria-labelledby': 'mapa-title', class: 'mapa' },
    h('div', { class: 'topbar' }, backButton('Torre', leave)),
    h(
      'div',
      { class: 'mapa__head' },
      h('h1', { class: 'title', id: 'mapa-title' }, 'Onde vai ser a luta?'),
      h(
        'p',
        { class: 'lede' },
        `${me.name} contra ${rv.name}. Escolha um lugar do Brasil para receber a ${L.name.toLocaleLowerCase('pt-BR')}.`,
      ),
      h('div', { class: 'mapa__who' }, portrait(app, partner, 'mapa__who-img'), typeChip(me.type), h('span', { class: 'mapa__vs' }, 'VS'), typeChip(rv.type), portrait(app, L.rival, 'mapa__who-img')),
    ),
    h(
      'div',
      { class: 'mapa__board' },
      h('div', { class: 'mapa__art' }, board),
      h('div', { class: 'mapa__list', role: 'group', 'aria-label': 'Arenas do Brasil' }, buttons),
      card,
    ),
    keys([[icon('up'), icon('down')], 'escolher a arena'], ['Enter', 'lutar'], ['Esc', 'voltar']),
  );

  let off = () => {};
  return {
    el,
    enter() {
      app.music.play('menu');
      off = safeAreas(app, { top: 0.1, bottom: 0.92, left: 0.5, right: 1 }, { top: 0.04, bottom: 0.3 });
      select(sel, true);
    },
    leave() {
      off();
      clearTimeout(timer);
    },
    key(e) {
      if (!buttons.includes(document.activeElement as HTMLButtonElement)) return;
      const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
      const fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      if (!back && !fwd) return;
      e.preventDefault();
      const i = MAP_SPOTS.indexOf(sel) + (fwd ? 1 : -1);
      if (i < 0 || i >= MAP_SPOTS.length) return;
      buttons[i].focus();
    },
    back: leave,
  };
};
