import { describe, expect, it } from 'vitest';
import { STAGE_NAMES, type StageId } from '../src/game/levels';
import { MAP_H, MAP_SPOTS, MAP_W, outlinePoints, project, spotOf } from '../src/game/mapa';

describe('mapa', () => {
  it('offers every battle stage exactly once', () => {
    const ids = MAP_SPOTS.map((s) => s.stage);
    expect(new Set(ids).size).toBe(ids.length);
    const all = Object.keys(STAGE_NAMES) as StageId[];
    expect(new Set(ids)).toEqual(new Set(all.filter((s) => s !== 'treino')));
  });

  it('describes each arena in Portuguese', () => {
    for (const s of MAP_SPOTS) {
      expect(s.short.trim().length).toBeGreaterThan(2);
      expect(s.blurb.trim().length).toBeGreaterThan(20);
      expect(s.uf).toMatch(/^[A-Z]{2}(\/[A-Z]{2})*$/);
      expect(spotOf(s.stage)).toBe(s);
    }
  });

  it('places every pin inside the drawing', () => {
    for (const s of MAP_SPOTS) {
      const p = project(s.lon, s.lat);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(MAP_W);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(MAP_H);
    }
  });

  it('keeps pins far enough apart to tap', () => {
    for (let i = 0; i < MAP_SPOTS.length; i++) {
      for (let j = i + 1; j < MAP_SPOTS.length; j++) {
        const a = project(MAP_SPOTS[i].lon, MAP_SPOTS[i].lat);
        const b = project(MAP_SPOTS[j].lon, MAP_SPOTS[j].lat);
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(3.4);
      }
    }
  });

  it('draws a closed outline of Brazil', () => {
    const pts = outlinePoints().split(' ');
    expect(pts.length).toBeGreaterThan(20);
    for (const p of pts) expect(p).toMatch(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/);
  });
});
