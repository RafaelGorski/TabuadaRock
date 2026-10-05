import type { App } from '../app';
import { CREATURES, type CreatureId } from '../game/creatures';
import { fmt, h } from './dom';
import { icon } from './icons';
import { portrait, typeChip } from './parts';

class Bar {
  readonly el: HTMLElement;
  private segs: HTMLElement[] = [];
  private max = -1;

  constructor(label: string, cls: string) {
    this.el = h('div', { class: `bar ${cls}`, role: 'meter', 'aria-label': label, 'aria-valuemin': 0 });
  }

  set(n: number, max: number): void {
    if (max !== this.max) {
      this.max = max;
      this.segs = Array.from({ length: max }, () => h('i', { class: 'bar__seg is-on' }));
      this.el.replaceChildren(...this.segs);
      this.el.style.setProperty('--n', String(max));
    }
    this.segs.forEach((s, i) => {
      const on = i < n;
      if (!on && s.classList.contains('is-on')) {
        s.classList.remove('is-on');
        s.classList.add('is-lost');
      } else if (on) {
        s.classList.add('is-on');
        s.classList.remove('is-lost');
      }
    });
    this.el.setAttribute('aria-valuemax', String(max));
    this.el.setAttribute('aria-valuenow', String(Math.max(0, n)));
  }
}

/** Top band of the fight: both fighters, the clock, rounds and score. */
export class FightHud {
  readonly el: HTMLElement;
  readonly combo: HTMLElement;
  private life: Bar;
  private hp: Bar;
  private superEl: HTMLElement;
  private superPips: HTMLElement[];
  private clock: HTMLElement;
  private roundEl: HTMLElement;
  private pips: HTMLElement[];
  private scoreEl: HTMLElement;

  constructor(app: App, left: CreatureId, right: CreatureId) {
    const L = CREATURES[left];
    const R = CREATURES[right];
    this.life = new Bar(`Vida de ${L.name}`, 'bar--p1');
    this.hp = new Bar(`Vida de ${R.name}`, 'bar--p2');
    this.superPips = Array.from({ length: 5 }, () => h('i', { class: 'super__pip' }));
    this.superEl = h('div', { class: 'super', 'aria-hidden': 'true' }, h('span', { class: 'super__label' }, 'Super'), h('span', { class: 'super__pips' }, this.superPips));
    this.combo = h('div', { class: 'combo', 'aria-hidden': 'true' });
    this.clock = h('div', { class: 'clock', role: 'timer', 'aria-label': 'Sem relógio' }, icon('infinity'));
    this.roundEl = h('p', { class: 'hud__round' }, 'Round 1');
    this.pips = Array.from({ length: 3 }, () => h('i', { class: 'pip' }));
    this.scoreEl = h('span', { class: 'hud__points' }, '0');
    const side = (id: CreatureId, bar: Bar, cls: string, extra: Node[]) =>
      h(
        'div',
        { class: `hud__side ${cls}` },
        h(
          'div',
          { class: 'fighter' },
          h('span', { class: 'fighter__face' }, portrait(app, id, 'fighter__img')),
          h('div', { class: 'fighter__info' }, h('p', { class: 'fighter__name' }, h('span', null, CREATURES[id].name), typeChip(CREATURES[id].type)), bar.el),
        ),
        extra,
      );
    this.el = h(
      'header',
      { class: 'hud' },
      side(left, this.life, 'hud__side--p1', [this.superEl, this.combo]),
      h(
        'div',
        { class: 'hud__mid' },
        this.clock,
        this.roundEl,
        h('div', { class: 'pips', 'aria-hidden': 'true' }, this.pips),
        h('p', { class: 'hud__score' }, h('span', { class: 'hud__label' }, 'Pontos'), this.scoreEl),
      ),
      side(right, this.hp, 'hud__side--p2', []),
    );
  }

  setLives(n: number, max: number): void {
    this.life.set(n, max);
  }

  setHp(n: number, max: number): void {
    this.hp.set(n, max);
  }

  setScore(n: number): void {
    this.scoreEl.textContent = fmt(n);
  }

  setCombo(n: number): void {
    if (n < 2) {
      this.combo.classList.remove('is-on');
      return;
    }
    this.combo.replaceChildren(h('b', null, String(n)), h('span', null, 'acertos seguidos'));
    this.combo.classList.remove('is-on');
    void this.combo.offsetWidth;
    this.combo.classList.add('is-on');
  }

  /** k of 5 pips; 5 fires the super. */
  setSuper(k: number): void {
    this.superPips.forEach((p, i) => p.classList.toggle('is-on', i < k));
    this.superEl.classList.toggle('is-full', k >= 5);
  }

  setRound(round: number, won: number, label?: string): void {
    this.roundEl.textContent = label ?? (round === 3 ? 'Round final' : `Round ${round}`);
    this.pips.forEach((p, i) => {
      p.classList.toggle('is-won', i < won);
      p.classList.toggle('is-now', i === round - 1 && i >= won);
    });
  }

  setClock(seconds: number | null): void {
    if (seconds === null) {
      this.clock.replaceChildren(icon('infinity'));
      this.clock.classList.remove('is-urgent', 'is-timed');
      this.clock.setAttribute('aria-label', 'Sem relógio');
      return;
    }
    const s = Math.max(0, Math.ceil(seconds));
    if (this.clock.textContent !== String(s)) {
      this.clock.textContent = String(s);
      this.clock.setAttribute('aria-label', `${s} segundos`);
    }
    this.clock.classList.add('is-timed');
    this.clock.classList.toggle('is-urgent', seconds <= 5);
  }
}
