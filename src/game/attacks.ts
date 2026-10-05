import { CREATURES, type CreatureId } from './creatures';
import type { Rng } from './facts';
import type { ElementType } from './types';

export interface Attack {
  name: string;
  type: ElementType;
  /** 1 for a normal hit, 2 for a super move. */
  power: 1 | 2;
}

/** A second element every fighter can reach for, so two duels never look the same. */
const WILD: Record<CreatureId, { name: string; type: ElementType }> = {
  capibolha: { name: 'Chuva de Gotas', type: 'vento' },
  brasonca: { name: 'Patada de Pedra', type: 'pedra' },
  folhandua: { name: 'Sopro de Folhas', type: 'vento' },
  tesourada: { name: 'Mergulho Salgado', type: 'agua' },
  treguica: { name: 'Galho de Pedra', type: 'pedra' },
  guarabrasa: { name: 'Poeira do Cerrado', type: 'pedra' },
  jacarock: { name: 'Rabanada d’Água', type: 'agua' },
  rolachoque: { name: 'Casco de Pedra', type: 'pedra' },
  boitata: { name: 'Olhar Fulminante', type: 'raio' },
  polvorosa: { name: 'Tinta Rasteira', type: 'vento' },
  quatrovao: { name: 'Banho de Cachoeira', type: 'agua' },
  micoleao: { name: 'Juba em Brasa', type: 'fogo' },
  mapinguari: { name: 'Berro da Mata', type: 'planta' },
  saci: { name: 'Fumacinha do Cachimbo', type: 'fogo' },
  curupira: { name: 'Assobio Cortante', type: 'vento' },
  iara: { name: 'Nota Aguda', type: 'raio' },
  cuca: { name: 'Caldeirão Fervente', type: 'fogo' },
  boto: { name: 'Chapéu Voador', type: 'vento' },
  mula: { name: 'Coice de Pedra', type: 'pedra' },
  caipora: { name: 'Faísca do Cajado', type: 'raio' },
};

/** Normal hits first, super move last. */
export function attacksOf(id: CreatureId): Attack[] {
  const c = CREATURES[id];
  return [
    { name: c.move, type: c.type, power: 1 },
    { name: WILD[id].name, type: WILD[id].type, power: 1 },
    { name: c.superMove, type: c.type, power: 2 },
  ];
}

export const superOf = (id: CreatureId): Attack => attacksOf(id)[2];

/** A random normal hit. The super move only comes out when the caller asks for it. */
export function pickAttack(id: CreatureId, rng: Rng, superMove = false): Attack {
  const all = attacksOf(id);
  if (superMove) return all[2];
  const normals = all.filter((a) => a.power === 1);
  return normals[Math.min(normals.length - 1, Math.floor(rng() * normals.length))];
}

export type Opener = 'heroi' | 'rival';

/** Coin toss for who opens the round. */
export function tossOpener(rng: Rng): Opener {
  return rng() < 0.5 ? 'heroi' : 'rival';
}

/** Points multiplier for the question right after the rival opened the round. */
export const COUNTER_BONUS = 2;
