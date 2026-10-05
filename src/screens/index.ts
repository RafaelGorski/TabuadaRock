import type { ScreenTable } from '../app';
import { attract } from './attract';
import { campeao } from './campeao';
import { luta } from './luta';
import { menu } from './menu';
import { novo } from './novo';
import { opcoes } from './opcoes';
import { perfis } from './perfis';
import { recordes } from './recordes';
import { resultado } from './resultado';
import { torre } from './torre';
import { treino } from './treino';
import { vs } from './vs';

export const SCREENS: ScreenTable = { attract, menu, perfis, novo, torre, vs, treino, luta, resultado, campeao, recordes, opcoes };
