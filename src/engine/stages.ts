import type { StageId } from '../game/levels';
import type { Stage } from './stage-kit';
import { copacabana, mata, treino } from './stages-a';
import { caatinga, cerrado, pantanal } from './stages-b';
import { amazonia, noronha } from './stages-c';
import { iguacu } from './stages-d';
import { paodeacucar, roraima } from './stages-e';

const BUILDERS: Record<StageId, () => Stage> = {
  treino,
  copacabana,
  mata,
  cerrado,
  pantanal,
  caatinga,
  amazonia,
  noronha,
  iguacu,
  paodeacucar,
  roraima,
};

export function buildStage(id: StageId): Stage {
  return BUILDERS[id]();
}

export type { Look, Stage } from './stage-kit';
