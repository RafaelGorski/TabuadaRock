export type ElementType = 'agua' | 'fogo' | 'planta' | 'raio' | 'pedra' | 'vento';

export interface TypeInfo {
  id: ElementType;
  name: string;
  color: string;
  beats: ElementType;
  phrase: string;
}

/** Six types in one cycle: each type beats exactly the next one. */
export const TYPES: Record<ElementType, TypeInfo> = {
  raio: { id: 'raio', name: 'Raio', color: '#FFE014', beats: 'agua', phrase: 'O raio dá choque na água' },
  agua: { id: 'agua', name: 'Água', color: '#1FA2FF', beats: 'fogo', phrase: 'A água apaga o fogo' },
  fogo: { id: 'fogo', name: 'Fogo', color: '#FF5A1F', beats: 'planta', phrase: 'O fogo queima a planta' },
  planta: { id: 'planta', name: 'Planta', color: '#2DBE4E', beats: 'pedra', phrase: 'As raízes racham a pedra' },
  pedra: { id: 'pedra', name: 'Pedra', color: '#B08A5F', beats: 'vento', phrase: 'A pedra segura o vento' },
  vento: { id: 'vento', name: 'Vento', color: '#7FD6EA', beats: 'raio', phrase: 'O vento sopra a tempestade para longe' },
};

export const TYPE_ORDER: ElementType[] = ['raio', 'agua', 'fogo', 'planta', 'pedra', 'vento'];

export type Matchup = 'vantagem' | 'neutro' | 'desvantagem';

export function matchup(attacker: ElementType, defender: ElementType): Matchup {
  if (TYPES[attacker].beats === defender) return 'vantagem';
  if (TYPES[defender].beats === attacker) return 'desvantagem';
  return 'neutro';
}

/** How many wrong answers the fighter survives in one round. */
export const MISTAKES_ALLOWED: Record<Matchup, number> = { vantagem: 7, neutro: 5, desvantagem: 4 };

export function matchupText(attacker: ElementType, defender: ElementType): { kind: Matchup; title: string; text: string; lives: string } {
  const kind = matchup(attacker, defender);
  const n = MISTAKES_ALLOWED[kind];
  if (kind === 'vantagem') {
    return { kind, title: 'Vantagem!', text: `${TYPES[attacker].phrase}.`, lives: `Você pode errar ${n} vezes por round.` };
  }
  if (kind === 'desvantagem') {
    return { kind, title: 'Cuidado!', text: `${TYPES[defender].phrase}.`, lives: `Você pode errar só ${n} vezes por round.` };
  }
  return { kind, title: 'Luta equilibrada', text: 'Nenhum tipo leva vantagem.', lives: `Você pode errar ${n} vezes por round.` };
}
