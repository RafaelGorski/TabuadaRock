import type { ElementType } from '../game/types';

export type Bus = 'sfx' | 'music';

export interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  /** End frequency, reached at the end of the note. */
  slide?: number;
  when?: number;
  bus?: Bus;
  /** Lowpass cutoff, optionally sweeping to filterTo. */
  filter?: number;
  filterTo?: number;
  q?: number;
  detune?: number;
  /** Hold the level until late in the note instead of decaying right away. */
  sustain?: boolean;
}

export interface NoiseOpts {
  gain?: number;
  type?: BiquadFilterType;
  freq?: number;
  slide?: number;
  q?: number;
  when?: number;
  bus?: Bus;
}

export const midiHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** Everything audible is synthesized here; no audio files to download. */
export class Sound {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private duckNode: GainNode | null = null;
  private buses: Partial<Record<Bus, GainNode>> = {};
  private noiseBuf: AudioBuffer | null = null;
  private sfxOn = true;
  private musicOn = true;
  private vol = 0.8;

  /** Call from a click or key press; browsers only allow audio after a gesture. */
  unlock(): void {
    try {
      if (!this.ctx) this.build();
      if (this.ctx?.state === 'suspended') void this.ctx.resume();
    } catch (err) {
      console.warn('Som indisponível', err);
    }
  }

  private build(): void {
    const AC: typeof AudioContext | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = this.vol;
    master.connect(comp);
    const duck = ctx.createGain();
    duck.connect(master);
    const sfx = ctx.createGain();
    sfx.gain.value = this.sfxOn ? 1 : 0;
    sfx.connect(master);
    const music = ctx.createGain();
    music.gain.value = this.musicOn ? 0.5 : 0;
    music.connect(duck);
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.ctx = ctx;
    this.master = master;
    this.duckNode = duck;
    this.buses = { sfx, music };
    this.noiseBuf = buf;
  }

  get now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  get running(): boolean {
    return this.ctx?.state === 'running';
  }

  get musicEnabled(): boolean {
    return this.musicOn;
  }

  setVolume(v: number): void {
    this.vol = Math.max(0, Math.min(1, v));
    this.master?.gain.setTargetAtTime(this.vol, this.now, 0.05);
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
    this.buses.sfx?.gain.setTargetAtTime(on ? 1 : 0, this.now, 0.03);
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    this.buses.music?.gain.setTargetAtTime(on ? 0.5 : 0, this.now, 0.08);
  }

  /** Lowers the music while the narrator talks. */
  duck(on: boolean): void {
    this.duckNode?.gain.setTargetAtTime(on ? 0.35 : 1, this.now, 0.1);
  }

  private live(bus: Bus): GainNode | null {
    if (!this.ctx || this.ctx.state !== 'running') return null;
    if (bus === 'sfx' && !this.sfxOn) return null;
    if (bus === 'music' && !this.musicOn) return null;
    return this.buses[bus] ?? null;
  }

  tone(freq: number, dur: number, o: ToneOpts = {}): void {
    const out = this.live(o.bus ?? 'sfx');
    const ctx = this.ctx;
    if (!out || !ctx) return;
    const t = o.when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const a = o.attack ?? 0.004;
    const peak = o.gain ?? 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    if (o.sustain) g.gain.setValueAtTime(peak, t + Math.max(a + 0.005, dur * 0.72));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.01));
    let node: AudioNode = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.filter, t);
      if (o.filterTo) f.frequency.exponentialRampToValueAtTime(o.filterTo, t + dur);
      f.Q.value = o.q ?? 0.7;
      node.connect(f);
      node = f;
    }
    node.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  noise(dur: number, o: NoiseOpts = {}): void {
    const out = this.live(o.bus ?? 'sfx');
    const ctx = this.ctx;
    if (!out || !ctx || !this.noiseBuf) return;
    const t = o.when ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq ?? 1500, t);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    f.Q.value = o.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.gain ?? 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.8);
    src.stop(t + dur + 0.02);
  }

  /* ---- interface ---- */

  move(): void {
    this.tone(700, 0.05, { type: 'square', gain: 0.05, filter: 2400 });
  }

  ok(): void {
    this.tone(880, 0.07, { type: 'square', gain: 0.07, filter: 3000 });
    this.tone(1320, 0.1, { type: 'square', gain: 0.07, filter: 3000, when: this.now + 0.06 });
  }

  back(): void {
    this.tone(560, 0.09, { type: 'triangle', gain: 0.12, slide: 330 });
  }

  key(): void {
    this.tone(1250 + Math.random() * 120, 0.03, { type: 'triangle', gain: 0.07 });
  }

  erase(): void {
    this.tone(420, 0.05, { type: 'triangle', gain: 0.08, slide: 300 });
  }

  denied(): void {
    this.tone(190, 0.16, { type: 'square', gain: 0.07, slide: 150, filter: 1200 });
  }

  /* ---- fight ---- */

  correct(): void {
    this.tone(988, 0.08, { type: 'square', gain: 0.08, filter: 3500 });
    this.tone(1319, 0.16, { type: 'square', gain: 0.08, filter: 3500, when: this.now + 0.07 });
  }

  wrong(): void {
    this.tone(155, 0.32, { type: 'sawtooth', gain: 0.16, slide: 105, filter: 900 });
    this.tone(160, 0.32, { type: 'sawtooth', gain: 0.1, slide: 110, filter: 900, detune: 18 });
  }

  combo(n: number): void {
    const f = 523 * Math.pow(2, Math.min(n, 14) / 12);
    this.tone(f, 0.09, { type: 'square', gain: 0.06, filter: 4000 });
    this.tone(f * 1.5, 0.12, { type: 'triangle', gain: 0.05, when: this.now + 0.05 });
  }

  tick(urgent = false): void {
    this.tone(urgent ? 2300 : 1700, 0.035, { type: 'sine', gain: urgent ? 0.14 : 0.07 });
  }

  count(): void {
    this.tone(660, 0.14, { type: 'square', gain: 0.1, filter: 2600 });
  }

  go(): void {
    this.tone(1320, 0.42, { type: 'square', gain: 0.1, filter: 3200, sustain: true });
    this.tone(660, 0.42, { type: 'sawtooth', gain: 0.06, filter: 2000, sustain: true });
    this.noise(0.5, { type: 'highpass', freq: 5000, gain: 0.12 });
  }

  slam(): void {
    this.tone(70, 0.6, { type: 'sine', gain: 0.8, slide: 32 });
    this.tone(140, 0.35, { type: 'sawtooth', gain: 0.12, slide: 60, filter: 900 });
    this.noise(0.9, { type: 'lowpass', freq: 2600, slide: 200, gain: 0.5 });
  }

  whoosh(): void {
    this.noise(0.22, { type: 'bandpass', freq: 500, slide: 2600, q: 1.2, gain: 0.22 });
  }

  charge(): void {
    this.tone(180, 0.65, { type: 'sawtooth', gain: 0.07, slide: 980, filter: 600, filterTo: 4000 });
    this.noise(0.65, { type: 'bandpass', freq: 400, slide: 4000, q: 2, gain: 0.12 });
  }

  impact(el: ElementType, power = 1): void {
    const p = Math.min(power, 2);
    const t = this.now;
    switch (el) {
      case 'agua':
        this.tone(900, 0.12, { type: 'sine', gain: 0.25, slide: 220 });
        this.noise(0.25, { type: 'lowpass', freq: 1800, slide: 400, gain: 0.3 * p });
        break;
      case 'fogo':
        this.noise(0.45, { type: 'lowpass', freq: 3000, slide: 300, gain: 0.4 * p, q: 1.5 });
        this.tone(120, 0.25, { type: 'sawtooth', gain: 0.12, slide: 60, filter: 500 });
        break;
      case 'planta':
        this.noise(0.18, { type: 'highpass', freq: 3000, gain: 0.22 });
        this.tone(330, 0.2, { type: 'triangle', gain: 0.22, slide: 160 });
        this.noise(0.2, { type: 'bandpass', freq: 900, gain: 0.25 * p, when: t + 0.04 });
        break;
      case 'raio':
        this.tone(1600, 0.16, { type: 'square', gain: 0.1, slide: 90, filter: 5000 });
        this.noise(0.3, { type: 'highpass', freq: 2500, gain: 0.3 * p });
        break;
      case 'pedra':
        this.tone(150, 0.4, { type: 'sine', gain: 0.6, slide: 38 });
        this.noise(0.35, { type: 'lowpass', freq: 900, slide: 120, gain: 0.45 * p });
        break;
      case 'vento':
        this.noise(0.35, { type: 'bandpass', freq: 2400, slide: 500, q: 2.5, gain: 0.35 * p });
        this.tone(600, 0.2, { type: 'triangle', gain: 0.1, slide: 1200 });
        break;
    }
    this.tone(95, 0.18, { type: 'sine', gain: 0.45 * p, slide: 45 });
  }

  knockout(): void {
    this.tone(110, 1.1, { type: 'sine', gain: 0.7, slide: 28 });
    this.noise(1.2, { type: 'lowpass', freq: 1400, slide: 90, gain: 0.55 });
    this.tone(660, 0.9, { type: 'sawtooth', gain: 0.06, slide: 90, filter: 1800 });
  }

  star(i: number): void {
    const f = [1047, 1319, 1568][Math.max(0, Math.min(2, i))];
    this.tone(f, 0.32, { type: 'triangle', gain: 0.16 });
    this.tone(f * 2, 0.14, { type: 'sine', gain: 0.06, when: this.now + 0.05 });
  }

  orb(i: number): void {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    this.tone(midiHz(67 + scale[i % scale.length]), 0.16, { type: 'triangle', gain: 0.08 });
  }

  pop(): void {
    this.tone(500 + Math.random() * 200, 0.06, { type: 'sine', gain: 0.1, slide: 1200 });
  }

  sparkle(): void {
    [0, 4, 7, 12, 16].forEach((s, i) => this.tone(midiHz(76 + s), 0.18, { type: 'triangle', gain: 0.07, when: this.now + i * 0.06 }));
  }
}
