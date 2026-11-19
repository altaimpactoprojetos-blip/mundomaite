// Tipos centrais do Mundo da Maitê
export type Vec3 = [number, number, number];

export type HairStyle =
  | 'curto' | 'longo' | 'rabo' | 'chiquinhas' | 'coque' | 'cacheado' | 'trancas' | 'franja' | 'black' | 'careca';
export type Expression = 'feliz' | 'sorriso' | 'surpresa' | 'piscadinha' | 'calma' | 'lingua';
export type Personality = 'aventureira' | 'criativa' | 'carinhosa' | 'engracada' | 'tranquila' | 'curiosa';
export type EyeStyle = 'redondo' | 'brilhante' | 'cilios';

export interface Appearance {
  name: string;
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeColor: string;
  eyeStyle: EyeStyle;
  top: string;
  topColor: string;
  bottom: string;
  bottomColor: string;
  shoes: string;
  shoesColor: string;
  accessories: string[];
  accColor: string;
  makeup: { blush: boolean; glitter: boolean; lips: boolean };
  expression: Expression;
  personality: Personality;
  height: number; // 0.85 - 1.15
  robot?: boolean;
}

export type AnimName =
  | 'idle' | 'walk' | 'run' | 'jump' | 'swim' | 'dance' | 'wave' | 'hug' | 'sit' | 'drive'
  | 'sleep' | 'play' | 'cheer' | 'work' | 'exercise' | 'ride' | 'sing' | 'paint' | 'photo';

export type ItemCategory =
  | 'roupas' | 'vestidos' | 'calcados' | 'bolsas' | 'acessorios' | 'brinquedos'
  | 'moveis' | 'decoracao' | 'construcao' | 'jardim' | 'parque' | 'loja'
  | 'carros' | 'motos' | 'bicicletas' | 'barcos' | 'avioes' | 'pets' | 'especiais';

export type WearSlot = 'top' | 'bottom' | 'shoes' | 'acc';

export type ItemData =
  | { kind: 'wear'; slot: WearSlot; style: string; color?: string; dress?: boolean }
  | { kind: 'build'; model: string; color: string }
  | { kind: 'vehicle'; vtype: VehicleType; color: string }
  | { kind: 'pet'; species: PetSpecies; color: string }
  | { kind: 'toy'; toy: string }
  | { kind: 'special'; effect: string };

export interface ShopItem {
  id: string;
  name: string;
  cat: ItemCategory;
  price: number;
  icon: string;
  data: ItemData;
  hidden?: boolean; // itens secretos (ilhas)
}

export type TextureKind =
  | 'liso' | 'madeira' | 'tijolo' | 'listras' | 'bolinhas' | 'xadrez' | 'estrelas' | 'coracoes' | 'marmore' | 'grama' | 'azulejo' | 'nuvens';

export interface PlacedObject {
  id: string;
  model: string;
  pos: Vec3;
  rotY: number;
  scale: Vec3;
  color: string;
  texture: TextureKind;
  label?: string;
}

export type HouseStyle = 'casa' | 'mansao' | 'chale' | 'moderna' | 'praia' | 'castelinho';

export interface HouseConfig {
  style: HouseStyle;
  name: string;
  rooms: number; // cômodos por andar (largura)
  depth: number;
  floors: number;
  wallColor: string;
  roofColor: string;
  floorColor: string;
  pool: boolean;
  garden: boolean;
  garage: boolean;
  furnished: boolean;
}

export interface PropertyDef {
  id: string;
  name: string;
  area: string;
  pos: [number, number];
  rot: number;
  lot: [number, number];
  price: number;
  preset: HouseConfig | null; // null = terreno vazio
}

export interface PropertyState {
  owned: boolean;
  house: HouseConfig | null;
}

export type VehicleType =
  | 'carro' | 'esportivo' | 'suv' | 'caminhonete' | 'conversivel' | 'moto' | 'bicicleta' | 'patinete'
  | 'barco' | 'lancha' | 'jetski' | 'aviao' | 'jatinho' | 'helicoptero' | 'carrinho' | 'onibus' | 'caminhao-bombeiro' | 'viatura' | 'trator';

export interface OwnedVehicle {
  id: string;
  vtype: VehicleType;
  name: string;
  color: string;
  color2: string;
  parked: { pos: Vec3; rotY: number } | null;
}

export type PetSpecies =
  | 'cachorro' | 'gato' | 'coelho' | 'cavalo' | 'passaro' | 'hamster' | 'tartaruga'
  | 'unicornio' | 'dragao' | 'raposa' | 'panda' | 'pinguim';

export interface Pet {
  id: string;
  species: PetSpecies;
  name: string;
  color: string;
  accessory: string;
  accColor: string;
  hunger: number; // 0..100 (100 = satisfeito)
  fun: number;
  clean: number;
  love: number;
}

export type ActionSpec =
  | { type: 'shop'; cat?: ItemCategory; title?: string }
  | { type: 'job'; job: string }
  | { type: 'sit' }
  | { type: 'sleep' }
  | { type: 'editor'; tab?: string }
  | { type: 'cinema' }
  | { type: 'snack'; item: string; name: string }
  | { type: 'tv' }
  | { type: 'piano' }
  | { type: 'exercise' }
  | { type: 'bath' }
  | { type: 'trampoline' }
  | { type: 'adopt' }
  | { type: 'swing' }
  | { type: 'message'; text: string; icon?: string }
  | { type: 'ride'; ride: string }
  | { type: 'treasure'; id: string }
  | { type: 'teleport'; to: Vec3; label: string }
  | { type: 'farm'; plot: string }
  | { type: 'dance' }
  | { type: 'garage' }
  | { type: 'mailbox' };

export interface Fixture {
  model: string;
  x: number;
  z: number;
  y?: number;
  rot?: number;
  color?: string;
  scale?: Vec3;
  texture?: TextureKind;
  label?: string;
  action?: ActionSpec;
}

export interface BuildingDef {
  id: string;
  name: string;
  type: string;
  icon: string;
  pos: [number, number];
  size: [number, number, number]; // w, h, d
  rot: number;
  color: string;
  roof: string;
  trim: string;
  zone: string;
}

export interface NPCRoutineStep {
  from: number; // hora
  to: number;
  at: [number, number];
  activity: 'work' | 'walk' | 'play' | 'sit' | 'dance' | 'patrol' | 'wander' | 'sleep' | 'exercise';
  radius?: number;
  path?: [number, number][];
}

export interface NPCDef {
  id: string;
  name: string;
  role: string;
  icon: string;
  personality: Personality;
  look: Partial<Appearance>;
  routine: NPCRoutineStep[];
  lines: string[];
  job?: string;
  shop?: ItemCategory;
  kid?: boolean;
}

export interface Photo {
  id: string;
  url: string;
  date: number;
  place: string;
}

export interface Painting {
  id: string;
  url: string;
  date: number;
}

export interface Quest {
  id: string;
  text: string;
  icon: string;
  event: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

export interface WorldTask {
  kind: 'fires' | 'lost' | 'farm' | 'deliver';
  title: string;
  targets: { id: string; pos: Vec3; done: boolean; icon: string; name: string }[];
  reward: number;
}

export interface FarmPlot {
  crop: string | null;
  planted: number; // timestamp ms
  watered: boolean;
}
