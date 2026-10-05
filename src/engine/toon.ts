import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const INK = '#1A1230';

let gradient: THREE.DataTexture | null = null;

/** Three hard light steps, the cel look. */
export function gradientMap(): THREE.DataTexture {
  if (gradient) return gradient;
  gradient = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

export function toon(color: THREE.ColorRepresentation, opts: { flat?: boolean; map?: THREE.Texture } = {}): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: gradientMap(),
    map: opts.map ?? null,
  });
  // The toon shader honors FLAT_SHADED even though the typings omit the flag.
  (m as unknown as { flatShading: boolean }).flatShading = !!opts.flat;
  return m;
}

const shared = new Map<string, THREE.MeshToonMaterial>();

/** Shared material for static scenery. Never change these at runtime. */
export function sharedToon(color: string, flat = false): THREE.MeshToonMaterial {
  const key = `${color}|${flat ? 1 : 0}`;
  let m = shared.get(key);
  if (!m) {
    m = toon(color, { flat });
    shared.set(key, m);
  }
  return m;
}

/**
 * Inverted hull outline. Vertices are pushed along the normal in view space,
 * so the line keeps the same weight no matter how the part is scaled.
 */
export function outlineMaterial(thickness: number, color: THREE.ColorRepresentation = INK): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  const uniform = { value: thickness };
  mat.userData.uOutline = uniform;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = uniform;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uOutline;\nvoid main() {')
      .replace(
        '#include <project_vertex>',
        `vec3 oN = normal;
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
  oN = mat3( instanceMatrix ) * oN;
#endif
mvPosition = modelViewMatrix * mvPosition;
mvPosition.xyz += normalize( normalMatrix * oN ) * uOutline;
gl_Position = projectionMatrix * mvPosition;`,
      );
  };
  mat.customProgramCacheKey = () => 'ink-outline';
  return mat;
}

const outlineCache = new Map<number, THREE.MeshBasicMaterial>();

export function sharedOutline(thickness: number): THREE.MeshBasicMaterial {
  const key = Math.round(thickness * 1000);
  let m = outlineCache.get(key);
  if (!m) {
    m = outlineMaterial(thickness);
    outlineCache.set(key, m);
  }
  return m;
}

const hullCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

/** Position-only copy with welded vertices and smooth normals, so hard edges do not crack the outline. */
export function hullGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const cached = hullCache.get(geo);
  if (cached) return cached;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', geo.getAttribute('position').clone());
  if (geo.index) g.setIndex(geo.index.clone());
  const welded = mergeVertices(g, 1e-4);
  welded.computeVertexNormals();
  hullCache.set(geo, welded);
  return welded;
}

export function withOutline(mesh: THREE.Mesh, thickness: number): THREE.Mesh {
  const hull = new THREE.Mesh(hullGeometry(mesh.geometry), sharedOutline(thickness));
  hull.name = 'outline';
  hull.raycast = () => {};
  mesh.add(hull);
  return mesh;
}

/* Shared primitive geometry. Parts get their shape from scale. */
export const GEO = {
  sphere: new THREE.SphereGeometry(1, 24, 16),
  sphereLo: new THREE.SphereGeometry(1, 12, 8),
  cone: new THREE.ConeGeometry(1, 1, 16),
  coneLo: new THREE.ConeGeometry(1, 1, 7),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, 8),
  box: new THREE.BoxGeometry(1, 1, 1),
  ico: new THREE.IcosahedronGeometry(1, 0),
  dodeca: new THREE.DodecahedronGeometry(1, 0),
  tetra: new THREE.TetrahedronGeometry(1, 0),
};

const capsules = new Map<string, THREE.CapsuleGeometry>();
export function capsule(radius: number, length: number): THREE.CapsuleGeometry {
  const key = `${radius.toFixed(3)}|${length.toFixed(3)}`;
  let g = capsules.get(key);
  if (!g) {
    g = new THREE.CapsuleGeometry(radius, length, 6, 14);
    capsules.set(key, g);
  }
  return g;
}

const tori = new Map<string, THREE.TorusGeometry>();
export function torus(radius: number, tube: number, arc = Math.PI * 2): THREE.TorusGeometry {
  const key = `${radius.toFixed(3)}|${tube.toFixed(3)}|${arc.toFixed(3)}`;
  let g = tori.get(key);
  if (!g) {
    g = new THREE.TorusGeometry(radius, tube, 10, 32, arc);
    tori.set(key, g);
  }
  return g;
}

export type V3 = [number, number, number];

export interface Placement {
  pos?: V3;
  rot?: V3;
  scale?: V3 | number;
}

export function place<T extends THREE.Object3D>(obj: T, p: Placement = {}): T {
  if (p.pos) obj.position.set(...p.pos);
  if (p.rot) obj.rotation.set(...p.rot);
  if (p.scale !== undefined) {
    if (typeof p.scale === 'number') obj.scale.setScalar(p.scale);
    else obj.scale.set(...p.scale);
  }
  return obj;
}

function stripToPosNormal(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const src = geo.index ? geo.toNonIndexed() : geo.clone();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', src.getAttribute('position'));
  if (src.getAttribute('normal')) g.setAttribute('normal', src.getAttribute('normal'));
  else g.computeVertexNormals();
  return g;
}

/**
 * Collects static scenery and merges it into one mesh per color plus one outline mesh,
 * so a whole stage costs a handful of draw calls.
 */
export class StaticBatch {
  private byMat = new Map<string, THREE.BufferGeometry[]>();
  private hulls: THREE.BufferGeometry[] = [];
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private s = new THREE.Vector3();
  private v = new THREE.Vector3();

  constructor(private outline = 0.05) {}

  matrixOf(p: Placement, parent?: THREE.Matrix4): THREE.Matrix4 {
    this.v.set(...(p.pos ?? [0, 0, 0]));
    this.e.set(...(p.rot ?? [0, 0, 0]));
    this.q.setFromEuler(this.e);
    if (p.scale === undefined) this.s.set(1, 1, 1);
    else if (typeof p.scale === 'number') this.s.setScalar(p.scale);
    else this.s.set(...p.scale);
    const m = new THREE.Matrix4().compose(this.v, this.q, this.s);
    return parent ? new THREE.Matrix4().multiplyMatrices(parent, m) : m;
  }

  add(geo: THREE.BufferGeometry, color: string, p: Placement | THREE.Matrix4, opts: { outline?: boolean; flat?: boolean } = {}): void {
    const matrix = p instanceof THREE.Matrix4 ? p : this.matrixOf(p);
    const g = stripToPosNormal(geo);
    g.applyMatrix4(matrix);
    const key = `${color}|${opts.flat ? 1 : 0}`;
    const list = this.byMat.get(key) ?? [];
    list.push(g);
    this.byMat.set(key, list);
    if (opts.outline !== false) {
      const h = stripToPosNormal(hullGeometry(geo));
      h.applyMatrix4(matrix);
      this.hulls.push(h);
    }
  }

  build(): THREE.Group {
    const group = new THREE.Group();
    for (const [key, list] of this.byMat) {
      const [color, flat] = key.split('|');
      const merged = mergeGeometries(list, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, sharedToon(color, flat === '1'));
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      for (const g of list) g.dispose();
    }
    if (this.hulls.length) {
      const merged = mergeGeometries(this.hulls, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, sharedOutline(this.outline));
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
      }
      for (const g of this.hulls) g.dispose();
    }
    this.byMat.clear();
    this.hulls = [];
    return group;
  }
}

export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

export function skyTexture(stops: [number, string][]): THREE.CanvasTexture {
  return canvasTexture(4, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    for (const [at, color] of stops) g.addColorStop(at, color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  });
}
