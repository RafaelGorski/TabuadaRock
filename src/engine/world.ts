import * as THREE from 'three';
import type { StageId } from '../game/levels';
import { makeActor, type Actor, type ActorId } from './actors';
import { CameraRig, type SafeArea, type ShotOptions } from './camera';
import { Particles } from './fx';
import { Portraits } from './portraits';
import { buildStage, type Stage } from './stages';
import { Tweens } from './tween';

/** Fighters stand this far from the middle. */
export const FIGHT_X = 1.8;

export interface CastSlot {
  id: ActorId;
  x: number;
  z?: number;
  dir?: 1 | -1;
  turn?: number;
}

/** Runs after each rendered frame with game time and real time. */
export type FrameFn = (gdt: number, dt: number) => void;

const v = new THREE.Vector3();

/**
 * Owns the renderer, the loop and everything in the 3D scene.
 * Game time freezes during hitstop and pause; scenery and camera keep real time.
 */
export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly rig = new CameraRig();
  readonly fx = new Particles(360);
  readonly tw = new Tweens();
  readonly portraits: Portraits;
  readonly cast: Actor[] = [];
  stage: Stage | null = null;
  /** Bumped by reset(), so choreography started before a scene change can tell it is stale. */
  gen = 0;
  paused = false;
  slowmo = 1;
  private hemi = new THREE.HemisphereLight('#ffffff', '#8a7a66', 1.2);
  private sun = new THREE.DirectionalLight('#ffffff', 2.1);
  private stopFor = 0;
  private time = 0;
  private last = -1;
  private running = false;
  private frameFns = new Set<FrameFn>();
  private w = 1;
  private h = 1;
  private dpr: number;
  private sampleT = 0;
  private sampleN = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.sun.position.set(4, 8, 6);
    this.scene.add(this.hemi, this.sun, this.sun.target, this.fx.group);
    this.portraits = new Portraits(this.renderer);
    this.resize();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(canvas);
    else addEventListener('resize', () => this.resize());
  }

  get width(): number {
    return this.w;
  }

  get height(): number {
    return this.h;
  }

  resize(): void {
    const w = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    if (w === this.w && h === this.h && this.renderer.getPixelRatio() === this.dpr) return;
    this.w = w;
    this.h = h;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.rig.resize(w, h);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      this.tick(now);
    };
    requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    this.last = -1;
  }

  onFrame(fn: FrameFn): () => void {
    this.frameFns.add(fn);
    return () => this.frameFns.delete(fn);
  }

  /** Freezes game time for a beat so a hit lands with weight. */
  hitstop(seconds: number): void {
    this.stopFor = Math.max(this.stopFor, seconds);
  }

  private tick(now: number): void {
    const dt = this.last < 0 ? 1 / 60 : Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    let gdt = this.paused ? 0 : dt * this.slowmo;
    if (this.stopFor > 0) {
      this.stopFor -= dt;
      gdt = 0;
    }
    this.tw.update(gdt);
    for (const a of this.cast) a.update(gdt);
    this.fx.update(gdt);
    this.stage?.update(this.time, dt);
    this.rig.update(dt);
    this.renderer.render(this.scene, this.rig.camera);
    for (const fn of this.frameFns) fn(gdt, dt);
    this.portraits.pump();
    this.govern(dt);
  }

  /** Lowers the resolution a notch when the machine cannot keep up. */
  private govern(dt: number): void {
    if (this.time < 4 || this.dpr <= 1) return;
    this.sampleT += dt;
    this.sampleN++;
    if (this.sampleT < 2.5) return;
    const avg = this.sampleT / this.sampleN;
    this.sampleT = 0;
    this.sampleN = 0;
    if (avg > 1 / 42) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.resize();
    }
  }

  /** Forgets everything in flight: tweens, particles, hitstop, pause, and objects tagged `userData.transient`. */
  reset(): void {
    this.gen++;
    this.tw.abandon();
    this.fx.clear();
    this.stopFor = 0;
    this.paused = false;
    this.slowmo = 1;
    for (const a of this.cast) a.reset();
    for (const o of this.scene.children.filter((c) => c.userData.transient)) o.removeFromParent();
  }

  setStage(id: StageId): Stage {
    if (this.stage?.id === id) return this.stage;
    this.stage?.dispose();
    const s = buildStage(id);
    this.stage = s;
    this.scene.add(s.group);
    const L = s.look;
    this.scene.fog = new THREE.Fog(L.fog[0], L.fog[1], L.fog[2]);
    this.hemi.color.set(L.hemi[0]);
    this.hemi.groundColor.set(L.hemi[1]);
    this.hemi.intensity = L.hemi[2];
    this.sun.color.set(L.sun[0]);
    this.sun.intensity = L.sun[1];
    this.sun.position.set(...L.sun[2]);
    return s;
  }

  /** Puts these creatures on stage, reusing the ones already there. */
  setCast(slots: CastSlot[]): Actor[] {
    const spare = this.cast.splice(0);
    for (const s of slots) {
      const i = spare.findIndex((a) => a.id === s.id);
      const a = i >= 0 ? spare.splice(i, 1)[0] : makeActor(s.id);
      a.reset();
      a.group.position.set(s.x, 0, s.z ?? 0);
      a.face(s.dir ?? 1, s.turn ?? 0.95);
      a.group.visible = true;
      this.scene.add(a.group);
      this.cast.push(a);
    }
    for (const a of spare) a.dispose();
    return this.cast.slice();
  }

  setFighters(left: ActorId, right: ActorId | null, spread = FIGHT_X): [Actor, Actor | null] {
    const slots: CastSlot[] = [{ id: left, x: -spread, dir: 1 }];
    if (right) slots.push({ id: right, x: spread, dir: -1 });
    const [a, b] = this.setCast(slots);
    return [a, b ?? null];
  }

  /** Bounding points of creatures, for framing. */
  pointsOf(actors: Actor[]): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    for (const a of actors) {
      const p = a.group.position;
      const half = a.worldWidth * 0.5;
      pts.push(new THREE.Vector3(p.x - half, 0, p.z), new THREE.Vector3(p.x + half, a.worldHeight, p.z));
    }
    return pts;
  }

  frameActors(actors: Actor[], opts: Partial<ShotOptions> = {}, cut = false): void {
    if (!actors.length) return;
    this.rig.frame({ points: this.pointsOf(actors), ...opts }, cut);
  }

  frameFight(cut = false, opts: Partial<ShotOptions> = {}): void {
    this.frameActors(this.cast.slice(0, 2), { pitch: 0.12, pad: 0.12, speed: 3.2, ...opts }, cut);
  }

  /** Close-up on one creature, seen from the side it faces. */
  frameClose(a: Actor, cut = false, opts: Partial<ShotOptions> = {}): void {
    const p = a.group.position;
    const h = a.worldHeight;
    this.rig.frame(
      {
        points: [new THREE.Vector3(p.x, h * 0.25, p.z), new THREE.Vector3(p.x, h * 1.05, p.z), new THREE.Vector3(p.x - 0.4, h * 0.6, p.z), new THREE.Vector3(p.x + 0.4, h * 0.6, p.z)],
        yaw: a.dir * 0.42,
        pitch: 0.1,
        pad: 0.2,
        speed: 5,
        ...opts,
      },
      cut,
    );
  }

  setSafeArea(safe: SafeArea): void {
    this.rig.setSafeArea(safe);
  }

  set shake(on: boolean) {
    this.rig.shakeEnabled = on;
  }

  /** World point to CSS pixels on the canvas. */
  project(p: THREE.Vector3, out = { x: 0, y: 0 }): { x: number; y: number } {
    v.copy(p).project(this.rig.camera);
    out.x = (v.x + 1) * 0.5 * this.w;
    out.y = (1 - v.y) * 0.5 * this.h;
    return out;
  }
}

export type { Actor, ActorId };
