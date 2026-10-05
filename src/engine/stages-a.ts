import * as THREE from 'three';
import { GEO, sharedToon, torus } from './toon';
import { Scenery, type Stage } from './stage-kit';

const PASTEL = ['#F4E3C1', '#E9B9A0', '#BFD7EA', '#F6F0E6', '#D9C6E8', '#F2D0A4'];

export function bromelia(s: Scenery, x: number, z: number, center = '#FF3B4E'): void {
  const m = s.at(x, z, s.range(0, 6), s.range(0.8, 1.1));
  for (let i = 0; i < 6; i++) {
    const lm = s.b.matrixOf({ rot: [0, (i / 6) * Math.PI * 2, 0] }, m);
    s.part(lm, GEO.coneLo, i % 2 ? '#3E9A3A' : '#2E8B3E', { pos: [0, 0.3, 0.28], rot: [0.75, 0, 0], scale: [0.12, 0.8, 0.05] });
  }
  s.part(m, GEO.coneLo, center, { pos: [0, 0.35, 0], scale: [0.14, 0.7, 0.14] });
}

/** Blue morpho butterfly fluttering around a point. */
export function butterfly(s: Scenery, x: number, y: number, z: number, color: string, phase: number): void {
  const g = new THREE.Group();
  const pivots: THREE.Group[] = [];
  for (const side of [1, -1]) {
    const pivot = new THREE.Group();
    const wing = new THREE.Mesh(GEO.sphereLo, sharedToon(color));
    wing.scale.set(0.17, 0.02, 0.13);
    wing.position.x = side * 0.16;
    pivot.add(wing);
    g.add(pivot);
    pivots.push(pivot);
  }
  const body = new THREE.Mesh(GEO.sphereLo, sharedToon('#1A1230'));
  body.scale.set(0.035, 0.035, 0.14);
  g.add(body);
  s.group.add(g);
  s.anim((t) => {
    const k = t * 0.6 + phase;
    g.position.set(x + Math.sin(k) * 1.6, y + Math.sin(k * 2.3) * 0.4, z + Math.cos(k * 0.8) * 1.1);
    g.rotation.y = k + Math.PI / 2;
    const flap = Math.sin(t * 17 + phase) * 0.9;
    pivots[0].rotation.z = flap;
    pivots[1].rotation.z = -flap;
  });
}

export function treino(): Stage {
  const s = new Scenery(
    'treino',
    {
      sky: [
        [0, '#0F1F99'],
        [0.5, '#2440FF'],
        [1, '#2440FF'],
      ],
      fog: ['#2440FF', 40, 140],
      hemi: ['#FFFFFF', '#FFE9A0', 1.25],
      sun: ['#FFFFFF', 2.0, [3, 8, 5]],
    },
    11,
  );
  s.ground(s.checker('#2DBE4E', '#FFD21F', 27), '#FFFFFF', 40);
  const b = s.b;
  b.add(GEO.box, '#2440FF', { pos: [0, 4.5, -7.3], scale: [34, 9, 0.6] });
  b.add(GEO.box, '#FFD21F', { pos: [0, 0.35, -6.97], scale: [34, 0.7, 0.1] }, { outline: false });
  b.add(GEO.box, '#FF4A1C', { pos: [0, 8.2, -6.97], scale: [34, 0.35, 0.1] }, { outline: false });
  for (const sx of [-1, 1]) b.add(GEO.box, '#1B33D6', { pos: [sx * 13, 4.5, -0.5], scale: [0.6, 9, 13.6] });
  for (const r of [Math.PI / 4, -Math.PI / 4]) b.add(GEO.box, '#FFD21F', { pos: [0, 4.7, -6.85], rot: [0, 0, r], scale: [0.85, 3.6, 0.25] });
  const badges = ['#FFE014', '#1FA2FF', '#FF5A1F', '#2DBE4E', '#B08A5F', '#7FD6EA', '#FF6FB5', '#19D3A0'];
  badges.forEach((c, i) => {
    const x = (i < 4 ? -1 : 1) * (3.2 + (i % 4) * 1.35);
    b.add(GEO.cyl, '#F4F7FF', { pos: [x, 4.7, -6.95], rot: [Math.PI / 2, 0, 0], scale: [0.58, 0.12, 0.58] });
    b.add(GEO.cyl, c, { pos: [x, 4.7, -6.86], rot: [Math.PI / 2, 0, 0], scale: [0.44, 0.12, 0.44] }, { outline: false });
  });
  for (const [x, z] of [
    [-6.4, -3.6],
    [6.6, -4.2],
  ]) {
    b.add(GEO.cyl, '#FF4A1C', { pos: [x, 2.4, z], scale: [0.42, 1.9, 0.42] });
    b.add(GEO.cyl, '#1A1230', { pos: [x, 2.0, z], scale: [0.44, 0.22, 0.44] }, { outline: false });
    b.add(GEO.sphere, '#FF4A1C', { pos: [x, 3.35, z], scale: [0.42, 0.16, 0.42] });
    b.add(GEO.cylLo, '#1A1230', { pos: [x, 6.6, z], scale: [0.035, 6.5, 0.035] }, { outline: false });
  }
  for (let i = 0; i < 3; i++) b.add(torus(0.55, 0.22), '#2E2A3A', { pos: [-9.2, 0.22 + i * 0.42, -4.8], rot: [Math.PI / 2, 0, i * 0.4] });
  b.add(torus(0.55, 0.22), '#2E2A3A', { pos: [-8.1, 0.6, -5.6], rot: [0.2, 0, 1.3] });
  b.add(GEO.box, '#B97A45', { pos: [8.8, 0.9, -5.6], scale: [3.2, 0.2, 0.8] });
  for (const dx of [-1.3, 1.3]) b.add(GEO.box, '#7A5232', { pos: [8.8 + dx, 0.45, -5.6], scale: [0.18, 0.9, 0.6] });
  for (const [x, z] of [
    [-4.2, -2.4],
    [4.4, -2.8],
    [-3.2, 2.6],
    [3.4, 2.8],
  ]) {
    b.add(GEO.cone, '#FF4A1C', { pos: [x, 0.3, z], scale: [0.2, 0.6, 0.2] });
    b.add(GEO.cyl, '#F4F7FF', { pos: [x, 0.3, z], scale: [0.13, 0.08, 0.13] }, { outline: false });
  }
  return s.finish();
}

export function copacabana(): Stage {
  const s = new Scenery(
    'copacabana',
    {
      sky: [
        [0, '#2A6BFF'],
        [0.3, '#5FA8FF'],
        [0.46, '#BFE3FF'],
        [0.5, '#DDF2FF'],
        [1, '#DDF2FF'],
      ],
      fog: ['#DDF2FF', 30, 100],
      hemi: ['#EAF6FF', '#F1DDB0', 1.15],
      sun: ['#FFF4D6', 2.1, [4, 9, 6]],
    },
    22,
  );
  s.ground(
    s.speckles(
      '#F1DDB0',
      [
        ['#E2C68E', 160, 3],
        ['#FFF3D6', 120, 2],
      ],
      26,
    ),
  );
  s.patch(s.calcadao([24, 2.4]), '#FFFFFF', 70, 7, [0, 0.01, 0.6]);
  s.b.add(GEO.box, '#F4F1E8', { pos: [0, 0.08, -2.95], scale: [70, 0.16, 0.25] }, { outline: false });
  s.water('#1FA2FF', '#C6F1FF', 320, 200, [0, 0.04, -116], [0.004, 0.02]);
  const foam = new THREE.Mesh(s.own(new THREE.PlaneGeometry(320, 1.4)), s.own(new THREE.MeshBasicMaterial({ color: '#FFFFFF' })));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(0, 0.06, -16.2);
  s.group.add(foam);
  s.anim((t) => (foam.position.z = -16.2 + Math.sin(t * 0.9) * 0.6));
  for (const [x, z] of [
    [-11, -4.2],
    [-6.6, -4.6],
    [7, -4.4],
    [11.5, -4.0],
    [-17, -4.4],
    [17.5, -4.6],
    [-8.8, 2.6],
    [9.2, 3],
  ])
    s.palm(x, z, s.range(4.6, 6), s.range(0.15, 0.32), s.range(0, 6));
  const umbrellas = ['#FF4A1C', '#FFD21F', '#2440FF', '#19D3A0', '#FF6FB5'];
  for (let i = 0; i < 8; i++) {
    const x = -18 + i * 5 + s.range(-1, 1);
    const z = s.range(-12, -7);
    const m = s.at(x, z, s.range(0, 6), 1, 0);
    s.part(m, GEO.cylLo, '#F4F1E8', { pos: [0, 1.05, 0], rot: [0.12, 0, 0], scale: [0.045, 2.1, 0.045] }, { outline: false });
    s.part(m, GEO.coneLo, umbrellas[i % umbrellas.length], { pos: [0, 2.2, 0.12], rot: [0.12, 0, 0], scale: [1.25, 0.5, 1.25] });
  }
  const km = s.at(-10.5, 0.4, 0.3);
  s.part(km, GEO.box, '#F4F7FF', { pos: [0, 1, 0], scale: [2.2, 2, 2] });
  s.part(km, GEO.box, '#2DBE4E', { pos: [0, 1.15, 1.02], scale: [1.6, 0.7, 0.05] }, { outline: false });
  s.part(km, GEO.coneLo, '#2DBE4E', { pos: [0, 2.45, 0], scale: [2, 0.9, 2] });
  for (let i = 0; i < 9; i++) {
    const h = s.range(8, 16);
    const w = s.range(4.5, 6.5);
    s.b.add(GEO.box, PASTEL[i % PASTEL.length], { pos: [-25 - i * 1.6, h / 2, 6 - i * 6.2], rot: [0, 0.25, 0], scale: [w, h, 5] });
  }
  s.peak(48, -70, 18, 24, '#3E7A4A');
  s.peak(-62, -88, 22, 30, '#4F8A52');
  s.peak(30, -95, 26, 20, '#5E9A5A');
  s.cloud(-30, 22, -60, 3);
  s.cloud(10, 26, -72, 4);
  s.cloud(42, 20, -55, 3);
  s.cloud(-6, 17, -48, 2.4);
  return s.finish();
}

export function mata(): Stage {
  const s = new Scenery(
    'mata',
    {
      sky: [
        [0, '#4FA9E0'],
        [0.32, '#9ED6E8'],
        [0.5, '#D3EEDC'],
        [1, '#D3EEDC'],
      ],
      fog: ['#D3EEDC', 16, 72],
      hemi: ['#E6FFF0', '#3E6A32', 1.2],
      sun: ['#FFF6DA', 2.0, [-3, 9, 5]],
    },
    33,
  );
  s.ground(
    s.speckles(
      '#5E9A45',
      [
        ['#4C8A3A', 140, 7],
        ['#78B055', 90, 4],
        ['#8A6A45', 30, 4],
      ],
      22,
    ),
  );
  s.water('#3FA7C9', '#C6F1FF', 80, 1.8, [0, 0.03, -5.6], [0.12, 0], [20, 0.5]);
  for (const x of [-7, -2.5, 3.5, 8]) s.rock(x + s.range(-0.6, 0.6), -5.6 + s.range(-0.5, 0.5), s.range(0.35, 0.55), '#8A8F7E');
  const leaves = [
    ['#2E8B3E', '#1F7A35', '#3FA34D'],
    ['#3FA34D', '#2E8B3E', '#57B85A'],
    ['#1F7A35', '#2E8B3E', '#196B2E'],
  ];
  for (const [x, z] of [
    [-9, -9],
    [-4.5, -12],
    [1, -14],
    [6, -11],
    [10.5, -8.5],
    [-14, -4],
    [14, -3.5],
    [-18, -13],
    [18, -14],
    [-11, -20],
    [12, -21],
    [3, -24],
    [-6, -26],
  ])
    s.tree(x, z, s.range(6, 9), s.range(1.8, 2.8), s.pick(leaves), '#6B4A32', s.range(0, 6));
  for (const [x, z] of [
    [-6.5, -3.2],
    [7, -3],
    [-11, 0.5],
    [11.5, 1.2],
  ])
    s.palm(x, z, s.range(2.4, 3.2), s.range(-0.05, 0.1), s.range(0, 6), { fronds: 9, leaf: ['#3FA34D', '#2E8B3E'], bark: '#4A3A2A', nuts: false, droop: 0.85, size: 0.9 });
  for (const [x, z] of [
    [-3.8, -2.6],
    [4.2, -2.2],
    [-8.4, -1.4],
    [9.2, -1],
  ])
    bromelia(s, x, z, s.pick(['#FF3B4E', '#FF9F1C', '#FF6FB5']));
  for (let i = 0; i < 26; i++) {
    const x = s.range(-22, 22);
    const z = s.range(-16, 3);
    if (Math.abs(x) < 6 && z > -4) continue;
    s.bush(x, z, s.range(0.6, 1.1), s.pick(leaves));
  }
  for (const [x, z, r, h, c] of [
    [-40, -60, 24, 18, '#3F8A4A'],
    [5, -75, 30, 24, '#2F7A40'],
    [45, -58, 22, 16, '#3F8A4A'],
  ] as const)
    s.part(s.at(x, z), GEO.sphereLo, c, { scale: [r, h, r * 0.7] });
  butterfly(s, -3, 2.4, -3, '#2F6BFF', 0);
  butterfly(s, 4, 2.9, -4, '#2F6BFF', 2.1);
  butterfly(s, 0.5, 3.4, -7, '#FFD21F', 4.2);
  return s.finish();
}
