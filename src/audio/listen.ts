interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface RecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [i: number]: RecognitionAlternative;
}
interface RecognitionResultList {
  readonly length: number;
  [i: number]: RecognitionResult;
}
interface RecognitionEvent extends Event {
  resultIndex: number;
  results: RecognitionResultList;
}
interface Recognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  const w = globalThis as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const UNITS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  meia: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
};

const strip = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Reads a number out of what a child said: digits ("42"), words ("quarenta e dois"),
 * or digits read one by one ("quatro dois"). Returns null when nothing looks like a number.
 */
export function parseNumber(raw: string): number | null {
  const text = strip(raw).replace(/[^a-z0-9\s]/g, ' ');
  const digits = text.match(/\d+/g);
  if (digits) {
    const n = Number(digits.join(''));
    if (Number.isFinite(n) && n >= 0 && n <= 999) return n;
  }
  const words = text.split(/\s+/).filter((w) => w && w !== 'e');
  const values = words.map((w) => UNITS[w]).filter((v): v is number => v !== undefined);
  if (!values.length) return null;
  if (values.length === 1) return values[0];
  // "quarenta e dois": every part but the last is a round ten or hundred, so they add up.
  const additive = values.slice(0, -1).every((v, i) => v >= 10 && v % 10 === 0 && v > values[i + 1]);
  if (additive && values.length <= 3) {
    const sum = values.reduce((a, b) => a + b, 0);
    if (sum <= 999) return sum;
  }
  // "quatro dois": digits read one at a time.
  if (values.every((v) => v <= 9) && values.length <= 3) return Number(values.join(''));
  return null;
}

export type ListenState = 'off' | 'ouvindo' | 'pensando';

/**
 * pt-BR speech input so a child can answer the times table out loud.
 * Silent no-op on browsers without speech recognition.
 */
export class Listener {
  enabled = true;
  onState: (s: ListenState) => void = () => {};
  onNumber: (n: number, transcript: string) => void = () => {};
  onFail: (reason: 'sem-numero' | 'sem-permissao' | 'erro') => void = () => {};
  private rec: Recognition | null = null;
  private active = false;
  private heard = '';

  get available(): boolean {
    return !!ctor();
  }

  get listening(): boolean {
    return this.active;
  }

  start(): void {
    if (!this.enabled || this.active) return;
    const C = ctor();
    if (!C) return;
    let rec: Recognition;
    try {
      rec = new C();
    } catch {
      this.onFail('erro');
      return;
    }
    this.rec = rec;
    this.heard = '';
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        for (let j = 0; j < r.length; j++) {
          const t = r[j].transcript;
          this.heard = t;
          const n = parseNumber(t);
          if (n === null) continue;
          this.stop();
          this.onNumber(n, t);
          return;
        }
      }
      this.onState('pensando');
    };
    rec.onerror = (e) => {
      const err = e.error ?? 'erro';
      this.finish();
      this.onFail(err === 'not-allowed' || err === 'service-not-allowed' ? 'sem-permissao' : 'erro');
    };
    rec.onend = () => {
      if (!this.active) return;
      const heard = this.heard;
      this.finish();
      if (parseNumber(heard) === null) this.onFail('sem-numero');
    };
    try {
      rec.start();
    } catch {
      this.rec = null;
      this.onFail('erro');
      return;
    }
    this.active = true;
    this.onState('ouvindo');
  }

  stop(): void {
    if (!this.active) return;
    const rec = this.rec;
    this.finish();
    try {
      rec?.stop();
    } catch {
      /* already stopped */
    }
  }

  toggle(): void {
    if (this.active) this.stop();
    else this.start();
  }

  private finish(): void {
    this.active = false;
    if (this.rec) {
      this.rec.onresult = null;
      this.rec.onerror = null;
      this.rec.onend = null;
    }
    this.rec = null;
    this.onState('off');
  }
}
