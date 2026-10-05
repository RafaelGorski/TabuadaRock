import type { CreatureId } from '../game/creatures';
import type { StageId } from '../game/levels';

/** What a finished match hands to the results screen. */
export interface MatchResult {
  level: string;
  partner: CreatureId;
  score: number;
  stars: number;
  mistakes: number;
  correct: number;
  ms: number;
  maxCombo: number;
  /** Whether the duel was won without any mistake (0 or 1). */
  perfect: number;
  /** Best score for this level before this match. */
  prevBest: number;
  /** Place of this attempt in the all-time top 10, or null. */
  rank: number | null;
  /** The rival joined the team in this match. */
  recruited: boolean;
  /** This match made the profile champion for the first time. */
  crowned: boolean;
  firstClear: boolean;
}

export interface Routes {
  attract: undefined;
  menu: undefined;
  perfis: undefined;
  novo: undefined;
  torre: { level?: string } | undefined;
  mapa: { level: string; partner: CreatureId };
  vs: { level: string; partner: CreatureId; stage?: StageId };
  treino: { level: string; partner: CreatureId };
  luta: { level: string; partner: CreatureId; stage?: StageId };
  resultado: MatchResult;
  campeao: undefined;
  recordes: { tab?: RecordTab; from?: keyof Routes } | undefined;
  opcoes: { from?: keyof Routes } | undefined;
}

export type RecordTab = 'ranking' | 'lutas' | 'duelo' | 'dominio';

export type RouteName = keyof Routes;
