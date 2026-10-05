import * as THREE from 'three';
import { GEO, hullGeometry, sharedOutline, toon } from './toon';
import { ease } from './tween';

const MAX = 100;
const ROW_COLORS = ['#2440FF', '#FFD21F'];

interface Orb {
  home: THREE.Vector3;
  pos: THREE.Vector3;
  appear: number;
  want: 0 | 1;
  delay: number;
  fly: { from: THREE.Vector3; to: THREE.Vector3; t: number; done: () => void } | null;
}

/**
 * The training wall: one row of n orbs for each step, stacked upward,
 * so 7 × 4 is literally four rows of seven.
 */
export class OrbWall {
  readonly group = new THREE.Group();
  readonly gap = 0.36;
  readonly radius = 0.135;
  private mesh: THREE.InstancedMesh;
  private hull: THREE.InstancedMesh;
  private orbs: Orb[] = [];
  private cols = 1;
  private rows = 0;
  private time = 0;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();
  private c = new THREE.Color();

  constructor(readonly origin = new THREE.Vector3(0, 0.5, -0.4)) {
    this.mesh = new THREE.InstancedMesh(GEO.sphere, toon('#ffffff'), MAX);
    this.hull = new THREE.InstancedMesh(hullGeometry(GEO.sphere), sharedOutline(0.024), MAX);
    for (const im of [this.mesh, this.hull]) {
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
    for (let i = 0; i < MAX; i++) {
      this.orbs.push({ home: new THREE.Vector3(), pos: new THREE.Vector3(), appear: 0, want: 0, delay: 0, fly: null });
      this.mesh.setColorAt(i, this.c.set(ROW_COLORS[0]));
    }
    this.group.add(this.mesh, this.hull);
    this.write();
  }

  get table(): number {
    return this.cols;
  }

  get shown(): number {
    return this.rows;
  }

  /** Starts a fresh wall for the table of n. */
  setTable(n: number): void {
    this.cols = Math.max(1, Math.min(10, n));
    this.rows = 0;
    for (let i = 0; i < MAX; i++) {
      const o = this.orbs[i];
      o.appear = 0;
      o.want = 0;
      o.fly = null;
      const r = Math.floor(i / this.cols);
      const col = i % this.cols;
      o.home.set(this.origin.x + (col - (this.cols - 1) / 2) * this.gap, this.origin.y + r * this.gap, this.origin.z);
      o.pos.copy(o.home);
      this.mesh.setColorAt(i, this.c.set(ROW_COLORS[r % 2]));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.write();
  }

  /** Shows b rows. New orbs pop in left to right. */
  showRows(b: number): void {
    const prev = this.rows;
    this.rows = Math.max(0, Math.min(10, b));
    const total = this.rows * this.cols;
    for (let i = 0; i < MAX; i++) {
      const o = this.orbs[i];
      const want: 0 | 1 = i < total ? 1 : 0;
      if (want && !o.want) {
        const r = Math.floor(i / this.cols);
        o.delay = (r - prev) * 0.12 + (i % this.cols) * 0.045;
        o.pos.copy(o.home);
        o.fly = null;
      }
      o.want = want;
    }
  }

  /** Where the running total of row r is written. */
  rowEnd(r: number, out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(this.origin.x + ((this.cols - 1) / 2) * this.gap + this.gap * 0.85, this.origin.y + r * this.gap, this.origin.z);
  }

  /** Corners of the full wall (10 rows), for framing. */
  bounds(): THREE.Vector3[] {
    const half = ((this.cols - 1) / 2) * this.gap + this.radius + 0.5;
    const top = this.origin.y + 9 * this.gap + this.radius;
    return [new THREE.Vector3(this.origin.x - half, 0, this.origin.z), new THREE.Vector3(this.origin.x + half, top, this.origin.z)];
  }

  /** Fires every visible orb at the target, top row first. */
  barrage(target: THREE.Vector3, onLand: (row: number, col: number) => void): Promise<void> {
    const total = this.rows * this.cols;
    if (!total) return Promise.resolve();
    let left = total;
    return new Promise((resolve) => {
      for (let i = 0; i < total; i++) {
        const o = this.orbs[i];
        const r = Math.floor(i / this.cols);
        const col = i % this.cols;
        o.delay = (this.rows - 1 - r) * 0.13 + (this.cols - 1 - col) * 0.018;
        o.fly = {
          from: o.pos.clone(),
          to: target.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0)),
          t: 0,
          done: () => {
            onLand(r, col);
            if (--left === 0) resolve();
          },
        };
      }
    });
  }

  clear(): void {
    this.rows = 0;
    for (const o of this.orbs) {
      o.appear = 0;
      o.want = 0;
      o.fly = null;
    }
    this.write();
  }

  update(dt: number): void {
    this.time += dt;
    for (let i = 0; i < MAX; i++) {
      const o = this.orbs[i];
      if (o.delay > 0) {
        o.delay -= dt;
        continue;
      }
      if (o.fly) {
        const f = o.fly;
        f.t = Math.min(1, f.t + dt / 0.3);
        o.pos.lerpVectors(f.from, f.to, ease.inQuad(f.t));
        o.pos.y += Math.sin(f.t * Math.PI) * 0.7;
        if (f.t >= 1) {
          o.fly = null;
          o.want = 0;
          o.appear = 0;
          f.done();
        }
        continue;
      }
      const step = dt / 0.26;
      o.appear = o.want ? Math.min(1, o.appear + step) : Math.max(0, o.appear - step * 1.5);
    }
    this.write();
  }

  private write(): void {
    let any = false;
    for (let i = 0; i < MAX; i++) {
      const o = this.orbs[i];
      const k = o.fly ? 1 : o.want ? ease.outBack(o.appear) : o.appear;
      if (k < 0.002) {
        this.p.set(0, -60, 0);
        this.s.setScalar(0.0001);
      } else {
        any = true;
        const bob = o.fly ? 0 : Math.sin(this.time * 2.2 + (i % this.cols) * 0.55 + Math.floor(i / this.cols) * 0.4) * 0.018;
        this.p.copy(o.pos);
        this.p.y += bob;
        this.s.setScalar(k * this.radius);
      }
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
      this.hull.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.hull.instanceMatrix.needsUpdate = true;
    this.group.visible = any;
  }
}
