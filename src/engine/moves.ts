import * as THREE from 'three';
import { TYPES, type ElementType } from '../game/types';
import type { Actor } from './actors';
import type { Particles } from './fx';
import { GEO, sharedToon, torus, withOutline, type V3 } from './toon';
import { ease } from './tween';
import type { World } from './world';

const UP = new THREE.Vector3(0, 1, 0);
const basics = new Map<string, THREE.MeshBasicMaterial>();

function basic(color: string): THREE.MeshBasicMaterial {
  let m = basics.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color });
    basics.set(color, m);
  }
  return m;
}

function part(geo: THREE.BufferGeometry, mat: THREE.Material, s: V3 | number, outline = 0.022): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  if (typeof s === 'number') m.scale.setScalar(s);
  else m.scale.set(...s);
  if (outline) withOutline(m, outline);
  return m;
}

interface Missile {
  obj: THREE.Object3D;
  animate: (k: number, t: number) => void;
}

const MISSILES: Record<Exclude<ElementType, 'raio'>, (p: number) => Missile> = {
  agua: (p) => {
    const g = new THREE.Group();
    const ball = part(GEO.sphere, sharedToon('#7CCBFF'), 0.21 * p);
    const shine = part(GEO.sphereLo, basic('#FFFFFF'), 0.055 * p, 0);
    shine.position.set(-0.07 * p, 0.09 * p, 0.15 * p);
    g.add(ball, shine);
    return {
      obj: g,
      animate: (_k, t) => {
        const w = 1 + Math.sin(t * 34) * 0.1;
        ball.scale.set(0.21 * p * w, (0.21 * p) / w, 0.21 * p * w);
      },
    };
  },
  fogo: (p) => {
    const g = new THREE.Group();
    const shell = part(GEO.sphere, sharedToon('#FF5A1F'), 0.2 * p);
    const core = part(GEO.sphere, basic('#FFE27A'), 0.13 * p, 0);
    core.position.z = 0.09 * p;
    g.add(shell, core);
    return { obj: g, animate: (_k, t) => g.scale.setScalar(1 + Math.sin(t * 40) * 0.08) };
  },
  planta: (p) => {
    const g = new THREE.Group();
    const seed = part(GEO.sphere, sharedToon('#7A4E22'), 0.08 * p);
    g.add(seed);
    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Group();
      arm.rotation.z = (i * Math.PI * 2) / 3;
      const leaf = part(GEO.sphere, sharedToon(i === 1 ? '#8EE06A' : '#2DBE4E'), [0.075 * p, 0.2 * p, 0.03 * p]);
      leaf.position.y = 0.2 * p;
      arm.add(leaf);
      g.add(arm);
    }
    return { obj: g, animate: (_k, t) => (g.rotation.z = -t * 22) };
  },
  pedra: (p) => {
    const rock = part(GEO.dodeca, sharedToon('#9C7A55', true), 0.24 * p, 0.03);
    return {
      obj: rock,
      animate: (_k, t) => rock.rotation.set(t * 9, t * 6, t * 4),
    };
  },
  vento: (p) => {
    const g = new THREE.Group();
    const a = part(torus(1, 0.16, Math.PI), basic('#C9F5FF'), 0.3 * p, 0.02);
    const b = part(torus(1, 0.16, Math.PI), basic('#7FD6EA'), 0.2 * p, 0.02);
    b.rotation.z = Math.PI;
    g.add(a, b);
    return { obj: g, animate: (_k, t) => (g.rotation.z = t * 26) };
  },
};

const DURATION: Record<ElementType, number> = { agua: 0.3, fogo: 0.24, planta: 0.3, raio: 0.1, pedra: 0.36, vento: 0.22 };

function trail(fx: Particles, el: ElementType, at: THREE.Vector3): void {
  switch (el) {
    case 'agua':
      fx.emit('dot', at, { count: 1, color: ['#BDE6FF', '#FFFFFF'], speed: 0.4, life: 0.35, size: 0.11, sizeEnd: 0 });
      break;
    case 'fogo':
      fx.emit('flame', at, { count: 2, color: ['#FF5A1F', '#FFD21F', '#FF8A1F'], dir: UP, speed: 0.9, spread: 0.5, gravity: -3, life: 0.34, size: 0.24, sizeEnd: 0.02 });
      break;
    case 'planta':
      fx.emit('leaf', at, { count: 1, color: ['#2DBE4E', '#8EE06A'], speed: 0.6, life: 0.5, size: 0.15, sizeEnd: 0.05, spin: 6 });
      break;
    case 'pedra':
      fx.emit('dot', at, { count: 1, color: ['#C9A57A', '#8E6B48'], speed: 0.3, life: 0.4, size: 0.15, sizeEnd: 0.02 });
      break;
    case 'vento':
      fx.emit('swirl', at, { count: 1, color: ['#BFF3FF', '#FFFFFF'], speed: 0.2, life: 0.3, size: 0.26, sizeEnd: 0.05, spin: 8 });
      break;
    default:
      fx.emit('bolt', at, { count: 1, color: '#FFE014', speed: 1, life: 0.25, size: 0.2, sizeEnd: 0 });
  }
}

/** The element's own impact, scaled by power. */
export function burst(fx: Particles, el: ElementType, at: THREE.Vector3, p = 1): void {
  const n = (k: number) => Math.round(k * p);
  switch (el) {
    case 'agua':
      fx.emit('drop', at, { count: n(13), color: ['#1FA2FF', '#8FD3FF', '#FFFFFF'], dir: UP, speed: 4.6, spread: 0.85, gravity: 11, life: 0.65, size: 0.22, sizeEnd: 0.1 });
      fx.emit('ring', at, { count: 1, color: '#8FD3FF', speed: 0, life: 0.32, size: 0.4, sizeEnd: 1.5 * p, spin: 0 });
      break;
    case 'fogo':
      fx.emit('flame', at, { count: n(15), color: ['#FF5A1F', '#FFD21F', '#FF8A1F'], dir: UP, speed: 3.6, spread: 0.9, gravity: -2.5, life: 0.55, size: 0.3, sizeEnd: 0.04 });
      fx.emit('dot', at, { count: n(8), color: ['#FFD21F', '#FFFFFF'], speed: 5, spread: 1, life: 0.3, size: 0.12, sizeEnd: 0 });
      break;
    case 'planta':
      fx.emit('leaf', at, { count: n(15), color: ['#2DBE4E', '#8EE06A', '#1E8C3A'], speed: 3.8, spread: 1, gravity: 3, life: 0.8, size: 0.2, sizeEnd: 0.1, spin: 7 });
      break;
    case 'raio':
      fx.emit('bolt', at, { count: n(11), color: ['#FFE014', '#FFFFFF'], speed: 5.2, spread: 1, life: 0.38, size: 0.28, sizeEnd: 0.06, spin: 4 });
      fx.emit('ring', at, { count: 1, color: '#FFE014', speed: 0, life: 0.24, size: 0.4, sizeEnd: 1.7 * p, spin: 0 });
      break;
    case 'pedra':
      fx.emit('rock', at, { count: n(11), color: ['#9C7A55', '#B08A5F', '#6E5238'], speed: 4.6, spread: 0.9, dir: UP, gravity: 13, life: 0.7, size: 0.22, sizeEnd: 0.12, spin: 6 });
      fx.emit('dot', at, { count: n(8), color: ['#E3CFAE', '#C9A57A'], speed: 2.2, spread: 1, life: 0.5, size: 0.3, sizeEnd: 0.5, drag: 3 });
      break;
    case 'vento':
      fx.emit('swirl', at, { count: n(9), color: ['#BFF3FF', '#FFFFFF', '#7FD6EA'], speed: 3.4, spread: 1, life: 0.5, size: 0.34, sizeEnd: 0.1, spin: 9 });
      fx.emit('ring', at, { count: 1, color: '#FFFFFF', speed: 0, life: 0.3, size: 0.5, sizeEnd: 1.6 * p, spin: 0 });
      break;
  }
}

export interface StrikeOptions {
  /** 1 for a normal hit, 2 for a super move. */
  power?: number;
  /** The defender goes down. */
  ko?: boolean;
  /** Called the moment the hit lands. */
  onHit?: () => void;
}

/** Attack choreography: wind-up, the element flies, the hit lands with hitstop and shake. */
export class Moves {
  constructor(private w: World) {}

  async strike(att: Actor, def: Actor, el: ElementType, o: StrikeOptions = {}): Promise<void> {
    const w = this.w;
    const gen = w.gen;
    const power = o.power ?? 1;
    if (power > 1) await this.charge(att, el);
    if (gen !== w.gen) return;
    let flight: Promise<void> = Promise.resolve();
    const reach = el === 'pedra' || el === 'planta' ? 0.75 : 0.42;
    await att.attack(
      w.tw,
      reach,
      () => {
        flight = this.fly(att, def, el, power).then(() => this.land(def, el, power, o, gen));
      },
      power,
    );
    await flight;
  }

  /** Aura that rises before a super move. */
  async charge(att: Actor, el: ElementType): Promise<void> {
    const w = this.w;
    const color = TYPES[el].color;
    const base = att.group.position;
    const at = new THREE.Vector3();
    let frame = 0;
    att.energy = 3;
    await w.tw.run(
      0.6,
      (k) => {
        if (frame++ % 2) return;
        at.set(base.x + (Math.random() - 0.5) * att.worldWidth * 1.2, 0.1 + Math.random() * 0.3, base.z + (Math.random() - 0.5) * 0.8);
        w.fx.emit('dot', at, { count: 2, color: [color, '#FFFFFF'], dir: UP, speed: 2.4 + 2.5 * k, spread: 0.12, life: 0.55, size: 0.15, sizeEnd: 0, drag: 0.4 });
        if (frame % 6 === 0) w.fx.emit('star', att.worldCenter(at), { count: 1, color: '#FFD21F', speed: 2, life: 0.4, size: 0.22, sizeEnd: 0 });
      },
      { ease: ease.linear },
    );
  }

  private fly(att: Actor, def: Actor, el: ElementType, power: number): Promise<void> {
    const from = att.worldMouth(new THREE.Vector3());
    const to = def.worldCenter(new THREE.Vector3());
    if (el === 'raio') return this.bolt(from, to, power);
    const shots = power > 1 ? 3 : 1;
    const runs: Promise<void>[] = [];
    for (let i = 0; i < shots; i++) runs.push(this.missile(el, from, to, power > 1 ? 1.3 : 1, i * 0.1, i < shots - 1));
    return Promise.all(runs).then(() => undefined);
  }

  private missile(el: Exclude<ElementType, 'raio'>, from: THREE.Vector3, to: THREE.Vector3, scale: number, delay: number, minor: boolean): Promise<void> {
    const w = this.w;
    const m = MISSILES[el](scale);
    const dur = DURATION[el];
    const arc = el === 'pedra' ? 1.15 : 0.24;
    const dest = to.clone();
    if (minor) dest.add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4, 0.2));
    m.obj.visible = false;
    w.scene.add(m.obj);
    return w.tw
      .run(
        dur,
        (k) => {
          m.obj.visible = true;
          m.obj.position.lerpVectors(from, dest, k);
          m.obj.position.y += Math.sin(k * Math.PI) * arc;
          m.animate(k, k * dur);
          trail(w.fx, el, m.obj.position);
        },
        { ease: ease.linear, delay },
      )
      .then(() => {
        m.obj.removeFromParent();
        if (minor) burst(w.fx, el, dest, 0.5);
      });
  }

  private bolt(from: THREE.Vector3, to: THREE.Vector3, power: number): Promise<void> {
    const w = this.w;
    const g = new THREE.Group();
    const pts: THREE.Vector3[] = [from.clone()];
    const side = new THREE.Vector3().subVectors(to, from).cross(new THREE.Vector3(0, 0, 1)).normalize();
    const segs = 7;
    for (let i = 1; i < segs; i++) {
      const p = new THREE.Vector3().lerpVectors(from, to, i / segs);
      p.addScaledVector(side, (i % 2 ? 1 : -1) * (0.12 + Math.random() * 0.16));
      p.z += (Math.random() - 0.5) * 0.2;
      pts.push(p);
    }
    pts.push(to.clone());
    const r = 0.045 * (power > 1 ? 1.6 : 1);
    const dir = new THREE.Vector3();
    for (let i = 0; i < pts.length - 1; i++) {
      dir.subVectors(pts[i + 1], pts[i]);
      const len = dir.length();
      const seg = part(GEO.cylLo, basic(i % 2 ? '#FFF6B0' : '#FFE014'), [r, len + r, r], 0.018);
      seg.position.addVectors(pts[i], pts[i + 1]).multiplyScalar(0.5);
      seg.quaternion.setFromUnitVectors(UP, dir.normalize());
      g.add(seg);
    }
    w.scene.add(g);
    w.fx.emit('bolt', from, { count: 4, color: ['#FFE014', '#FFFFFF'], speed: 2.5, life: 0.25, size: 0.2, sizeEnd: 0 });
    return w.tw
      .run(0.18, (k) => (g.visible = Math.floor(k * 7) % 2 === 0), { ease: ease.linear })
      .then(() => {
        g.removeFromParent();
      });
  }

  private async land(def: Actor, el: ElementType, power: number, o: StrikeOptions, gen: number): Promise<void> {
    const w = this.w;
    if (gen !== w.gen) return;
    const at = def.worldCenter(new THREE.Vector3());
    burst(w.fx, el, at, power);
    w.fx.emit('star', at, { count: 4 + 2 * power, color: ['#FFD21F', '#FFFFFF'], speed: 4, spread: 1, life: 0.42, size: 0.28, sizeEnd: 0 });
    w.fx.emit('ring', at, { count: 1, color: '#FFFFFF', speed: 0, life: 0.26, size: 0.3, sizeEnd: 1.2 + 0.5 * power, spin: 0 });
    w.hitstop(o.ko ? 0.24 : 0.055 + 0.045 * power);
    w.rig.addTrauma(o.ko ? 0.8 : 0.26 + 0.2 * power);
    o.onHit?.();
    if (o.ko) {
      w.slowmo = 0.45;
      await def.knockout(w.tw);
      if (gen === w.gen) w.slowmo = 1;
    } else {
      await def.hurt(w.tw, power > 1 ? 1.4 : 1);
    }
  }
}
