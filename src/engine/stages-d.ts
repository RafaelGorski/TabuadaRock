import * as THREE from 'three';
import { GEO, toon, type V3 } from './toon';
import { Scenery, type Stage } from './stage-kit';
import { butterfly } from './stages-a';

const UP = new THREE.Vector3(0, 1, 0);
const JUNGLE = [
  ['#2E7A30', '#3E8A3A', '#1F6A2A'],
  ['#4C9A44', '#2E7A30', '#3E8A3A'],
];

/** Thin cylinder between two points, merged into the static batch. */
export function rod(s: Scenery, a: V3, b: V3, r: number, color: string): void {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  s.b.add(GEO.cylLo, color, new THREE.Matrix4().compose(va.add(vb).multiplyScalar(0.5), q, new THREE.Vector3(r, len, r)));
}

/** Bird gliding in wide circles. */
export function bird(s: Scenery, c: V3, r: number, speed: number, phase: number, color = '#1A1230'): void {
  const g = s.movable((b) => {
    b.add(GEO.box, color, { pos: [0.55, 0.12, 0], rot: [0, 0, 0.35], scale: [1.1, 0.06, 0.32] }, { outline: false });
    b.add(GEO.box, color, { pos: [-0.55, 0.12, 0], rot: [0, 0, -0.35], scale: [1.1, 0.06, 0.32] }, { outline: false });
    b.add(GEO.sphereLo, color, { scale: [0.14, 0.12, 0.45] }, { outline: false });
  });
  s.anim((t) => {
    const a = phase + t * speed;
    g.position.set(c[0] + Math.cos(a) * r, c[1] + Math.sin(a * 2.3) * 0.6, c[2] + Math.sin(a) * r);
    g.rotation.set(0, -a, Math.sin(a * 3) * 0.15);
  });
}

/** Arc of an open cylinder around (0, y, cz), seen from inside. phi is measured from -Z toward +X. */
function arc(s: Scenery, mat: THREE.Material, r: number, h: number, y: number, cz: number, phi0: number, phi1: number): void {
  const geo = s.own(new THREE.CylinderGeometry(r, r, h, Math.max(6, Math.round((phi1 - phi0) * 18)), 1, true, Math.PI - phi1, phi1 - phi0));
  const m = new THREE.Mesh(geo, mat);
  m.position.set(0, y + h / 2, cz);
  s.group.add(m);
}

export function iguacu(): Stage {
  const s = new Scenery(
    'iguacu',
    {
      sky: [
        [0, '#2F86DE'],
        [0.3, '#86C4F0'],
        [0.46, '#D8F0F0'],
        [0.5, '#E6F6F1'],
        [1, '#E6F6F1'],
      ],
      fog: ['#E6F6F1', 28, 105],
      hemi: ['#F2FFF8', '#46683A', 1.2],
      sun: ['#FFF6E2', 2.0, [4, 9, 6]],
    },
    99,
  );
  const W = -1.2;
  const C = -3;
  const R = 25;
  s.water('#4E9E92', '#D8F6EE', 400, 400, [0, W, -100], [0, 0.06], [48, 48]);
  const foam = new THREE.Mesh(s.own(new THREE.RingGeometry(R - 7, R - 0.4, 48, 1, Math.PI / 2 - 1.4, 2.8)), s.own(new THREE.MeshBasicMaterial({ color: '#F4FFFC' })));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(0, W + 0.03, C);
  s.group.add(foam);

  const rockMat = s.own(toon('#5E4B3C', { flat: true }));
  rockMat.side = THREE.BackSide;
  arc(s, rockMat, R, 9.4, W, C, -1.45, 1.45);
  const ledgeMat = s.own(toon('#4A3A2E', { flat: true }));
  ledgeMat.side = THREE.BackSide;
  arc(s, ledgeMat, R - 1.2, 0.7, 2.4, C, -1.4, 1.4);
  const fall = s.own(s.streaks('#E4F6F2', ['#FFFFFF', '#BFE6E0', '#9ED3CC', '#D2F0EA'], [3, 1]));
  const fallMat = s.own(new THREE.MeshBasicMaterial({ map: fall, side: THREE.BackSide }));
  s.anim((_t, dt) => (fall.offset.y += dt * 0.6));
  const curtains: [number, number][] = [
    [-1.3, -0.92],
    [-0.8, -0.42],
    [-0.3, 0.16],
    [0.28, 0.66],
    [0.78, 1.28],
  ];
  for (const [a, b] of curtains) arc(s, fallMat, R - 0.6, 8.6, W, C, a, b);

  const onArc = (phi: number, r: number): [number, number] => [Math.sin(phi) * r, C - Math.cos(phi) * r];
  for (let phi = -1.38; phi <= 1.38; phi += 0.13) {
    const [x, z] = onArc(phi, R - 1.5);
    s.b.add(GEO.sphereLo, '#F4FFFC', { pos: [x, 3.1, z], scale: [s.range(1, 1.5), 0.5, 0.8] }, { outline: false });
  }
  for (let phi = -1.5; phi <= 1.5; phi += 0.085) {
    const [x, z] = onArc(phi, R + s.range(0.2, 2.4));
    s.b.add(GEO.sphereLo, s.pick(s.pick(JUNGLE)), { pos: [x, 8.2 + s.range(0, 1.2), z], scale: s.range(1.6, 2.6) });
  }
  for (let i = 0; i < 9; i++) {
    const [x, z] = onArc(s.range(-1.4, 1.4), R + s.range(4, 9));
    s.tree(x, z, s.range(5, 7), s.range(2, 2.6), s.pick(JUNGLE), '#5A3E2A', s.range(0, 6), 8);
  }
  for (let k = 0; k < curtains.length - 1; k++) {
    const phi = (curtains[k][1] + curtains[k + 1][0]) / 2;
    for (const y of [1.2, 5, 6.8]) {
      const [x, z] = onArc(phi + s.range(-0.03, 0.03), R - 0.5);
      s.b.add(GEO.sphereLo, s.pick(JUNGLE[0]), { pos: [x, y, z], scale: s.range(0.9, 1.3) });
    }
  }
  for (let i = 0; i < 18; i++) {
    const [x, z] = onArc(s.range(-1.35, 1.35), R - s.range(1.5, 3.5));
    s.b.add(GEO.sphereLo, '#F4FFFC', { pos: [x, W + s.range(0.2, 1), z], scale: [s.range(1.4, 2.4), s.range(0.8, 1.4), 1.2] }, { outline: false });
  }

  for (const [cx, cz] of [
    [-32, 4],
    [33, 5],
  ]) {
    s.b.add(GEO.sphereLo, '#3E8A3A', { pos: [cx, W, cz], scale: [17, 2.6, 30] });
    for (let i = 0; i < 9; i++) {
      const x = cx + s.range(-9, 9);
      const z = cz + s.range(-22, 4);
      const y = W + 2.6 * Math.sqrt(Math.max(0, 1 - ((x - cx) / 17) ** 2 - ((z - cz) / 30) ** 2)) - 0.2;
      s.tree(x, z, s.range(6, 9), s.range(2.2, 2.9), s.pick(JUNGLE), '#5A3E2A', s.range(0, 6), y);
    }
  }

  s.patch(s.planks('#C89A62', '#B5864F', [3, 1.2]), '#FFFFFF', 12, 4.8, [0, 0.01, 0.2]);
  s.patch(s.planks('#C89A62', '#B5864F', [8, 0.55]), '#FFFFFF', 30, 2.2, [21, 0.01, 1.3]);
  s.b.add(GEO.box, '#6B4A2A', { pos: [0, -0.2, 0.2], scale: [12, 0.4, 4.8] });
  s.b.add(GEO.box, '#6B4A2A', { pos: [21, -0.2, 1.3], scale: [30, 0.4, 2.2] });
  for (let x = -5.6; x <= 34; x += 2.8) {
    for (const z of x > 6 ? [0.4, 2.2] : [-2, 2.4]) s.b.add(GEO.cylLo, '#4A3A2A', { pos: [x, (W - 0.4) / 2, z], scale: [0.12, -W, 0.12] });
  }
  for (let x = -5.8; x <= 5.8; x += 1.45) s.b.add(GEO.cylLo, '#6B4A2A', { pos: [x, 0.5, -2.1], scale: [0.06, 1, 0.06] });
  s.b.add(GEO.box, '#C89A62', { pos: [0, 1.02, -2.1], scale: [11.8, 0.1, 0.12] });
  for (const x of [-5.9, 5.9]) {
    for (let z = -2.1; z <= (x < 0 ? 2.5 : 0); z += 1.5) s.b.add(GEO.cylLo, '#6B4A2A', { pos: [x, 0.5, z], scale: [0.06, 1, 0.06] });
    s.b.add(GEO.box, '#C89A62', x < 0 ? { pos: [x, 1.02, 0.2], scale: [0.12, 0.1, 4.6] } : { pos: [x, 1.02, -1.35], scale: [0.12, 0.1, 1.6] });
  }

  const colors = ['#FF4A1C', '#FF9F1C', '#FFD21F', '#2DBE4E', '#1FA2FF', '#7A4CFF'];
  colors.forEach((c, i) => {
    const m = new THREE.Mesh(s.own(new THREE.TorusGeometry(9.5 - i * 0.3, 0.15, 6, 64, Math.PI)), s.own(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, depthWrite: false })));
    m.position.set(6, W - 1.5, -16);
    s.group.add(m);
  });
  const puffs = [0, 1, 2].map((i) => {
    const g = s.movable((b) => b.add(GEO.sphereLo, '#F4FFFC', { scale: [1.6, 1.1, 1.2] }, { outline: false }));
    const [x, z] = onArc(-0.9 + i * 0.9, R - 3);
    g.position.set(x, W, z);
    return g;
  });
  s.anim((t) =>
    puffs.forEach((g, i) => {
      const p = (t * 0.12 + i / 3) % 1;
      g.position.y = W + p * 6;
      g.scale.setScalar(0.15 + Math.sin(p * Math.PI) * 1.1);
    }),
  );
  bird(s, [0, 5, -18], 7, 0.35, 0, '#2A2236');
  bird(s, [-4, 6, -20], 9, 0.28, 2.5, '#2A2236');
  bird(s, [5, 4.5, -15], 5, 0.42, 4, '#2A2236');
  butterfly(s, -6.6, 1.7, -1.4, '#FF9F1C', 0.5);
  butterfly(s, 7.2, 2, -1.8, '#1FA2FF', 2);
  return s.finish();
}
