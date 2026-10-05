import { Music } from './audio/music';
import { Sound } from './audio/synth';
import { Voice } from './audio/voice';
import { DEFAULT_SETTINGS, type Profile, type Settings, type Store } from './data/store';
import { Moves } from './engine/moves';
import { OrbWall } from './engine/orbs';
import { World } from './engine/world';
import type { RouteName, Routes } from './screens/routes';
import { h, reducedMotion } from './ui/dom';

export interface Screen {
  el: HTMLElement;
  /** Runs once the element is in the page. */
  enter?(): void;
  /** Runs before the next screen replaces this one. */
  leave?(): void;
  key?(e: KeyboardEvent): void;
  /** Escape. */
  back?(): void;
  /** The tab was hidden; fights pause here. */
  hidden?(): void;
}

export type ScreenFactory<K extends RouteName> = (app: App, params: Routes[K]) => Screen;
export type ScreenTable = { [K in RouteName]: ScreenFactory<K> };
type Args<K extends RouteName> = undefined extends Routes[K] ? [params?: Routes[K]] : [params: Routes[K]];

const NEEDS_PROFILE = new Set<RouteName>(['torre', 'vs', 'treino', 'luta', 'resultado', 'campeao']);

export class App {
  readonly world: World;
  readonly moves: Moves;
  readonly sound = new Sound();
  readonly music = new Music(this.sound);
  readonly voice = new Voice(this.sound);
  readonly orbs = new OrbWall();
  settings: Settings = { ...DEFAULT_SETTINGS };
  profile: Profile | null = null;
  reduced = reducedMotion();
  private current: Screen | null = null;
  private currentName: RouteName | null = null;
  private switching = false;
  private toastEl: HTMLElement | null = null;
  private toastTimer = 0;

  constructor(
    readonly store: Store,
    canvas: HTMLCanvasElement,
    readonly root: HTMLElement,
    private screens: ScreenTable,
  ) {
    this.world = new World(canvas);
    this.moves = new Moves(this.world);
    addEventListener('pointerdown', () => this.sound.unlock(), { capture: true, passive: true });
    addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('visibilitychange', () => this.onVisibility());
    addEventListener('pagehide', () => void this.store.flush());
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reduced = e.matches;
      this.applySettings();
    });
  }

  get route(): RouteName | null {
    return this.currentName;
  }

  go<K extends RouteName>(name: K, ...args: Args<K>): void {
    if (this.switching) {
      queueMicrotask(() => this.go(name, ...args));
      return;
    }
    if (NEEDS_PROFILE.has(name) && !this.profile) {
      this.go('perfis');
      return;
    }
    this.switching = true;
    try {
      try {
        this.current?.leave?.();
      } catch (err) {
        console.error(err);
      }
      this.world.reset();
      this.voice.stop();
      this.world.setSafeArea({ top: 0.08, bottom: 0.72 });
      const make = this.screens[name] as ScreenFactory<K>;
      const screen = make(this, args[0] as Routes[K]);
      screen.el.classList.add('screen', `screen--${name}`);
      this.root.replaceChildren(screen.el);
      this.current = screen;
      this.currentName = name;
      screen.enter?.();
      this.focusStart(screen.el);
    } finally {
      this.switching = false;
    }
  }

  /** Puts focus where a keyboard player expects it on a fresh screen. */
  focusStart(el: HTMLElement): void {
    const target = el.querySelector<HTMLElement>('[data-autofocus]:not([disabled])') ?? el.querySelector<HTMLElement>('h1');
    if (!target) return;
    if (target.tagName === 'H1' && !target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }

  applySettings(): void {
    const s = this.settings;
    this.sound.setVolume(s.volume);
    this.sound.setSfx(s.sfx);
    this.sound.setMusic(s.music);
    this.voice.enabled = s.narrator;
    if (!s.narrator) this.voice.stop();
    this.world.shake = s.shake && !this.reduced;
    document.documentElement.classList.toggle('has-keypad', this.showKeypad);
  }

  /** The on-screen keypad shows when asked for, and always on touch screens. */
  get showKeypad(): boolean {
    return this.settings.keypad || matchMedia('(pointer: coarse)').matches;
  }

  async saveSettings(patch: Partial<Settings>): Promise<void> {
    this.settings = { ...this.settings, ...patch };
    this.applySettings();
    try {
      await this.store.saveSettings(this.settings);
    } catch (err) {
      console.error(err);
      this.toast('Não deu para salvar as opções neste navegador.', 'erro');
    }
  }

  async setProfile(p: Profile | null): Promise<void> {
    this.profile = p;
    try {
      await this.store.setActiveProfileId(p?.id ?? null);
    } catch (err) {
      console.warn(err);
    }
  }

  /** Saves the active profile. Returns false and warns the player when the browser refuses. */
  async saveProfile(): Promise<boolean> {
    const p = this.profile;
    if (!p) return false;
    try {
      await this.store.saveProfile(p);
      return true;
    } catch (err) {
      console.error(err);
      this.toast('Não deu para salvar o progresso. Baixe um backup em Opções para não perder nada.', 'erro');
      return false;
    }
  }

  /** Narrator line, if the narrator is on. */
  say(text: string): Promise<void> {
    return this.voice.say(text);
  }

  toast(text: string, kind: 'ok' | 'erro' = 'ok'): void {
    if (!this.toastEl) {
      this.toastEl = h('div', { class: 'toast', role: 'status' });
      document.body.appendChild(this.toastEl);
    }
    const el = this.toastEl;
    el.className = `toast toast--${kind}`;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (el.hidden = true), kind === 'erro' ? 7000 : 4200);
  }

  private onKey(e: KeyboardEvent): void {
    this.sound.unlock();
    const s = this.current;
    if (!s || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && s.back) {
      e.preventDefault();
      s.back();
      return;
    }
    s.key?.(e);
  }

  private onVisibility(): void {
    if (document.hidden) {
      void this.store.flush();
      this.voice.stop();
      this.current?.hidden?.();
      void this.sound.ctx?.suspend().catch(() => {});
    } else if (this.sound.ctx) {
      this.sound.unlock();
    }
  }
}
