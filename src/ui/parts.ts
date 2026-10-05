import * as THREE from 'three';
import type { App } from '../app';
import { CREATURES, type CreatureId } from '../game/creatures';
import { TYPES, matchup, type ElementType, type Matchup } from '../game/types';
import type { ActorId } from '../engine/actors';
import { announce, h } from './dom';

export function typeChip(el: ElementType): HTMLSpanElement {
  return h('span', { class: 'chip', 'data-type': el }, TYPES[el].name);
}

const MATCHUP_LABEL: Record<Matchup, string> = { vantagem: 'Vantagem', neutro: 'Equilibrada', desvantagem: 'Cuidado' };

export function matchupChip(att: CreatureId, def: CreatureId): HTMLSpanElement {
  const m = matchup(CREATURES[att].type, CREATURES[def].type);
  const cls = m === 'vantagem' ? 'chip chip--menta' : m === 'desvantagem' ? 'chip chip--brasa' : 'chip chip--ouro';
  return h('span', { class: cls }, MATCHUP_LABEL[m]);
}

/** The best partner on the team against this rival. */
export function bestPartner(team: CreatureId[], rival: CreatureId, fallback: CreatureId): CreatureId {
  const score = (id: CreatureId) => ({ vantagem: 2, neutro: 1, desvantagem: 0 })[matchup(CREATURES[id].type, CREATURES[rival].type)];
  let best = team.includes(fallback) ? fallback : team[0];
  for (const id of team) if (score(id) > score(best)) best = id;
  return best;
}

/** Rendered 3D portrait. Decorative unless given alt text. */
export function portrait(app: App, id: ActorId, cls = 'portrait', alt = ''): HTMLImageElement {
  const img = h('img', { class: cls, alt, width: 160, height: 160, decoding: 'async' });
  app.world.portraits
    .get(id)
    .then((url) => (img.src = url))
    .catch(() => img.remove());
  return img;
}

export type Tone = 'ouro' | 'giz' | 'brasa' | 'menta';

/** Arcade calls: ROUND 1, LUTE!, K.O.! Timed on game time, so they freeze on pause and die with the screen. */
export class Announcer {
  readonly el = h('div', { class: 'announcer', 'aria-hidden': 'true' });

  constructor(private app: App) {}

  async show(text: string, o: { sub?: string; tone?: Tone; hold?: number; big?: boolean } = {}): Promise<void> {
    const line = h(
      'div',
      { class: `announcer__line announcer__line--${o.tone ?? 'ouro'}${o.big === false ? ' announcer__line--small' : ''}` },
      h('span', { class: 'announcer__text' }, text),
      o.sub ? h('span', { class: 'announcer__sub' }, o.sub) : null,
    );
    this.el.replaceChildren(line);
    announce(o.sub ? `${text} ${o.sub}` : text);
    await this.app.world.tw.wait(o.hold ?? 0.9);
    line.classList.add('is-out');
    await this.app.world.tw.wait(0.18);
    line.remove();
  }

  clear(): void {
    this.el.replaceChildren();
  }
}

const at = new THREE.Vector3();

/** A number that pops out of a point in the scene and floats away. */
export function pop(app: App, layer: HTMLElement, where: THREE.Vector3, text: string, cls = 'pop'): void {
  const p = app.world.project(at.copy(where));
  const el = h('div', { class: `${cls}${app.reduced ? ' pop--still' : ''}`, 'aria-hidden': 'true' }, text);
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
  layer.appendChild(el);
  window.setTimeout(() => el.remove(), app.reduced ? 900 : 1300);
}

/** HTML labels pinned to points in the 3D scene, updated every frame. */
export class Pins {
  readonly el = h('div', { class: 'pins', 'aria-hidden': 'true' });
  private list: { el: HTMLElement; pos: THREE.Vector3 }[] = [];
  private p = { x: 0, y: 0 };

  constructor(private app: App) {}

  add(pos: THREE.Vector3, content: string | Node, cls = 'pin'): HTMLElement {
    const el = h('div', { class: cls }, content);
    this.el.appendChild(el);
    this.list.push({ el, pos: pos.clone() });
    this.place(this.list[this.list.length - 1]);
    return el;
  }

  clear(): void {
    this.list = [];
    this.el.replaceChildren();
  }

  update(): void {
    for (const item of this.list) this.place(item);
  }

  private place(item: { el: HTMLElement; pos: THREE.Vector3 }): void {
    this.app.world.project(item.pos, this.p);
    item.el.style.transform = `translate(${this.p.x.toFixed(1)}px, ${this.p.y.toFixed(1)}px)`;
  }
}

export function creatureName(id: CreatureId): string {
  return CREATURES[id].name;
}
