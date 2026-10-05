export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inBack: (t: number) => {
    const c1 = 1.70158;
    return (c1 + 1) * t * t * t - c1 * t * t;
  },
};

interface Tween {
  t: number;
  dur: number;
  delay: number;
  ease: Ease;
  step: (v: number) => void;
  resolve: () => void;
  tag?: string;
}

/** Tweens advance on game time, so they freeze during hitstop and pause. */
export class Tweens {
  private list: Tween[] = [];

  run(dur: number, step: (v: number) => void, opts: { ease?: Ease; delay?: number; tag?: string } = {}): Promise<void> {
    return new Promise((resolve) => {
      this.list.push({ t: 0, dur: Math.max(1e-4, dur), delay: opts.delay ?? 0, ease: opts.ease ?? ease.outCubic, step, resolve, tag: opts.tag });
    });
  }

  wait(seconds: number): Promise<void> {
    return this.run(seconds, () => {});
  }

  cancel(tag: string): void {
    this.list = this.list.filter((tw) => {
      if (tw.tag !== tag) return true;
      tw.resolve();
      return false;
    });
  }

  clear(): void {
    for (const tw of this.list) tw.resolve();
    this.list = [];
  }

  /** Drops every tween without resolving it, so any async choreography waiting on them simply stops. */
  abandon(): void {
    this.list = [];
  }

  get busy(): boolean {
    return this.list.length > 0;
  }

  update(dt: number): void {
    if (!this.list.length) return;
    const finished: Tween[] = [];
    for (const tw of this.list) {
      let step = dt;
      if (tw.delay > 0) {
        tw.delay -= step;
        if (tw.delay > 0) continue;
        step = -tw.delay;
        tw.delay = 0;
      }
      tw.t = Math.min(tw.dur, tw.t + step);
      const k = tw.t / tw.dur;
      tw.step(tw.ease(k));
      if (k >= 1) finished.push(tw);
    }
    if (finished.length) {
      this.list = this.list.filter((tw) => !finished.includes(tw));
      for (const tw of finished) tw.resolve();
    }
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Frame-rate independent smoothing toward a target. */
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));
