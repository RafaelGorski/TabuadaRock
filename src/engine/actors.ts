import type { CreatureId } from '../game/creatures';
import { Actor, type Builder } from './rig';
import { boneco, brasonca, capibolha, folhandua } from './cast-starters';
import { guarabrasa, jacarock, rolachoque, tesourada, treguica } from './cast-rivals1';
import { boitata, mapinguari, micoleao, polvorosa, quatrovao } from './cast-rivals2';
import { boto, caipora, cuca, curupira, iara, mula, saci } from './cast-folclore';

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
  saci,
  curupira,
  iara,
  cuca,
  boto,
  mula,
  caipora,
};

export function makeActor(id: ActorId): Actor {
  return new Actor(id, BUILDERS[id]);
}

export { Actor };
