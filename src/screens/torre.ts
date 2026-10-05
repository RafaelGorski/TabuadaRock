import type { ScreenFactory } from '../app';
import { levelUnlocked } from '../data/store';
import { CREATURES, type CreatureId } from '../game/creatures';
import { LEVELS, STAGE_NAMES, type LevelDef } from '../game/levels';
import { matchupText } from '../game/types';
import { fill, fmt, h } from '../ui/dom';
import { icon, stars } from '../ui/icons';
import { bestPartner, portrait, typeChip } from '../ui/parts';
import { backButton, frontier, guard, keys, levelIndex, progressOf, safeAreas, whoami } from './kit';

export const torre: ScreenFactory<'torre'> = (app, params) => {
  const alive = guard(app);
  const p = app.profile!;
  let sel: LevelDef = params?.level ? (LEVELS.find((l) => l.id === params.level) ?? frontier(p)) : frontier(p);
  let partner: CreatureId = p.starter;
  let timer = 0;
  let staged = '';

  const rungs = LEVELS.map((l, i) => {
    const lp = progressOf(p, l.id);
    const open = levelUnlocked(p, i);
    const state = !open ? 'locked' : lp.resume ? 'resume' : lp.cleared ? 'cleared' : 'open';
    const b = h(
      'button',
      { type: 'button', class: 'rung', 'data-state': state, 'data-final': l.table === null ? '' : undefined, tabindex: -1 },
      h('span', { class: 'rung__n', 'aria-hidden': 'true' }, l.table === null ? icon('crown') : String(l.table)),
      h('span', { class: 'rung__name' }, l.name),
      h('span', { class: 'rung__state' }, !open ? [icon('lock'), h('span', { class: 'sr-only' }, 'bloqueada')] : lp.resume ? `Round ${lp.resume.nextRound}` : stars(lp.stars)),
    );
    b.addEventListener('click', () => {
      select(l, true);
      (panel.querySelector<HTMLElement>('.btn--primary') ?? b).focus();
    });
    b.addEventListener('focus', () => select(l, false));
    return b;
  });

  const panel = h('section', { class: 'info plate plate--paper', 'aria-labelledby': 'torre-nivel' });
  const total = LEVELS.reduce((s, l) => s + progressOf(p, l.id).stars, 0);

  const el = h(
    'section',
    { 'aria-labelledby': 'torre-title', class: 'torre' },
    h(
      'div',
      { class: 'topbar' },
      backButton('Lutadores', () => leave()),
      whoami(app),
      h('span', { class: 'topbar__gap' }),
      h('button', { type: 'button', class: 'btn btn--small', onclick: () => app.go('recordes', { from: 'torre' }) }, icon('trophy'), 'Recordes'),
      h('button', { type: 'button', class: 'btn btn--small btn--icon', 'aria-label': 'Opções', onclick: () => app.go('opcoes', { from: 'torre' }) }, icon('sliders')),
    ),
    h(
      'nav',
      { class: 'ladder', 'aria-labelledby': 'torre-title' },
      h('h1', { class: 'title ladder__title', id: 'torre-title' }, 'Torre da Tabuada'),
      h('p', { class: 'ladder__sum' }, icon('star'), `${total} de ${LEVELS.length * 3} estrelas`),
      h('ol', { class: 'ladder__list' }, rungs.map((b) => h('li', null, b))),
    ),
    panel,
    keys([[icon('up'), icon('down')], 'subir e descer'], ['Enter', 'escolher'], ['Esc', 'voltar']),
  );

  function stage(now: boolean) {
    clearTimeout(timer);
    const run = () => {
      if (!alive()) return;
      const k = `${sel.id}|${partner}`;
      if (k === staged) return;
      const sameStage = app.world.stage?.id === sel.stage;
      staged = k;
      app.world.setStage(sel.stage);
      app.world.setFighters(partner, sel.rival);
      app.world.frameFight(!sameStage, { yaw: 0.12, pitch: 0.1, speed: 2.6 });
    };
    if (now) run();
    else timer = window.setTimeout(run, 220);
  }

  function select(l: LevelDef, now: boolean) {
    const changed = l.id !== sel.id;
    sel = l;
    rungs.forEach((b, i) => {
      const on = LEVELS[i].id === l.id;
      b.tabIndex = on ? 0 : -1;
      b.toggleAttribute('data-autofocus', on);
      if (on) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    const lp = progressOf(p, l.id);
    partner = lp.resume?.partner && p.team.includes(lp.resume.partner) ? lp.resume.partner : bestPartner(p.team, l.rival, p.starter);
    if (changed || !panel.childElementCount) render();
    stage(now);
  }

  function partnerPicker(): HTMLElement {
    const rival = CREATURES[sel.rival];
    const note = h('p', { class: 'matchup' });
    const describe = () => {
      const m = matchupText(CREATURES[partner].type, rival.type);
      note.dataset.kind = m.kind;
      note.replaceChildren(h('b', null, m.title), ' ', m.text, ' ', h('span', { class: 'matchup__lives' }, m.lives));
    };
    const opts = p.team.map((id) => {
      const c = CREATURES[id];
      const r = h('input', { type: 'radio', name: 'parceiro', value: id, class: 'sr-only', checked: id === partner });
      r.addEventListener('change', () => {
        if (!r.checked) return;
        partner = id;
        app.sound.move();
        describe();
        stage(true);
      });
      return h('label', { class: 'mate' }, r, portrait(app, id, 'mate__img'), h('span', { class: 'mate__name' }, c.name), typeChip(c.type));
    });
    describe();
    return h('fieldset', { class: 'mates' }, h('legend', { class: 'info__label' }, 'Quem luta com você'), h('div', { class: 'mates__row' }, opts), note);
  }

  function render() {
    const i = levelIndex(sel.id);
    const lp = progressOf(p, sel.id);
    const open = levelUnlocked(p, i);
    const rival = CREATURES[sel.rival];
    const head = [
      h('h2', { class: 'info__title', id: 'torre-nivel' }, sel.name),
      h('p', { class: 'info__rival' }, h('span', null, `${rival.name} guarda esta ${sel.table === null ? 'luta' : 'tabuada'}.`), typeChip(rival.type)),
      h('p', { class: 'info__place' }, icon('play'), STAGE_NAMES[sel.stage]),
    ];
    if (!open) {
      const prev = LEVELS[i - 1];
      panel.replaceChildren(...head, h('p', { class: 'info__lock' }, icon('lock'), `Vença a ${prev.name} para liberar.`));
      return;
    }
    const best = lp.best ? h('p', { class: 'info__best' }, stars(lp.stars), h('span', null, `Melhor: ${fmt(lp.best)} pontos`)) : null;
    const trick =
      sel.table === null
        ? h('div', { class: 'trick' }, h('h3', { class: 'trick__title' }, 'Todas as tabuadas'), h('p', null, 'Round 1 mistura do 2 ao 5, round 2 do 6 ao 10, e o último round mistura tudo com relógio e sem dicas.'))
        : h('div', { class: 'trick' }, h('h3', { class: 'trick__title' }, `Truque: ${sel.trickName}`), h('p', null, sel.trick));
    const btn = (label: string, ic: Parameters<typeof icon>[0], cls: string, run: () => void) => h('button', { type: 'button', class: `btn ${cls}`, onclick: run }, icon(ic), label);
    const fight = () => {
      app.sound.ok();
      app.go('vs', { level: sel.id, partner });
    };
    const train = () => {
      app.sound.ok();
      app.go('treino', { level: sel.id, partner });
    };
    const actions: HTMLElement[] = [];
    if (lp.resume) {
      const r = lp.resume;
      actions.push(
        btn(`Continuar no round ${r.nextRound}`, 'play', 'btn--primary btn--big', () => {
          app.sound.ok();
          app.go('luta', { level: sel.id, partner: r.partner, resume: true });
        }),
        btn('Começar do zero', 'restart', '', fight),
      );
    } else if (sel.table !== null && !lp.trained) {
      actions.push(btn('Treinar', 'bulb', 'btn--primary btn--big', train), btn('Lutar sem treinar', 'swords', '', fight));
    } else {
      actions.push(btn(lp.cleared ? 'Lutar de novo' : 'Lutar', 'swords', 'btn--primary btn--big', fight));
      if (sel.table !== null) actions.push(btn('Treinar de novo', 'bulb', '', train));
    }
    const hint = sel.table !== null && !lp.trained && !lp.resume ? h('p', { class: 'info__hint' }, 'Comece pelo treino: as bolinhas mostram a tabuada inteira, uma fileira por vez.') : null;
    fill(panel, head, best, trick, lp.resume ? null : partnerPicker(), hint, h('div', { class: 'actions' }, actions));
  }

  function leave() {
    app.sound.back();
    app.go('perfis');
  }

  let off = () => {};
  return {
    el,
    enter() {
      app.music.play('menu');
      off = safeAreas(app, { top: 0.13, bottom: 0.9, left: 0.27, right: 0.64 }, { top: 0.07, bottom: 0.34 });
      select(sel, true);
    },
    leave() {
      off();
      clearTimeout(timer);
    },
    key(e) {
      if (!rungs.includes(document.activeElement as HTMLButtonElement)) return;
      const up = e.key === 'ArrowUp' || e.key === 'ArrowRight';
      const down = e.key === 'ArrowDown' || e.key === 'ArrowLeft';
      if (!up && !down) return;
      e.preventDefault();
      const i = levelIndex(sel.id) + (up ? 1 : -1);
      if (i < 0 || i >= LEVELS.length) return;
      app.sound.move();
      rungs[i].focus();
    },
    back: leave,
  };
};
