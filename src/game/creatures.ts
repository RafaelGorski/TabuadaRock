import type { ElementType } from './types';

export type CreatureId =
  | 'capibolha'
  | 'brasonca'
  | 'folhandua'
  | 'tesourada'
  | 'treguica'
  | 'guarabrasa'
  | 'jacarock'
  | 'rolachoque'
  | 'boitata'
  | 'polvorosa'
  | 'quatrovao'
  | 'micoleao'
  | 'mapinguari'
  | 'saci'
  | 'curupira'
  | 'iara'
  | 'cuca'
  | 'boto'
  | 'mula'
  | 'caipora';

export interface CreatureDef {
  id: CreatureId;
  name: string;
  type: ElementType;
  animal: string;
  blurb: string;
  move: string;
  superMove: string;
}

export const CREATURES: Record<CreatureId, CreatureDef> = {
  capibolha: {
    id: 'capibolha',
    name: 'Capibolha',
    type: 'agua',
    animal: 'capivara',
    blurb: 'Capivara tranquila com uma gota d’água na cabeça. Mergulha, nada e solta bolhas que estouram com força.',
    move: 'Bolha Turbo',
    superMove: 'Tsunami de Bolhas',
  },
  brasonca: {
    id: 'brasonca',
    name: 'Brasonça',
    type: 'fogo',
    animal: 'onça-pintada',
    blurb: 'Filhote de onça-pintada com a cauda em chamas. Rápida, corajosa e um pouco esquentadinha.',
    move: 'Patada Brasa',
    superMove: 'Rugido Vulcânico',
  },
  folhandua: {
    id: 'folhandua',
    name: 'Folhanduá',
    type: 'planta',
    animal: 'tamanduá-bandeira',
    blurb: 'Tamanduá com cauda de folhas. Usa a língua comprida como cipó e levanta um vendaval verde.',
    move: 'Língua-Cipó',
    superMove: 'Tempestade de Folhas',
  },
  tesourada: {
    id: 'tesourada',
    name: 'Tesourada',
    type: 'vento',
    animal: 'tesourão',
    blurb: 'Ave do mar com cauda em tesoura e papo vermelho. Corta o vento da praia em duas partes.',
    move: 'Tesoura de Vento',
    superMove: 'Ciclone Duplo',
  },
  treguica: {
    id: 'treguica',
    name: 'Treguiça',
    type: 'planta',
    animal: 'preguiça-de-três-dedos',
    blurb: 'Preguiça de três garras coberta de musgo. Lenta para andar, rápida para pensar.',
    move: 'Garra Tripla',
    superMove: 'Abraço da Floresta',
  },
  guarabrasa: {
    id: 'guarabrasa',
    name: 'Guarabrasa',
    type: 'fogo',
    animal: 'lobo-guará',
    blurb: 'Lobo-guará de pernas compridas e juba em brasa. Atravessa o Cerrado inteiro sem cansar.',
    move: 'Uivo de Brasa',
    superMove: 'Corrida Flamejante',
  },
  jacarock: {
    id: 'jacarock',
    name: 'Jacarock',
    type: 'pedra',
    animal: 'jacaré-do-pantanal',
    blurb: 'Jacaré com cinco placas de pedra nas costas. Duro na queda e paciente na água.',
    move: 'Mordida de Pedra',
    superMove: 'Cauda Sísmica',
  },
  rolachoque: {
    id: 'rolachoque',
    name: 'Rolachoque',
    type: 'raio',
    animal: 'tatu-bola',
    blurb: 'Tatu-bola que se enrola e vira uma bola elétrica. Quanto mais rola, mais choque dá.',
    move: 'Bola Elétrica',
    superMove: 'Rolamento Trovão',
  },
  boitata: {
    id: 'boitata',
    name: 'Boitatá',
    type: 'fogo',
    animal: 'serpente de fogo da lenda',
    blurb: 'A serpente de fogo das lendas, com olhos enormes e brilhantes. Protege a floresta de quem faz mal.',
    move: 'Serpente de Fogo',
    superMove: 'Fogo-Fátuo',
  },
  polvorosa: {
    id: 'polvorosa',
    name: 'Polvorosa',
    type: 'agua',
    animal: 'polvo',
    blurb: 'Polvo de Noronha com oito braços agitados. Por onde passa, deixa tudo em polvorosa.',
    move: 'Oito Jatos',
    superMove: 'Redemoinho Salgado',
  },
  quatrovao: {
    id: 'quatrovao',
    name: 'Quatrovão',
    type: 'raio',
    animal: 'quati',
    blurb: 'Quati das cataratas com o rabo listrado de faíscas. Curioso, ligeiro e barulhento.',
    move: 'Rabo Trovão',
    superMove: 'Faísca das Cataratas',
  },
  micoleao: {
    id: 'micoleao',
    name: 'Micoleão',
    type: 'vento',
    animal: 'mico-leão-dourado',
    blurb: 'Mico-leão-dourado de juba brilhante. Pequeno no tamanho, gigante no rugido.',
    move: 'Juba Dourada',
    superMove: 'Rugido do Pão de Açúcar',
  },
  mapinguari: {
    id: 'mapinguari',
    name: 'Mapinguari',
    type: 'pedra',
    animal: 'gigante da lenda',
    blurb: 'Gigante das lendas da floresta, de um olho só e boca na barriga. O último desafio da torre.',
    move: 'Pisão de Pedra',
    superMove: 'Terremoto Ancestral',
  },
  saci: {
    id: 'saci',
    name: 'Saci',
    type: 'vento',
    animal: 'menino travesso da lenda',
    blurb: 'Saci de uma perna só, gorro vermelho e sorriso maroto. Gira num redemoinho e prega peças do bem.',
    move: 'Rodopio do Gorro',
    superMove: 'Redemoinho Travesso',
  },
  curupira: {
    id: 'curupira',
    name: 'Curupira',
    type: 'planta',
    animal: 'guardião da floresta',
    blurb: 'Curupira de cabelos vermelhos e pés virados para trás. Protege as árvores com muita energia e alegria.',
    move: 'Passo ao Contrário',
    superMove: 'Trilha da Floresta',
  },
  iara: {
    id: 'iara',
    name: 'Iara',
    type: 'agua',
    animal: 'sereia do rio',
    blurb: 'Iara sereia dos rios, com cauda brilhante e voz afinada. Faz ondas musicais que refrescam a arena.',
    move: 'Onda Cantante',
    superMove: 'Canto das Águas',
  },
  cuca: {
    id: 'cuca',
    name: 'Cuca',
    type: 'planta',
    animal: 'jacaré brincalhona da lenda',
    blurb: 'Cuca jacaré brincalhona, cheia de escamas coloridas e ideias divertidas. Seu feitiço faz cócegas na floresta.',
    move: 'Cócega de Ervas',
    superMove: 'Caldeirão de Folhas',
  },
  boto: {
    id: 'boto',
    name: 'Boto',
    type: 'agua',
    animal: 'boto-cor-de-rosa',
    blurb: 'Boto-cor-de-rosa sorridente, de chapéu de palha e saltos elegantes. Nada ligeiro e dança nas ondas.',
    move: 'Salto Rosa',
    superMove: 'Onda do Boto',
  },
  mula: {
    id: 'mula',
    name: 'Mula',
    type: 'fogo',
    animal: 'mula-sem-cabeça da lenda',
    blurb: 'Mula-sem-cabeça que trocou a cabeça por chamas coloridas. É veloz, engraçada e ilumina a noite.',
    move: 'Coice de Fagulhas',
    superMove: 'Galope Flamejante',
  },
  caipora: {
    id: 'caipora',
    name: 'Caipora',
    type: 'planta',
    animal: 'guardião da mata',
    blurb: 'Caipora de cabelos de fogo, cajado na mão e coração enorme. Cuida dos bichos e confunde quem maltrata a mata.',
    move: 'Cajado de Cipó',
    superMove: 'Festa da Mata',
  },
};

export const STARTERS: CreatureId[] = ['capibolha', 'brasonca', 'folhandua'];

export const ALL_CREATURES = Object.keys(CREATURES) as CreatureId[];
