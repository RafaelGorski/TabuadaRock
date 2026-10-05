import { GEO, INK, torus, type V3 } from './toon';
import type { Builder } from './rig';

const H = Math.PI / 2;

/** T2 · Vento: a frigatebird with a red throat pouch. */
export const tesourada: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.15;
  r.width = 1.5;
  r.hover = 0.7;
  r.headSize = 0.34;
  r.bobAmp = 0.05;
  r.bobSpeed = 3;
  r.mouth.set(0, 0.84, 0.72);
  const feather = '#2E2550';
  const tip = '#7FD6EA';
  k.ball(b, feather, [0, 0.55, -0.02], [0.3, 0.32, 0.44], { rot: [-0.25, 0, 0] });
  const pouch = k.ball(b, '#FF3B4E', [0, 0.42, 0.22], [0.25, 0.25, 0.23]);
  k.ball(b, '#FFFFFF', [0.08, 0.52, 0.43], [0.05, 0.04, 0.02], { basic: true, outline: false });
  for (const s of [1, -1]) k.cone(b, feather, [s * 0.08, 0.5, -0.5], [0.05, 0.5, 0.05], [-(H + 0.3), 0, -s * 0.25]);
  for (const s of [1, -1]) {
    const sh = k.pivot(b, [s * 0.24, 0.66, 0], [0, 0, s * 0.25]);
    k.ball(sh, feather, [s * 0.38, 0, 0], [0.4, 0.04, 0.17]);
    const el = k.pivot(sh, [s * 0.74, 0, 0], [0, 0, s * 0.15]);
    k.ball(el, feather, [s * 0.32, 0, -0.02], [0.36, 0.035, 0.12], { rot: [0, s * 0.25, 0] });
    k.ball(el, tip, [s * 0.6, 0, -0.09], [0.13, 0.037, 0.08], { rot: [0, s * 0.25, 0] });
    k.wave(sh, 'z', s * 0.45, 6);
    k.wave(el, 'z', s * 0.3, 6, -0.7);
  }
  const head = k.pivot(b, [0, 0.86, 0.22]);
  r.head = head;
  const hc: V3 = [0, 0, 0];
  const hr: V3 = [0.22, 0.21, 0.23];
  k.ball(head, feather, hc, hr);
  k.cone(head, '#A9B4C8', [0, -0.03, 0.34], [0.065, 0.32, 0.065], [H, 0, 0]);
  k.cone(head, '#A9B4C8', [0, -0.07, 0.48], [0.035, 0.09, 0.035], [Math.PI, 0, 0]);
  k.eyePair(head, hc, hr, [0.6, 0.35, 0.75], 0.075, tip, { brow: 0.4 });
  for (const a of [-0.35, 0, 0.35]) k.cone(head, feather, [0, 0.26, -0.1], [0.04, 0.22, 0.04], [-0.7, 0, a]);
  r.special = (t) => pouch.scale.set(0.25 * (1 + t * 0.35), 0.25 * (1 + t * 0.35), 0.23 * (1 + t * 0.35));
};

/** T3 · Planta: a mossy sloth that fights sitting down. */
export const treguica: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.48;
  r.width = 1.3;
  r.headSize = 0.4;
  r.bobSpeed = 1.3;
  r.mouth.set(0, 0.98, 0.46);
  const fur = '#A08A6E';
  const dark = '#6E5A44';
  const moss = '#5FA03A';
  const claw = '#F4EEDC';
  k.ball(b, fur, [0, 0.5, 0], [0.45, 0.5, 0.4]);
  k.ball(b, '#B9A386', [0, 0.45, 0.2], [0.3, 0.34, 0.24], { outline: false });
  for (const s of [1, -1]) {
    k.ball(b, dark, [s * 0.24, 0.1, 0.32], [0.13, 0.1, 0.18]);
    for (const c of [-0.05, 0, 0.05]) k.cone(b, claw, [s * 0.24 + c, 0.07, 0.52], [0.022, 0.1, 0.022], [H, 0, 0], { outline: 0.012 });
  }
  k.ball(b, moss, [0.28, 0.82, -0.08], [0.17, 0.07, 0.15], { rot: [0, 0, -0.6] });
  k.ball(b, moss, [-0.3, 0.42, 0.18], [0.12, 0.05, 0.1], { rot: [0.3, 0, 0.9] });
  k.ball(b, moss, [-0.1, 0.7, -0.35], [0.16, 0.06, 0.14], { rot: [-0.8, 0, 0] });
  for (const s of [1, -1]) {
    const sh = k.pivot(b, [s * 0.38, 0.78, 0.05], [-0.9, 0, s * 0.25]);
    k.limb(sh, fur, 0.085, 0.55);
    for (const c of [-0.05, 0, 0.05]) k.cone(sh, claw, [c, -0.74, 0.03], [0.025, 0.18, 0.025], [Math.PI - 0.2, 0, 0], { outline: 0.012 });
    k.wave(sh, 'x', 0.12, 1.4, s);
  }
  const head = k.pivot(b, [0, 1.08, 0.08]);
  r.head = head;
  k.ball(head, fur, [0, 0, 0], [0.36, 0.33, 0.33]);
  const fc: V3 = [0, -0.03, 0.15];
  const fr: V3 = [0.28, 0.24, 0.2];
  k.ball(head, '#EADBC0', fc, fr, { outline: false });
  for (const s of [1, -1]) k.ball(head, '#4A3426', [s * 0.13, 0.0, 0.27], [0.15, 0.065, 0.07], { rot: [0, s * 0.3, -s * 0.35], outline: false });
  k.eyePair(head, fc, fr, [0.45, 0.2, 1], 0.07, '#2DBE4E', { brow: 0.25 });
  k.ball(head, INK, [0, -0.07, 0.35], [0.06, 0.04, 0.03], { outline: false });
  k.add(head, torus(0.06, 0.013, Math.PI), INK, { pos: [0, -0.12, 0.335], rot: [-0.3, 0, Math.PI] }, { outline: false });
  k.ball(head, moss, [0.06, 0.3, -0.02], [0.2, 0.07, 0.17], { rot: [0, 0, 0.2] });
  const sprig = k.pivot(head, [0.1, 0.34, 0]);
  k.ball(sprig, '#2DBE4E', [0.06, 0.06, 0], [0.08, 0.025, 0.045], { rot: [0, 0, 0.6] });
  k.wave(sprig, 'z', 0.25, 1.8);
  k.wave(head, 'z', 0.09, 1.1);
};

/** T4 · Fogo: a maned wolf on stilt legs with an ember mane. */
export const guarabrasa: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.95;
  r.width = 1.3;
  r.headSize = 0.36;
  r.mouth.set(0, 1.43, 0.98);
  const fur = '#E2642A';
  const leg = '#3A2A3E';
  const cream = '#F4EEDC';
  for (const s of [1, -1]) {
    for (const z of [0.3, -0.34]) {
      k.cyl(b, leg, [s * 0.17, 0.44, z], [0.07, 0.8, 0.07]);
      k.ball(b, leg, [s * 0.17, 0.04, z + 0.04], [0.09, 0.05, 0.12]);
    }
  }
  k.ball(b, fur, [0, 0.98, -0.04], [0.34, 0.3, 0.56]);
  k.ball(b, cream, [0, 0.9, 0.2], [0.22, 0.2, 0.3], { outline: false });
  k.cyl(b, fur, [0, 1.2, 0.36], [0.15, 0.42, 0.15], [0.55, 0, 0]);
  const mane: V3[] = [[0, 1.4, 0.34], [0, 1.27, 0.2], [0, 1.24, 0.02], [0, 1.24, -0.18], [0, 1.2, -0.38]];
  mane.forEach((p, i) => {
    const m = k.pivot(b, p, [-0.55, 0, 0]);
    k.cone(m, '#FF5A1F', [0, 0.1, 0], [0.075, 0.26 - i * 0.025, 0.075]);
    k.cone(m, '#FFD21F', [0, 0.07, 0.025], [0.04, 0.14 - i * 0.015, 0.04], undefined, { outline: false });
    k.flicker(m, 12 + i, 0.2);
  });
  const tail = k.pivot(b, [0, 1.0, -0.56], [0.95, 0, 0]);
  k.ball(tail, fur, [0, -0.28, 0], [0.12, 0.3, 0.12]);
  k.ball(tail, cream, [0, -0.56, 0], [0.09, 0.1, 0.09]);
  k.wave(tail, 'z', 0.3, 3);
  const head = k.pivot(b, [0, 1.5, 0.52]);
  r.head = head;
  const hc: V3 = [0, 0, 0];
  const hr: V3 = [0.24, 0.22, 0.25];
  k.ball(head, fur, hc, hr);
  k.ball(head, leg, [0, -0.07, 0.26], [0.11, 0.1, 0.18]);
  k.ball(head, INK, [0, -0.03, 0.43], [0.05, 0.04, 0.03], { outline: false });
  k.ball(head, cream, [0, -0.16, 0.1], [0.15, 0.09, 0.15], { outline: false });
  k.eyePair(head, hc, hr, [0.55, 0.3, 0.85], 0.07, '#FFD21F', { pupil: 'slit', brow: 0.45 });
  for (const s of [1, -1]) {
    const ear = k.pivot(head, [s * 0.13, 0.17, -0.04], [0, 0, -s * 0.22]);
    k.cone(ear, fur, [0, 0.16, 0], [0.11, 0.34, 0.07]);
    k.cone(ear, '#FFD2A8', [0, 0.13, 0.035], [0.065, 0.22, 0.03], undefined, { outline: false });
    k.wave(ear, 'x', 0.1, 2.6, s);
  }
};

/** T5 · Pedra: a caiman with five stone plates on its back. */
export const jacarock: Builder = (k, b) => {
  const r = k.rig;
  r.height = 0.95;
  r.width = 1.45;
  r.headSize = 0.38;
  r.mouth.set(0, 0.5, 1.12);
  const hide = '#6E8A4A';
  const belly = '#D8CF9A';
  const stoneDark = '#77736A';
  for (const s of [1, -1]) for (const z of [0.3, -0.3]) k.ball(b, '#5E7840', [s * 0.38, 0.13, z], [0.13, 0.13, 0.16]);
  k.ball(b, hide, [0, 0.38, -0.05], [0.42, 0.28, 0.62]);
  k.ball(b, belly, [0, 0.27, 0.05], [0.36, 0.17, 0.52], { outline: false });
  for (let i = 0; i < 5; i++) {
    const z = 0.36 - i * 0.2;
    const y = 0.38 + 0.28 * Math.sqrt(Math.max(0, 1 - ((z + 0.05) / 0.62) ** 2));
    const s = 0.15 - i * 0.012;
    k.rock(b, i % 2 ? stoneDark : '#9A968A', [0, y + 0.02, z], [s, s * 0.8, s], [0.3 * i, i, 0]);
  }
  let seg = k.pivot(b, [0, 0.36, -0.6], [1.7, 0, 0]);
  k.wave(seg, 'z', 0.22, 2.2);
  [0.14, 0.11, 0.085, 0.06].forEach((rad, i) => {
    k.limb(seg, hide, rad, 0.16);
    k.cone(seg, stoneDark, [0, -0.15, -rad * 0.9], [0.04, 0.09, 0.04], [-H, 0, 0]);
    seg = k.pivot(seg, [0, -(0.16 + rad * 1.1), 0], [0.12, 0, 0]);
    k.wave(seg, 'z', 0.18, 2.2, -0.6 * (i + 1));
  });
  const head = k.pivot(b, [0, 0.46, 0.52]);
  r.head = head;
  k.ball(head, hide, [0, 0.03, 0.2], [0.3, 0.16, 0.44]);
  for (const s of [1, -1]) {
    k.ball(head, hide, [s * 0.13, 0.15, 0.06], [0.1, 0.09, 0.1]);
    k.eye(head, [s * 0.13, 0.2, 0.11], 0.075, '#FFD21F', { pupil: 'slit', yaw: s * 0.3 });
    k.box(head, INK, [s * 0.13, 0.31, 0.12], [0.1, 0.022, 0.025], [0, s * 0.3, s * 0.4], { outline: false });
    k.ball(head, INK, [s * 0.05, 0.13, 0.6], [0.025, 0.018, 0.02], { outline: false });
    for (let i = 0; i < 4; i++) k.cone(head, '#FFFFFF', [s * (0.21 - i * 0.035), -0.1, 0.18 + i * 0.1], [0.025, 0.07, 0.025], [Math.PI, 0, 0], { outline: 0.01 });
  }
  const jaw = k.pivot(head, [0, -0.04, -0.02]);
  k.ball(jaw, belly, [0, -0.05, 0.22], [0.26, 0.08, 0.4]);
  r.special = (t) => (jaw.rotation.x = t * 0.65);
};

/** T6 · Raio: a three-banded armadillo with six lightning bands that rolls into its attack. */
export const rolachoque: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.12;
  r.width = 1.15;
  r.headSize = 0.3;
  r.mouth.set(0, 0.46, 0.96);
  const shellC = '#55607A';
  const band = '#FFE014';
  const skin = '#D4AE84';
  for (const s of [1, -1]) for (const z of [0.25, -0.25]) k.ball(b, skin, [s * 0.25, 0.08, z], [0.1, 0.08, 0.13]);
  k.cone(b, shellC, [0, 0.3, -0.55], [0.08, 0.3, 0.08], [-2.0, 0, 0]);
  const shell = k.pivot(b, [0, 0.56, 0]);
  k.ball(shell, shellC, [0, 0, 0], [0.5, 0.48, 0.55]);
  for (let i = 0; i < 6; i++) {
    const z = -0.3 + i * 0.12;
    k.add(shell, torus(0.5 * Math.sqrt(1 - (z / 0.58) ** 2), 0.032), band, { pos: [0, 0, z], scale: [1, 0.96, 1] });
  }
  r.special = (t) => (shell.rotation.x = t * Math.PI * 2);
  const head = k.pivot(b, [0, 0.46, 0.5]);
  r.head = head;
  const hc: V3 = [0, 0, 0.06];
  const hr: V3 = [0.19, 0.18, 0.22];
  k.ball(head, skin, hc, hr);
  k.ball(head, skin, [0, -0.05, 0.28], [0.1, 0.09, 0.13]);
  k.ball(head, INK, [0, -0.03, 0.4], [0.04, 0.03, 0.025], { outline: false });
  k.box(head, band, [0, 0.16, 0.06], [0.2, 0.06, 0.2], [0, Math.PI / 4, 0]);
  k.eyePair(head, hc, hr, [0.6, 0.25, 0.75], 0.065, band, { brow: 0.45 });
  for (const s of [1, -1]) k.cone(head, skin, [s * 0.14, 0.15, 0], [0.06, 0.13, 0.04], [0, 0, -s * 0.5]);
  for (const s of [1, -1]) {
    const sp = k.pivot(b, [s * 0.42, 0.98, -0.1]);
    k.add(sp, GEO.tetra, band, { scale: 0.07 }, { outline: 0.012 });
    k.spin(sp, 'y', 4 * s);
    k.flicker(sp, 18, 0.3);
  }
};
