import * as THREE from 'three';
import { INK } from './toon';

export type ParticleKind = 'dot' | 'star' | 'drop' | 'leaf' | 'flame' | 'bolt' | 'rock' | 'swirl' | 'square' | 'ring';

type Draw = (ctx: CanvasRenderingContext2D) => void;

const SHAPES: Record<ParticleKind, Draw> = {
  dot: (c) => {
    c.beginPath();
    c.arc(32, 32, 22, 0, Math.PI * 2);
  },
  star: (c) => {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 11 : 26;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      c.lineTo(32 + Math.cos(a) * r, 34 + Math.sin(a) * r);
    }
    c.closePath();
  },
  drop: (c) => {
    c.beginPath();
    c.moveTo(32, 6);
    c.bezierCurveTo(44, 24, 52, 32, 52, 40);
    c.arc(32, 40, 20, 0, Math.PI);
    c.bezierCurveTo(12, 32, 20, 24, 32, 6);
    c.closePath();
  },
  leaf: (c) => {
    c.beginPath();
    c.moveTo(8, 56);
    c.quadraticCurveTo(10, 10, 56, 8);
    c.quadraticCurveTo(54, 54, 8, 56);
    c.closePath();
  },
  flame: (c) => {
    c.beginPath();
    c.moveTo(32, 4);
    c.bezierCurveTo(40, 20, 54, 28, 52, 44);
    c.bezierCurveTo(50, 56, 40, 60, 32, 60);
    c.bezierCurveTo(22, 60, 12, 54, 12, 42);
    c.bezierCurveTo(12, 32, 22, 30, 24, 20);
    c.bezierCurveTo(28, 26, 30, 14, 32, 4);
    c.closePath();
  },
  bolt: (c) => {
    c.beginPath();
    c.moveTo(38, 4);
    c.lineTo(14, 36);
    c.lineTo(30, 36);
    c.lineTo(22, 60);
    c.lineTo(50, 24);
    c.lineTo(34, 24);
    c.lineTo(44, 4);
    c.closePath();
  },
  rock: (c) => {
    c.beginPath();
    c.moveTo(14, 20);
    c.lineTo(34, 8);
    c.lineTo(54, 22);
    c.lineTo(52, 46);
    c.lineTo(30, 58);
    c.lineTo(10, 44);
    c.closePath();
  },
  swirl: (c) => {
    c.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = i * 0.21;
      const r = 3 + i * 0.42;
      c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
    }
  },
  square: (c) => {
    c.beginPath();
    c.rect(14, 14, 36, 36);
  },
  ring: (c) => {
    c.beginPath();
    c.arc(32, 32, 22, 0, Math.PI * 2);
  },
};

const STROKE_ONLY: ParticleKind[] = ['swirl', 'ring'];

const textures = new Map<ParticleKind, THREE.CanvasTexture>();

function texture(kind: ParticleKind): THREE.CanvasTexture {
  let t = textures.get(kind);
  if (t) return t;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Canvas 2D indisponível');
  c.lineJoin = 'round';
  c.lineCap = 'round';
  SHAPES[kind](c);
  if (STROKE_ONLY.includes(kind)) {
    c.strokeStyle = INK;
    c.lineWidth = 12;
    c.stroke();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 6;
    c.stroke();
  } else {
    c.fillStyle = '#ffffff';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 5;
    c.stroke();
    if (kind === 'leaf') {
      c.beginPath();
      c.moveTo(12, 52);
      c.lineTo(46, 18);
      c.lineWidth = 3;
      c.stroke();
    }
  }
  t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  textures.set(kind, t);
  return t;
}

interface Particle {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  vel: THREE.Vector3;
  gravity: number;
  drag: number;
  life: number;
  max: number;
  size0: number;
  size1: number;
  spin: number;
  alive: boolean;
}

export interface EmitOptions {
  count?: number;
  color?: THREE.ColorRepresentation | THREE.ColorRepresentation[];
  /** Base direction; particles spread around it. */
  dir?: THREE.Vector3;
  speed?: number;
  speedJitter?: number;
  /** 0 = tight beam, 1 = full sphere. */
  spread?: number;
  gravity?: number;
  drag?: number;
  life?: number;
  size?: number;
  sizeEnd?: number;
  spin?: number;
  /** Random offset of the spawn point. */
  jitter?: number;
}

const tmp = new THREE.Vector3();

export class Particles {
  private pool: Particle[] = [];
  private cursor = 0;
  readonly group = new THREE.Group();

  constructor(max = 320) {
    for (let i = 0; i < max; i++) {
      const mat = new THREE.SpriteMaterial({ map: texture('dot'), transparent: true, depthWrite: false, fog: false });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      sprite.renderOrder = 10;
      this.group.add(sprite);
      this.pool.push({ sprite, mat, vel: new THREE.Vector3(), gravity: 0, drag: 0, life: 0, max: 1, size0: 0.2, size1: 0, spin: 0, alive: false });
    }
  }

  private take(): Particle {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[(this.cursor + i) % this.pool.length];
      if (!p.alive) {
        this.cursor = (this.cursor + i + 1) % this.pool.length;
        return p;
      }
    }
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.pool.length;
    return p;
  }

  emit(kind: ParticleKind, at: THREE.Vector3, o: EmitOptions = {}): void {
    const count = o.count ?? 10;
    const colors = Array.isArray(o.color) ? o.color : [o.color ?? '#ffffff'];
    const dir = o.dir ?? new THREE.Vector3(0, 1, 0);
    const spread = o.spread ?? 1;
    const map = texture(kind);
    for (let i = 0; i < count; i++) {
      const p = this.take();
      p.alive = true;
      p.mat.map = map;
      p.mat.color.set(colors[i % colors.length]);
      p.mat.opacity = 1;
      p.mat.rotation = Math.random() * Math.PI * 2;
      const j = o.jitter ?? 0.05;
      p.sprite.position.set(at.x + (Math.random() - 0.5) * j * 2, at.y + (Math.random() - 0.5) * j * 2, at.z + (Math.random() - 0.5) * j * 2);
      tmp.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      p.vel.copy(dir).normalize().lerp(tmp, spread).normalize();
      const speed = (o.speed ?? 3) * (1 + (Math.random() - 0.5) * 2 * (o.speedJitter ?? 0.4));
      p.vel.multiplyScalar(speed);
      p.gravity = o.gravity ?? 0;
      p.drag = o.drag ?? 1.5;
      p.max = (o.life ?? 0.7) * (0.75 + Math.random() * 0.5);
      p.life = p.max;
      p.size0 = (o.size ?? 0.25) * (0.7 + Math.random() * 0.6);
      p.size1 = o.sizeEnd ?? 0;
      p.spin = (o.spin ?? 2) * (Math.random() - 0.5) * 2;
      p.sprite.scale.setScalar(p.size0);
      p.sprite.visible = true;
    }
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        p.sprite.visible = false;
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.vel.multiplyScalar(Math.exp(-p.drag * dt));
      p.sprite.position.addScaledVector(p.vel, dt);
      const k = 1 - p.life / p.max;
      const pop = k < 0.12 ? 0.55 + (k / 0.12) * 0.45 : 1;
      p.sprite.scale.setScalar(Math.max(0.001, (p.size0 + (p.size1 - p.size0) * k) * pop));
      p.mat.rotation += p.spin * dt;
      p.mat.opacity = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
    }
  }

  clear(): void {
    for (const p of this.pool) {
      p.alive = false;
      p.sprite.visible = false;
    }
  }
}
