import * as THREE from 'three';
import type { StageId } from '../game/levels';
import { GEO, StaticBatch, canvasTexture, skyTexture, toon, type Placement, type V3 } from './toon';

export interface Look {
  /** Sky gradient stops. 0 is straight up, 0.5 is the horizon. */
  sky: [number, string][];
  fog: [string, number, number];
  hemi: [string, string, number];
  sun: [string, number, V3];
}

export interface Stage {
  readonly id: StageId;
  readonly group: THREE.Group;
  readonly look: Look;
  update(t: number, dt: number): void;
  dispose(): void;
}

type Tick = (t: number, dt: number) => void;
interface Disposable {
  dispose(): void;
}
type Ctx = CanvasRenderingContext2D;

export const MESA = new THREE.CylinderGeometry(0.8, 1, 1, 9);

/**
 * Builds one stage. Static props are merged into a few meshes; moving props get small batches of their own.
 * Fighters stand at x = ±1.8 on y = 0, the camera sits around z = +8, so the backdrop lives at z < 0.
 */
export class Scenery {
  readonly group = new THREE.Group();
  readonly b = new StaticBatch(0.045);
  private ticks: Tick[] = [];
  private trash: Disposable[] = [];
  private s: number;
  /** Tint it above 1 for lightning. */
  skyMat!: THREE.MeshBasicMaterial;

  constructor(
    readonly id: StageId,
    readonly look: Look,
    seed = 1,
  ) {
    this.s = seed;
    this.dome();
  }

  rnd(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(a: number, b: number): number {
    return a + (b - a) * this.rnd();
  }

  pick<T>(list: T[]): T {
    return list[Math.floor(this.rnd() * list.length)];
  }

  own<T extends Disposable>(x: T): T {
    this.trash.push(x);
    return x;
  }

  anim(fn: Tick): void {
    this.ticks.push(fn);
  }

  private keep(g: THREE.Object3D): void {
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) this.trash.push(o.geometry);
    });
  }

  private dome(): void {
    const mat = this.own(new THREE.MeshBasicMaterial({ map: this.own(skyTexture(this.look.sky)), side: THREE.BackSide, fog: false, depthWrite: false }));
    this.skyMat = mat;
    const dome = new THREE.Mesh(this.own(new THREE.SphereGeometry(200, 32, 16)), mat);
    dome.renderOrder = -10;
    dome.frustumCulled = false;
    this.group.add(dome);
  }

  /* ---------- surfaces ---------- */

  ground(map: THREE.Texture | null, color = '#FFFFFF', radius = 90, y = 0): THREE.Mesh {
    const mat = this.own(toon(color, map ? { map: this.own(map) } : {}));
    const mesh = new THREE.Mesh(this.own(new THREE.CircleGeometry(radius, 48)), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    this.group.add(mesh);
    return mesh;
  }

  /** A flat rectangle on the floor, like a promenade, a deck or a mat. */
  patch(map: THREE.Texture | null, color: string, w: number, d: number, pos: V3, ry = 0): THREE.Mesh {
    const mat = this.own(toon(color, map ? { map: this.own(map) } : {}));
    const mesh = new THREE.Mesh(this.own(new THREE.PlaneGeometry(w, d)), mat);
    mesh.rotation.set(-Math.PI / 2, 0, ry);
    mesh.position.set(...pos);
    this.group.add(mesh);
    return mesh;
  }

  water(base: string, line: string, w: number, d: number, pos: V3, flow: [number, number] = [0.02, 0.008], repeat: [number, number] = [10, 10]): THREE.Mesh {
    const map = this.own(canvasTexture(256, 256, (c) => this.drawWaves(c, base, line), repeat));
    const mesh = new THREE.Mesh(this.own(new THREE.PlaneGeometry(w, d)), this.own(new THREE.MeshBasicMaterial({ map })));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...pos);
    this.group.add(mesh);
    this.anim((_t, dt) => {
      map.offset.x += flow[0] * dt;
      map.offset.y += flow[1] * dt;
    });
    return mesh;
  }

  /* ---------- textures ---------- */

  private drawWaves(c: Ctx, base: string, line: string): void {
    c.fillStyle = base;
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = line;
    c.lineWidth = 5;
    c.lineCap = 'round';
    for (let i = 0; i < 24; i++) {
      const x = 22 + this.rnd() * 180;
      const y = 18 + this.rnd() * 220;
      const w = 20 + this.rnd() * 30;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + w * 0.25, y - 7, x + w * 0.5, y);
      c.quadraticCurveTo(x + w * 0.75, y + 7, x + w, y);
      c.stroke();
    }
  }

  /** Base color with scattered specks, tiled seamlessly. specks = [color, count, radius]. */
  speckles(base: string, specks: [string, number, number][], repeat: number): THREE.CanvasTexture {
    return canvasTexture(
      256,
      256,
      (c) => {
        c.fillStyle = base;
        c.fillRect(0, 0, 256, 256);
        for (const [color, count, size] of specks) {
          c.fillStyle = color;
          for (let i = 0; i < count; i++) {
            const x = this.rnd() * 256;
            const y = this.rnd() * 256;
            const r = size * (0.6 + this.rnd() * 0.8);
            const rot = this.rnd() * Math.PI;
            for (const ox of [-256, 0, 256])
              for (const oy of [-256, 0, 256]) {
                c.beginPath();
                c.ellipse(x + ox, y + oy, r, r * 0.6, rot, 0, Math.PI * 2);
                c.fill();
              }
          }
        }
      },
      [repeat, repeat],
    );
  }

  checker(a: string, b: string, repeat: number, line = '#1A1230'): THREE.CanvasTexture {
    return canvasTexture(
      256,
      256,
      (c) => {
        for (let i = 0; i < 2; i++)
          for (let j = 0; j < 2; j++) {
            c.fillStyle = (i + j) % 2 ? b : a;
            c.fillRect(i * 128, j * 128, 128, 128);
          }
        c.strokeStyle = line;
        c.globalAlpha = 0.35;
        c.lineWidth = 4;
        c.strokeRect(0, 0, 256, 256);
        c.beginPath();
        c.moveTo(128, 0);
        c.lineTo(128, 256);
        c.moveTo(0, 128);
        c.lineTo(256, 128);
        c.stroke();
      },
      [repeat, repeat],
    );
  }

  /** The black and white wave mosaic of the Copacabana promenade. */
  calcadao(repeat: [number, number]): THREE.CanvasTexture {
    return canvasTexture(
      256,
      256,
      (c) => {
        c.fillStyle = '#F4F1E8';
        c.fillRect(0, 0, 256, 256);
        c.fillStyle = '#1A1230';
        for (let y0 = -64; y0 < 320; y0 += 64) {
          c.beginPath();
          for (let x = 0; x <= 256; x += 8) c.lineTo(x, y0 + Math.sin((x / 256) * Math.PI * 2) * 20);
          for (let x = 256; x >= 0; x -= 8) c.lineTo(x, y0 + 30 + Math.sin((x / 256) * Math.PI * 2) * 20);
          c.closePath();
          c.fill();
        }
      },
      repeat,
    );
  }

  planks(a: string, b: string, repeat: [number, number]): THREE.CanvasTexture {
    return canvasTexture(
      256,
      256,
      (c) => {
        for (let i = 0; i < 8; i++) {
          c.fillStyle = i % 2 ? a : b;
          c.fillRect(0, i * 32, 256, 32);
          c.fillStyle = 'rgba(26,18,48,0.55)';
          c.fillRect(0, i * 32, 256, 3);
          c.fillRect(((i * 97) % 200) + 20, i * 32, 3, 32);
        }
      },
      repeat,
    );
  }

  cracks(base: string, line: string, repeat: number): THREE.CanvasTexture {
    return canvasTexture(
      256,
      256,
      (c) => {
        c.fillStyle = base;
        c.fillRect(0, 0, 256, 256);
        c.strokeStyle = line;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        for (let i = 0; i < 16; i++) {
          let x = this.rnd() * 256;
          let y = this.rnd() * 256;
          let a = this.rnd() * Math.PI * 2;
          c.lineWidth = 2 + this.rnd() * 3;
          c.beginPath();
          c.moveTo(x, y);
          for (let k = 0; k < 6; k++) {
            a += (this.rnd() - 0.5) * 1.4;
            x += Math.cos(a) * 18;
            y += Math.sin(a) * 18;
            c.lineTo(x, y);
          }
          c.stroke();
        }
      },
      [repeat, repeat],
    );
  }

  streaks(base: string, colors: string[], repeat: [number, number]): THREE.CanvasTexture {
    return canvasTexture(
      128,
      256,
      (c) => {
        c.fillStyle = base;
        c.fillRect(0, 0, 128, 256);
        for (let i = 0; i < 40; i++) {
          c.fillStyle = this.pick(colors);
          const x = this.rnd() * 128;
          const y = this.rnd() * 256;
          const w = 3 + this.rnd() * 7;
          const h = 40 + this.rnd() * 120;
          for (const oy of [-256, 0, 256]) c.fillRect(x, y + oy, w, h);
        }
      },
      repeat,
    );
  }

  /* ---------- props ---------- */

  at(x: number, z: number, ry = 0, s: number | V3 = 1, y = 0): THREE.Matrix4 {
    return this.b.matrixOf({ pos: [x, y, z], rot: [0, ry, 0], scale: s });
  }

  part(m: THREE.Matrix4, geo: THREE.BufferGeometry, color: string, p: Placement, o: { outline?: boolean; flat?: boolean } = {}): void {
    this.b.add(geo, color, this.b.matrixOf(p, m), o);
  }

  /** Tapered trunk bending toward local +x. Returns its top. */
  trunk(m: THREE.Matrix4, h: number, r0: number, r1: number, bend: number, color: string, segs = 5): V3 {
    let px = 0;
    let py = 0;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const x = bend * h * t * t;
      const y = h * t;
      const len = Math.hypot(x - px, y - py);
      const ang = Math.atan2(x - px, y - py);
      const r = r0 + (r1 - r0) * (t - 0.5 / segs);
      this.part(m, GEO.cylLo, color, { pos: [(x + px) / 2, (y + py) / 2, 0], rot: [0, 0, -ang], scale: [r, len * 1.08, r] });
      px = x;
      py = y;
    }
    return [px, py, 0];
  }

  palm(x: number, z: number, h = 5, bend = 0.25, ry = 0, o: { fronds?: number; leaf?: [string, string]; bark?: string; nuts?: boolean; size?: number; droop?: number } = {}): void {
    const m = this.at(x, z, ry);
    const top = this.trunk(m, h, 0.2 * (o.size ?? 1), 0.13 * (o.size ?? 1), bend, o.bark ?? '#9A7650', 6);
    if (o.nuts !== false) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        this.part(m, GEO.sphereLo, '#6B4A2A', { pos: [top[0] + Math.sin(a) * 0.17, top[1] - 0.18, Math.cos(a) * 0.17], scale: 0.15 });
      }
    }
    const n = o.fronds ?? 7;
    const [l1, l2] = o.leaf ?? ['#2DBE4E', '#1F9A43'];
    const s = o.size ?? 1;
    const droop = o.droop ?? 0.55;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.range(-0.2, 0.2);
      const lm = this.b.matrixOf({ pos: top, rot: [0, a, 0], scale: s }, m);
      const col = i % 2 ? l1 : l2;
      this.part(lm, GEO.sphereLo, col, { pos: [0, 0.12, 0.55], rot: [-0.25, 0, 0], scale: [0.26, 0.05, 0.62] });
      this.part(lm, GEO.sphereLo, col, { pos: [0, 0.3 - droop * 0.75, 1.45], rot: [droop, 0, 0], scale: [0.22, 0.045, 0.6] });
    }
  }

  tree(x: number, z: number, h: number, r: number, leaves: string[], bark = '#7A5232', ry = 0, y = 0): void {
    const m = this.at(x, z, ry, 1, y);
    const top = this.trunk(m, h * 0.62, r * 0.17, r * 0.1, this.range(-0.08, 0.08), bark, 2);
    const blobs: [number, number, number, number][] = [
      [0, 0.15, 0, 1],
      [0.62, -0.12, 0.2, 0.72],
      [-0.6, -0.08, -0.15, 0.74],
      [0.1, 0.02, 0.58, 0.66],
      [-0.15, 0.5, -0.1, 0.62],
    ];
    blobs.forEach(([bx, by, bz, bs], i) => this.part(m, GEO.sphereLo, leaves[i % leaves.length], { pos: [top[0] + bx * r, top[1] + r * 0.55 + by * r, bz * r], scale: bs * r }));
  }

  /** Crooked savanna tree with a flat, sparse crown. */
  twisted(x: number, z: number, h: number, ry = 0, leaf = '#5E8F3A'): void {
    const m = this.at(x, z, ry);
    const top = this.trunk(m, h, 0.16, 0.09, 0.35, '#5A3E2A', 3);
    const bm = this.b.matrixOf({ pos: [top[0] * 0.4, h * 0.45, 0], rot: [0, 0, 0.9] }, m);
    const tip = this.trunk(bm, h * 0.45, 0.09, 0.06, -0.4, '#5A3E2A', 2);
    this.part(bm, GEO.sphereLo, leaf, { pos: [tip[0], tip[1] + 0.2, 0], scale: [0.9, 0.4, 0.8] });
    this.part(m, GEO.sphereLo, leaf, { pos: [top[0], top[1] + 0.25, 0], scale: [1.3, 0.5, 1.1] });
    this.part(m, GEO.sphereLo, leaf, { pos: [top[0] + 0.7, top[1] + 0.05, 0.3], scale: [0.8, 0.36, 0.7] });
  }

  bush(x: number, z: number, s: number, colors: string[]): void {
    const m = this.at(x, z, this.range(0, 6), s);
    this.part(m, GEO.sphereLo, colors[0], { pos: [0, 0.45, 0], scale: [0.8, 0.6, 0.7] });
    this.part(m, GEO.sphereLo, colors[1 % colors.length], { pos: [0.55, 0.3, 0.1], scale: 0.48 });
    this.part(m, GEO.sphereLo, colors[2 % colors.length], { pos: [-0.5, 0.28, 0.05], scale: 0.45 });
  }

  rock(x: number, z: number, s: number, color: string, y = 0, squash = 0.7): void {
    const m = this.at(x, z, this.range(0, 6));
    this.part(m, GEO.dodeca, color, { pos: [0, y + s * squash * 0.55, 0], rot: [this.range(-0.3, 0.3), 0, this.range(-0.3, 0.3)], scale: [s, s * squash, s * 0.9] }, { flat: true });
  }

  /** Little grass blades, no outline so the floor stays calm. */
  tuft(x: number, z: number, s: number, color: string): void {
    const m = this.at(x, z, this.range(0, 6), s);
    for (let i = 0; i < 3; i++) {
      this.part(m, GEO.coneLo, color, { pos: [(i - 1) * 0.12, 0.25, 0], rot: [0, 0, (i - 1) * 0.35], scale: [0.06, 0.5, 0.06] }, { outline: false });
    }
  }

  peak(x: number, z: number, r: number, h: number, color: string, cap?: string, y = 0): void {
    const m = this.at(x, z, this.range(0, 6), 1, y);
    this.part(m, GEO.coneLo, color, { pos: [0, h / 2, 0], scale: [r, h, r] }, { flat: true });
    if (cap) this.part(m, GEO.coneLo, cap, { pos: [0, h * 0.86, 0], scale: [r * 0.29, h * 0.29, r * 0.29] }, { flat: true, outline: false });
  }

  /** Table mountain: steep sides, flat top. */
  mesa(x: number, z: number, w: number, d: number, h: number, side: string, top: string, y = 0): void {
    const m = this.at(x, z, this.range(-0.3, 0.3), 1, y);
    this.part(m, MESA, side, { pos: [0, h / 2, 0], scale: [w, h, d] }, { flat: true });
    this.part(m, MESA, top, { pos: [0, h + 0.1, 0], scale: [w * 0.81, 0.25, d * 0.81] }, { flat: true, outline: false });
  }

  cactus(x: number, z: number, h: number, arms: number, ry = 0, color = '#4F8F4A'): void {
    const m = this.at(x, z, ry);
    const r = 0.18 + h * 0.03;
    this.part(m, GEO.cylLo, color, { pos: [0, h / 2, 0], scale: [r, h, r] }, { flat: true });
    this.part(m, GEO.sphereLo, color, { pos: [0, h, 0], scale: [r, r * 0.8, r] });
    for (let i = 0; i < arms; i++) {
      const side = i % 2 ? -1 : 1;
      const y = h * (0.35 + 0.15 * i);
      const out = r + 0.35;
      const up = h * (0.3 + 0.08 * i);
      const am = this.b.matrixOf({ rot: [0, (i * Math.PI) / 2.4, 0] }, m);
      this.part(am, GEO.cylLo, color, { pos: [side * out * 0.55, y, 0], rot: [0, 0, Math.PI / 2], scale: [r * 0.62, out, r * 0.62] }, { flat: true });
      this.part(am, GEO.cylLo, color, { pos: [side * out, y + up / 2, 0], scale: [r * 0.62, up, r * 0.62] }, { flat: true });
      this.part(am, GEO.sphereLo, color, { pos: [side * out, y + up, 0], scale: r * 0.62 });
    }
  }

  /** Small batched prop that can move. */
  movable(build: (b: StaticBatch) => void, outline = 0.04): THREE.Group {
    const mb = new StaticBatch(outline);
    build(mb);
    const g = mb.build();
    this.keep(g);
    this.group.add(g);
    return g;
  }

  cloud(x: number, y: number, z: number, s: number, speed = 0.35, span = 160): void {
    const g = this.movable((cb) => {
      const puffs: V3[] = [
        [0, 0, 0],
        [1.15, -0.25, 0.1],
        [-1.1, -0.3, 0],
        [0.5, 0.45, -0.1],
        [-0.45, 0.35, 0.15],
      ];
      puffs.forEach((p, i) => cb.add(GEO.sphereLo, '#FFFFFF', { pos: p, scale: [1.2 - i * 0.1, 0.95 - i * 0.08, 1 - i * 0.08] }));
    }, 0.05);
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    this.anim((_t, dt) => {
      g.position.x += speed * dt;
      if (g.position.x > span / 2) g.position.x -= span;
    });
  }

  sunDisc(pos: V3, r: number, color: string, halo?: string): void {
    const add = (radius: number, c: string, order: number) => {
      const mat = this.own(new THREE.MeshBasicMaterial({ color: c, fog: false, depthWrite: false }));
      const mesh = new THREE.Mesh(this.own(new THREE.CircleGeometry(radius, 48)), mat);
      mesh.position.set(...pos);
      mesh.lookAt(0, pos[1] * 0.3, 0);
      mesh.renderOrder = order;
      this.group.add(mesh);
    };
    if (halo) add(r * 1.5, halo, -9);
    add(r, color, -8);
  }

  finish(): Stage {
    const built = this.b.build();
    this.keep(built);
    this.group.add(built);
    const { id, group, look, ticks, trash } = this;
    return {
      id,
      group,
      look,
      update(t: number, dt: number) {
        for (const fn of ticks) fn(t, dt);
      },
      dispose() {
        group.removeFromParent();
        for (const x of trash) x.dispose();
        trash.length = 0;
      },
    };
  }
}
