import * as THREE from 'three';
import { GEO, type V3 } from './toon';
import { Scenery, type Stage } from './stage-kit';
import { bird, rod } from './stages-d';

export function paodeacucar(): Stage {
  const s = new Scenery(
    'paodeacucar',
    {
      sky: [
        [0, '#2E2470'],
        [0.2, '#6A3C9A'],
        [0.34, '#D9548A'],
        [0.43, '#FF8A5C'],
        [0.48, '#FFC27A'],
        [0.5, '#FFD8A0'],
        [1, '#FFD8A0'],
      ],
      fog: ['#FFD8A0', 30, 120],
      hemi: ['#FFE4EC', '#5A3E5E', 1.15],
      sun: ['#FFC890', 2.15, [-5, 6, 6]],
    },
    1010,
  );
  const B = -14;
  s.water('#4A5FB0', '#FFC2A0', 420, 420, [0, B, -90], [0.006, 0.01], [36, 36]);
  s.sunDisc([-62, 6, -165], 12, '#FFE9B0', '#FFC98A');

  s.mesa(0, -0.6, 11, 6.2, 14, '#7E7078', '#5E8A4A', B - 0.3);
  s.patch(s.planks('#C89A62', '#B5864F', [3.5, 1.6]), '#FFFFFF', 13, 6.6, [0, 0.01, -0.2]);
  s.b.add(GEO.box, '#6B4A2A', { pos: [0, -0.2, -0.2], scale: [13, 0.4, 6.6] });
  for (let x = -6; x <= 6.01; x += 1.5) s.b.add(GEO.cylLo, '#F4F7FF', { pos: [x, 0.55, -3.4], scale: [0.06, 1.1, 0.06] });
  s.b.add(GEO.box, '#F4F7FF', { pos: [0, 1.1, -3.4], scale: [12.2, 0.1, 0.1] });
  s.b.add(GEO.box, '#F4F7FF', { pos: [0, 0.6, -3.4], scale: [12.2, 0.06, 0.06] });
  const green = ['#4F8A4A', '#5E9A50', '#3E7A3E'];
  for (const [x, z] of [
    [-7.6, -1.5],
    [-7.2, 1.8],
    [-3.6, -4.6],
    [0.4, -4.9],
    [3.6, -4.7],
  ])
    s.bush(x, z, s.range(0.9, 1.3), green);
  s.palm(-7.2, -3.6, 4.6, 0.22, 1.2, { leaf: ['#3E8A3A', '#2E7A30'] });

  const st = s.at(7.4, -2.6, -0.15);
  s.part(st, GEO.box, '#F4F7FF', { pos: [0, 1.1, 0], scale: [2.4, 2.2, 2.6] });
  s.part(st, GEO.box, '#FF4A1C', { pos: [0, 2.35, 0], scale: [2.8, 0.3, 3] });
  s.part(st, GEO.box, '#2440FF', { pos: [-1.21, 1.4, 0], scale: [0.04, 0.5, 1.9] }, { outline: false });

  const pao = s.at(9, -54, 0, 1, B);
  s.part(pao, GEO.sphere, '#8C7F86', { rot: [0, 0, 0.06], scale: [7, 21, 8] });
  s.part(pao, GEO.sphereLo, '#7E747C', { pos: [-6, 0, 3], scale: [8, 7, 7] }, { flat: true });
  for (const p of [
    [-5, 3, 5],
    [4, 2, 6],
    [6.5, 4, 2],
    [-9, 5, 4],
  ] as V3[])
    s.part(pao, GEO.sphereLo, s.pick(green), { pos: p, scale: [3, 2.5, 2.5] });
  s.part(pao, GEO.box, '#F4F7FF', { pos: [-1.2, 21, 0], scale: [2, 0.9, 2] });

  const A: V3 = [7.4, 2.1, -3.6];
  const Z: V3 = [7.8, 7.6, -54];
  for (const dx of [-0.25, 0.25]) rod(s, [A[0] + dx, A[1], A[2]], [Z[0] + dx, Z[1], Z[2]], 0.025, '#1A1230');
  const cab = s.movable((b) => {
    b.add(GEO.cylLo, '#1A1230', { pos: [0, 0.55, 0], scale: [0.05, 1.1, 0.05] });
    b.add(GEO.box, '#FFD21F', { pos: [0, -0.5, 0], scale: [1.5, 1.1, 1.9] });
    b.add(GEO.box, '#2440FF', { pos: [0, -0.35, 0], scale: [1.56, 0.4, 1.96] }, { outline: false });
  });
  s.anim((t) => {
    const p = 1 - Math.abs(((t / 26) % 1) * 2 - 1);
    const e = p * p * (3 - 2 * p);
    cab.position.set(A[0] + (Z[0] - A[0]) * e, A[1] + (Z[1] - A[1]) * e - 1.1, A[2] + (Z[2] - A[2]) * e);
  });

  s.peak(-40, -88, 11, 26, '#4F7A55', undefined, B);
  const cr = s.at(-40, -88, 0.3, 1, B + 26);
  s.part(cr, GEO.box, '#F4F7FF', { pos: [0, 0.4, 0], scale: [0.9, 0.8, 0.9] });
  s.part(cr, GEO.box, '#F4F7FF', { pos: [0, 1.9, 0], scale: [0.6, 2.4, 0.5] });
  s.part(cr, GEO.box, '#F4F7FF', { pos: [0, 2.7, 0], scale: [3, 0.42, 0.42] });
  s.part(cr, GEO.sphereLo, '#F4F7FF', { pos: [0, 3.35, 0], scale: 0.32 });
  const hills: [number, number, number, number, string][] = [
    [-70, -70, 14, 20, '#5A7A64'],
    [-92, -105, 16, 26, '#6A8070'],
    [-18, -76, 9, 14, '#56785E'],
    [48, -96, 16, 18, '#6A7E72'],
    [72, -80, 12, 13, '#728478'],
    [30, -112, 14, 14, '#7A8A80'],
  ];
  for (const [x, z, r, h, c] of hills) s.peak(x, z, r, h, c, undefined, B);
  s.b.add(GEO.sphereLo, '#E8D5A8', { pos: [-34, B, -66], scale: [26, 1.2, 7] });
  for (let i = 0; i < 16; i++) {
    const h = s.range(1.2, 3.4);
    s.b.add(GEO.box, s.pick(['#F4F7FF', '#FFE6C8', '#FFD6E0', '#D6E4FF']), { pos: [-54 + i * 2.6 + s.range(-0.5, 0.5), B + 0.6 + h / 2, -68 + s.range(-1.5, 1.5)], scale: [s.range(1.2, 2), h, s.range(1.2, 2)] });
  }
  bird(s, [2, 9, -24], 7, 0.25, 0);
  bird(s, [-6, 10, -30], 9, 0.2, 2);
  bird(s, [12, 9.5, -34], 6, 0.3, 4);
  s.cloud(-30, 12, -84, 4.5, 0.25);
  s.cloud(26, 13, -96, 5, 0.2);
  s.cloud(64, 10, -74, 3.5, 0.3);
  return s.finish();
}

function mushroom(s: Scenery, x: number, z: number, h: number, w: number): void {
  const m = s.at(x, z, s.range(0, 6));
  s.part(m, GEO.dodeca, '#2E2836', { pos: [0, h * 0.32, 0], scale: [w * 0.42, h * 0.38, w * 0.38] }, { flat: true });
  s.part(m, GEO.dodeca, '#4A4352', { pos: [0, h * 0.78, 0], rot: [0.1, 0, -0.08], scale: [w, h * 0.26, w * 0.85] }, { flat: true });
  s.part(m, GEO.dodeca, '#3A3442', { pos: [w * 0.2, h * 0.98, -w * 0.1], scale: [w * 0.55, h * 0.14, w * 0.5] }, { flat: true });
}

function crystals(s: Scenery, x: number, z: number, n: number, size: number): void {
  const m = s.at(x, z, s.range(0, 6), size);
  for (let i = 0; i < n; i++) {
    const h = s.range(0.6, 1.2);
    s.part(m, GEO.ico, s.pick(['#B48CFF', '#E6DAFF', '#8A5CFF', '#F4F0FF']), { pos: [s.range(-0.45, 0.45), h * 0.7, s.range(-0.45, 0.45)], rot: [s.range(-0.5, 0.5), 0, s.range(-0.5, 0.5)], scale: [0.24, h, 0.24] }, { flat: true });
  }
}

function pool(s: Scenery, x: number, z: number, r: number): void {
  const mesh = new THREE.Mesh(s.own(new THREE.CircleGeometry(r, 28)), s.own(new THREE.MeshBasicMaterial({ color: '#2E4E7A' })));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.02, z);
  s.group.add(mesh);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + s.range(-0.2, 0.2);
    s.rock(x + Math.cos(a) * r, z + Math.sin(a) * r, s.range(0.25, 0.45), '#2A2432', -0.05);
  }
}

/** Carnivorous pitcher plants that only grow on the tepuis. */
function pitcher(s: Scenery, x: number, z: number): void {
  const m = s.at(x, z, s.range(0, 6));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    s.part(m, GEO.coneLo, i % 2 ? '#C8463A' : '#9ABF4A', { pos: [Math.cos(a) * 0.14, 0.28, Math.sin(a) * 0.14], rot: [Math.PI + Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3], scale: [0.13, 0.56, 0.13] });
  }
}

export function roraima(): Stage {
  const s = new Scenery(
    'roraima',
    {
      sky: [
        [0, '#1E0E46'],
        [0.22, '#4A2488'],
        [0.36, '#8E4FC0'],
        [0.45, '#4FB8B4'],
        [0.5, '#BDEBE2'],
        [1, '#BDEBE2'],
      ],
      fog: ['#BDEBE2', 32, 115],
      hemi: ['#E6E2FF', '#2E2640', 1.2],
      sun: ['#FFF2E6', 2.05, [-3, 8, 6]],
    },
    1111,
  );
  s.ground(
    s.speckles(
      '#3A3442',
      [
        ['#2A2432', 160, 5],
        ['#4E4858', 140, 4],
        ['#5E5868', 40, 2],
      ],
      18,
    ),
    '#FFFFFF',
    32,
  );
  s.ground(null, '#F2F8FF', 200, -7);
  s.sunDisc([28, 17, -160], 8, '#F6F2FF', '#C9B8F0');
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + s.range(-0.05, 0.05);
    const d = s.range(35, 50);
    s.b.add(GEO.sphereLo, '#FFFFFF', { pos: [Math.sin(a) * d, s.range(-3, -1.2), -Math.cos(a) * d], scale: [s.range(5, 9), s.range(2.4, 3.6), s.range(4, 7)] });
  }
  for (let i = 0; i < 30; i++) {
    const a = s.range(0, Math.PI * 2);
    const d = s.range(27, 31);
    s.rock(Math.sin(a) * d, -Math.cos(a) * d, s.range(1, 2.4), s.pick(['#2E2836', '#3A3442', '#46404E']));
  }
  s.mesa(-34, -78, 24, 13, 24, '#2E2836', '#3E5A44', -12);
  s.b.add(GEO.box, '#F4FBFF', { pos: [-33, 4, -67.2], scale: [1, 12, 2.4] }, { outline: false });
  s.mesa(48, -92, 20, 12, 20, '#34303E', '#44604A', -12);
  s.mesa(-78, -58, 12, 9, 14, '#3A3444', '#4A6450', -10);

  const mush: [number, number, number, number][] = [
    [-9, -9, 3, 2.4],
    [8.5, -11, 3.6, 2.8],
    [-15, -4, 2.6, 2],
    [14.5, -6, 2.4, 1.8],
    [-4, -17, 4.2, 3],
    [3, -22, 5, 3.6],
    [17, 2.5, 2, 1.6],
    [-18, 3.5, 2.2, 1.8],
    [-24, -12, 4, 3],
    [22, -15, 4.4, 3.2],
  ];
  for (const [x, z, h, w] of mush) mushroom(s, x, z, h, w);
  const cry: [number, number, number, number][] = [
    [-6.6, -3.2, 5, 1],
    [7, -4.4, 6, 1.1],
    [-11, 1.6, 4, 0.9],
    [12, 0.6, 4, 0.9],
    [-2.6, -9.5, 5, 1.4],
    [5.4, -14, 6, 1.6],
    [-13, -13, 5, 1.5],
    [10, 2.4, 3, 0.8],
    [-9.5, 2.8, 3, 0.8],
  ];
  for (const [x, z, n, sz] of cry) crystals(s, x, z, n, sz);
  pool(s, -9.5, -5, 1.7);
  pool(s, 9.8, -7.5, 2.1);
  pool(s, -14, 5, 1.4);
  pool(s, 13.5, 4.5, 1.3);
  for (const [x, z] of [
    [-7.5, 1.5],
    [7.8, 2],
    [-8.4, -1.6],
    [6.4, -2],
    [-11.5, -8],
    [11.5, -10],
  ])
    pitcher(s, x, z);

  const floaters = ([
    [-7, 3.2, -7],
    [7.5, 3.8, -9],
    [0.5, 5.4, -14],
  ] as V3[]).map((p, i) => {
    const g = s.movable((b) => {
      b.add(GEO.ico, '#C8A8FF', { scale: [0.35, 0.9, 0.35] }, { flat: true });
      b.add(GEO.ico, '#F4F0FF', { pos: [0.3, -0.2, 0.1], rot: [0, 0, 0.5], scale: [0.18, 0.5, 0.18] }, { flat: true });
    });
    g.position.set(...p);
    return { g, y: p[1], ph: i * 2.1 };
  });
  const bolt = s.movable((b) => {
    const pts: V3[] = [
      [0, 9, 0],
      [1.2, 6, 0],
      [-0.4, 4.2, 0],
      [1, 1, 0],
      [-0.2, -2, 0],
    ];
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0];
      const dy = pts[i + 1][1] - pts[i][1];
      b.add(GEO.box, '#FFF6A8', { pos: [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2, 0], rot: [0, 0, -Math.atan2(dx, dy)], scale: [0.35, Math.hypot(dx, dy) + 0.2, 0.35] }, { outline: false });
    }
  }, 0);
  bolt.position.set(36, -4, -66);
  bolt.scale.setScalar(1.6);
  bolt.visible = false;
  s.anim((t, dt) => {
    for (const f of floaters) {
      f.g.rotation.y += dt * 0.6;
      f.g.position.y = f.y + Math.sin(t * 1.1 + f.ph) * 0.35;
    }
    const k = t % 9;
    bolt.visible = k > 8 && (k < 8.12 || (k > 8.22 && k < 8.32));
    s.skyMat.color.setScalar(bolt.visible ? 1.12 : 1);
  });
  s.cloud(-40, 1, -55, 3, 0.4, 200);
  s.cloud(30, 0, -60, 3.6, 0.3, 200);
  s.cloud(5, 3, -75, 4, 0.35, 200);
  return s.finish();
}
