import * as THREE from 'three';
import type { App } from '../app';
import type { CastSlot } from '../engine/world';
import type { SafeArea, ShotOptions } from '../engine/camera';
import type { ActorId } from '../engine/actors';
import { LEVELS, type LevelDef, type StageId } from '../game/levels';
import { emptyLevel, levelUnlocked, type LevelProgress, type Profile } from '../data/store';
import { h, type Child } from '../ui/dom';
import { icon } from '../ui/icons';
import { portrait } from '../ui/parts';

export const levelIndex = (id: string): number => LEVELS.findIndex((l) => l.id === id);
export const nextLevel = (id: string): LevelDef | null => LEVELS[levelIndex(id) + 1] ?? null;

export function progressOf(p: Profile, id: string): LevelProgress {
  return p.levels[id] ?? (p.levels[id] = emptyLevel());
}

/** The level a player should look at first: the lowest one unlocked and not yet won. */
export function frontier(p: Profile): LevelDef {
  for (let i = 0; i < LEVELS.length; i++) if (levelUnlocked(p, i) && !progressOf(p, LEVELS[i].id).cleared) return LEVELS[i];
  return LEVELS[LEVELS.length - 1];
}

export function backButton(label: string, run: () => void): HTMLButtonElement {
  return h('button', { type: 'button', class: 'btn btn--small btn--back', onclick: run, 'aria-keyshortcuts': 'Escape' }, icon('left'), label, h('kbd', { 'aria-hidden': 'true' }, 'Esc'));
}

/** Keyboard reminders for players who use the keyboard. Hidden from screen readers; the controls carry their own names. */
export function keys(...pairs: [Child, string][]): HTMLElement {
  return h(
    'p',
    { class: 'keys', 'aria-hidden': 'true' },
    pairs.map(([k, t]) => h('span', null, h('kbd', null, k), t)),
  );
}

export const ARROWS_UD = (): Child => [icon('up'), icon('down')];
export const ARROWS = (): Child => [icon('left'), icon('right')];

export function whoami(app: App, onclick?: () => void): HTMLElement | null {
  const p = app.profile;
  if (!p) return null;
  const inner = [portrait(app, p.starter, 'whoami__img'), h('span', { class: 'whoami__name' }, p.name), p.champion ? icon('crown', 'whoami__crown') : null];
  if (!onclick) return h('div', { class: 'whoami plate plate--ink' }, inner);
  return h('button', { type: 'button', class: 'whoami btn btn--small', onclick, 'aria-label': `Lutador: ${p.name}. Trocar de lutador` }, inner);
}

/** Wide screens keep the 3D subject in one band; narrow screens put it on top. Returns the cleanup. */
export function safeAreas(app: App, wide: SafeArea, narrow: SafeArea, onChange?: () => void): () => void {
  const mq = matchMedia('(min-width: 860px)');
  const apply = () => {
    app.world.setSafeArea(mq.matches ? wide : narrow);
    onChange?.();
  };
  apply();
  mq.addEventListener('change', apply);
  return () => mq.removeEventListener('change', apply);
}

export const isWide = (): boolean => matchMedia('(min-width: 860px)').matches;

/** Creatures in a gentle arc facing the camera. */
export function lineup(app: App, stage: StageId, ids: ActorId[], gap = 1.5, shot: Partial<ShotOptions> = {}, cut = true) {
  app.world.setStage(stage);
  const n = ids.length;
  const slots: CastSlot[] = ids.map((id, i) => {
    const x = (i - (n - 1) / 2) * gap;
    const z = -Math.abs(x) * 0.18;
    return { id, x, z, dir: x > 0.01 ? -1 : 1, turn: Math.min(0.5, 0.18 + Math.abs(x) * 0.08) };
  });
  const cast = app.world.setCast(slots);
  app.world.frameActors(cast, { pitch: 0.14, pad: 0.1, speed: 2.4, ...shot }, cut);
  return cast;
}

/** A calm wide shot of a stage with nobody on it. */
export function emptyStage(app: App, stage: StageId, cut = true): void {
  app.world.setStage(stage);
  app.world.setCast([]);
  app.world.rig.frame({ points: [new THREE.Vector3(-3.2, 0, 0), new THREE.Vector3(3.2, 2.6, 0)], pitch: 0.1, pad: 0.05, speed: 1.5, drift: 0.01 }, cut);
}

/** Runs fn after the screen's choreography settles, unless the screen changed. */
export function guard(app: App): () => boolean {
  const g = app.world.gen;
  return () => g === app.world.gen;
}

export const LEVEL_SHORT = (l: LevelDef): string => (l.table === null ? 'Final' : String(l.table));
