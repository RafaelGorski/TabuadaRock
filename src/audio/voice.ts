import type { Sound } from './synth';

export interface SayOpts {
  rate?: number;
  pitch?: number;
  /** Cut off whatever is being said (default true). */
  interrupt?: boolean;
}

const PREFERRED = /google|natural|online|francisca|thalita|antonio|luciana|maria|daniel|felipe/i;

/** pt-BR narrator on top of the browser's speech engine. Silent when no Portuguese voice exists. */
export class Voice {
  enabled = true;
  private voice: SpeechSynthesisVoice | null = null;
  private loaded = false;
  private request = 0;

  constructor(private sound: Sound) {
    if (!this.available) return;
    const pick = () => {
      const all = speechSynthesis.getVoices();
      this.loaded = all.length > 0;
      const pt = all.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('pt'));
      const br = pt.filter((v) => /br/i.test(v.lang));
      this.voice = br.find((v) => PREFERRED.test(v.name)) ?? br[0] ?? pt[0] ?? null;
    };
    pick();
    speechSynthesis.addEventListener('voiceschanged', pick);
  }

  get available(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  /** False only when the voice list loaded and none of them speaks Portuguese. */
  get speaksPortuguese(): boolean {
    return this.available && (!!this.voice || !this.loaded);
  }

  get voiceName(): string | null {
    return this.voice?.name ?? null;
  }

  say(text: string, o: SayOpts = {}): Promise<void> {
    if (!this.enabled || !this.available || !this.speaksPortuguese || !text.trim()) return Promise.resolve();
    const request = ++this.request;
    if (o.interrupt !== false) {
      speechSynthesis.cancel();
      this.sound.duck(false);
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = this.voice?.lang ?? 'pt-BR';
    if (this.voice) u.voice = this.voice;
    u.rate = o.rate ?? 1.05;
    u.pitch = o.pitch ?? 1.05;
    u.volume = 1;
    this.sound.duck(true);
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        if (request === this.request) this.sound.duck(false);
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
      window.setTimeout(done, Math.min(14000, 1800 + text.length * 95));
    });
  }

  stop(): void {
    if (!this.available) return;
    this.request++;
    speechSynthesis.cancel();
    this.sound.duck(false);
  }
}
