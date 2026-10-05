import { describe, expect, it } from 'vitest';
import { makeActor } from '../src/engine/actors';
import { ALL_CREATURES, CREATURES } from '../src/game/creatures';

describe('elenco de criaturas', () => {
  it('has complete pt-BR copy for every creature', () => {
    for (const id of ALL_CREATURES) {
      const c = CREATURES[id];
      expect(c.name).toBeTruthy();
      expect(c.blurb).toMatch(/[A-Za-zÀ-ÿ]/);
      expect(c.move).toBeTruthy();
      expect(c.superMove).toBeTruthy();
    }
  });

  it('has a procedural actor for every creature id', () => {
    for (const id of ALL_CREATURES) {
      const actor = makeActor(id);
      expect(actor.worldHeight).toBeGreaterThan(0);
      expect(actor.worldWidth).toBeGreaterThan(0);
      actor.dispose();
    }
  });
});
