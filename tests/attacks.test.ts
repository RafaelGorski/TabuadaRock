import { describe, expect, it } from 'vitest';
import { attacksOf, COUNTER_BONUS, pickAttack, superOf, tossOpener } from '../src/game/attacks';
import { CREATURES, type CreatureId } from '../src/game/creatures';

const CREATURE_IDS = Object.keys(CREATURES) as CreatureId[];
import { TYPES } from '../src/game/types';

const rngOf = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('attacks', () => {
  it('gives every creature two normal hits and one super move', () => {
    for (const id of CREATURE_IDS) {
      const all = attacksOf(id);
      expect(all).toHaveLength(3);
      expect(all.filter((a) => a.power === 1)).toHaveLength(2);
      expect(superOf(id).power).toBe(2);
      for (const a of all) {
        expect(a.name.trim().length).toBeGreaterThan(2);
        expect(TYPES[a.type]).toBeDefined();
      }
    }
  });

  it('keeps the signature move and super move from the creature sheet', () => {
    for (const id of CREATURE_IDS) {
      const c = CREATURES[id];
      expect(attacksOf(id)[0]).toEqual({ name: c.move, type: c.type, power: 1 });
      expect(superOf(id)).toEqual({ name: c.superMove, type: c.type, power: 2 });
    }
  });

  it('gives each fighter a second element so rounds look different', () => {
    for (const id of CREATURE_IDS) {
      const [first, wild] = attacksOf(id);
      expect(wild.type).not.toBe(first.type);
      expect(wild.name).not.toBe(first.name);
    }
  });

  it('picks only normal hits unless the super move is asked for', () => {
    const rng = rngOf([0, 0.99, 0.5, 0.2]);
    for (let i = 0; i < 20; i++) expect(pickAttack('saci', rng).power).toBe(1);
    expect(pickAttack('saci', rng, true)).toEqual(superOf('saci'));
  });

  it('reaches both normal hits', () => {
    const names = new Set([pickAttack('curupira', rngOf([0])).name, pickAttack('curupira', rngOf([0.99])).name]);
    expect(names.size).toBe(2);
  });

  it('tosses for who opens the round', () => {
    expect(tossOpener(rngOf([0.1]))).toBe('heroi');
    expect(tossOpener(rngOf([0.9]))).toBe('rival');
    expect(COUNTER_BONUS).toBeGreaterThan(1);
  });
});
