import { GEO } from './toon';
import { Scenery, type Stage } from './stage-kit';
import { butterfly } from './stages-a';

/** Dolphin that arcs out of the water every few seconds, traveling along +x. */
function jumper(s: Scenery, color: string, x0: number, z: number, period: number, delay: number, size = 1): void {
  const g = s.movable((b) => {
    b.add(GEO.sphereLo, color, { scale: [1.1, 0.32, 0.36] });
    b.add(GEO.coneLo, color, { pos: [1.25, -0.02, 0], rot: [0, 0, -Math.PI / 2], scale: [0.1, 0.45, 0.1] });
    b.add(GEO.coneLo, color, { pos: [-0.1, 0.38, 0], rot: [0, 0, 0.5], scale: [0.16, 0.36, 0.05] });
    b.add(GEO.sphereLo, color, { pos: [-1.1, 0.05, 0], rot: [0, 0, 0.4], scale: [0.14, 0.05, 0.42] });
    b.add(GEO.sphereLo, '#1A1230', { pos: [0.85, 0.08, 0.24], scale: 0.05 }, { outline: false });
    b.add(GEO.sphereLo, '#1A1230', { pos: [0.85, 0.08, -0.24], scale: 0.05 }, { outline: false });
  });
  g.scale.setScalar(size);
  s.anim((t) => {
    const p = (((t + delay) % period) + period) % period / 1.5;
    g.visible = p <= 1;
    if (!g.visible) return;
    g.position.set(x0 + (p - 0.5) * 4 * size, -0.7 + Math.sin(p * Math.PI) * 1.9 * size, z);
    g.rotation.z = Math.cos(p * Math.PI) * 0.9;
  });
}

export function amazonia(): Stage {
  const s = new Scenery(
    'amazonia',
    {
      sky: [
        [0, '#4A86C8'],
        [0.3, '#9CC4DE'],
        [0.47, '#DCE8DA'],
        [1, '#DCE8DA'],
      ],
      fog: ['#DCE8DA', 22, 92],
      hemi: ['#F0FFF4', '#3E5A2E', 1.2],
      sun: ['#FFF4D8', 1.95, [-4, 9, 4]],
    },
    77,
  );
  s.ground(
    s.speckles(
      '#EDE3C6',
      [
        ['#D9CBA4', 150, 4],
        ['#FFF8E6', 120, 3],
      ],
      24,
    ),
  );
  s.water('#2B2018', '#6A5236', 320, 40, [0, 0.03, -26], [0.03, 0.004], [24, 3]);
  const jungle = [
    ['#2E7A30', '#1F6A2A', '#3E8A3A'],
    ['#1F6A2A', '#2E7A30', '#185A22'],
    ['#3E8A3A', '#2E7A30', '#4C9A44'],
  ];
  for (let i = 0; i < 22; i++) {
    const x = -84 + i * 8 + s.range(-2, 2);
    s.tree(x, s.range(-58, -49), s.range(10, 14), s.range(3.2, 4.4), s.pick(jungle), '#5A3E2A', s.range(0, 6));
  }
  s.tree(-14, -54, 24, 7, ['#3E8A3A', '#2E7A30', '#4C9A44'], '#8A7058', 1.2);
  for (let i = 0; i < 10; i++) {
    s.palm(-60 + i * 13 + s.range(-3, 3), s.range(-49, -47), s.range(8, 10), s.range(-0.08, 0.08), s.range(0, 6), { fronds: 8, leaf: ['#3E8A3A', '#2E7A30'], nuts: false, droop: 0.9, size: 0.75, bark: '#6B5A48' });
  }
  for (const [x, z] of [
    [-13, -3],
    [15, -2],
    [-19, 2],
    [20, 3],
  ])
    s.tree(x, z, s.range(8, 10), s.range(2.6, 3.2), s.pick(jungle), '#5A3E2A', s.range(0, 6));
  for (let i = 0; i < 14; i++) {
    const x = s.range(-22, 22);
    const z = s.range(-5.5, 4);
    if (Math.abs(x) < 7) continue;
    s.bush(x, z, s.range(0.7, 1.2), s.pick(jungle));
  }
  for (const x of [-6, 5.5]) s.rock(x, -5, s.range(0.5, 0.8), '#5A5048');
  const boat = s.movable((b) => {
    b.add(GEO.box, '#F4F7FF', { pos: [0, 0.6, 0], scale: [8, 1.2, 2.2] });
    b.add(GEO.box, '#2440FF', { pos: [0, 0.35, 0], scale: [8.05, 0.3, 2.25] }, { outline: false });
    b.add(GEO.box, '#F4F7FF', { pos: [-0.4, 1.75, 0], scale: [6.4, 1.1, 2] });
    b.add(GEO.box, '#FF4A1C', { pos: [-0.4, 2.4, 0], scale: [6.8, 0.2, 2.3] });
    b.add(GEO.box, '#F4F7FF', { pos: [-1, 2.95, 0], scale: [4.2, 0.9, 1.8] });
    b.add(GEO.box, '#FFD21F', { pos: [-1, 3.5, 0], scale: [4.6, 0.18, 2.1] });
    b.add(GEO.coneLo, '#F4F7FF', { pos: [4.4, 0.6, 0], rot: [0, 0, -Math.PI / 2], scale: [0.6, 1.2, 1.1] });
  });
  boat.position.set(-60, 0, -36);
  s.anim((t, dt) => {
    boat.position.x += dt * 1.4;
    if (boat.position.x > 70) boat.position.x = -70;
    boat.rotation.z = Math.sin(t * 1.3) * 0.02;
  });
  jumper(s, '#FF8FB8', 3, -12, 7, 0, 0.9);
  jumper(s, '#FF8FB8', -9, -20, 9, 3.5, 0.9);
  butterfly(s, -4, 2.6, -2.5, '#2F6BFF', 1);
  butterfly(s, 5, 3.1, -3.5, '#2F6BFF', 3);
  s.cloud(-30, 22, -70, 4);
  s.cloud(18, 26, -76, 5);
  return s.finish();
}

export function noronha(): Stage {
  const s = new Scenery(
    'noronha',
    {
      sky: [
        [0, '#1D6FE8'],
        [0.3, '#5DB4F5'],
        [0.46, '#C2EDFF'],
        [0.5, '#E2F8FF'],
        [1, '#E2F8FF'],
      ],
      fog: ['#E2F8FF', 34, 110],
      hemi: ['#EFFBFF', '#F3E6C4', 1.15],
      sun: ['#FFF6DE', 2.15, [3, 9, 6]],
    },
    88,
  );
  s.ground(
    s.speckles(
      '#F6E7C1',
      [
        ['#E8D5A8', 150, 3],
        ['#FFF8E6', 120, 2],
      ],
      26,
    ),
  );
  s.water('#5FE0D8', '#E0FFFA', 320, 6, [0, 0.04, -10], [0.004, 0.03], [40, 0.8]);
  s.water('#12A8C9', '#C9FFF6', 320, 200, [0, 0.04, -113], [0.004, 0.02]);
  const foam = s.movable((b) => b.add(GEO.box, '#FFFFFF', { scale: [320, 0.02, 0.9] }, { outline: false }));
  foam.position.set(0, 0.06, -7);
  s.anim((t) => (foam.position.z = -7 + Math.sin(t * 0.8) * 0.45));
  const pico = s.at(-26, -62);
  s.part(pico, GEO.sphereLo, '#3E8A4A', { pos: [0, 0, 0], scale: [16, 11, 13] });
  s.part(pico, GEO.coneLo, '#6A6F66', { pos: [1, 17, -1], scale: [5.5, 30, 5.5] }, { flat: true });
  s.part(pico, GEO.sphereLo, '#3E8A4A', { pos: [-6, 6, 4], scale: [7, 6, 6] });
  for (const [x, z, r, h] of [
    [22, -46, 5, 10],
    [31, -51, 4.6, 8],
  ]) {
    const m = s.at(x, z);
    s.part(m, GEO.sphereLo, '#4F9A55', { scale: [r, h, r] });
    s.part(m, GEO.sphereLo, '#7C7468', { pos: [0, 0.4, r * 0.3], scale: [r * 0.9, h * 0.5, r * 0.8] }, { flat: true });
  }
  for (const [x, z] of [
    [-9, -3],
    [-14, -5],
    [10, -4],
    [15.5, -2.5],
    [-20, -1],
    [8.6, 2.6],
  ])
    s.palm(x, z, s.range(4.6, 6.2), s.range(0.18, 0.34), s.range(0, 6));
  for (const [x, z, sz] of [
    [-6, -5.5, 0.9],
    [6.5, -6, 1.2],
    [12, -7, 1.6],
    [-12, -6.8, 1.3],
  ])
    s.rock(x, z, sz, '#4A4550', 0, 0.55);
  const sail = s.movable((b) => {
    b.add(GEO.box, '#F4F7FF', { pos: [0, 0.3, 0], scale: [3, 0.6, 1] });
    b.add(GEO.cylLo, '#7A5232', { pos: [0, 2.4, 0], scale: [0.06, 4, 0.06] }, { outline: false });
    b.add(GEO.coneLo, '#FF4A1C', { pos: [0.7, 2.6, 0], scale: [1.3, 3.6, 0.06] });
  });
  sail.position.set(-40, 0.05, -44);
  s.anim((t, dt) => {
    sail.position.x += dt * 0.9;
    if (sail.position.x > 60) sail.position.x = -60;
    sail.rotation.z = Math.sin(t * 1.1) * 0.05;
  });
  jumper(s, '#7A8CA8', 6, -18, 6, 0, 1);
  jumper(s, '#7A8CA8', 8.5, -19.5, 6, 0.35, 0.85);
  jumper(s, '#7A8CA8', -10, -24, 8, 3, 1);
  s.cloud(-28, 21, -62, 3.4);
  s.cloud(14, 25, -70, 4.2);
  s.cloud(46, 19, -50, 3);
  return s.finish();
}
