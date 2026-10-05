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
  private eq: HTMLElement;
  private hintEl: HTMLParagraphElement;
  private turnEl: HTMLParagraphElement;
  private box: HTMLElement;
  private locked = false;
  onSubmit: (value: number) => void = () => {};
  onHint: () => void = () => {};

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
      // Arrow keys move the caret here; they never jump to other buttons mid-answer.
      'data-nav': 'native',
    });
    this.box = h('span', { class: 'qplate__box' }, this.input);
    this.eq = h('div', { class: 'qplate__eq' });
    this.hintEl = h('p', { class: 'qplate__hint', id: hintId, hidden: true });
    this.turnEl = h('p', { class: 'qplate__turn', hidden: true });
    this.hintBtn = h(
      'button',
      { type: 'button', class: 'btn btn--small qplate__dica', hidden: true, 'aria-keyshortcuts': o.hintKey === false ? undefined : 'D' },
      icon('bulb'),
      'Dica',
      o.hintKey === false ? null : h('kbd', { 'aria-hidden': 'true' }, 'D'),
    );
    this.hintBtn.addEventListener('click', () => {
      this.onHint();
      this.focus();
    });
    this.el = h(
      'form',
      { class: 'qplate', novalidate: true, 'data-state': 'idle', hidden: true },
      this.turnEl,
      h('div', { class: 'qplate__main' }, this.eq, this.hintEl),
      h('div', { class: 'qplate__side' }, this.hintBtn, this.keypad()),
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

  show(eq: Equation, label: string, o: { hint?: boolean } = {}): void {
    const n = (t: string) => h('span', { class: 'qplate__n', 'aria-hidden': 'true' }, t);
    const op = (t: string) => h('span', { class: 'qplate__op', 'aria-hidden': 'true' }, t);
    this.eq.replaceChildren(n(eq.x), op('×'), eq.y === '?' ? this.box : n(eq.y), op('='), eq.result === '?' ? this.box : n(eq.result));
    this.input.setAttribute('aria-label', label);
    this.input.value = '';
    this.hintBtn.hidden = !o.hint;
    this.hintBtn.disabled = false;
    this.setHint(null);
    this.el.dataset.state = 'idle';
    this.el.hidden = false;
    this.lock(false);
    this.focus();
  }

  hide(): void {
    this.el.hidden = true;
  }

  setHint(text: string | null, kind: 'dica' | 'pedido' = 'dica'): void {
    this.hintEl.hidden = !text;
    this.hintEl.textContent = text ?? '';
    this.hintEl.dataset.kind = kind;
  }

  /** Whose move it is, as a tag on the plate's top edge. */
  setTurn(kind: 'ataque' | 'defesa' | 'rival' | null, label?: string): void {
    this.turnEl.hidden = !kind;
    if (!kind) {
      delete this.turnEl.dataset.turn;
      return;
    }
    if (this.turnEl.dataset.turn !== kind) {
      this.turnEl.style.animation = 'none';
      void this.turnEl.offsetWidth;
      this.turnEl.style.animation = '';
    }
    this.turnEl.dataset.turn = kind;
    const text = label ?? (kind === 'ataque' ? 'Seu ataque' : 'Defenda!');
    this.turnEl.replaceChildren(icon(kind === 'ataque' ? 'swords' : 'shield'), h('span', {}, text));
  }

  /** The burning fuse along the plate's bottom edge: 1 is full, 0 is the rival's hit. */
  setFuse(k: number | null): void {
    if (k === null) {
      delete this.el.dataset.fuse;
      this.el.style.removeProperty('--fuse');
      return;
    }
    this.el.dataset.fuse = '';
    this.el.style.setProperty('--fuse', Math.min(1, Math.max(0, k)).toFixed(4));
  }

  /** The rival types the right answer into the box, one digit at a time. */
  async reveal(answer: number): Promise<void> {
    this.lock(true);
    this.input.value = '';
    this.flash('rival');
    for (const d of String(answer)) {
      await this.app.world.tw.wait(0.12);
      this.input.value += d;
      this.app.sound.key();
    }
  }

  /** Empties and unlocks the box for a fresh answer on the same question. */
  ready(): void {
    this.input.value = '';
    this.el.dataset.state = 'idle';
    this.lock(false);
    this.focus();
  }

  lock(on: boolean): void {
    this.locked = on;
    this.input.readOnly = on;
    this.el.classList.toggle('is-locked', on);
  }

  clear(): void {
    this.input.value = '';
  }

  focus(): void {
    if (!this.el.hidden) this.input.focus({ preventScroll: true });
  }

  flash(state: 'ok' | 'erro' | 'vazio' | 'rival'): void {
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
