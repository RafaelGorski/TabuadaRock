import * as THREE from 'three';
import { GEO, INK, capsule, place, toon, withOutline, type Placement, type V3 } from './toon';
import { clamp, damp, ease, lerp, type Tweens } from './tween';

export const OUTLINE = 0.022;

/** Point on the surface of an ellipsoid (center c, radii r) in direction d, pulled in by inset. */
export function surf(c: V3, r: V3, d: V3, inset = 0): V3 {
  const l = Math.hypot(d[0], d[1], d[2]) || 1;
  const k = (1 - inset) / l;
  return [c[0] + r[0] * d[0] * k, c[1] + r[1] * d[1] * k, c[2] + r[2] * d[2] * k];
}

export interface PartOpts {
  outline?: boolean | number;
  flat?: boolean;
  basic?: boolean;
}

export interface EyeOpts {
  pupil?: 'round' | 'bar' | 'slit';
  yaw?: number;
  glow?: boolean;
}

type Axis = 'x' | 'y' | 'z';
interface Wave {
  obj: THREE.Object3D;
  axis: Axis;
  amp: number;
  speed: number;
  phase: number;
  base: number;
}
interface Flicker {
  obj: THREE.Object3D;
  base: THREE.Vector3;
  speed: number;
  amt: number;
  phase: number;
}
interface Spin {
  obj: THREE.Object3D;
  axis: Axis;
  speed: number;
}

/** Everything a builder fills in besides meshes. */
export class Rig {
  height = 1.4;
  width = 1.2;
  hover = 0;
  bobAmp = 0.03;
  bobSpeed = 2.4;
  scale = 1;
  mouth = new THREE.Vector3(0, 1, 0.6);
  head: THREE.Object3D | null = null;
  headSize = 0.35;
  waves: Wave[] = [];
  flickers: Flicker[] = [];
  spins: Spin[] = [];
  eyes: THREE.Object3D[] = [];
  /** Attack flourish, called with k going 0 → 1 → 0. */
  special?: (k: number) => void;
  /** Procedural idle motion, called every frame with time and energy. */
  tick?: (t: number, e: number) => void;
}

/** Part factory. Gives each actor its own materials so hit flashes stay local. */
export class Kit {
  readonly mats: THREE.MeshToonMaterial[] = [];
  readonly basics: THREE.MeshBasicMaterial[] = [];
  private toonCache = new Map<string, THREE.MeshToonMaterial>();
  private basicCache = new Map<string, THREE.MeshBasicMaterial>();

  constructor(
    readonly rig: Rig,
    readonly outline = OUTLINE,
  ) {}

  toon(color: string, flat = false): THREE.MeshToonMaterial {
    const key = `${color}|${flat ? 1 : 0}`;
    let m = this.toonCache.get(key);
    if (!m) {
      m = toon(color, { flat });
      this.toonCache.set(key, m);
      this.mats.push(m);
    }
    return m;
  }

  basic(color: string): THREE.MeshBasicMaterial {
    let m = this.basicCache.get(color);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color });
      this.basicCache.set(color, m);
      this.basics.push(m);
    }
    return m;
  }

  add(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: string, p: Placement = {}, o: PartOpts = {}): THREE.Mesh {
    const mesh = new THREE.Mesh(geo, o.basic ? this.basic(color) : this.toon(color, o.flat));
    place(mesh, p);
    if (o.outline !== false) withOutline(mesh, typeof o.outline === 'number' ? o.outline : this.outline);
    parent.add(mesh);
    return mesh;
  }

  ball(parent: THREE.Object3D, color: string, pos: V3, scale: V3 | number, o?: PartOpts & { rot?: V3 }): THREE.Mesh {
    return this.add(parent, GEO.sphere, color, { pos, scale, rot: o?.rot }, o);
  }

  cone(parent: THREE.Object3D, color: string, pos: V3, scale: V3, rot?: V3, o?: PartOpts): THREE.Mesh {
    return this.add(parent, GEO.cone, color, { pos, scale, rot }, o);
  }

  cyl(parent: THREE.Object3D, color: string, pos: V3, scale: V3, rot?: V3, o?: PartOpts): THREE.Mesh {
    return this.add(parent, GEO.cyl, color, { pos, scale, rot }, o);
  }

  box(parent: THREE.Object3D, color: string, pos: V3, scale: V3, rot?: V3, o?: PartOpts): THREE.Mesh {
    return this.add(parent, GEO.box, color, { pos, scale, rot }, o);
  }

  rock(parent: THREE.Object3D, color: string, pos: V3, scale: V3, rot?: V3): THREE.Mesh {
    return this.add(parent, GEO.dodeca, color, { pos, scale, rot }, { flat: true });
  }

  /** Capsule hanging down from its top end. */
  limb(parent: THREE.Object3D, color: string, r: number, len: number, rot?: V3, o?: PartOpts): THREE.Mesh {
    return this.add(parent, capsule(r, len), color, { pos: [0, -(len / 2 + r * 0.6), 0], rot }, o);
  }

  pivot(parent: THREE.Object3D, pos: V3, rot?: V3): THREE.Group {
    const g = place(new THREE.Group(), { pos, rot });
    parent.add(g);
    return g;
  }

  /** Anime eye: white sclera, colored iris, ink pupil and a glint. Faces local +Z. */
  eye(parent: THREE.Object3D, pos: V3, size: number, iris: string, o: EyeOpts = {}): THREE.Group {
    const g = place(new THREE.Group(), { pos, rot: [0, o.yaw ?? 0, 0] });
    parent.add(g);
    this.add(g, GEO.sphere, o.glow ? iris : '#FFFFFF', { scale: [size, size * 1.15, size * 0.55] }, { basic: true, outline: this.outline * 0.85 });
    if (!o.glow) this.add(g, GEO.sphere, iris, { pos: [0, -size * 0.06, size * 0.3], scale: [size * 0.64, size * 0.76, size * 0.3] }, { basic: true, outline: false });
    const ps: V3 = o.pupil === 'bar' ? [size * 0.55, size * 0.17, size * 0.2] : o.pupil === 'slit' ? [size * 0.14, size * 0.56, size * 0.2] : [size * 0.34, size * 0.42, size * 0.2];
    this.add(g, GEO.sphere, INK, { pos: [0, -size * 0.06, size * 0.44], scale: ps }, { basic: true, outline: false });
    this.add(g, GEO.sphere, '#FFFFFF', { pos: [size * 0.24, size * 0.26, size * 0.5], scale: size * 0.17 }, { basic: true, outline: false });
    this.rig.eyes.push(g);
    return g;
  }

  wave(obj: THREE.Object3D, axis: Axis, amp: number, speed: number, phase = 0): void {
    this.rig.waves.push({ obj, axis, amp, speed, phase, base: obj.rotation[axis] });
  }

  /** Brows above eyes at ±x. Positive tilt reads as angry, negative as worried. */
  brows(parent: THREE.Object3D, x: number, y: number, z: number, w = 0.12, tilt = 0.35, color = INK): void {
    for (const s of [1, -1]) this.box(parent, color, [s * x, y, z], [w, w * 0.24, w * 0.3], [0, s * 0.3, s * tilt], { outline: false });
  }

  /**
   * Mirrored eyes sitting on an ellipsoid head (center c, radii r), d points at the right eye.
   * brow adds a brow bar; positive tilt reads as angry.
   */
  eyePair(parent: THREE.Object3D, c: V3, r: V3, d: V3, size: number, iris: string, o: EyeOpts & { brow?: number } = {}): void {
    for (const s of [1, -1]) {
      const p = surf(c, r, [d[0] * s, d[1], d[2]]);
      p[2] -= size * 0.3;
      const yaw = Math.atan2(p[0] - c[0], Math.max(0.05, p[2] - c[2])) * 0.75;
      this.eye(parent, p, size, iris, { ...o, yaw });
      if (o.brow !== undefined) {
        this.box(parent, INK, [p[0], p[1] + size * 1.38, p[2] + size * 0.25], [size * 1.25, size * 0.3, size * 0.32], [0, yaw, s * o.brow], { outline: false });
      }
    }
  }

  /** Round markings sunk into an ellipsoid with center c and radii r. */
  spots(parent: THREE.Object3D, color: string, c: V3, r: V3, dirs: V3[], size: number): void {
    for (const d of dirs) this.ball(parent, color, surf(c, r, d, 0.04), size, { outline: false });
  }

  flicker(obj: THREE.Object3D, speed = 14, amt = 0.18): void {
    this.rig.flickers.push({ obj, base: obj.scale.clone(), speed, amt, phase: Math.random() * 6 });
  }

  spin(obj: THREE.Object3D, axis: Axis, speed: number): void {
    this.rig.spins.push({ obj, axis, speed });
  }
}

export type Builder = (k: Kit, body: THREE.Group) => void;

const SHADOW_GEO = new THREE.CircleGeometry(1, 28);
const v = new THREE.Vector3();

/**
 * group (home position) → root (offsets, knockout tilt) → yaw (facing) → pose (attack squash) → body (idle bob).
 */
export class Actor {
  readonly group = new THREE.Group();
  readonly root = new THREE.Group();
  readonly yaw = new THREE.Group();
  readonly pose = new THREE.Group();
  readonly body = new THREE.Group();
  readonly shadow: THREE.Mesh;
  readonly rig = new Rig();
  readonly kit: Kit;
  dir: 1 | -1 = 1;
  energy = 1;
  flash = 0;
  ko = false;
  private t = Math.random() * 10;
  private blinkIn = 1 + Math.random() * 3;
  private blinkT = 0;
  private hoverK = 1;

  constructor(
    readonly id: string,
    build: Builder,
  ) {
    this.kit = new Kit(this.rig);
    build(this.kit, this.body);
    this.shadow = new THREE.Mesh(SHADOW_GEO, new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.2, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.015;
    this.group.add(this.shadow, this.root);
    this.root.add(this.yaw);
    this.yaw.add(this.pose);
    this.pose.add(this.body);
    this.root.scale.setScalar(this.rig.scale);
    this.face(1);
  }

  /** Top of the creature above the ground, hover included. */
  get worldHeight(): number {
    return (this.rig.height + this.rig.hover) * this.rig.scale;
  }

  get worldWidth(): number {
    return this.rig.width * this.rig.scale;
  }

  face(dir: 1 | -1, turn = 0.95): void {
    this.dir = dir;
    this.yaw.rotation.y = dir * turn;
  }

  update(dt: number): void {
    const r = this.rig;
    this.t += dt;
    this.energy = damp(this.energy, this.ko ? 0.15 : 1, 2.2, dt);
    const e = this.energy;
    const bob = Math.sin(this.t * r.bobSpeed);
    const hover = r.hover * this.hoverK;
    this.body.position.y = hover + (bob * 0.5 + 0.5) * r.bobAmp * (r.hover ? 3 : 1) * Math.min(e, 1.5);
    const sq = this.ko ? 0 : bob * 0.02 * Math.min(e, 1.5);
    this.body.scale.set(1 - sq, 1 + sq * 1.4, 1 - sq);
    const ws = 0.6 + 0.4 * e;
    const wa = Math.min(e, 2);
    for (const w of r.waves) w.obj.rotation[w.axis] = w.base + Math.sin(this.t * w.speed * ws + w.phase) * w.amp * wa;
    for (const f of r.flickers) {
      const k = 1 + (Math.sin(this.t * f.speed + f.phase) + Math.sin(this.t * f.speed * 2.3 + f.phase) * 0.5) * f.amt * Math.min(e, 1.6);
      f.obj.scale.set(f.base.x * (2 - k), f.base.y * k, f.base.z * (2 - k));
    }
    for (const s of r.spins) s.obj.rotation[s.axis] += s.speed * dt * e;
    r.tick?.(this.t, e);
    this.blinkIn -= dt;
    if (this.blinkIn <= 0 && !this.ko) {
      this.blinkT = 0.13;
      this.blinkIn = 2 + Math.random() * 3.5;
    }
    const lid = this.ko ? 0.12 : this.blinkT > 0 ? 0.12 : 1;
    if (this.blinkT > 0) this.blinkT -= dt;
    for (const eye of r.eyes) eye.scale.y = lid;
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 4.5);
      for (const m of this.kit.mats) m.emissive.setScalar(this.flash * 0.85);
    }
    const lift = this.root.position.y + this.body.position.y * this.rig.scale;
    const s = this.worldWidth * 0.5 * clamp(1 - lift * 0.22, 0.35, 1);
    this.shadow.scale.set(s, s, s);
    this.shadow.position.x = this.root.position.x;
    this.shadow.position.z = this.root.position.z;
  }

  private local(p: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
    this.group.updateMatrixWorld(true);
    return this.body.localToWorld(out.copy(p));
  }

  worldMouth(out = new THREE.Vector3()): THREE.Vector3 {
    return this.local(this.rig.mouth, out);
  }

  worldCenter(out = new THREE.Vector3()): THREE.Vector3 {
    return this.local(v.set(0, this.rig.height * 0.55, 0), out);
  }

  worldTop(out = new THREE.Vector3()): THREE.Vector3 {
    return this.local(v.set(0, this.rig.height, 0), out);
  }

  worldHead(out = new THREE.Vector3()): THREE.Vector3 {
    this.group.updateMatrixWorld(true);
    if (this.rig.head) return this.rig.head.getWorldPosition(out);
    return this.worldTop(out);
  }

  reset(): void {
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    this.pose.rotation.set(0, 0, 0);
    this.pose.scale.set(1, 1, 1);
    this.ko = false;
    this.energy = 1;
    this.hoverK = 1;
    this.flash = 0;
    for (const m of this.kit.mats) m.emissive.setScalar(0);
    this.rig.special?.(0);
  }

  async attack(tw: Tweens, reach: number, onImpact: () => void, power = 1): Promise<void> {
    const d = this.dir;
    const sp = this.rig.special;
    this.energy = 2.6;
    await tw.run(
      power > 1 ? 0.3 : 0.16,
      (k) => {
        this.root.position.x = -d * 0.18 * k;
        this.pose.rotation.x = -0.22 * k;
        this.pose.scale.set(1 + 0.1 * k, 1 - 0.12 * k, 1 + 0.1 * k);
      },
      { ease: ease.outQuad },
    );
    await tw.run(
      0.11,
      (k) => {
        this.root.position.x = lerp(-d * 0.18, d * reach, k);
        this.pose.rotation.x = lerp(-0.22, 0.28, k);
        this.pose.scale.set(lerp(1.1, 0.9, k), lerp(0.88, 1.12, k), lerp(1.1, 0.9, k));
        sp?.(k);
      },
      { ease: ease.inQuad },
    );
    onImpact();
    await tw.wait(0.07);
    await tw.run(
      0.34,
      (k) => {
        this.root.position.x = lerp(d * reach, 0, k);
        this.pose.rotation.x = lerp(0.28, 0, k);
        this.pose.scale.set(lerp(0.9, 1, k), lerp(1.12, 1, k), lerp(0.9, 1, k));
        sp?.(1 - k);
      },
      { ease: ease.outCubic },
    );
  }

  async hurt(tw: Tweens, strength = 1): Promise<void> {
    const d = this.dir;
    this.flash = 1;
    this.energy = 2;
    await tw.run(
      0.09,
      (k) => {
        this.root.position.x = -d * 0.4 * strength * k;
        this.pose.rotation.x = -0.35 * k;
        this.pose.scale.set(1 + 0.14 * k, 1 - 0.16 * k, 1 + 0.14 * k);
      },
      { ease: ease.outQuad },
    );
    await tw.run(
      0.42,
      (k) => {
        this.root.position.x = -d * 0.4 * strength * (1 - k);
        this.pose.rotation.x = -0.35 * (1 - k);
        this.pose.scale.set(lerp(1.14, 1, k), lerp(0.84, 1, k), lerp(1.14, 1, k));
      },
      { ease: ease.outBack },
    );
  }

  /** Braces behind a shield: a short lean into the hit, no knockback. */
  async guard(tw: Tweens): Promise<void> {
    const d = this.dir;
    this.energy = 1.8;
    await tw.run(
      0.08,
      (k) => {
        this.root.position.x = -d * 0.1 * k;
        this.pose.rotation.x = 0.12 * k;
        this.pose.scale.set(1 + 0.1 * k, 1 - 0.12 * k, 1 + 0.1 * k);
      },
      { ease: ease.outQuad },
    );
    await tw.run(
      0.3,
      (k) => {
        this.root.position.x = -d * 0.1 * (1 - k);
        this.pose.rotation.x = 0.12 * (1 - k);
        this.pose.scale.set(lerp(1.1, 1, k), lerp(0.88, 1, k), lerp(1.1, 1, k));
      },
      { ease: ease.outBack },
    );
  }

  async knockout(tw: Tweens): Promise<void> {
    const d = this.dir;
    this.flash = 1;
    this.ko = true;
    await tw.run(
      0.55,
      (k) => {
        this.root.position.x = -d * 1.2 * k;
        this.root.position.y = Math.sin(k * Math.PI) * 0.9;
        this.root.rotation.z = d * 1.45 * k;
        this.hoverK = 1 - k;
      },
      { ease: ease.linear },
    );
    await tw.run(0.3, (k) => {
      this.root.position.y = Math.sin(k * Math.PI) * 0.16;
    });
  }

  async cheer(tw: Tweens, hops = 2): Promise<void> {
    this.energy = 2.2;
    for (let i = 0; i < hops; i++) {
      await tw.run(0.1, (k) => this.pose.scale.set(1 + 0.12 * k, 1 - 0.15 * k, 1 + 0.12 * k), { ease: ease.outQuad });
      await tw.run(
        0.42,
        (k) => {
          this.root.position.y = Math.sin(k * Math.PI) * 0.55;
          const s = Math.sin(k * Math.PI);
          this.pose.scale.set(lerp(1.12, 0.94, s), lerp(0.85, 1.1, s), lerp(1.12, 0.94, s));
        },
        { ease: ease.linear },
      );
    }
    await tw.run(0.18, (k) => this.pose.scale.set(lerp(0.94, 1, k), lerp(1.1, 1, k), lerp(0.94, 1, k)), { ease: ease.outBack });
  }

  async enter(tw: Tweens, from = 5): Promise<void> {
    this.reset();
    await tw.run(0.42, (k) => (this.root.position.y = (1 - k) * from), { ease: ease.inQuad });
    await tw.run(0.1, (k) => this.pose.scale.set(1 + 0.18 * k, 1 - 0.22 * k, 1 + 0.18 * k), { ease: ease.outQuad });
    await tw.run(0.3, (k) => this.pose.scale.set(lerp(1.18, 1, k), lerp(0.78, 1, k), lerp(1.18, 1, k)), { ease: ease.outBack });
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.kit.mats) m.dispose();
    for (const m of this.kit.basics) m.dispose();
    (this.shadow.material as THREE.Material).dispose();
  }
}
