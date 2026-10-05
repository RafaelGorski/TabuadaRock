import type { CreatureId } from '../game/creatures';
import { Actor, type Builder } from './rig';
import { boneco, brasonca, capibolha, folhandua } from './cast-starters';
import { guarabrasa, jacarock, rolachoque, tesourada, treguica } from './cast-rivals1';
import { boitata, mapinguari, micoleao, polvorosa, quatrovao } from './cast-rivals2';

export type ActorId = CreatureId | 'boneco';

const BUILDERS: Record<ActorId, Builder> = {
  capibolha,
  brasonca,
  folhandua,
  tesourada,
  treguica,
  guarabrasa,
  jacarock,
  rolachoque,
  boitata,
  polvorosa,
  quatrovao,
  micoleao,
  mapinguari,
  boneco,
};

export function makeActor(id: ActorId): Actor {
  return new Actor(id, BUILDERS[id]);
}

export { Actor };
