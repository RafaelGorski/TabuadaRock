import { INK, torus, type V3 } from './toon';
import type { Builder } from './rig';

const H = Math.PI / 2;

/** Água starter: a capybara with a scarf and a water-drop crest. */
export const capibolha: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.45;
  r.width = 1.15;
  r.headSize = 0.46;
  r.mouth.set(0, 0.88, 0.84);
  const fur = '#B97A45';
  const dark = '#7E4A26';
  const light = '#E8BD8A';
  for (const x of [0.26, -0.26]) for (const z of [0.24, -0.3]) k.cyl(b, dark, [x, 0.14, z], [0.1, 0.28, 0.1]);
  k.ball(b, fur, [0, 0.56, -0.05], [0.5, 0.46, 0.6]);
  k.ball(b, light, [0, 0.47, 0.2], [0.36, 0.32, 0.38], { outline: false });
  k.add(b, torus(0.33, 0.075), '#1FA2FF', { pos: [0, 0.84, 0.16], rot: [H + 0.3, 0, 0], scale: [1, 0.9, 1] });
  const tail = k.pivot(b, [0.22, 0.86, -0.06], [0.5, 0, -0.55]);
  k.box(tail, '#1FA2FF', [0, -0.16, 0], [0.13, 0.3, 0.05]);
  k.wave(tail, 'x', 0.3, 4.2);

  const head = k.pivot(b, [0, 0.98, 0.3]);
  r.head = head;
  const hc: V3 = [0, 0, 0];
  const hr: V3 = [0.4, 0.36, 0.44];
  k.ball(head, fur, hc, hr);
  k.ball(head, '#A86A3A', [0, -0.09, 0.32], [0.3, 0.23, 0.24]);
  for (const s of [1, -1]) {
    k.ball(head, INK, [s * 0.07, -0.02, 0.55], [0.035, 0.05, 0.03], { outline: false });
    k.ball(head, '#F2A0A0', [s * 0.27, -0.07, 0.26], [0.07, 0.04, 0.03], { outline: false });
    const ear = k.pivot(head, [s * 0.26, 0.27, -0.1], [0, 0, -s * 0.3]);
    k.ball(ear, dark, [0, 0.04, 0], [0.08, 0.1, 0.06]);
    k.wave(ear, 'z', 0.18, 2.6, s);
  }
  k.add(head, torus(0.07, 0.014, Math.PI), INK, { pos: [0, -0.16, 0.53], rot: [-0.3, 0, Math.PI] }, { outline: false });
  k.eyePair(head, hc, hr, [0.5, 0.3, 1], 0.105, '#1F7BFF');
  const drop = k.pivot(head, [0, 0.33, 0.02]);
  k.ball(drop, '#7FD0FF', [0, 0.09, 0], 0.1);
  k.cone(drop, '#7FD0FF', [0, 0.22, 0], [0.085, 0.18, 0.085]);
  k.wave(drop, 'z', 0.2, 3);
  k.wave(head, 'x', 0.05, 2.4);
};

/** Fogo starter: a jaguar cub with a burning tail tip. */
export const brasonca: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.5;
  r.width = 1.1;
  r.headSize = 0.44;
  r.mouth.set(0, 0.86, 0.74);
  const fur = '#F5A030';
  const cream = '#FFE2B0';
  const spot = '#8A3A12';
  for (const x of [0.21, -0.21]) {
    for (const z of [0.24, -0.26]) {
      k.cyl(b, fur, [x, 0.17, z], [0.095, 0.3, 0.095]);
      k.ball(b, cream, [x, 0.05, z + 0.05], [0.12, 0.07, 0.14]);
    }
  }
  const bc: V3 = [0, 0.56, -0.04];
  const br: V3 = [0.4, 0.4, 0.52];
  k.ball(b, fur, bc, br);
  k.ball(b, cream, [0, 0.52, 0.22], [0.28, 0.3, 0.3], { outline: false });
  k.spots(b, spot, bc, br, [[1, 0.5, -0.2], [-1, 0.3, -0.4], [0.8, 0.1, 0.2], [-0.7, 0.8, -0.6], [0.3, 1, -0.7], [-0.2, 0.9, -0.1], [0.9, 0.6, -0.8]], 0.055);

  let seg = k.pivot(b, [0, 0.62, -0.5], [2.2, 0, 0]);
  k.wave(seg, 'z', 0.3, 2.4);
  for (let i = 0; i < 3; i++) {
    k.limb(seg, fur, 0.065, 0.2);
    if (i === 1) k.ball(seg, spot, [0, -0.15, 0.05], [0.07, 0.05, 0.03], { outline: false });
    seg = k.pivot(seg, [0, -0.27, 0], [0.35, 0, 0]);
    k.wave(seg, 'x', 0.18, 2.4, i * 0.7);
  }
  const flame = k.pivot(seg, [0, 0, 0], [Math.PI, 0, 0]);
  k.cone(flame, '#FF5A1F', [0, 0.12, 0], [0.12, 0.3, 0.12]);
  k.cone(flame, '#FFD21F', [0, 0.08, 0.03], [0.07, 0.18, 0.07], undefined, { outline: false });
  k.flicker(flame, 16, 0.2);

  const head = k.pivot(b, [0, 1.0, 0.26]);
  r.head = head;
  const hc: V3 = [0, 0, 0];
  const hr: V3 = [0.42, 0.38, 0.38];
  k.ball(head, fur, hc, hr);
  k.ball(head, cream, [0, -0.13, 0.27], [0.22, 0.15, 0.16]);
  k.ball(head, '#5A2A1A', [0, -0.05, 0.42], [0.07, 0.05, 0.04], { outline: false });
  k.add(head, torus(0.05, 0.012, Math.PI), INK, { pos: [0, -0.19, 0.415], rot: [-0.3, 0, Math.PI] }, { outline: false });
  k.eyePair(head, hc, hr, [0.42, 0.3, 1], 0.11, '#3DCB4F', { pupil: 'slit' });
  k.spots(head, spot, hc, hr, [[0.8, 0.7, 0.1], [-0.85, 0.55, 0.25], [0.2, 1, -0.3]], 0.045);
  for (const s of [1, -1]) {
    const ear = k.pivot(head, [s * 0.25, 0.28, -0.05], [0, 0, -s * 0.35]);
    k.cone(ear, fur, [0, 0.08, 0], [0.13, 0.2, 0.09]);
    k.cone(ear, '#FF8A5A', [0, 0.06, 0.04], [0.07, 0.12, 0.04], undefined, { outline: false });
    k.wave(ear, 'z', 0.12, 3, s);
  }
  const tuft = k.pivot(head, [0, 0.34, 0.08], [0.2, 0, 0]);
  k.cone(tuft, '#FF5A1F', [0, 0.1, 0], [0.09, 0.24, 0.09]);
  k.cone(tuft, '#FFD21F', [0, 0.06, 0.03], [0.05, 0.13, 0.05], undefined, { outline: false });
  k.flicker(tuft, 13, 0.18);
  k.wave(head, 'z', 0.05, 1.8);
};

/** Planta starter: an anteater with a leaf-fan tail and a vine tongue. */
export const folhandua: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.42;
  r.width = 1.2;
  r.headSize = 0.4;
  r.mouth.set(0, 0.9, 1.08);
  const fur = '#93AE7C';
  const dark = '#3E5A36';
  const belly = '#DCE8C6';
  const leaf = '#2DBE4E';
  const leaf2 = '#1E9440';
  for (const x of [0.24, -0.24]) {
    for (const z of [0.26, -0.28]) {
      k.cyl(b, dark, [x, 0.17, z], [0.1, 0.32, 0.1]);
      k.ball(b, dark, [x, 0.04, z + 0.06], [0.12, 0.06, 0.15]);
    }
  }
  k.ball(b, fur, [0, 0.6, -0.06], [0.44, 0.42, 0.58]);
  k.ball(b, belly, [0, 0.5, 0.18], [0.32, 0.3, 0.36], { outline: false });
  k.add(b, torus(0.4, 0.06), dark, { pos: [0, 0.68, 0.16], rot: [H + 0.5, 0, 0], scale: [1.04, 0.98, 1] }, { outline: false });

  const fan = k.pivot(b, [0, 0.7, -0.56], [-0.5, 0, 0]);
  for (let i = 0; i < 7; i++) {
    const p = k.pivot(fan, [0, 0, 0], [0, 0, (i - 3) * 0.32]);
    k.ball(p, i % 2 ? leaf2 : leaf, [0, 0.36, 0], [0.11, 0.36, 0.04]);
    k.cyl(p, i % 2 ? leaf : leaf2, [0, 0.36, 0.035], [0.012, 0.6, 0.012], undefined, { outline: false });
    k.wave(p, 'z', 0.06, 2.2, i * 0.5);
  }

  const head = k.pivot(b, [0, 0.98, 0.42]);
  r.head = head;
  const hc: V3 = [0, 0, 0];
  const hr: V3 = [0.28, 0.27, 0.3];
  k.ball(head, fur, hc, hr);
  k.cone(head, fur, [0, -0.07, 0.4], [0.13, 0.5, 0.13], [H, 0, 0]);
  k.ball(head, INK, [0, -0.07, 0.65], [0.045, 0.04, 0.035], { outline: false });
  k.eyePair(head, hc, hr, [0.6, 0.3, 0.8], 0.085, leaf);
  for (const s of [1, -1]) k.ball(head, dark, [s * 0.17, 0.2, -0.1], [0.07, 0.08, 0.05]);
  const sprout = k.pivot(head, [0, 0.25, -0.02]);
  k.cyl(sprout, leaf2, [0, 0.06, 0], [0.018, 0.12, 0.018], undefined, { outline: false });
  for (const s of [1, -1]) k.ball(sprout, leaf, [s * 0.08, 0.13, 0], [0.09, 0.025, 0.05], { rot: [0, 0, s * 0.4] });
  k.wave(sprout, 'z', 0.2, 2.2);

  const tongue = k.pivot(head, [0, -0.1, 0.62], [-H, 0, 0]);
  k.limb(tongue, leaf, 0.03, 0.22, undefined, { outline: false });
  tongue.visible = false;
  r.special = (t) => {
    tongue.visible = t > 0.02;
    tongue.scale.set(1, 0.1 + t * 2.6, 1);
  };
};

/** Training dummy: a straw target on a wooden post. */
export const boneco: Builder = (k, b) => {
  const r = k.rig;
  r.height = 1.7;
  r.width = 1.1;
  r.headSize = 0.34;
  r.bobAmp = 0;
  r.mouth.set(0, 1.3, 0.3);
  const wood = '#8A5A32';
  const straw = '#E8C766';
  const straw2 = '#C99A2E';
  k.cyl(b, '#6E4526', [0, 0.05, 0], [0.34, 0.1, 0.34]);
  const sway = k.pivot(b, [0, 0.1, 0]);
  k.wave(sway, 'z', 0.035, 1.7);
  k.wave(sway, 'x', 0.025, 1.3, 1);
  k.cyl(sway, wood, [0, 0.35, 0], [0.065, 0.7, 0.065]);
  k.cyl(sway, wood, [0, 0.95, -0.05], [0.05, 1.05, 0.05], [0, 0, H]);
  for (const s of [1, -1]) k.ball(sway, straw, [s * 0.55, 0.95, -0.05], [0.1, 0.12, 0.1]);
  k.ball(sway, straw, [0, 0.82, 0], [0.36, 0.4, 0.3]);
  k.add(sway, torus(0.3, 0.035), straw2, { pos: [0, 0.6, 0], rot: [H, 0, 0], scale: [1, 0.85, 1] });
  k.add(sway, torus(0.19, 0.028), '#FF4A1C', { pos: [0, 0.84, 0.27] }, { outline: false });
  k.add(sway, torus(0.1, 0.028), '#FF4A1C', { pos: [0, 0.84, 0.3] }, { outline: false });
  k.ball(sway, '#FF4A1C', [0, 0.84, 0.3], [0.04, 0.04, 0.02], { outline: false });
  const head = k.pivot(sway, [0, 1.36, 0]);
  r.head = head;
  k.ball(head, straw, [0, 0, 0], [0.25, 0.24, 0.22]);
  for (const s of [1, -1]) {
    k.cyl(head, INK, [s * 0.09, 0.04, 0.21], [0.045, 0.02, 0.045], [H, 0, 0], { outline: false });
    k.cone(head, straw2, [s * 0.07, 0.25, 0], [0.05, 0.12, 0.05], [0, 0, -s * 0.5]);
  }
  k.box(head, INK, [0, -0.08, 0.215], [0.12, 0.014, 0.01], undefined, { outline: false });
  for (const x of [-0.04, 0, 0.04]) k.box(head, INK, [x, -0.08, 0.217], [0.008, 0.04, 0.01], undefined, { outline: false });
  k.cone(head, straw2, [0, 0.27, 0], [0.06, 0.14, 0.06]);
};
