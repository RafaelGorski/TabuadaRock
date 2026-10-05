import { GEO, INK, type V3 } from './toon';
import type { Builder } from './rig';
import type { Object3D } from 'three';

const H = Math.PI / 2;

/** T7 · Fogo: Boitatá, the fire serpent of the legend, with huge glowing eyes. */
export const boitata: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.95;
  r.width = 1.1;
  r.headSize = 0.44;
  r.mouth.set(0, 1.46, 0.72);
  const red = '#FF5A1F';
  const red2 = '#E8401A';
  const gold = '#FFD21F';
  const path: V3[] = [[0.2, 0.1, -0.5], [0.05, 0.13, -0.62], [-0.2, 0.16, -0.48], [-0.26, 0.21, -0.16], [0, 0.3, 0.05], [0.16, 0.55, 0], [0.1, 0.85, -0.1], [0, 1.12, -0.04], [0, 1.33, 0.1]];
  const sizes = [0.09, 0.12, 0.15, 0.18, 0.2, 0.2, 0.19, 0.18, 0.17];
  const segs: Object3D[] = path.map((p, i) => {
    const g = k.pivot(b, p);
    const s = sizes[i];
    k.ball(g, i % 2 ? red2 : red, [0, 0, 0], s);
    if (i >= 3) k.ball(g, gold, [0, -s * 0.2, s * 0.55], [s * 0.75, s * 0.7, s * 0.5], { outline: false });
    if (i >= 2) {
      const f = k.pivot(g, [0, s * 0.85, -s * 0.3], [-0.5, 0, 0]);
      k.cone(f, i % 2 ? gold : red, [0, 0.07, 0], [0.05, 0.16, 0.05], undefined, { outline: 0.015 });
      k.flicker(f, 12 + i, 0.25);
    }
    return g;
  });
  const headBase: V3 = [0, 1.52, 0.26];
  const head = k.pivot(b, headBase);
  r.head = head;
  const hc: V3 = [0, 0, 0];
  const hr: V3 = [0.3, 0.26, 0.32];
  k.ball(head, red, hc, hr);
  k.ball(head, red, [0, -0.06, 0.24], [0.21, 0.15, 0.2]);
  k.ball(head, gold, [0, -0.15, 0.12], [0.22, 0.08, 0.24], { outline: false });
  for (const s of [1, -1]) k.ball(head, INK, [s * 0.06, -0.01, 0.43], [0.022, 0.016, 0.015], { outline: false });
  k.eyePair(head, hc, hr, [0.55, 0.4, 0.8], 0.13, '#FFF6A8', { glow: true, pupil: 'slit', brow: 0.5 });
  [-0.13, 0, 0.13].forEach((z, i) => {
    const f = k.pivot(head, [0, 0.22 - Math.abs(z) * 0.4, z - 0.05], [-0.4, 0, 0]);
    k.cone(f, red, [0, 0.14, 0], [0.09, z === 0 ? 0.34 : 0.26, 0.09]);
    k.cone(f, gold, [0, 0.09, 0.03], [0.05, 0.18, 0.05], undefined, { outline: false });
    k.flicker(f, 14 + i * 2, 0.22);
  });
  const tongue = k.pivot(head, [0, -0.1, 0.42], [-H, 0, 0]);
  for (const s of [1, -1]) k.limb(tongue, '#FF3B6B', 0.02, 0.16, [0, 0, s * 0.2], { outline: false });
  tongue.visible = false;
  r.special = (t) => {
    tongue.visible = t > 0.05;
    tongue.scale.set(1, 0.2 + t * 1.6, 1);
  };
  r.tick = (t, e) => {
    const amp = Math.min(e, 2);
    segs.forEach((g, i) => {
      g.position.x = path[i][0] + Math.sin(t * 2.4 - i * 0.6) * 0.05 * amp * (0.3 + i / 8);
      g.position.y = path[i][1] + Math.cos(t * 2.4 - i * 0.6) * 0.02 * (i / 8);
    });
    head.position.x = headBase[0] + Math.sin(t * 2.4 - 5.4) * 0.06 * amp;
  };
};

/** T8 · Água: an octopus with eight curling arms. */
export const polvorosa: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.58;
  r.width = 1.5;
  r.headSize = 0.5;
  r.mouth.set(0, 0.72, 0.52);
  const skin = '#3D5BFF';
  const spot = '#9FD8FF';
  const rots = [-0.35, -0.4, -0.55, -0.6];
  const radii = [0.1, 0.085, 0.07, 0.055];
  for (let i = 0; i < 8; i++) {
    const arm = k.pivot(b, [0, 0.64, -0.02], [0, i * (Math.PI / 4) + Math.PI / 8, 0]);
    let seg = k.pivot(arm, [0, 0, 0.24], [rots[0], 0, 0]);
    for (let j = 0; j < 4; j++) {
      k.limb(seg, skin, radii[j], 0.16);
      if (j >= 2) k.ball(seg, '#C9E8FF', [0, -0.12, -radii[j] * 0.75], radii[j] * 0.45, { outline: false });
      k.wave(seg, 'x', 0.12, 2.6, i * 0.8 + j * 0.6);
      if (j < 3) seg = k.pivot(seg, [0, -(0.16 + radii[j] * 1.1), 0], [rots[j + 1], 0, 0]);
    }
  }
  k.cyl(b, skin, [0.13, 0.68, 0.38], [0.05, 0.14, 0.05], [1.2, 0, 0]);
  const mantle = k.pivot(b, [0, 1.02, -0.05], [-0.25, 0, 0]);
  r.head = mantle;
  const mc: V3 = [0, 0, 0];
  const mr: V3 = [0.42, 0.5, 0.45];
  k.ball(mantle, skin, mc, mr);
  k.spots(mantle, spot, mc, mr, [[0.5, 0.8, 0.3], [-0.6, 0.6, 0.4], [0.2, 0.9, -0.5], [-0.3, 0.95, -0.2], [0.85, 0.3, -0.3], [-0.9, 0.2, -0.4], [0.1, 0.65, 0.8]], 0.06);
  k.eyePair(mantle, mc, mr, [0.42, -0.3, 0.85], 0.1, '#FFD21F', { pupil: 'bar', brow: 0.3 });
  k.wave(mantle, 'x', 0.06, 1.8);
};

/** T9 · Raio: a coati whose ringed tail ends in a spark. */
export const quatrovao: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.95;
  r.width = 1.15;
  r.headSize = 0.36;
  r.mouth.set(0, 0.8, 0.92);
  const fur = '#B5703A';
  const dark = '#3A2418';
  const spark = '#FFE014';
  for (const s of [1, -1]) for (const z of [0.25, -0.28]) k.cyl(b, dark, [s * 0.19, 0.16, z], [0.08, 0.32, 0.08]);
  k.ball(b, fur, [0, 0.56, -0.05], [0.36, 0.34, 0.5]);
  k.ball(b, '#E0A060', [0, 0.48, 0.15], [0.25, 0.22, 0.3], { outline: false });
  let seg = k.pivot(b, [0, 0.62, -0.48], [2.6, 0, 0]);
  k.wave(seg, 'z', 0.12, 2);
  for (let i = 0; i < 7; i++) {
    k.limb(seg, i % 2 ? dark : fur, 0.085 - i * 0.004, 0.08);
    seg = k.pivot(seg, [0, -0.2, 0], [0.1, 0, 0]);
    k.wave(seg, 'z', 0.07, 2, -0.5 * (i + 1));
  }
  const tip = k.pivot(seg, [0, -0.05, 0]);
  k.add(tip, GEO.ico, spark, { scale: 0.11 }, { flat: true });
  k.spin(tip, 'y', 5);
  k.flicker(tip, 20, 0.25);
  const head = k.pivot(b, [0, 0.86, 0.4]);
  r.head = head;
  const hc: V3 = [0, 0, 0];
  const hr: V3 = [0.26, 0.24, 0.26];
  k.ball(head, fur, hc, hr);
  k.cone(head, fur, [0, -0.06, 0.3], [0.11, 0.36, 0.11], [H, 0, 0]);
  k.ball(head, INK, [0, -0.06, 0.48], [0.05, 0.04, 0.04], { outline: false });
  for (const s of [1, -1]) {
    k.ball(head, '#F4EEDC', [s * 0.11, -0.04, 0.19], [0.09, 0.045, 0.05], { outline: false });
    k.ball(head, fur, [s * 0.17, 0.2, -0.04], [0.07, 0.08, 0.05]);
  }
  k.eyePair(head, hc, hr, [0.5, 0.35, 0.85], 0.07, spark, { brow: 0.4 });
};

/** T10 · Vento: a golden lion tamarin with a sunburst mane. */
export const micoleao: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.45;
  r.width = 1.0;
  r.headSize = 0.5;
  r.bobAmp = 0.05;
  r.bobSpeed = 3.2;
  r.mouth.set(0, 0.98, 0.38);
  const gold = '#FF9F1C';
  const face = '#4A2A1A';
  k.ball(b, gold, [0, 0.58, -0.02], [0.3, 0.36, 0.3]);
  for (const s of [1, -1]) {
    const hip = k.pivot(b, [s * 0.15, 0.36, 0.05], [-0.3, 0, s * 0.15]);
    k.limb(hip, gold, 0.07, 0.18);
    k.ball(hip, face, [0, -0.33, 0.06], [0.07, 0.05, 0.1]);
    const sh = k.pivot(b, [s * 0.27, 0.75, 0.06], [-0.9, 0, s * 0.35]);
    k.limb(sh, gold, 0.06, 0.26);
    k.ball(sh, face, [0, -0.44, 0], 0.065);
    k.wave(sh, 'z', s * 0.12, 3.2, s);
  }
  let seg = k.pivot(b, [0, 0.4, -0.24], [1.0, 0, 0]);
  for (let i = 0; i < 6; i++) {
    k.limb(seg, i > 3 ? '#C46A10' : gold, 0.05, 0.12);
    seg = k.pivot(seg, [0, -0.2, 0], [0.35, 0, 0]);
    k.wave(seg, 'z', 0.1, 2.4, -0.5 * i);
  }
  const head = k.pivot(b, [0, 1.06, 0.06]);
  r.head = head;
  k.ball(head, gold, [0, 0, -0.08], [0.3, 0.3, 0.24]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    k.ball(head, i % 2 ? gold : '#FFB52E', [Math.cos(a) * 0.27, Math.sin(a) * 0.27, -0.02], [0.13, 0.13, 0.11]);
  }
  const fc: V3 = [0, -0.01, 0.1];
  const fr: V3 = [0.18, 0.2, 0.13];
  k.ball(head, face, fc, fr);
  k.ball(head, '#6A4030', [0, -0.09, 0.21], [0.08, 0.06, 0.05], { outline: false });
  k.eyePair(head, fc, fr, [0.45, 0.3, 0.85], 0.06, gold, { brow: 0.35 });
  k.wave(head, 'z', 0.07, 2.1);
};

/** Final · Pedra: Mapinguari, the one-eyed giant with a mouth on its belly. */
export const mapinguari: Builder = (k, b) => {
  const r = k.rig;
  r.height = 2.15;
  r.width = 1.7;
  r.scale = 1.35;
  r.headSize = 0.42;
  r.bobSpeed = 1.6;
  r.bobAmp = 0.04;
  r.mouth.set(0, 0.86, 0.62);
  const fur = '#6B4E3A';
  const furDark = '#4E3626';
  const stone = '#8A8A7C';
  const stone2 = '#A6A496';
  const bone = '#EDE3C8';
  for (const s of [1, -1]) {
    k.cyl(b, furDark, [s * 0.28, 0.22, 0], [0.17, 0.42, 0.17]);
    k.ball(b, furDark, [s * 0.28, 0.07, -0.14], [0.17, 0.08, 0.26]);
    for (const c of [-0.08, 0, 0.08]) k.cone(b, bone, [s * 0.28 + c, 0.05, -0.4], [0.03, 0.1, 0.03], [-H, 0, 0], { outline: 0.012 });
  }
  k.ball(b, fur, [0, 0.98, 0], [0.6, 0.7, 0.5]);
  k.ball(b, '#8A6A50', [0, 0.85, 0.22], [0.42, 0.45, 0.3], { outline: false });
  const mouth = k.pivot(b, [0, 0.86, 0.5]);
  const hole = k.ball(mouth, '#2A1420', [0, 0, 0], [0.28, 0.16, 0.04], { outline: 0.015 });
  const upper = k.pivot(mouth, [0, 0.11, 0]);
  const lower = k.pivot(mouth, [0, -0.11, 0]);
  for (let i = 0; i < 5; i++) {
    const h = 0.09 - Math.abs(i - 2) * 0.012;
    k.cone(upper, bone, [(i - 2) * 0.1, -0.02, 0.045], [0.035, h, 0.03], [Math.PI, 0, 0], { outline: 0.01 });
    if (i < 4) k.cone(lower, bone, [(i - 1.5) * 0.1, 0.02, 0.045], [0.03, h * 0.8, 0.03], undefined, { outline: 0.01 });
  }
  const arms: Object3D[] = [];
  for (const s of [1, -1]) {
    k.rock(b, stone, [s * 0.5, 1.42, 0], [0.26, 0.2, 0.26], [0.3, s, 0.2]);
    k.rock(b, stone2, [s * 0.36, 1.56, -0.12], [0.14, 0.12, 0.14], [0.5, s * 2, 0]);
    const sh = k.pivot(b, [s * 0.6, 1.28, 0.05], [-0.3, 0, s * 0.28]);
    k.limb(sh, fur, 0.15, 0.55);
    k.rock(sh, stone, [s * 0.06, -0.4, -0.06], [0.12, 0.1, 0.12], [1, 0, 0]);
    k.ball(sh, furDark, [0, -0.86, 0.02], [0.17, 0.15, 0.17]);
    for (const c of [-0.08, 0, 0.08]) k.cone(sh, bone, [c, -1.0, 0.06], [0.035, 0.16, 0.035], [Math.PI - 0.3, 0, 0], { outline: 0.012 });
    k.wave(sh, 'z', s * 0.06, 1.6, s);
    arms.push(sh);
  }
  r.special = (t) => {
    hole.scale.set(0.28, 0.16 + t * 0.12, 0.04);
    upper.position.y = 0.11 + t * 0.06;
    lower.position.y = -0.11 - t * 0.06;
    for (const a of arms) a.rotation.x = -0.3 - t * 1.1;
  };
  const head = k.pivot(b, [0, 1.7, 0.08]);
  r.head = head;
  k.ball(head, fur, [0, 0, 0], [0.36, 0.3, 0.32]);
  k.eye(head, [0, 0.05, 0.27], 0.17, '#FF4A1C', { pupil: 'slit' });
  for (const s of [1, -1]) k.box(head, INK, [s * 0.09, 0.23, 0.3], [0.2, 0.05, 0.05], [0, s * 0.2, s * 0.35], { outline: false });
  const crown: V3[] = [[-0.16, -0.02, 0.1], [0.02, -0.08, 0.13], [0.17, 0, 0.09]];
  for (const [x, z, s] of crown) k.rock(head, stone2, [x, 0.27, z], [s, s * 1.2, s], [x * 3, x * 5, 0]);
};
