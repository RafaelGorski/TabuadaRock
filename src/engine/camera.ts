import * as THREE from 'three';
import { clamp, damp } from './tween';

export interface ShotOptions {
  /** Points that must stay on screen. */
  points: THREE.Vector3[];
  /** Horizontal angle around the subject, in radians. 0 looks down -Z. */
  yaw?: number;
  /** Angle above the horizon, in radians. */
  pitch?: number;
  /** Extra room around the subject, as a share of the frame. */
  pad?: number;
  /** Raise or lower the look target. */
  lift?: number;
  /** Smoothing speed. Higher is snappier. */
  speed?: number;
  /** Seconds of slow orbit per full turn. 0 for none. */
  orbit?: number;
  /** Slow push toward the subject, per second. */
  drift?: number;
}

/** Part of the screen that the 3D subject should use, as shares from the top and from the left. */
export interface SafeArea {
  top: number;
  bottom: number;
  left?: number;
  right?: number;
}

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  private pos = new THREE.Vector3(0, 2, 8);
  private look = new THREE.Vector3(0, 1, 0);
  private wantPos = new THREE.Vector3(0, 2, 8);
  private wantLook = new THREE.Vector3(0, 1, 0);
  private shot: Required<ShotOptions> | null = null;
  private orbitAngle = 0;
  private driftAmount = 0;
  private trauma = 0;
  private time = 0;
  private w = 1;
  private h = 1;
  safe: SafeArea = { top: 0.08, bottom: 0.72 };
  shakeEnabled = true;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    this.camera.position.copy(this.pos);
  }

  resize(w: number, h: number): void {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.camera.aspect = this.w / this.h;
    this.applyViewOffset();
    this.camera.updateProjectionMatrix();
    if (this.shot) this.solve();
  }

  setSafeArea(safe: SafeArea): void {
    this.safe = safe;
    this.applyViewOffset();
    this.camera.updateProjectionMatrix();
    if (this.shot) this.solve();
  }

  private applyViewOffset(): void {
    const cy = (this.safe.top + this.safe.bottom) / 2;
    const cx = ((this.safe.left ?? 0) + (this.safe.right ?? 1)) / 2;
    this.camera.setViewOffset(this.w, this.h, (0.5 - cx) * this.w, (0.5 - cy) * this.h, this.w, this.h);
  }

  frame(opts: ShotOptions, cut = false): void {
    this.shot = {
      points: opts.points.map((p) => p.clone()),
      yaw: opts.yaw ?? 0,
      pitch: opts.pitch ?? 0.12,
      pad: opts.pad ?? 0.12,
      lift: opts.lift ?? 0,
      speed: opts.speed ?? 4,
      orbit: opts.orbit ?? 0,
      drift: opts.drift ?? 0,
    };
    this.orbitAngle = 0;
    this.driftAmount = 0;
    this.solve();
    if (cut) this.cut();
  }

  cut(): void {
    this.pos.copy(this.wantPos);
    this.look.copy(this.wantLook);
  }

  /** Works out where the camera has to stand so every point fits inside the safe area. */
  private solve(): void {
    const s = this.shot;
    if (!s || !s.points.length) return;
    const center = new THREE.Vector3();
    for (const p of s.points) center.add(p);
    center.divideScalar(s.points.length);
    center.y += s.lift;
    const yaw = s.yaw + this.orbitAngle;
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(s.pitch), Math.sin(s.pitch), Math.cos(yaw) * Math.cos(s.pitch)).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    const up = new THREE.Vector3().crossVectors(dir, right).normalize();
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const usable = clamp(this.safe.bottom - this.safe.top, 0.2, 1);
    const usableX = clamp((this.safe.right ?? 1) - (this.safe.left ?? 0), 0.2, 1);
    const tanVy = tanV * usable * (1 - s.pad);
    const tanVx = tanV * this.camera.aspect * usableX * (1 - s.pad);
    let dist = 1.5;
    const d = new THREE.Vector3();
    for (const p of s.points) {
      d.subVectors(p, center);
      const along = d.dot(dir);
      const need = Math.max(Math.abs(d.dot(right)) / tanVx, Math.abs(d.dot(up)) / tanVy) + along;
      dist = Math.max(dist, need);
    }
    dist *= 1 - this.driftAmount;
    this.wantLook.copy(center);
    this.wantPos.copy(center).addScaledVector(dir, dist);
  }

  addTrauma(amount: number): void {
    if (!this.shakeEnabled) return;
    this.trauma = clamp(this.trauma + amount, 0, 1);
  }

  update(dt: number): void {
    this.time += dt;
    const s = this.shot;
    if (s && (s.orbit || s.drift)) {
      if (s.orbit) this.orbitAngle += (dt / s.orbit) * Math.PI * 2;
      if (s.drift) this.driftAmount = Math.min(0.25, this.driftAmount + s.drift * dt);
      this.solve();
    }
    const speed = s?.speed ?? 4;
    this.pos.set(damp(this.pos.x, this.wantPos.x, speed, dt), damp(this.pos.y, this.wantPos.y, speed, dt), damp(this.pos.z, this.wantPos.z, speed, dt));
    this.look.set(damp(this.look.x, this.wantLook.x, speed, dt), damp(this.look.y, this.wantLook.y, speed, dt), damp(this.look.z, this.wantLook.z, speed, dt));
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
    if (this.trauma > 0) {
      const k = this.trauma * this.trauma;
      const t = this.time * 38;
      this.camera.position.x += Math.sin(t * 1.1) * 0.09 * k;
      this.camera.position.y += Math.sin(t * 1.7 + 1.3) * 0.07 * k;
      this.camera.rotation.z += Math.sin(t * 0.9 + 2.1) * 0.02 * k;
      this.trauma = Math.max(0, this.trauma - dt * 1.6);
    }
  }
}
