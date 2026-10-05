import type { V3 } from './toon';
import type { Builder } from './rig';

const H = Math.PI / 2;
const flame = (k: Parameters<Builder>[0], parent: Parameters<Builder>[1], pos: V3, size: number) => {
  k.cone(parent, '#FF5A1F', pos, [size, size * 2.4, size], undefined);
  k.cone(parent, '#FFD21F', [pos[0], pos[1] + size * 0.22, pos[2] + size * 0.04], [size * 0.52, size * 1.45, size * 0.52], undefined, { outline: false });
};

/** Folclore brasileiro: silhouettes are intentionally bold and cheerful at fight distance. */
export const saci: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.55; r.width = 0.9; r.headSize = 0.4; r.mouth.set(0, 1.2, 0.38);
  const red = '#D9423A'; const skin = '#6B3E2E'; const cap = '#E52935';
  k.cyl(b, skin, [0, 0.55, 0], [0.17, 0.65, 0.17]);
  k.ball(b, '#2E2550', [0, 0.06, 0.12], [0.22, 0.08, 0.24]);
  const arm = (s: number) => { const p = k.pivot(b, [s * 0.18, 0.9, 0], [0, 0, -s * 0.6]); k.limb(p, skin, 0.07, 0.48); k.ball(p, red, [0, -0.52, 0], 0.09); k.wave(p, 'z', 0.2, 3, s); };
  arm(1); arm(-1);
  const head = k.pivot(b, [0, 1.17, 0.1]); r.head = head;
  k.ball(head, skin, [0, 0, 0], [0.31, 0.3, 0.3]);
  k.cone(head, cap, [0, 0.32, 0], [0.2, 0.48, 0.2], [0.1, 0, 0]);
  k.ball(head, '#F2B28C', [0, -0.08, 0.27], [0.19, 0.13, 0.13], { outline: false });
  k.eyePair(head, [0, 0, 0], [0.31, 0.3, 0.3], [0.55, 0.3, 1], 0.075, '#FFE014', { brow: 0.2 });
  k.wave(head, 'z', 0.08, 2);
};

export const curupira: Builder = (k, b) => {
  const r = k.rig; r.height = 1.58; r.width = 1.05; r.headSize = 0.4; r.mouth.set(0, 1.05, 0.4);
  const hair = '#E83E30'; const skin = '#A85A39'; const green = '#2DBE4E';
  k.ball(b, green, [0, 0.62, 0], [0.36, 0.42, 0.3]);
  for (const s of [1, -1]) {
    const leg = k.pivot(b, [s * 0.16, 0.42, 0], [0, 0, s * 0.08]); k.limb(leg, skin, 0.085, 0.5);
    k.ball(leg, skin, [0, -0.54, -0.18], [0.13, 0.07, 0.25]);
    const arm = k.pivot(b, [s * 0.3, 0.82, 0], [-0.8, 0, s * 0.2]); k.limb(arm, skin, 0.065, 0.42); k.wave(arm, 'z', 0.18, 2.5, s);
  }
  const head = k.pivot(b, [0, 1.09, 0.08]); r.head = head;
  k.ball(head, skin, [0, 0, 0], [0.31, 0.3, 0.3]);
  for (let i = -2; i <= 2; i++) k.cone(head, hair, [i * 0.12, 0.27, -0.02], [0.09, 0.38, 0.08], [0.15, 0, i * 0.12]);
  k.eyePair(head, [0, 0, 0], [0.31, 0.3, 0.3], [0.55, 0.3, 1], 0.08, '#7FD6EA', { brow: 0.25 });
};

export const iara: Builder = (k, b) => {
  const r = k.rig; r.height = 1.62; r.width = 1.1; r.hover = 0.12; r.headSize = 0.4; r.mouth.set(0, 1.22, 0.4);
  const tail = k.pivot(b, [0, 0.48, 0], [0.1, 0, 0]);
  k.ball(tail, '#1FA2FF', [0, 0.05, 0], [0.36, 0.42, 0.3]);
  k.cone(tail, '#7FD6EA', [0, -0.4, 0], [0.28, 0.48, 0.2], [0.15, 0, 0]);
  k.ball(tail, '#1FA2FF', [0, -0.85, 0], [0.45, 0.1, 0.22]);
  k.ball(b, '#F2B28C', [0, 0.9, 0], [0.27, 0.35, 0.25]);
  const head = k.pivot(b, [0, 1.2, 0.08]); r.head = head;
  k.ball(head, '#F2B28C', [0, 0, 0], [0.3, 0.3, 0.3]);
  for (const s of [1, -1]) k.ball(head, '#3A2418', [s * 0.2, 0.1, -0.02], [0.13, 0.38, 0.1]);
  k.eyePair(head, [0, 0, 0], [0.3, 0.3, 0.3], [0.55, 0.3, 1], 0.075, '#1FA2FF', { brow: 0.15 });
  k.wave(head, 'z', 0.07, 2.2);
};

export const cuca: Builder = (k, b) => {
  const r = k.rig; r.height = 1.35; r.width = 1.3; r.headSize = 0.46; r.mouth.set(0, 0.82, 0.65);
  const green = '#7FAE45'; const belly = '#D8E68A';
  k.ball(b, green, [0, 0.53, 0], [0.48, 0.42, 0.58]); k.ball(b, belly, [0, 0.48, 0.28], [0.32, 0.28, 0.34], { outline: false });
  for (const s of [1, -1]) { k.cyl(b, green, [s * 0.3, 0.18, 0.24], [0.1, 0.28, 0.1]); k.cyl(b, green, [s * 0.3, 0.18, -0.25], [0.1, 0.28, 0.1]); }
  const head = k.pivot(b, [0, 0.9, 0.34]); r.head = head;
  k.ball(head, green, [0, 0, 0], [0.4, 0.3, 0.45]); k.ball(head, belly, [0, -0.1, 0.35], [0.3, 0.14, 0.25], { outline: false });
  for (const s of [1, -1]) { k.eye(head, [s * 0.16, 0.18, 0.27], 0.08, '#FFD21F', { pupil: 'slit' }); k.cone(head, green, [s * 0.2, 0.3, 0], [0.09, 0.25, 0.08]); }
  k.wave(head, 'z', 0.08, 1.8);
};

export const boto: Builder = (k, b) => {
  const r = k.rig; r.height = 1.34; r.width = 1.45; r.hover = 0.28; r.headSize = 0.42; r.mouth.set(0, 0.92, 0.85);
  const pink = '#F080A6'; const dark = '#B44972';
  k.ball(b, pink, [0, 0.62, 0], [0.42, 0.32, 0.62]); k.cone(b, pink, [0, 0.62, 0.65], [0.2, 0.5, 0.2], [H, 0, 0]);
  for (const s of [1, -1]) { k.ball(b, pink, [s * 0.34, 0.7, -0.05], [0.08, 0.05, 0.28], { rot: [0, s * 0.5, 0] }); k.ball(b, dark, [s * 0.2, 0.36, -0.38], [0.08, 0.05, 0.18]); }
  const head = k.pivot(b, [0, 0.98, 0.4]); r.head = head;
  k.ball(head, pink, [0, 0, 0], [0.32, 0.28, 0.34]); k.ball(head, dark, [0, -0.03, 0.32], [0.11, 0.08, 0.18]);
  k.cyl(head, '#D5A44A', [0, 0.24, 0], [0.27, 0.035, 0.27]); k.cone(head, '#E8C766', [0, 0.38, 0], [0.2, 0.18, 0.2]);
  k.eyePair(head, [0, 0, 0], [0.32, 0.28, 0.34], [0.5, 0.3, 1], 0.07, '#1FA2FF', { brow: 0.15 });
};

export const mula: Builder = (k, b) => {
  const r = k.rig; r.height = 1.55; r.width = 1.25; r.headSize = 0.35; r.mouth.set(0, 0.9, 0.75);
  const brown = '#7B4B35';
  k.ball(b, brown, [0, 0.65, 0], [0.43, 0.35, 0.65]);
  for (const s of [1, -1]) for (const z of [0.28, -0.3]) { k.cyl(b, brown, [s * 0.25, 0.25, z], [0.09, 0.48, 0.09]); k.ball(b, '#2E2550', [s * 0.25, 0.03, z + 0.05], [0.12, 0.06, 0.13]); }
  for (const z of [-0.28, 0, 0.28]) flame(k, b, [0, 1.15, z], 0.13);
  const neck = k.pivot(b, [0, 1.05, 0.08]); r.head = neck; k.ball(neck, '#FF5A1F', [0, 0, 0], [0.25, 0.25, 0.25]);
  k.eyePair(neck, [0, 0, 0], [0.25, 0.25, 0.25], [0.5, 0.3, 1], 0.07, '#FFD21F', { pupil: 'slit' });
  r.special = (t) => neck.scale.set(1, 1 + t * 0.3, 1);
};

export const caipora: Builder = (k, b) => {
  const r = k.rig; r.height = 1.62; r.width = 1.2; r.headSize = 0.4; r.mouth.set(0, 1.1, 0.45);
  const red = '#E83E30'; const fur = '#7B4B35';
  k.ball(b, fur, [0, 0.52, 0], [0.48, 0.35, 0.62]); k.ball(b, '#A85A39', [0, 0.5, 0.28], [0.3, 0.23, 0.3], { outline: false });
  for (const s of [1, -1]) { k.cyl(b, fur, [s * 0.3, 0.17, 0.28], [0.1, 0.3, 0.1]); k.cyl(b, fur, [s * 0.3, 0.17, -0.28], [0.1, 0.3, 0.1]); }
  k.cyl(b, '#8A5A32', [0.45, 0.72, 0.25], [0.035, 0.75, 0.035], [0, 0, -0.25]);
  const head = k.pivot(b, [0, 1.0, 0.18]); r.head = head; k.ball(head, '#A85A39', [0, 0, 0], [0.3, 0.3, 0.3]);
  for (let i = -2; i <= 2; i++) k.cone(head, red, [i * 0.11, 0.27, 0], [0.08, 0.35, 0.07], [0, 0, i * 0.1]);
  k.eyePair(head, [0, 0, 0], [0.3, 0.3, 0.3], [0.5, 0.3, 1], 0.075, '#2DBE4E', { brow: 0.2 });
  k.wave(head, 'z', 0.07, 2.4);
};
