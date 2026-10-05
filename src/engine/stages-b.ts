import { GEO, torus } from './toon';
import { Scenery, type Stage } from './stage-kit';

function termite(s: Scenery, x: number, z: number, h: number): void {
  const m = s.at(x, z, s.range(0, 6));
  s.part(m, GEO.sphereLo, '#B5542E', { pos: [0, h * 0.18, 0], scale: [h * 0.42, h * 0.3, h * 0.42] }, { flat: true });
  s.part(m, GEO.coneLo, '#B5542E', { pos: [0, h * 0.55, 0], scale: [h * 0.32, h * 0.9, h * 0.32] }, { flat: true });
  s.part(m, GEO.coneLo, '#A34A26', { pos: [h * 0.2, h * 0.42, 0.05], scale: [h * 0.16, h * 0.5, h * 0.16] }, { flat: true });
}

export function cerrado(): Stage {
  const s = new Scenery(
    'cerrado',
    {
      sky: [
        [0, '#2E7BEA'],
        [0.3, '#7DB9F0'],
        [0.47, '#F7E2B5'],
        [1, '#F7E2B5'],
      ],
      fog: ['#F7E2B5', 32, 105],
      hemi: ['#FFF3D9', '#B5542E', 1.15],
      sun: ['#FFE8B8', 2.15, [5, 8, 4]],
    },
    44,
  );
  s.ground(
    s.speckles(
      '#C8743E',
      [
        ['#B5622F', 120, 7],
        ['#D88A50', 90, 5],
        ['#E3B55A', 200, 3],
      ],
      22,
    ),
  );
  for (let i = 0; i < 80; i++) {
    const x = s.range(-30, 30);
    const z = s.range(-30, 3);
    if (Math.abs(x) < 5 && z > -3.5) continue;
    s.tuft(x, z, s.range(0.8, 1.6), s.pick(['#E3B55A', '#D4A040', '#C99A3A']));
  }
  for (const [x, z] of [
    [-8, -7],
    [6.5, -9],
    [-14, -14],
    [13, -16],
    [-3, -18],
    [20, -8],
    [-21, -6],
    [10, 1.5],
  ])
    s.twisted(x, z, s.range(2.4, 3.4), s.range(0, 6));
  for (const [x, z, h] of [
    [-5.2, -4.5, 1.6],
    [9, -5, 2.2],
    [-12, -9, 1.3],
    [16, -12, 1.8],
    [2, -12, 1.2],
  ])
    termite(s, x, z, h);
  for (const [x, z] of [
    [-17, -22],
    [11, -26],
    [24, -20],
  ])
    s.palm(x, z, s.range(6, 7.5), 0.02, s.range(0, 6), { fronds: 11, leaf: ['#5E9A3A', '#4C8A2E'], nuts: false, droop: 0.3, bark: '#6B5A48' });
  for (const [x, z, w, d, h] of [
    [-42, -70, 30, 10, 13],
    [18, -82, 40, 12, 16],
    [60, -62, 20, 9, 10],
    [-75, -50, 18, 8, 9],
  ])
    s.mesa(x, z, w, d, h, '#B0684A', '#6E8A4A');
  s.cloud(-24, 20, -55, 3);
  s.cloud(20, 24, -64, 3.6);
  s.cloud(48, 18, -40, 2.6);
  return s.finish();
}

function tuiuiu(s: Scenery, x: number, z: number, ry: number): void {
  const m = s.at(x, z, ry, 0.9);
  for (const dx of [0.08, -0.08]) s.part(m, GEO.cylLo, '#1A1230', { pos: [dx, 0.55, 0], scale: [0.03, 1.1, 0.03] }, { outline: false });
  s.part(m, GEO.sphereLo, '#F4F7FF', { pos: [0, 1.35, -0.1], rot: [-0.3, 0, 0], scale: [0.32, 0.34, 0.55] });
  s.part(m, GEO.cylLo, '#1A1230', { pos: [0, 1.85, 0.2], rot: [0.25, 0, 0], scale: [0.09, 0.7, 0.09] });
  s.part(m, GEO.sphereLo, '#FF3B4E', { pos: [0, 1.62, 0.15], scale: [0.14, 0.1, 0.14] });
  s.part(m, GEO.sphereLo, '#1A1230', { pos: [0, 2.22, 0.3], scale: 0.13 });
  s.part(m, GEO.coneLo, '#2A2438', { pos: [0, 2.13, 0.62], rot: [Math.PI / 2 + 0.25, 0, 0], scale: [0.06, 0.55, 0.06] });
}

export function pantanal(): Stage {
  const s = new Scenery(
    'pantanal',
    {
      sky: [
        [0, '#3C7BE0'],
        [0.3, '#8FC1EE'],
        [0.45, '#FFE0A8'],
        [0.5, '#FFD99A'],
        [1, '#FFD99A'],
      ],
      fog: ['#FFD99A', 30, 110],
      hemi: ['#FFF0D0', '#5E8A3A', 1.15],
      sun: ['#FFE2A8', 2.1, [-5, 7, 4]],
    },
    55,
  );
  s.water('#4F8C86', '#BFE8D8', 260, 260, [0, -0.12, 0], [0.006, 0.004], [30, 30]);
  s.ground(
    s.speckles(
      '#6FA845',
      [
        ['#5E9A3A', 160, 6],
        ['#86BC55', 120, 4],
      ],
      4,
    ),
    '#FFFFFF',
    6.8,
  );
  s.b.add(torus(6.8, 0.16), '#7A5A3A', { pos: [0, -0.05, 0], rot: [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 46; i++) {
    const a = s.range(0, Math.PI * 2);
    const r = s.range(5.6, 6.9);
    const z = Math.cos(a) * r;
    if (z > 2) continue;
    s.tuft(Math.sin(a) * r, z, s.range(1, 1.8), s.pick(['#5E9A3A', '#86BC55', '#4C8A2E']));
  }
  for (const [x, z, pink] of [
    [-12, -12, 1],
    [9, -15, 0],
    [-3, -24, 0],
    [20, -22, 1],
    [-22, -20, 0],
    [14, -6, 1],
  ]) {
    const r = s.range(2.4, 3.4);
    s.b.add(GEO.cylLo, '#6FA845', { pos: [x, -0.1, z], scale: [r + 1, 0.25, r + 0.6] });
    const flowers = pink ? ['#FF6FB5', '#FF8FC8', '#E0559A'] : ['#FFD21F', '#FFE36A', '#F2B705'];
    s.tree(x, z, s.range(5, 6.5), r, flowers, '#6B4A32', s.range(0, 6));
  }
  for (let i = 0; i < 22; i++) {
    const x = s.range(-20, 20);
    const z = s.range(-20, 6);
    if (Math.hypot(x, z) < 8) continue;
    const r = s.range(0.6, 1.1);
    s.b.add(GEO.cylLo, '#3E9A3A', { pos: [x, -0.08, z], scale: [r, 0.06, r] }, { outline: false });
    s.b.add(torus(r, 0.05), '#2E7A2E', { pos: [x, -0.05, z], rot: [Math.PI / 2, 0, 0] }, { outline: false });
    if (s.rnd() < 0.3) s.b.add(GEO.sphereLo, '#FF8FC8', { pos: [x + r * 0.3, 0.02, z], scale: [0.2, 0.14, 0.2] });
  }
  tuiuiu(s, -4.6, -4.2, 0.5);
  const cm = s.at(5.8, -9.5, -0.5);
  s.part(cm, GEO.sphereLo, '#4A5A3A', { pos: [0, -0.1, 0.2], scale: [0.35, 0.16, 1.1] }, { flat: true });
  for (const sx of [-0.18, 0.18]) {
    s.part(cm, GEO.sphereLo, '#4A5A3A', { pos: [sx, 0, -0.45], scale: 0.14 });
    s.part(cm, GEO.sphereLo, '#FFD21F', { pos: [sx, 0.06, -0.36], scale: [0.07, 0.06, 0.05] }, { outline: false });
  }
  for (let i = 0; i < 16; i++) {
    const x = -70 + i * 9.5 + s.range(-3, 3);
    s.tree(x, s.range(-62, -46), s.range(5, 8), s.range(2.4, 3.4), ['#4C8A2E', '#3E7A26', '#5E9A3A'], '#5A3E2A', s.range(0, 6));
  }
  s.cloud(-26, 19, -52, 3.2);
  s.cloud(16, 23, -66, 4);
  s.cloud(44, 17, -46, 2.8);
  return s.finish();
}

export function caatinga(): Stage {
  const s = new Scenery(
    'caatinga',
    {
      sky: [
        [0, '#3A8BF0'],
        [0.28, '#8EC5F2'],
        [0.45, '#FFE7A6'],
        [0.5, '#FFD98A'],
        [1, '#FFD98A'],
      ],
      fog: ['#FFD98A', 30, 100],
      hemi: ['#FFF4D6', '#C98A4E', 1.1],
      sun: ['#FFF0C8', 2.25, [6, 9, 3]],
    },
    66,
  );
  s.ground(s.cracks('#D9A066', '#9A6436', 12));
  s.sunDisc([34, 62, -120], 9, '#FFF8DC', '#FFEBB0');
  for (const [x, z, h, arms] of [
    [-7.5, -5, 3.6, 2],
    [8, -6.5, 4.2, 3],
    [-13, -11, 4.8, 3],
    [14, -13, 3.2, 2],
    [-3, -14, 3, 1],
    [20, -5, 3.8, 2],
    [-19, -3, 4.2, 2],
  ])
    s.cactus(x, z, h, arms, s.range(0, 6));
  for (let i = 0; i < 9; i++) {
    const x = s.range(-18, 18);
    const z = s.range(-12, -3.5);
    for (let k = 0; k < 3; k++) s.cactus(x + s.range(-0.5, 0.5), z + s.range(-0.5, 0.5), s.range(0.6, 1.2), 0, 0, '#5E9A55');
  }
  for (const [x, z, sz] of [
    [-10, -6, 1.6],
    [-11.5, -7.5, 1.1],
    [11, -9, 2.2],
    [4, -10, 1],
    [-17, -16, 2.6],
    [17, -18, 3],
  ])
    s.rock(x, z, sz, s.pick(['#B8A48A', '#A08C72', '#C4B095']), 0, 0.6);
  for (const [x, z] of [
    [-5, -11],
    [6, -16],
    [-22, -12],
  ])
    s.twisted(x, z, s.range(2.2, 3), s.range(0, 6), '#A9B07E');
  const hm = s.at(-12.5, -12, 0.35);
  s.part(hm, GEO.box, '#E8C9A0', { pos: [0, 1.1, 0], scale: [4, 2.2, 3] });
  for (const side of [1, -1]) s.part(hm, GEO.box, '#B5542E', { pos: [0, 2.55, side * 0.8], rot: [side * 0.45, 0, 0], scale: [4.4, 0.18, 1.9] });
  s.part(hm, GEO.box, '#2440FF', { pos: [0.6, 0.8, 1.52], scale: [0.8, 1.6, 0.08] }, { outline: false });
  s.part(hm, GEO.box, '#19D3A0', { pos: [-1.1, 1.3, 1.52], scale: [0.7, 0.6, 0.08] }, { outline: false });
  const wx = 13;
  const wz = -14;
  for (const [dx, dz] of [
    [-0.6, -0.6],
    [0.6, -0.6],
    [-0.6, 0.6],
    [0.6, 0.6],
  ]) {
    s.b.add(GEO.cylLo, '#6E6A7A', { pos: [wx + dx * 0.5, 3, wz + dz * 0.5], rot: [dz * 0.1, 0, -dx * 0.1], scale: [0.06, 6, 0.06] }, { outline: false });
  }
  const fan = s.movable((fb) => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      fb.add(GEO.box, i % 2 ? '#F4F7FF' : '#FF4A1C', { pos: [-Math.sin(a) * 0.85, Math.cos(a) * 0.85, 0], rot: [0, 0, a], scale: [0.26, 1.3, 0.04] });
    }
    fb.add(GEO.sphereLo, '#6E6A7A', { scale: 0.22 });
  });
  fan.position.set(wx, 6.3, wz + 0.4);
  s.anim((_t, dt) => (fan.rotation.z -= dt * 1.6));
  for (const [x, z, w, d, h] of [
    [-40, -72, 34, 10, 10],
    [24, -84, 44, 12, 13],
    [66, -60, 22, 9, 8],
  ])
    s.mesa(x, z, w, d, h, '#B07A52', '#8A9A5A');
  return s.finish();
}
