import type { App } from '../app';
import { coarsePointer, h } from './dom';
import { icon } from './icons';

export interface Equation {
  x: string;
  y: string;
  result: string;
}

let uid = 0;

/**
 * "6 × 7 = [  ]": the answer box sits wherever the question mark is,
 * so reverse questions read "6 × [  ] = 42".
 */
export class QuestionPlate {
  readonly el: HTMLFormElement;
  readonly input: HTMLInputElement;
  readonly hintBtn: HTMLButtonElement;
  readonly sayBtn: HTMLButtonElement;
  readonly micBtn: HTMLButtonElement;
  private eq: HTMLElement;
  private hintEl: HTMLParagraphElement;
  private hintCountEl: HTMLSpanElement;
  private box: HTMLElement;
  private voiceEl: HTMLParagraphElement;
  private locked = false;
  private label = '';
  private armed = false;
  onSubmit: (value: number) => void = () => {};
  onHint: () => void = () => {};
  /** Asked to read the question out loud again. Defaults to the narrator. */
  onSay: (text: string) => void = (text) => void this.app.say(text);

  constructor(
    private app: App,
    o: { hintKey?: boolean } = {},
  ) {
    const hintId = `dica-${++uid}`;
    this.input = h('input', {
      class: 'answer',
      type: 'text',
      // Touch screens answer on the on-screen keypad, so the system keyboard stays down.
      inputmode: coarsePointer() ? 'none' : 'numeric',
      autocomplete: 'off',
      maxlength: 3,
      enterkeyhint: 'done',
      'aria-describedby': hintId,
    });
    this.box = h('span', { class: 'qplate__box' }, this.input);
    this.eq = h('div', { class: 'qplate__eq' });
    this.hintEl = h('p', { class: 'qplate__hint', id: hintId, hidden: true });
    this.voiceEl = h('p', { class: 'qplate__voice', role: 'status', hidden: true });
    this.hintCountEl = h('span', { class: 'qplate__dica-count', 'aria-hidden': 'true' });
    this.hintBtn = h(
      'button',
      { type: 'button', class: 'btn btn--small qplate__dica', hidden: true, 'aria-keyshortcuts': o.hintKey === false ? undefined : 'D' },
      icon('bulb'),
      'Dica',
      this.hintCountEl,
      o.hintKey === false ? null : h('kbd', { 'aria-hidden': 'true' }, 'D'),
    );
    this.hintBtn.addEventListener('click', () => {
      this.onHint();
      this.focus();
    });
    this.sayBtn = h('button', { type: 'button', class: 'btn btn--small qplate__ouvir', 'aria-label': 'Ouvir a conta de novo' }, icon('sound'), 'Ouvir');
    this.sayBtn.addEventListener('click', () => {
      if (!this.label) return;
      this.app.sound.ok();
      this.onSay(this.label);
      this.focus();
    });
    this.micBtn = h('button', { type: 'button', class: 'btn btn--small qplate__mic', 'aria-pressed': 'false', 'aria-label': 'Responder falando' }, icon('mic'), 'Falar');
    this.micBtn.addEventListener('click', () => this.toggleMic());
    this.el = h(
      'form',
      { class: 'qplate', novalidate: true, 'data-state': 'idle', hidden: true },
      h('div', { class: 'qplate__main' }, this.eq, this.hintEl, this.voiceEl),
      h('div', { class: 'qplate__side' }, h('div', { class: 'qplate__tools' }, this.sayBtn, this.micBtn, this.hintBtn), this.keypad()),
    );
    this.el.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
    this.input.addEventListener('input', () => {
      const clean = this.input.value.replace(/\D+/g, '').slice(0, 3);
      if (clean !== this.input.value) this.input.value = clean;
      this.settle();
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (this.locked) {
        if (e.key.length === 1 || e.key === 'Backspace') e.preventDefault();
        return;
      }
      if (/^\d$/.test(e.key)) this.app.sound.key();
      else if (e.key === 'Backspace' && this.input.value) this.app.sound.erase();
      else if (e.key.toLowerCase() === 'd' && o.hintKey !== false) {
        e.preventDefault();
        if (!this.hintBtn.hidden && !this.hintBtn.disabled) this.hintBtn.click();
      }
    });
  }

  get value(): string {
    return this.input.value;
  }

  show(eq: Equation, label: string, o: { hint?: boolean; hintsRemaining?: number } = {}): void {
    const n = (t: string) => h('span', { class: 'qplate__n', 'aria-hidden': 'true' }, t);
    const op = (t: string) => h('span', { class: 'qplate__op', 'aria-hidden': 'true' }, t);
    this.eq.replaceChildren(n(eq.x), op('×'), eq.y === '?' ? this.box : n(eq.y), op('='), eq.result === '?' ? this.box : n(eq.result));
    this.input.setAttribute('aria-label', label);
    this.input.value = '';
    this.label = label;
    if (o.hintsRemaining === undefined) {
      this.hintBtn.hidden = !o.hint;
      this.hintBtn.disabled = false;
      this.hintCountEl.hidden = true;
    } else {
      this.hintBtn.hidden = false;
      this.setHintCount(o.hintsRemaining);
    }
    this.setHint(null);
    this.setVoice(null);
    this.micBtn.hidden = !this.app.canSpeak;
    this.el.dataset.state = 'idle';
    this.el.hidden = false;
    this.lock(false);
    this.focus();
    // Once a child has answered by voice, keep the microphone ready for the next one.
    if (this.armed && this.app.canSpeak) setTimeout(() => this.toggleMic(), 600);
  }

  hide(): void {
    this.stopMic();
    this.el.hidden = true;
  }

  /** Short line under the equation for what the microphone is doing. */
  setVoice(text: string | null, kind: 'ouvindo' | 'erro' | 'ok' = 'ouvindo'): void {
    this.voiceEl.hidden = !text;
    this.voiceEl.textContent = text ?? '';
    this.voiceEl.dataset.kind = kind;
  }

  /** Starts or stops listening for a spoken answer. */
  toggleMic(): void {
    if (this.app.listener.listening) return this.stopMic();
    if (this.locked || this.el.hidden || !this.app.canSpeak) return;
    const L = this.app.listener;
    L.onState = (s) => {
      const on = s !== 'off';
      this.micBtn.setAttribute('aria-pressed', String(on));
      this.micBtn.classList.toggle('is-on', on);
      if (s === 'ouvindo') this.setVoice('Estou ouvindo… fale o número.');
      else if (s === 'pensando') this.setVoice('Entendendo…');
    };
    L.onNumber = (n) => {
      this.armed = true;
      this.input.value = String(n).slice(0, 3);
      this.setVoice(`Ouvi ${n}.`, 'ok');
      this.app.sound.key();
      this.submit();
    };
    L.onFail = (why) => {
      if (why !== 'sem-numero') this.armed = false;
      this.app.sound.denied();
      this.setVoice(
        why === 'sem-permissao' ? 'O navegador não deixou usar o microfone. Responda digitando.' : why === 'sem-numero' ? 'Não entendi o número. Fale de novo ou digite.' : 'O microfone não funcionou aqui. Responda digitando.',
        'erro',
      );
    };
    this.app.voice.stop();
    L.start();
  }

  stopMic(): void {
    if (!this.app.listener.listening) return;
    this.app.listener.stop();
    this.setVoice(null);
  }

  setHint(text: string | null, kind: 'dica' | 'pedido' = 'dica'): void {
    this.hintEl.hidden = !text;
    this.hintEl.textContent = text ?? '';
    this.hintEl.dataset.kind = kind;
  }

  setHintCount(remaining: number): void {
    const count = Math.max(0, remaining);
    this.hintCountEl.hidden = false;
    this.hintCountEl.textContent = String(count);
    this.hintBtn.disabled = count === 0;
    this.hintBtn.setAttribute('aria-label', count === 0 ? 'Nenhuma dica restante.' : count === 1 ? 'Usar dica. 1 dica restante.' : `Usar dica. ${count} dicas restantes.`);
  }

  lock(on: boolean): void {
    this.locked = on;
    this.input.readOnly = on;
    this.micBtn.disabled = on;
    if (on) this.stopMic();
    this.el.classList.toggle('is-locked', on);
  }

  clear(): void {
    this.input.value = '';
  }

  focus(): void {
    if (!this.el.hidden) this.input.focus({ preventScroll: true });
  }

  flash(state: 'ok' | 'erro' | 'vazio'): void {
    this.el.dataset.state = 'idle';
    void this.el.offsetWidth;
    this.el.dataset.state = state;
  }

  /** Typing again clears a red or empty flash, so the box goes back to "your turn". */
  private settle(): void {
    if (this.el.dataset.state !== 'idle') this.el.dataset.state = 'idle';
  }

  private submit(): void {
    if (this.locked || this.el.hidden) return;
    const v = this.input.value.trim();
    if (!v) {
      this.flash('vazio');
      this.app.sound.denied();
      this.focus();
      return;
    }
    this.onSubmit(Number(v));
  }

  private type(d: string): void {
    if (this.locked) return;
    if (this.input.value.length >= 3) {
      this.app.sound.denied();
      return;
    }
    this.input.value += d;
    this.settle();
    this.app.sound.key();
  }

  private keypad(): HTMLElement {
    const key = (label: string | Node, run: () => void, cls = '', aria?: string) => {
      const b = h('button', { type: 'button', class: `key ${cls}`, tabindex: -1, 'aria-label': aria }, label);
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.addEventListener('click', () => {
        run();
        this.focus();
      });
      return b;
    };
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => key(d, () => this.type(d)));
    const erase = key(
      icon('erase'),
      () => {
        if (this.locked || !this.input.value) return;
        this.input.value = this.input.value.slice(0, -1);
        this.settle();
        this.app.sound.erase();
      },
      'key--erase',
      'Apagar',
    );
    const zero = key('0', () => this.type('0'));
    const ok = key('OK', () => this.submit(), 'key--ok', 'Confirmar resposta');
    return h('div', { class: 'keypad', role: 'group', 'aria-label': 'Teclado de números' }, digits, erase, zero, ok);
  }
}
