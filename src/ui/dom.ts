export type Child = Node | string | number | null | undefined | false | Child[];
type Props = Record<string, unknown>;

function add(el: Node, c: Child): void {
  if (c === null || c === undefined || c === false) return;
  if (Array.isArray(c)) {
    for (const x of c) add(el, x);
    return;
  }
  el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
}

/** Tiny element builder. Props starting with "on" become listeners; aria-*, data-* and role become attributes. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props | null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (k.startsWith('aria-') || k.startsWith('data-') || k === 'role' || !(k in el)) el.setAttribute(k, v === true ? '' : String(v));
      else (el as unknown as Record<string, unknown>)[k] = v;
    }
  }
  add(el, children);
  return el;
}

export function fill(el: Element, ...children: Child[]): void {
  el.replaceChildren();
  add(el, children);
}

const live = () => document.getElementById('anuncio');

/** Reads text to screen readers through the polite live region. */
export function announce(text: string): void {
  const el = live();
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => (el.textContent = text));
}

const nf = new Intl.NumberFormat('pt-BR');
export const fmt = (n: number): string => nf.format(Math.round(n));
export const fmtSec = (ms: number): string => `${(ms / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
export const fmtDate = (t: number): string =>
  new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
export const fmtDateTime = (t: number): string =>
  new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Moves focus through a list or grid with the arrow keys. Returns true when it handled the key. */
export function arrowNav(e: KeyboardEvent, items: HTMLElement[], cols = 1, wrap = true): boolean {
  if (!items.length) return false;
  let d = 0;
  if (e.key === 'ArrowDown') d = cols;
  else if (e.key === 'ArrowUp') d = -cols;
  else if (e.key === 'ArrowRight' && cols > 1) d = 1;
  else if (e.key === 'ArrowLeft' && cols > 1) d = -1;
  else if (e.key === 'Home') d = -Infinity;
  else if (e.key === 'End') d = Infinity;
  if (!d) return false;
  e.preventDefault();
  const i = items.indexOf(document.activeElement as HTMLElement);
  let n: number;
  if (i < 0) n = d > 0 ? 0 : items.length - 1;
  else if (d === Infinity) n = items.length - 1;
  else if (d === -Infinity) n = 0;
  else {
    n = i + d;
    if (n < 0 || n >= items.length) n = wrap && cols === 1 ? (n + items.length) % items.length : i;
  }
  items[n].focus();
  return true;
}

/** A button that asks "tem certeza?" before doing something it cannot undo. */
export function confirmButton(label: string, ask: string, run: () => void | Promise<void>, cls = 'btn btn--small btn--danger'): HTMLButtonElement {
  let armed = 0;
  const b = h('button', { type: 'button', class: cls }, label);
  b.addEventListener('click', async () => {
    if (!armed) {
      b.textContent = ask;
      b.classList.add('is-armed');
      armed = window.setTimeout(() => {
        armed = 0;
        b.textContent = label;
        b.classList.remove('is-armed');
      }, 4000);
      return;
    }
    clearTimeout(armed);
    armed = 0;
    b.classList.remove('is-armed');
    b.disabled = true;
    try {
      await run();
    } finally {
      b.disabled = false;
      b.textContent = label;
    }
  });
  return b;
}

export function download(name: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept, class: 'sr-only' });
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null);
      input.remove();
    });
    input.addEventListener('cancel', () => {
      resolve(null);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  });
}

export const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarsePointer = (): boolean => matchMedia('(pointer: coarse)').matches;
