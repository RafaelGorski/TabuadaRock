import { Sound, midiHz } from './synth';

type Quality = 'M' | 'm' | '7' | 'm7' | 'M7';
interface Chord {
  root: number;
  q: Quality;
}

/**
 * Patterns are 16 characters per bar (sixteenth notes).
 * Drums: 'x' hit, 'X' accent, '.' rest.
 * Bass: r root, t third, f fifth, s seventh, o octave, l fifth below.
 * Lead: digit or letter indexes `scale`, '-' holds the previous note.
 */
interface Song {
  bpm: number;
  swing: number;
  bars: Chord[];
  kick: string;
  snare: string;
  hat: string;
  tamb?: string;
  bass: string;
  bassAlt?: string;
  stab?: string;
  arp?: string;
  scale?: number[];
  lead?: string[];
  leadType?: OscillatorType;
  /** Lead and tamborim join at or above this intensity. */
  layersFrom?: number;
  fillKick?: string;
  fillSnare?: string;
  snareGain?: number;
  hatGain?: number;
}

const IV: Record<Quality, number[]> = {
  M: [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  M7: [0, 4, 7, 11],
};

const C = (root: number, q: Quality): Chord => ({ root, q });

const LUTA: Song = {
  bpm: 132,
  swing: 0.12,
  bars: [C(45, 'm7'), C(50, '7'), C(45, 'm7'), C(40, '7'), C(41, 'M7'), C(40, '7'), C(45, 'm7'), C(40, '7')],
  kick: 'x..x....x.x.....',
  fillKick: 'x..x....x.x.x.x.',
  snare: '....x.......x...',
  fillSnare: '....x.......x.xx',
  hat: 'xxxXxxxXxxxXxxxX',
  hatGain: 0.7,
  tamb: 'x..x..x...x..x..',
  bass: 'r..r..o..r.f..t.',
  bassAlt: 'r..r..o..rof.s..',
  stab: '..x..x....x..x..',
  scale: [69, 72, 74, 76, 79, 81, 84, 86, 88],
  lead: [
    '5.-.4.3.-.2.3...',
    '2.-.0.2.-.3.....',
    '5.-.4.3.-.2.3.4.',
    '3-------........',
    '1.1.2.3.-.2.1...',
    '3.-.-.2.1.0.....',
    '0.2.3.5.-.4.3.2.',
    '3-------....4.5.',
  ],
  layersFrom: 1,
};

const SONGS = {
  menu: {
    bpm: 112,
    swing: 0.06,
    bars: [C(48, 'M'), C(45, 'm'), C(41, 'M'), C(43, 'M')],
    kick: 'x.......x.x.....',
    snare: '....x.......x...',
    hat: 'x.x.x.x.x.x.x.x.',
    hatGain: 0.8,
    bass: 'r.....o.r..r.f..',
    arp: 'x.x.x.x.x.x.x.x.',
    scale: [72, 74, 76, 79, 81, 84, 86, 88],
    lead: ['2.3.4.-.3.2.0...', '0.-.1.2.-.....4.', '5.-.4.3.-.4.5...', '4.3.1.-.3-------'],
    leadType: 'triangle',
  },
  luta: LUTA,
  treino: {
    bpm: 92,
    swing: 0.1,
    bars: [C(41, 'M7'), C(38, 'm7'), C(46, 'M7'), C(48, '7')],
    kick: 'x.......x.......',
    snare: '....x.......x...',
    snareGain: 0.45,
    hat: '..x...x...x...x.',
    hatGain: 0.8,
    bass: 'r.......f.....r.',
    arp: 'x.x.x.x.x.x.x.x.',
  },
  chefe: {
    bpm: 140,
    swing: 0,
    bars: [C(50, 'm'), C(46, 'M'), C(48, 'M'), C(45, 'M')],
    kick: 'x...x...x...x...',
    fillKick: 'x...x...x...x.xx',
    snare: '....x.......x...',
    fillSnare: '....x.......xxxx',
    hat: 'xXxXxXxXxXxXxXxX',
    hatGain: 0.55,
    tamb: 'x..x..x...x..x..',
    bass: 'r.r.o.r.r.r.o.r.',
    stab: 'x..x..x.........',
    scale: [74, 76, 77, 79, 81, 82, 84, 86],
    lead: ['4.-.-.3.4.5.4.3.', '5.-.-.-.3.2.1...', '6.-.-.5.6.7.6.4.', '4-------1.4.7.4.'],
    leadType: 'sawtooth',
    layersFrom: 1,
  },
  final: { ...LUTA, bpm: 146, swing: 0.08, kick: 'x..x..x.x.x...x.' },
} satisfies Record<string, Song>;

export type SongName = keyof typeof SONGS;

type Note = [beat: number, midi: number, beats: number, type?: OscillatorType];

const JINGLES = {
  vitoria: {
    bpm: 150,
    notes: [
      [0, 67, 0.5], [0.5, 72, 0.5], [1, 76, 0.5], [1.5, 79, 1], [2.5, 76, 0.5], [3, 79, 2.5],
      [3, 76, 2.5, 'triangle'], [3, 72, 2.5, 'triangle'],
      [0, 48, 1, 'sawtooth'], [1.5, 55, 1, 'sawtooth'], [3, 48, 2.5, 'sawtooth'],
    ] as Note[],
  },
  derrota: {
    bpm: 100,
    notes: [[0, 64, 0.7, 'sawtooth'], [0.75, 63, 0.7, 'sawtooth'], [1.5, 62, 0.7, 'sawtooth'], [2.25, 61, 2, 'sawtooth']] as Note[],
  },
  recruta: {
    bpm: 170,
    notes: [
      [0, 72, 0.5], [0.5, 76, 0.5], [1, 79, 0.5], [1.5, 84, 1.5],
      [1.5, 79, 1.5, 'triangle'], [1.5, 76, 1.5, 'triangle'],
    ] as Note[],
  },
  campeao: {
    bpm: 132,
    notes: [
      [0, 72, 0.5], [0.5, 72, 0.5], [1, 72, 0.5], [1.5, 72, 1], [2.5, 68, 1], [3.5, 70, 1],
      [4.5, 72, 0.75], [5.25, 70, 0.25], [5.5, 72, 3],
      [5.5, 79, 3, 'triangle'], [5.5, 76, 3, 'triangle'],
      [0, 48, 1.5, 'sawtooth'], [1.5, 48, 1, 'sawtooth'], [2.5, 44, 1, 'sawtooth'], [3.5, 46, 1, 'sawtooth'], [4.5, 48, 4, 'sawtooth'],
    ] as Note[],
  },
};

export type JingleName = keyof typeof JINGLES;

/** Lookahead step sequencer: a 25 ms timer schedules notes 120 ms ahead on the audio clock. */
export class Music {
  private song: Song | null = null;
  private current: SongName | null = null;
  private step = 0;
  private next = 0;
  private timer = 0;
  private arpI = 0;
  intensity = 0;

  constructor(private s: Sound) {}

  get playing(): SongName | null {
    return this.current;
  }

  play(name: SongName, intensity = 0): void {
    this.intensity = intensity;
    if (this.current === name) return;
    this.current = name;
    this.song = SONGS[name];
    this.step = 0;
    this.arpI = 0;
    this.next = this.s.now + 0.1;
    if (!this.timer) this.timer = window.setInterval(() => this.pump(), 25);
  }

  stop(): void {
    this.current = null;
    this.song = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = 0;
  }

  jingle(name: JingleName): void {
    const j = JINGLES[name];
    const beat = 60 / j.bpm;
    const t0 = this.s.now + 0.03;
    for (const [b, m, len, type] of j.notes) {
      const low = type === 'sawtooth' && m < 60;
      this.s.tone(midiHz(m), len * beat * 0.95, {
        type: type ?? 'square',
        gain: low ? 0.14 : type === 'triangle' ? 0.08 : 0.09,
        filter: low ? 900 : 3200,
        sustain: true,
        attack: 0.01,
        when: t0 + b * beat,
      });
    }
  }

  private pump(): void {
    const ctx = this.s.ctx;
    const song = this.song;
    if (!ctx || !song) return;
    if (ctx.state !== 'running') {
      this.next = ctx.currentTime + 0.05;
      return;
    }
    if (this.next < ctx.currentTime - 0.2) this.next = ctx.currentTime + 0.03;
    const spb = 60 / song.bpm / 4;
    while (this.next < ctx.currentTime + 0.12) {
      const swing = this.step % 2 === 1 ? song.swing * spb : 0;
      this.playStep(song, this.step, this.next + swing, spb);
      this.next += spb;
      this.step++;
    }
  }

  private playStep(song: Song, step: number, t: number, spb: number): void {
    const s = this.s;
    const barN = Math.floor(step / 16);
    const bar = barN % song.bars.length;
    const i = step % 16;
    const last = bar === song.bars.length - 1;
    const chord = song.bars[bar];
    const iv = IV[chord.q];
    const at = (p?: string): string => (p ? p[i] : '.');
    const o = { bus: 'music' as const, when: t };

    const k = at(last && song.fillKick ? song.fillKick : song.kick);
    if (k !== '.') {
      const a = k === 'X' ? 1 : 0.85;
      s.tone(150, 0.17, { ...o, type: 'sine', gain: 0.9 * a, slide: 42 });
      s.noise(0.012, { ...o, type: 'highpass', freq: 3500, gain: 0.08 });
    }
    const sn = at(last && song.fillSnare ? song.fillSnare : song.snare);
    if (sn !== '.') {
      const a = (sn === 'X' ? 1 : 0.85) * (song.snareGain ?? 1);
      s.noise(0.15, { ...o, type: 'bandpass', freq: 1900, q: 0.7, gain: 0.45 * a });
      s.tone(190, 0.08, { ...o, type: 'triangle', gain: 0.25 * a, slide: 140 });
    }
    const h = at(song.hat);
    if (h !== '.') s.noise(h === 'X' ? 0.05 : 0.03, { ...o, type: 'highpass', freq: 7500, gain: (h === 'X' ? 0.14 : 0.08) * (song.hatGain ?? 1) });
    if (this.intensity >= (song.layersFrom ?? 0)) {
      const tb = at(song.tamb);
      if (tb !== '.') s.tone(1180, 0.05, { ...o, type: 'triangle', gain: 0.09 });
    }

    const bp = barN % 2 === 1 && song.bassAlt ? song.bassAlt : song.bass;
    const bc = bp[i];
    if (bc !== '.' && bc !== '-') {
      const off = { r: 0, t: iv[1], f: 7, s: iv[3] ?? 10, o: 12, l: -5 }[bc as 'r'] ?? 0;
      s.tone(midiHz(chord.root + off), spb * 1.7, { ...o, type: 'sawtooth', gain: 0.2, filter: 900, filterTo: 260, q: 5 });
    }

    if (at(song.stab) !== '.') {
      for (const n of iv) s.tone(midiHz(chord.root + 12 + n), 0.12, { ...o, type: 'sawtooth', gain: 0.045, filter: 2400, filterTo: 800 });
    }

    if (at(song.arp) !== '.') {
      const tones = [...iv, 12];
      const n = chord.root + 24 + tones[this.arpI++ % tones.length];
      s.tone(midiHz(n), 0.16, { ...o, type: 'triangle', gain: 0.06 });
    }

    if (song.lead && song.scale && this.intensity >= (song.layersFrom ?? 0)) {
      const line = song.lead[bar % song.lead.length];
      const c = line[i];
      if (c !== '.' && c !== '-') {
        let holds = 0;
        while (line[i + 1 + holds] === '-') holds++;
        const idx = parseInt(c, 36);
        const m = song.scale[Math.min(idx, song.scale.length - 1)];
        s.tone(midiHz(m), (1 + holds) * spb * 0.92, { ...o, type: song.leadType ?? 'square', gain: 0.065, filter: 2800, attack: 0.008, sustain: true });
      }
    }
  }
}
