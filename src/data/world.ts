import type { BuildingDef, HouseConfig, PropertyDef, HouseStyle } from '../types';

// ===================== MAPA DO MUNDO =====================
// Eixo X: oeste(-) → leste(+). Eixo Z: norte(-) → sul(+). Mar ao sul.
export const WORLD_HALF = 395;
export const SEA_Z = 232; // onde começa a água
export const BEACH_Z = 168;
export const WATER_LEVEL = -0.15;

export interface Road { x1: number; z1: number; x2: number; z2: number; w: number }
export const ROADS: Road[] = [
  // avenidas norte-sul
  { x1: -130, z1: -375, x2: -130, z2: 160, w: 10 },
  { x1: 0, z1: -375, x2: 0, z2: 160, w: 12 },
  { x1: 130, z1: -375, x2: 130, z2: 160, w: 10 },
  { x1: -260, z1: -165, x2: -260, z2: 160, w: 9 },
  // ruas leste-oeste
  { x1: -390, z1: -170, x2: 390, z2: -170, w: 10 },
  { x1: -390, z1: -60, x2: 135, z2: -60, w: 10 },
  { x1: -390, z1: 50, x2: 135, z2: 50, w: 10 },
  { x1: -390, z1: 160, x2: 390, z2: 160, w: 10 },
  // acesso ao porto e aeroporto
  { x1: 300, z1: 160, x2: 300, z2: 205, w: 9 },
  { x1: 200, z1: -170, x2: 200, z2: -205, w: 9 },
];

export interface Island { id: string; name: string; x: number; z: number; r: number; color: string }
export const ISLANDS: Island[] = [
  { id: 'unicornios', name: 'Ilha dos Unicórnios', x: -220, z: 320, r: 30, color: '#ffe3f1' },
  { id: 'tesouro', name: 'Ilha do Tesouro', x: 40, z: 335, r: 22, color: '#ffe7a6' },
  { id: 'chocolate', name: 'Ilha do Vulcão de Chocolate', x: 240, z: 345, r: 32, color: '#d9b38c' },
  { id: 'nuvem', name: 'Ilhota das Estrelas', x: -60, z: 395, r: 16, color: '#e8e4ff' },
];

export interface Zone { id: string; name: string; icon: string; x: number; z: number; w: number; d: number; ground: string }
export const ZONES: Zone[] = [
  { id: 'centro', name: 'Centro da Cidade', icon: '🏙️', x: 0, z: -5, w: 260, d: 330, ground: '#79c95a' },
  { id: 'bairro', name: 'Bairro das Flores', icon: '🏡', x: -262, z: -5, w: 250, d: 330, ground: '#6fc451' },
  { id: 'condominio', name: 'Condomínio Jardim Encantado', icon: '🏘️', x: -195, z: 105, w: 120, d: 100, ground: '#66c04e' },
  { id: 'parque', name: 'Parque de Diversões Arco-Íris', icon: '🎡', x: 260, z: -5, w: 240, d: 100, ground: '#7fd08a' },
  { id: 'fazenda', name: 'Fazendinha Feliz', icon: '🐄', x: 260, z: 105, w: 240, d: 100, ground: '#a8d65e' },
  { id: 'castelo', name: 'Reino do Castelo & Floresta', icon: '🏰', x: -260, z: -275, w: 250, d: 200, ground: '#55a845' },
  { id: 'futuro', name: 'Cidade do Futuro', icon: '🚀', x: 0, z: -275, w: 250, d: 200, ground: '#9fb4f5' },
  { id: 'aeroporto', name: 'Aeroporto Nuvem Azul', icon: '✈️', x: 260, z: -275, w: 250, d: 200, ground: '#8fbf7c' },
  { id: 'praia', name: 'Praia do Sol', icon: '🏖️', x: 0, z: 200, w: 790, d: 64, ground: '#f3d27a' },
  { id: 'porto', name: 'Porto das Gaivotas', icon: '⚓', x: 330, z: 215, w: 120, d: 60, ground: '#f3d27a' },
];

// ----------------------- Prédios do Centro e outros -----------------------
const B = (
  id: string, name: string, type: string, icon: string, x: number, z: number, w: number, h: number, d: number, rot: number,
  color: string, roof: string, trim: string, zone = 'centro',
): BuildingDef => ({ id, name, type, icon, pos: [x, z], size: [w, h, d], rot, color, roof, trim, zone });

const S = 0; // porta para o sul (+z)
const N = Math.PI; // porta para o norte (-z)
const E = Math.PI / 2; // porta para leste (+x)
const Wd = -Math.PI / 2; // porta para oeste (-x)

export const BUILDINGS: BuildingDef[] = [
  B('escola', 'Escola Estrelinha', 'escola', '🏫', -95, -108, 36, 7, 26, S, '#ffd23f', '#e63946', '#ffffff'),
  B('hospital', 'Hospital Coração', 'hospital', '🏥', -35, -108, 34, 8, 26, S, '#ffffff', '#5ab0ff', '#e63946'),
  B('cinema', 'Cine Pipoca', 'cinema', '🎬', 35, -108, 32, 8, 26, S, '#9d4edd', '#2b2d42', '#ffd23f'),
  B('academia', 'Academia Pula-Pula', 'academia', '🏋️', 95, -108, 28, 6, 22, S, '#ff7b54', '#4a4e57', '#ffffff'),
  B('shopping', 'Shopping Brilho', 'shopping', '🛍️', -65, -2, 64, 9, 40, S, '#ff8fc7', '#9d4edd', '#ffffff'),
  B('mercado', 'Supermercado Cestinha', 'mercado', '🛒', -95, 82, 34, 6, 26, N, '#3ccf91', '#ffffff', '#ffd23f'),
  B('petshop', 'Pet Shop Patinhas', 'petshop', '🐾', -35, 80, 26, 5.5, 22, N, '#3ccf91', '#ff5fa2', '#ffffff'),
  B('salao', 'Salão Beleza Mágica', 'salao', '💇', -95, 132, 24, 5, 18, S, '#ff6fb5', '#7b2cbf', '#ffffff'),
  B('policia', 'Delegacia Amiga', 'policia', '🚓', -35, 132, 26, 5.5, 18, S, '#4a7bff', '#2b2d42', '#ffffff'),
  B('restaurante', 'Restaurante Panelinha', 'restaurante', '🍝', 35, 82, 28, 6, 22, N, '#ff8a3d', '#c0392b', '#fff3a6'),
  B('cafeteria', 'Cafeteria Nuvem de Leite', 'cafeteria', '☕', 95, 80, 22, 5, 18, N, '#b07a4f', '#ff8fc7', '#ffffff'),
  B('bombeiros', 'Corpo de Bombeiros', 'bombeiros', '🚒', 35, 132, 28, 7, 20, S, '#e63946', '#ffffff', '#ffd23f'),
  B('sorveteria', 'Sorveteria Geladinha', 'sorveteria', '🍦', 95, 132, 18, 5, 16, S, '#5ad1ff', '#ff5fa2', '#ffffff'),
  B('concessionaria', 'Concessionária Vrum-Vrum', 'concessionaria', '🚗', 180, -110, 36, 7, 26, S, '#5ab0ff', '#1d4fbf', '#ffffff', 'parque'),
  B('estudio', 'Estúdio de Música e Arte', 'estudio', '🎤', 240, -110, 28, 7, 22, S, '#b07cff', '#ff2f8a', '#ffffff', 'parque'),
  B('biblioteca', 'Biblioteca Mundo dos Livros', 'biblioteca', '📚', 320, -110, 26, 7, 22, S, '#ff9fc9', '#6b3d24', '#ffffff', 'parque'),
  B('terminal', 'Terminal do Aeroporto', 'terminal', '🛫', 220, -222, 56, 9, 26, S, '#e0f4ff', '#5ab0ff', '#ffffff', 'aeroporto'),
  B('hangar', 'Hangar', 'hangar', '🛩️', 330, -225, 34, 10, 26, S, '#9aa0a6', '#4a4e57', '#ffd23f', 'aeroporto'),
  B('celeiro', 'Celeiro da Fazenda', 'celeiro', '🌾', 210, 75, 26, 9, 18, N, '#e63946', '#ffffff', '#ffffff', 'fazenda'),
  B('mercado-peixe', 'Mercado do Porto', 'porto', '🐟', 335, 188, 22, 5, 14, Wd, '#5ad1ff', '#ffffff', '#2f6fdf', 'porto'),
  B('clube', 'Clube da Piscina', 'clube', '🏊', -170, 140, 24, 5, 12, N, '#ffffff', '#5ab0ff', '#ffd23f', 'condominio'),
  B('lab', 'Laboratório Estelar', 'lab', '🔭', -55, -250, 30, 10, 24, S, '#e0f4ff', '#9d4edd', '#5ad1ff', 'futuro'),
  B('robos', 'Loja de Robôs', 'robos', '🤖', 55, -250, 26, 8, 20, S, '#9fb4f5', '#5ad1ff', '#ff5fa2', 'futuro'),
];

// ----------------------- Casas & Terrenos -----------------------
const house = (style: HouseStyle, name: string, rooms: number, floors: number, wall: string, roof: string, extra: Partial<HouseConfig> = {}): HouseConfig => ({
  style, name, rooms, depth: 10, floors, wallColor: wall, roofColor: roof, floorColor: '#e8d5b7',
  pool: false, garden: true, garage: false, furnished: true, ...extra,
});

const PRESETS: (HouseConfig | null)[] = [
  house('casa', 'Casinha Rosa', 2, 1, '#ff9fc9', '#c0392b'),
  house('chale', 'Chalé de Madeira', 2, 2, '#b07a4f', '#4a2c1a'),
  null,
  house('moderna', 'Casa Moderna', 3, 2, '#ffffff', '#4a4e57', { garage: true }),
  house('casa', 'Casa Azul', 2, 1, '#5ab0ff', '#1d4fbf'),
  null,
  house('casa', 'Casa Amarela', 2, 2, '#ffd23f', '#e8553a'),
  house('castelinho', 'Castelinho Lilás', 2, 2, '#c9a7ff', '#7b2cbf'),
  house('praia', 'Casa de Verão', 3, 1, '#6fe0b8', '#1d8fbf', { pool: true }),
  null,
  house('casa', 'Casa Menta', 2, 1, '#8fe0b0', '#1f7a4d'),
  house('mansao', 'Mansão das Estrelas', 4, 3, '#fff1d6', '#7b2cbf', { pool: true, garage: true }),
];

const prices: Record<HouseStyle, number> = { casa: 800, chale: 1000, moderna: 1500, praia: 1300, castelinho: 1800, mansao: 4000 };

function genProperties(): PropertyDef[] {
  const list: PropertyDef[] = [];
  let n = 0;
  const rows: { z: number; rot: number; street: string; xs: number[] }[] = [
    { z: -142, rot: Math.PI, street: 'Rua das Margaridas', xs: [-365, -335, -305, -215, -185, -155] },
    { z: -82, rot: 0, street: 'Rua das Margaridas', xs: [-365, -335, -305, -215, -185, -155] },
    { z: -38, rot: Math.PI, street: 'Rua dos Girassóis', xs: [-365, -335, -305, -215, -185, -155] },
    { z: 28, rot: 0, street: 'Rua dos Girassóis', xs: [-365, -335, -305, -215, -185, -155] },
    { z: 72, rot: Math.PI, street: 'Rua das Tulipas', xs: [-365, -335, -305] },
    { z: 138, rot: 0, street: 'Rua das Tulipas', xs: [-365, -335, -305] },
  ];
  for (const r of rows) {
    for (const x of r.xs) {
      const preset = PRESETS[n % PRESETS.length];
      const big = preset?.style === 'mansao';
      list.push({
        id: `lote-${n}`,
        name: preset ? preset.name : 'Terreno livre',
        area: r.street,
        pos: [x, r.z],
        rot: r.rot,
        lot: big ? [28, 30] : [26, 30],
        price: preset ? prices[preset.style] : 300,
        preset: preset ? { ...preset } : null,
      });
      n++;
    }
  }
  // Condomínio fechado
  const condo: [number, number, number, HouseConfig | null][] = [
    [-238, 75, 0, house('casa', 'Casa Lavanda', 2, 2, '#c9a7ff', '#7b2cbf')],
    [-210, 75, 0, house('moderna', 'Casa Aurora', 2, 2, '#ffcf9f', '#e8553a', { pool: true })],
    [-182, 75, 0, house('chale', 'Chalé Encantado', 2, 1, '#ffb3c6', '#6b3d24')],
    [-238, 120, Math.PI / 2, null],
    [-210, 120, Math.PI / 2, house('mansao', 'Mansão Arco-Íris', 3, 3, '#ffffff', '#ff5fa2', { pool: true, garage: true })],
  ];
  condo.forEach(([x, z, rot, preset], i) => list.push({
    id: `condo-${i}`, name: preset ? preset.name : 'Terreno no condomínio', area: 'Condomínio Jardim Encantado',
    pos: [x, z], rot, lot: [26, 34], price: preset ? prices[preset.style] + 500 : 600, preset,
  }));
  // Casa de praia
  list.push({ id: 'praia-0', name: 'Casa de Praia Concha', area: 'Praia do Sol', pos: [-330, 196], rot: 0, lot: [28, 30], price: 2200, preset: house('praia', 'Casa de Praia Concha', 3, 2, '#ffffff', '#5ad1ff', { pool: true }) });
  list.push({ id: 'praia-1', name: 'Terreno pé na areia', area: 'Praia do Sol', pos: [-290, 196], rot: 0, lot: [28, 30], price: 800, preset: null });
  return list;
}

export const PROPERTIES: PropertyDef[] = genProperties();

// ----------------------- Pontos do mapa (viagem rápida) -----------------------
export interface Place { id: string; name: string; icon: string; x: number; z: number; zone: string }
export const PLACES: Place[] = [
  { id: 'praca', name: 'Praça Central', icon: '⛲', x: 65, z: 0, zone: 'centro' },
  ...BUILDINGS.map((b) => {
    const [x, z] = b.pos;
    const d = b.size[2] / 2 + 4;
    return { id: b.id, name: b.name, icon: b.icon, x: x + Math.sin(b.rot) * d, z: z + Math.cos(b.rot) * d, zone: b.zone };
  }),
  { id: 'bairro', name: 'Bairro das Flores', icon: '🏡', x: -260, z: -60, zone: 'bairro' },
  { id: 'condominio', name: 'Condomínio', icon: '🏘️', x: -200, z: 50, zone: 'condominio' },
  { id: 'parque-diversoes', name: 'Parque de Diversões', icon: '🎡', x: 200, z: -5, zone: 'parque' },
  { id: 'fazenda', name: 'Fazendinha', icon: '🐄', x: 260, z: 105, zone: 'fazenda' },
  { id: 'castelo', name: 'Castelo', icon: '🏰', x: -260, z: -235, zone: 'castelo' },
  { id: 'floresta', name: 'Floresta Encantada', icon: '🌲', x: -330, z: -320, zone: 'castelo' },
  { id: 'futuro', name: 'Cidade do Futuro', icon: '🚀', x: 0, z: -210, zone: 'futuro' },
  { id: 'aeroporto', name: 'Pista do Aeroporto', icon: '✈️', x: 200, z: -280, zone: 'aeroporto' },
  { id: 'praia', name: 'Praia do Sol', icon: '🏖️', x: 0, z: 200, zone: 'praia' },
  { id: 'porto', name: 'Porto', icon: '⚓', x: 310, z: 205, zone: 'porto' },
  ...ISLANDS.map((i) => ({ id: `ilha-${i.id}`, name: i.name, icon: '🏝️', x: i.x, z: i.z - i.r + 6, zone: 'ilhas' })),
];

export const SPAWN: [number, number, number] = [65, 0, 30];

export function zoneAt(x: number, z: number): string {
  for (const i of ISLANDS) if (Math.hypot(x - i.x, z - i.z) < i.r + 4) return i.name;
  if (z > SEA_Z + 4) return 'Mar';
  for (const zn of ZONES.slice().reverse()) {
    if (Math.abs(x - zn.x) <= zn.w / 2 && Math.abs(z - zn.z) <= zn.d / 2) return zn.name;
  }
  return 'Mundo da Maitê';
}
