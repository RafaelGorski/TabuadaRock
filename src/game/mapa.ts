import { STAGE_NAMES, type StageId } from './levels';

export interface MapSpot {
  stage: StageId;
  /** Short label for the pin on the map. */
  short: string;
  region: string;
  uf: string;
  /** What a kid sees when the fight happens here. */
  blurb: string;
  lon: number;
  lat: number;
}

/** Every arena the tower visits, placed where it really is in Brazil. */
export const MAP_SPOTS: MapSpot[] = [
  { stage: 'roraima', short: 'Monte Roraima', region: 'Norte', uf: 'RR', blurb: 'O topo de pedra mais antigo do país, sempre na neblina.', lon: -60.75, lat: 5.2 },
  { stage: 'amazonia', short: 'Rio Negro', region: 'Norte', uf: 'AM', blurb: 'Floresta fechada e água escura: a arena da Boitatá.', lon: -62.0, lat: -3.1 },
  { stage: 'noronha', short: 'Noronha', region: 'Nordeste', uf: 'PE', blurb: 'Ilha no meio do mar, com o Morro do Pico atrás da luta.', lon: -32.42, lat: -3.85 },
  { stage: 'caatinga', short: 'Sertão', region: 'Nordeste', uf: 'BA', blurb: 'Chão rachado, mandacaru e sol forte o dia inteiro.', lon: -40.0, lat: -9.5 },
  { stage: 'cerrado', short: 'Chapada', region: 'Centro-Oeste', uf: 'GO', blurb: 'Cerrado alto da Chapada dos Veadeiros, com cachoeira ao fundo.', lon: -47.5, lat: -14.1 },
  { stage: 'pantanal', short: 'Pantanal', region: 'Centro-Oeste', uf: 'MS', blurb: 'Água rasa, tuiuiús e jacarés assistindo à luta.', lon: -56.8, lat: -18.0 },
  { stage: 'mata', short: 'Serra do Mar', region: 'Sudeste', uf: 'SP', blurb: 'Mata Atlântica fechada, cheia de bromélias e neblina.', lon: -45.0, lat: -22.3 },
  { stage: 'paodeacucar', short: 'Pão de Açúcar', region: 'Sudeste', uf: 'RJ', blurb: 'No alto do morro, com a baía inteira lá embaixo.', lon: -43.5, lat: -22.1 },
  { stage: 'copacabana', short: 'Copacabana', region: 'Sudeste', uf: 'RJ', blurb: 'Calçadão de ondas pretas e brancas, pé na areia.', lon: -42.9, lat: -23.6 },
  { stage: 'iguacu', short: 'Iguaçu', region: 'Sul', uf: 'PR', blurb: 'As cataratas trovejam e molham todo mundo.', lon: -54.44, lat: -25.69 },
];

export const spotOf = (stage: StageId): MapSpot | undefined => MAP_SPOTS.find((s) => s.stage === stage);

export const spotName = (stage: StageId): string => spotOf(stage)?.short ?? STAGE_NAMES[stage];

/** Map window in degrees, wide enough to hold Fernando de Noronha. */
const WEST = -75;
const EAST = -31;
const NORTH = 7;
const SOUTH = -35;

export const MAP_W = 100;
export const MAP_H = (MAP_W * (NORTH - SOUTH)) / (EAST - WEST);

/** Longitude and latitude to the map's own coordinates. */
export function project(lon: number, lat: number): { x: number; y: number } {
  return { x: ((lon - WEST) / (EAST - WEST)) * MAP_W, y: ((NORTH - lat) / (NORTH - SOUTH)) * MAP_H };
}

/** A simplified outline of Brazil, clockwise from the far north. */
const OUTLINE: [number, number][] = [
  [-60.0, 5.2],
  [-59.8, 3.9],
  [-56.5, 2.0],
  [-54.6, 2.3],
  [-51.6, 4.1],
  [-50.0, 0.0],
  [-48.5, -1.5],
  [-44.3, -2.5],
  [-41.0, -2.8],
  [-38.5, -3.7],
  [-35.2, -5.8],
  [-34.8, -7.1],
  [-35.0, -8.9],
  [-37.0, -11.0],
  [-38.5, -13.0],
  [-39.0, -16.0],
  [-40.3, -20.3],
  [-41.0, -22.0],
  [-43.2, -23.0],
  [-46.5, -24.0],
  [-48.5, -25.5],
  [-48.7, -28.5],
  [-50.5, -31.5],
  [-53.4, -33.7],
  [-57.6, -30.2],
  [-56.0, -28.0],
  [-54.6, -25.6],
  [-54.3, -24.0],
  [-58.2, -20.0],
  [-57.8, -17.5],
  [-60.5, -15.0],
  [-65.4, -11.0],
  [-70.0, -11.0],
  [-73.0, -7.5],
  [-70.0, -4.2],
  [-69.5, 1.0],
  [-67.3, 2.0],
  [-64.0, 1.9],
  [-63.4, 3.9],
];

export function outlinePoints(): string {
  return OUTLINE.map(([lon, lat]) => {
    const p = project(lon, lat);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(' ');
}
