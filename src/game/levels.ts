import type { CreatureId } from './creatures';

export type StageId =
  | 'treino'
  | 'copacabana'
  | 'mata'
  | 'cerrado'
  | 'pantanal'
  | 'caatinga'
  | 'amazonia'
  | 'noronha'
  | 'iguacu'
  | 'paodeacucar'
  | 'roraima';

export const STAGE_NAMES: Record<StageId, string> = {
  treino: 'Sala de Treino',
  copacabana: 'Calçadão de Copacabana, RJ',
  mata: 'Mata Atlântica, Serra do Mar',
  cerrado: 'Cerrado, Chapada dos Veadeiros',
  pantanal: 'Pantanal, MS',
  caatinga: 'Caatinga, Sertão',
  amazonia: 'Amazônia, Rio Negro',
  noronha: 'Fernando de Noronha, PE',
  iguacu: 'Cataratas do Iguaçu, PR',
  paodeacucar: 'Pão de Açúcar, RJ',
  roraima: 'Monte Roraima, RR',
};

export interface LevelDef {
  id: string;
  order: number;
  /** The table taught in this level, or null for the mixed final challenge. */
  table: number | null;
  rival: CreatureId;
  stage: StageId;
  name: string;
  trickName: string;
  trick: string;
  taunt: string;
  join: string;
}

export const LEVELS: LevelDef[] = [
  {
    id: 't2',
    order: 0,
    table: 2,
    rival: 'tesourada',
    stage: 'copacabana',
    name: 'Tabuada do 2',
    trickName: 'Dobrar',
    trick: 'Na tabuada do 2 é só dobrar: 2 × 8 é 8 + 8.',
    taunt: 'Minha cauda é uma tesoura de duas lâminas! Na tabuada do 2, é só dobrar: 2 × 8 é 8 + 8.',
    join: 'Você corta rápido! Pode contar comigo.',
  },
  {
    id: 't3',
    order: 1,
    table: 3,
    rival: 'treguica',
    stage: 'mata',
    name: 'Tabuada do 3',
    trickName: 'Dobro e mais um',
    trick: 'Faça o dobro e some mais uma vez: 3 × 6 = 12 + 6.',
    taunt: 'Três garras, sem pressa… Na tabuada do 3, faça o dobro e some mais uma vez: 3 × 6 = 12 + 6.',
    join: 'Devagar e sempre… você chegou! Vou junto.',
  },
  {
    id: 't4',
    order: 2,
    table: 4,
    rival: 'guarabrasa',
    stage: 'cerrado',
    name: 'Tabuada do 4',
    trickName: 'Dobro do dobro',
    trick: 'Dobre e dobre de novo: 4 × 7 → 14 → 28.',
    taunt: 'No Cerrado eu corro em quatro patas! Tabuada do 4 é o dobro do dobro: 4 × 7 → 14 → 28.',
    join: 'Corre comigo, parceiro! O Cerrado é nosso.',
  },
  {
    id: 't5',
    order: 3,
    table: 5,
    rival: 'jacarock',
    stage: 'pantanal',
    name: 'Tabuada do 5',
    trickName: 'Metade do 10',
    trick: 'Faça vezes 10 e pegue a metade: 5 × 8 = metade de 80.',
    taunt: 'Cinco placas de pedra nas costas! Tabuada do 5: faça vezes 10 e pegue a metade. 5 × 8 = metade de 80.',
    join: 'Mordi a poeira… Agora estou na sua equipe!',
  },
  {
    id: 't6',
    order: 4,
    table: 6,
    rival: 'rolachoque',
    stage: 'caatinga',
    name: 'Tabuada do 6',
    trickName: '5 vezes e mais 1',
    trick: 'Faça 5 vezes e some mais uma: 6 × 7 = 35 + 7.',
    taunt: 'Rolo, rolo e dou choque! Tabuada do 6: 5 vezes e mais 1 vez. 6 × 7 = 35 + 7.',
    join: 'Bzzt! Agora eu rolo do seu lado.',
  },
  {
    id: 't7',
    order: 5,
    table: 7,
    rival: 'boitata',
    stage: 'amazonia',
    name: 'Tabuada do 7',
    trickName: '5 vezes e mais 2',
    trick: 'Faça 5 vezes e some mais 2 vezes: 7 × 8 = 40 + 16.',
    taunt: 'Sou a lenda que guarda a mata! Tabuada do 7: 5 vezes e mais 2 vezes. 7 × 8 = 40 + 16.',
    join: 'A lenda agora protege você.',
  },
  {
    id: 't8',
    order: 6,
    table: 8,
    rival: 'polvorosa',
    stage: 'noronha',
    name: 'Tabuada do 8',
    trickName: 'Dobro, dobro, dobro',
    trick: 'Dobre três vezes: 8 × 6 → 12 → 24 → 48.',
    taunt: 'Oito braços, oito golpes! Tabuada do 8: dobro, dobro, dobro. 8 × 6 → 12 → 24 → 48.',
    join: 'Com oito braços eu te dou um abraço!',
  },
  {
    id: 't9',
    order: 7,
    table: 9,
    rival: 'quatrovao',
    stage: 'iguacu',
    name: 'Tabuada do 9',
    trickName: '10 vezes menos 1',
    trick: 'Faça vezes 10 e tire uma vez: 9 × 7 = 70 − 7.',
    taunt: 'A cachoeira ruge e eu trovejo! Tabuada do 9: faça vezes 10 e tire uma vez. 9 × 7 = 70 − 7.',
    join: 'Que trovão de cabeça! Estou dentro.',
  },
  {
    id: 't10',
    order: 8,
    table: 10,
    rival: 'micoleao',
    stage: 'paodeacucar',
    name: 'Tabuada do 10',
    trickName: 'Coloque um zero',
    trick: 'É só colocar um zero no final: 10 × 6 = 60.',
    taunt: 'Minha juba dourada é um grande zero! Tabuada do 10: é só colocar um zero. 10 × 6 = 60.',
    join: 'Rugiu bonito! A juba dourada é sua.',
  },
  {
    id: 'final',
    order: 9,
    table: null,
    rival: 'mapinguari',
    stage: 'roraima',
    name: 'Desafio Final',
    trickName: 'Tudo junto',
    trick: 'Todas as tabuadas misturadas. Use os truques que você aprendeu.',
    taunt: 'Eu sou o Mapinguari, guardião do Monte Roraima! Aqui não tem truque fácil: todas as tabuadas, misturadas!',
    join: 'Você é o CAMPEÃO DA TABUADA!',
  },
];

export function levelById(id: string): LevelDef {
  const found = LEVELS.find((l) => l.id === id);
  if (!found) throw new Error(`Nível desconhecido: ${id}`);
  return found;
}
