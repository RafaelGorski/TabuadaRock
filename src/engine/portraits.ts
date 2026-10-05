import * as THREE from 'three';
import { makeActor, type ActorId } from './actors';

/** sRGB encode table, since render targets come back in linear light. */
const TO_SRGB = new Uint8ClampedArray(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  TO_SRGB[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
}

interface Job {
  id: ActorId;
  resolve: (url: string) => void;
}

/**
 * Renders a still of each creature for the menus, off screen, one per frame.
 * Rendered at twice the size and scaled down for clean edges.
 */
export class Portraits {
  private cache = new Map<ActorId, Promise<string>>();
  private queue: Job[] = [];
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  private rt: THREE.WebGLRenderTarget | null = null;
  private pixels: Uint8Array;
  private big = document.createElement('canvas');
  private out = document.createElement('canvas');
  private keepColor = new THREE.Color();
  private readonly ss: number;

  constructor(
    private renderer: THREE.WebGLRenderer,
    readonly size = 256,
  ) {
    this.ss = size * 2;
    this.pixels = new Uint8Array(this.ss * this.ss * 4);
    this.big.width = this.big.height = this.ss;
    this.out.width = this.out.height = size;
    const hemi = new THREE.HemisphereLight('#fff6e8', '#7d6a8a', 1.25);
    const sun = new THREE.DirectionalLight('#ffffff', 2.1);
    sun.position.set(3, 6, 5);
    this.scene.add(hemi, sun);
  }

  get(id: ActorId): Promise<string> {
    let p = this.cache.get(id);
    if (!p) {
      p = new Promise<string>((resolve) => this.queue.push({ id, resolve }));
      this.cache.set(id, p);
    }
    return p;
  }

  /** Called by the world right after it renders a frame. */
  pump(): void {
    const job = this.queue.shift();
    if (!job) return;
    try {
      job.resolve(this.render(job.id));
    } catch (err) {
      console.warn('Retrato falhou', job.id, err);
      job.resolve('');
    }
  }

  private render(id: ActorId): string {
    const S = this.ss;
    if (!this.rt) this.rt = new THREE.WebGLRenderTarget(S, S, { depthBuffer: true });
    const a = makeActor(id);
    a.shadow.visible = false;
    a.face(1, 0.5);
    a.update(0);
    this.scene.add(a.group);
    const h = a.worldHeight;
    const extent = Math.max(h, a.worldWidth * 0.95);
    const cy = h * 0.5;
    const dist = (extent * 0.5 * 1.14) / Math.tan(THREE.MathUtils.degToRad(13));
    this.cam.position.set(dist * 0.12, cy + dist * 0.07, dist);
    this.cam.lookAt(0, cy, 0);

    const r = this.renderer;
    const prev = r.getRenderTarget();
    const alpha = r.getClearAlpha();
    r.getClearColor(this.keepColor);
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(this.scene, this.cam);
    r.readRenderTargetPixels(this.rt, 0, 0, S, S, this.pixels);
    r.setRenderTarget(prev);
    r.setClearColor(this.keepColor, alpha);
    this.scene.remove(a.group);
    a.dispose();

    const px = this.pixels;
    const img = new ImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      const src = (S - 1 - y) * S * 4;
      const dst = y * S * 4;
      for (let x = 0; x < S * 4; x += 4) {
        const al = px[src + x + 3];
        const un = al > 0 && al < 255 ? 255 / al : 1;
        d[dst + x] = TO_SRGB[Math.min(255, Math.round(px[src + x] * un))];
        d[dst + x + 1] = TO_SRGB[Math.min(255, Math.round(px[src + x + 1] * un))];
        d[dst + x + 2] = TO_SRGB[Math.min(255, Math.round(px[src + x + 2] * un))];
        d[dst + x + 3] = al;
      }
    }
    const bctx = this.big.getContext('2d');
    const octx = this.out.getContext('2d');
    if (!bctx || !octx) return '';
    bctx.putImageData(img, 0, 0);
    octx.clearRect(0, 0, this.size, this.size);
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(this.big, 0, 0, this.size, this.size);
    return this.out.toDataURL('image/png');
  }
}
