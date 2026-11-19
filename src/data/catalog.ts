import type { ItemCategory, ShopItem, VehicleType, PetSpecies } from '../types';
import { MODELS } from './models';
import { VEHICLES } from './vehicles';
import { PETS } from './pets';

export const CATEGORIES: { id: ItemCategory; name: string; icon: string; group: 'moda' | 'casa' | 'veiculos' | 'outros' }[] = [
  { id: 'roupas', name: 'Roupas', icon: '👕', group: 'moda' },
  { id: 'vestidos', name: 'Vestidos', icon: '👗', group: 'moda' },
  { id: 'calcados', name: 'Tênis e Sapatos', icon: '👟', group: 'moda' },
  { id: 'bolsas', name: 'Bolsas', icon: '👜', group: 'moda' },
  { id: 'acessorios', name: 'Acessórios', icon: '🎀', group: 'moda' },
  { id: 'brinquedos', name: 'Brinquedos', icon: '🧸', group: 'outros' },
  { id: 'moveis', name: 'Móveis', icon: '🛋️', group: 'casa' },
  { id: 'decoracao', name: 'Decoração', icon: '🖼️', group: 'casa' },
  { id: 'construcao', name: 'Construção', icon: '🧱', group: 'casa' },
  { id: 'jardim', name: 'Jardim', icon: '🌷', group: 'casa' },
  { id: 'parque', name: 'Parque', icon: '🛝', group: 'casa' },
  { id: 'loja', name: 'Minha Loja', icon: '🏪', group: 'casa' },
  { id: 'carros', name: 'Carros', icon: '🚗', group: 'veiculos' },
  { id: 'motos', name: 'Motos', icon: '🏍️', group: 'veiculos' },
  { id: 'bicicletas', name: 'Bicicletas', icon: '🚲', group: 'veiculos' },
  { id: 'barcos', name: 'Barcos', icon: '⛵', group: 'veiculos' },
  { id: 'avioes', name: 'Aviões', icon: '✈️', group: 'veiculos' },
  { id: 'pets', name: 'Animais', icon: '🐶', group: 'outros' },
  { id: 'especiais', name: 'Especiais', icon: '✨', group: 'outros' },
];

type W = [id: string, name: string, icon: string, price: number];

const wear = (cat: ItemCategory, slot: 'top' | 'bottom' | 'shoes' | 'acc', list: W[], dress = false, hidden = false): ShopItem[] =>
  list.map(([id, name, icon, price]) => ({ id: `w-${id}`, name, cat, price, icon, hidden, data: { kind: 'wear', slot, style: id, dress } }));

export const TOPS: W[] = [
  ['camiseta', 'Camiseta', '👕', 15], ['regata', 'Regata', '🎽', 12], ['moletom', 'Moletom fofinho', '🧥', 30],
  ['blusa-babado', 'Blusa de babado', '👚', 25], ['jaqueta', 'Jaqueta', '🧥', 40], ['listrada', 'Blusa listrada', '👕', 20],
  ['estrela', 'Camiseta estrela', '⭐', 22], ['coracao', 'Camiseta coração', '💗', 22], ['sueter', 'Suéter de inverno', '🧶', 35],
];
export const DRESSES: W[] = [
  ['vestido', 'Vestido simples', '👗', 30], ['vestido-princesa', 'Vestido de princesa', '👸', 80], ['vestido-babados', 'Vestido de babados', '💃', 50],
  ['vestido-floral', 'Vestido florido', '🌸', 45], ['macacao', 'Macacão', '🩱', 35], ['vestido-fada', 'Vestido de fada', '🧚', 70],
];
export const BOTTOMS: W[] = [
  ['shorts', 'Shorts', '🩳', 12], ['saia', 'Saia', '👗', 15], ['calca', 'Calça jeans', '👖', 25], ['legging', 'Legging', '🩰', 15],
  ['saia-tutu', 'Saia tutu', '🩰', 30], ['bermuda', 'Bermuda de praia', '🩳', 12],
];
export const SHOES: W[] = [
  ['tenis', 'Tênis', '👟', 30], ['tenis-luz', 'Tênis de luzinha', '✨', 60], ['botas', 'Botas', '👢', 40], ['sandalia', 'Sandália', '👡', 20],
  ['sapatilha', 'Sapatilha', '🥿', 25], ['galocha', 'Galocha de chuva', '🥾', 25], ['patins', 'Patins (super rápida!)', '⛸️', 90],
];
export const BAGS: W[] = [
  ['bolsa-coracao', 'Bolsa de coração', '👛', 30], ['mochila', 'Mochila', '🎒', 35], ['bolsa-estrela', 'Bolsa de estrela', '👜', 30],
  ['pochete', 'Pochete', '👝', 20], ['mochila-unicornio', 'Mochila de unicórnio', '🦄', 60],
];
export const ACCS: W[] = [
  ['laco', 'Laço', '🎀', 10], ['tiara', 'Tiara', '👑', 15], ['coroa', 'Coroa de princesa', '👑', 70], ['oculos-coracao', 'Óculos de coração', '😎', 25],
  ['chapeu-sol', 'Chapéu de sol', '👒', 25], ['bone', 'Boné', '🧢', 15], ['fones-gato', 'Fones de gatinho', '🎧', 40], ['colar', 'Colar de pérolas', '📿', 30],
  ['asas-fada', 'Asas de fada', '🧚', 80], ['capa', 'Capa de heroína', '🦸', 50], ['orelhas-coelho', 'Orelhas de coelho', '🐰', 20], ['flor-cabelo', 'Flor no cabelo', '🌺', 10],
];
export const ROLE_ACCS: W[] = [
  ['chapeu-chef', 'Chapéu de chef', '👩‍🍳', 0], ['capacete', 'Capacete de bombeira', '⛑️', 0], ['quepe', 'Quepe de policial', '👮', 0],
  ['estetoscopio', 'Estetoscópio', '🩺', 0], ['antena', 'Antena de robô', '📡', 0], ['coroa-arcoiris', 'Coroa Arco-íris', '🌈', 0],
  ['asas-arcoiris', 'Asas Arco-íris', '🌈', 0],
];
export const ROLE_TOPS: W[] = [['jaleco', 'Jaleco', '🥼', 0], ['uniforme', 'Uniforme', '👔', 0], ['avental', 'Avental', '🧑‍🍳', 0]];

export const TOYS: [string, string, string, number][] = [
  ['bola', 'Bola', '⚽', 10], ['pipa', 'Pipa', '🪁', 15], ['balao', 'Balão', '🎈', 5], ['ursinho', 'Ursinho', '🧸', 20],
  ['varinha', 'Varinha mágica', '🪄', 40], ['bolhas', 'Bolhas de sabão', '🫧', 10], ['ioio', 'Ioiô', '🪀', 8], ['microfone', 'Microfone', '🎤', 30],
  ['camera', 'Câmera de fotos', '📷', 30], ['sorvete', 'Sorvete', '🍦', 5], ['pipoca', 'Pipoca', '🍿', 5], ['algodao', 'Algodão-doce', '🍭', 5],
];

const vehicleItems = (cat: ItemCategory, list: [VehicleType, number, string][]): ShopItem[] =>
  list.map(([vt, price, color]) => ({
    id: `v-${vt}`, name: VEHICLES[vt].name, cat, price, icon: VEHICLES[vt].icon, data: { kind: 'vehicle', vtype: vt, color },
  }));

export const CATALOG: ShopItem[] = [
  ...wear('roupas', 'top', TOPS),
  ...wear('roupas', 'bottom', BOTTOMS),
  ...wear('vestidos', 'top', DRESSES, true),
  ...wear('calcados', 'shoes', SHOES),
  ...wear('bolsas', 'acc', BAGS),
  ...wear('acessorios', 'acc', ACCS),
  ...wear('especiais', 'acc', ROLE_ACCS.slice(5), false, true),
  ...TOYS.map(([id, name, icon, price]): ShopItem => ({ id: `t-${id}`, name, cat: 'brinquedos', price, icon, data: { kind: 'toy', toy: id } })),
  ...MODELS.map((m): ShopItem => ({ id: `b-${m.id}`, name: m.name, cat: m.cat, price: m.price, icon: m.icon, data: { kind: 'build', model: m.id, color: m.color } })),
  ...vehicleItems('carros', [['carro', 300, '#ff5fa2'], ['esportivo', 800, '#e63946'], ['suv', 500, '#5ab0ff'], ['caminhonete', 550, '#3ccf91'], ['conversivel', 650, '#ffd23f'], ['carrinho', 200, '#ffffff'], ['trator', 400, '#3ccf91']]),
  ...vehicleItems('motos', [['moto', 350, '#9d4edd']]),
  ...vehicleItems('bicicletas', [['bicicleta', 80, '#ff8fc7'], ['patinete', 50, '#5ad1ff']]),
  ...vehicleItems('barcos', [['barco', 400, '#ffffff'], ['lancha', 700, '#ff7b54'], ['jetski', 450, '#ffd23f']]),
  ...vehicleItems('avioes', [['aviao', 1000, '#ffffff'], ['jatinho', 1600, '#ffc2d9'], ['helicoptero', 1200, '#5ab0ff']]),
  ...(Object.keys(PETS) as PetSpecies[]).map((sp): ShopItem => ({
    id: `p-${sp}`, name: PETS[sp].name, cat: 'pets', price: PETS[sp].price, icon: PETS[sp].icon, data: { kind: 'pet', species: sp, color: PETS[sp].colors[0] },
  })),
];

export const ITEM_MAP: Record<string, ShopItem> = Object.fromEntries(CATALOG.map((i) => [i.id, i]));

export const ALL_WEAR = {
  top: [...TOPS, ...DRESSES, ...ROLE_TOPS],
  bottom: BOTTOMS,
  shoes: SHOES,
  acc: [...ACCS, ...BAGS, ...ROLE_ACCS],
};
export const isDress = (style: string) => DRESSES.some((d) => d[0] === style);
export const BAG_STYLES = BAGS.map((b) => b[0]);
