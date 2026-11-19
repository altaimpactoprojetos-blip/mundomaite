import { box, cyl, ball, iso, shade, poly, type Cam, TW, TH, WALL_H } from './iso';

export interface PFurni { uid: string; type: string; x: number; y: number; rot: 0 | 1; color?: string; on?: boolean; wall?: 'L' | 'R'; wpos?: number; t0?: number }
export type FurniCat = 'presentes' | 'fazenda' | 'quarto' | 'sala' | 'cozinha' | 'banheiro' | 'jardim' | 'diversao' | 'especiais' | 'parede';
export interface FurniDef {
  id: string; name: string; cat: FurniCat; w: number; d: number; color: string;
  use?: 'sit' | 'lay' | 'toggle' | 'dance' | 'snack' | 'swim' | 'look' | 'jump' | 'farm'; walk?: boolean; wall?: boolean; gift?: boolean; span?: number;
  draw: (g: CanvasRenderingContext2D, cam: Cam, f: PFurni, W: number, D: number, t: number) => void;
}

export const FURNI_CATS: { id: FurniCat; name: string; icon: string }[] = [
  { id: 'presentes', name: 'Presentes', icon: '🎁' },
  { id: 'fazenda', name: 'Fazenda', icon: '🚜' },
  { id: 'quarto', name: 'Quarto', icon: '🛏️' }, { id: 'sala', name: 'Sala', icon: '🛋️' }, { id: 'cozinha', name: 'Cozinha', icon: '🍳' },
  { id: 'banheiro', name: 'Banheiro', icon: '🛁' }, { id: 'jardim', name: 'Jardim', icon: '🌷' }, { id: 'diversao', name: 'Diversão', icon: '🎉' },
  { id: 'especiais', name: 'Especiais', icon: '✨' }, { id: 'parede', name: 'Parede', icon: '🖼️' },
];

const WOOD = '#b07a4f';
const WHITE = '#f4f1ec';

const F = (id: string, name: string, cat: FurniCat, w: number, d: number, color: string, draw: FurniDef['draw'], extra: Partial<FurniDef> = {}): FurniDef => ({ id, name, cat, w, d, color, draw, ...extra });

// Atalhos de desenho em coordenadas locais do móvel
function H(g: CanvasRenderingContext2D, cam: Cam, f: PFurni) {
  return {
    B: (x: number, y: number, z: number, w: number, d: number, h: number, c: string) => box(g, cam, f.x + x, f.y + y, z, w, d, h, c),
    C: (x: number, y: number, z: number, r: number, h: number, c: string) => cyl(g, cam, f.x + x, f.y + y, z, r, h, c),
    O: (x: number, y: number, z: number, r: number, c: string) => ball(g, cam, f.x + x, f.y + y, z, r, c),
  };
}

export const FURNI: FurniDef[] = [
  // ---------------- Quarto ----------------
  F('cama', 'Cama', 'quarto', 1, 2, '#ff8fc7', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.05, 0.05, 0, W - 0.1, D - 0.1, 8, WOOD);
    B(0.08, 0.08, 8, W - 0.16, D - 0.16, 4, WHITE);
    if (f.rot) { B(0.08, 0.08, 12, W * 0.55, D - 0.16, 2, f.color!); B(W - 0.35, 0.15, 12, 0.25, D - 0.3, 4, WHITE); B(W - 0.12, 0.05, 0, 0.08, D - 0.1, 22, WOOD); }
    else { B(0.08, 0.08, 12, W - 0.16, D * 0.55, 2, f.color!); B(0.15, D - 0.35, 12, W - 0.3, 0.25, 4, WHITE); B(0.05, D - 0.12, 0, W - 0.1, 0.08, 22, WOOD); }
  }, { use: 'lay' }),
  F('cama-princesa', 'Cama de princesa', 'quarto', 2, 2, '#ffb3d9', (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 9, '#ffffff');
    B(0.12, 0.12, 9, W - 0.24, D - 0.24, 4, f.color!);
    B(0.3, 0.2, 13, 0.6, 0.4, 4, WHITE); B(1.1, 0.2, 13, 0.6, 0.4, 4, WHITE);
    for (const [x, y] of [[0.1, 0.1], [W - 0.2, 0.1], [0.1, D - 0.2], [W - 0.2, D - 0.2]]) B(x, y, 0, 0.1, 0.1, 46, '#ffd23f');
    box(g, cam, f.x + 0.05, f.y + 0.05, 46, W - 0.1, D - 0.1, 3, shade(f.color!, 1.1));
    C(W / 2, D / 2, 49, 0.25, 6, '#ffd23f');
  }, { use: 'lay' }),
  F('guarda-roupa', 'Guarda-roupa', 'quarto', 1, 1, WHITE, (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 50, f.color!);
    const a = iso(cam, f.x + W - 0.1, f.y + 0.5, 26), b = iso(cam, f.x + 0.5, f.y + D - 0.1, 26);
    g.fillStyle = '#ffd23f'; g.fillRect(a.x - 1, a.y, 2, 4); g.fillRect(b.x - 1, b.y, 2, 4);
  }),
  F('abajur', 'Abajur', 'quarto', 1, 1, '#ffe066', (g, cam, f, _W, _D, t) => {
    const { C } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.18, 2, WOOD); C(0.5, 0.5, 2, 0.04, 22, WOOD);
    C(0.5, 0.5, 22, 0.22, 10, f.on ? '#fff6b0' : f.color!);
    if (f.on) { const c = iso(cam, f.x + 0.5, f.y + 0.5, 26); const gr = g.createRadialGradient(c.x, c.y, 2, c.x, c.y, 34 + Math.sin(t * 3) * 2); gr.addColorStop(0, 'rgba(255,240,150,0.45)'); gr.addColorStop(1, 'rgba(255,240,150,0)'); g.fillStyle = gr; g.fillRect(c.x - 40, c.y - 40, 80, 80); }
  }, { use: 'toggle' }),
  F('tapete', 'Tapete fofinho', 'quarto', 2, 2, '#d4b8ff', (g, cam, f, W, D) => {
    box(g, cam, f.x + 0.1, f.y + 0.1, 0, W - 0.2, D - 0.2, 1, f.color!);
    box(g, cam, f.x + 0.4, f.y + 0.4, 1, W - 0.8, D - 0.8, 0, shade(f.color!, 1.25), false);
  }, { walk: true }),
  F('bau', 'Baú de brinquedos', 'quarto', 1, 1, '#ff7b54', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.15, 0.2, 0, W - 0.3, D - 0.4, 12, f.color!); B(0.12, 0.17, 12, W - 0.24, D - 0.34, 4, shade(f.color!, 0.85));
    B(0.45, D - 0.25, 6, 0.1, 0.05, 4, '#ffd23f');
  }),
  F('escrivaninha', 'Escrivaninha', 'quarto', 2, 1, WHITE, (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.1, 0, 0.1, D - 0.2, 18, f.color!); B(W - 0.2, 0.1, 0, 0.1, D - 0.2, 18, f.color!);
    B(0.05, 0.05, 18, W - 0.1, D - 0.1, 3, f.color!);
    B(W * 0.55, D * 0.3, 21, 0.4, 0.3, 8, '#5ab0ff');
  }),
  // ---------------- Sala ----------------
  F('sofa', 'Sofá', 'sala', 2, 1, '#ff8fc7', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.05, 0.1, 0, W - 0.1, D - 0.2, 10, f.color!);
    if (f.rot) { B(0.05, 0.1, 10, 0.25, D - 0.2, 12, shade(f.color!, 0.95)); B(0.3, 0.05, 10, W - 0.35, 0.2, 6, f.color!); B(0.3, D - 0.25, 10, W - 0.35, 0.2, 6, f.color!); }
    else { B(0.05, 0.1, 10, W - 0.1, 0.25, 12, shade(f.color!, 0.95)); B(0.05, 0.35, 10, 0.2, D - 0.45, 6, f.color!); B(W - 0.25, 0.35, 10, 0.2, D - 0.45, 6, f.color!); }
  }, { use: 'sit' }),
  F('poltrona', 'Poltrona', 'sala', 1, 1, '#9d4edd', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 10, f.color!);
    if (f.rot) B(0.1, 0.1, 10, 0.25, D - 0.2, 12, shade(f.color!, 0.9)); else B(0.1, 0.1, 10, W - 0.2, 0.25, 12, shade(f.color!, 0.9));
  }, { use: 'sit' }),
  F('cadeira', 'Cadeira', 'sala', 1, 1, WOOD, (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    for (const [x, y] of [[0.25, 0.25], [0.7, 0.25], [0.25, 0.7], [0.7, 0.7]]) B(x, y, 0, 0.06, 0.06, 10, f.color!);
    B(0.22, 0.22, 10, 0.56, 0.56, 2, f.color!);
    if (f.rot) B(0.22, 0.22, 12, 0.08, 0.56, 14, f.color!); else B(0.22, 0.22, 12, 0.56, 0.08, 14, f.color!);
  }, { use: 'sit' }),
  F('mesa', 'Mesa', 'sala', 2, 1, WOOD, (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    for (const [x, y] of [[0.15, 0.15], [W - 0.25, 0.15], [0.15, D - 0.25], [W - 0.25, D - 0.25]]) B(x, y, 0, 0.1, 0.1, 16, shade(f.color!, 0.9));
    B(0.05, 0.05, 16, W - 0.1, D - 0.1, 3, f.color!);
  }),
  F('mesa-redonda', 'Mesinha redonda', 'sala', 1, 1, WHITE, (g, cam, f) => {
    const { C } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.2, 1, shade(f.color!, 0.8)); C(0.5, 0.5, 1, 0.05, 15, shade(f.color!, 0.8)); C(0.5, 0.5, 16, 0.42, 2, f.color!);
    C(0.5, 0.5, 18, 0.1, 5, '#ff5fa2');
  }),
  F('tv', 'Televisão', 'sala', 2, 1, '#2b2d42', (g, cam, f, W, D, t) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.2, 0, W - 0.2, D - 0.4, 12, WOOD);
    B(0.2, 0.4, 12, W - 0.4, 0.2, 24, f.color!);
    if (f.rot) B(0.4, 0.2, 12, 0.2, D - 0.4, 24, f.color!);
    const scr = f.rot ? [iso(cam, f.x + 0.6, f.y + 0.3, 33), iso(cam, f.x + 0.6, f.y + D - 0.3, 33), iso(cam, f.x + 0.6, f.y + D - 0.3, 15), iso(cam, f.x + 0.6, f.y + 0.3, 15)]
      : [iso(cam, f.x + 0.3, f.y + 0.6, 33), iso(cam, f.x + W - 0.3, f.y + 0.6, 33), iso(cam, f.x + W - 0.3, f.y + 0.6, 15), iso(cam, f.x + 0.3, f.y + 0.6, 15)];
    poly(g, scr, f.on ? `hsl(${(t * 40) % 360},70%,65%)` : '#1a1a2e');
  }, { use: 'toggle' }),
  F('estante', 'Estante de livros', 'sala', 2, 1, WOOD, (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.6, 48, f.color!);
    const cols = ['#ff5f5f', '#ffd23f', '#5ab0ff', '#3ccf91', '#c77dff', '#ff8fc7'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      if (f.rot) box(g, cam, f.x + 0.5, f.y + 0.15 + i * ((D - 0.3) / 6), 6 + r * 14, 0.08, (D - 0.3) / 6 - 0.04, 9 - (i % 3), cols[(i + r) % 6], false);
      else box(g, cam, f.x + 0.15 + i * ((W - 0.3) / 6), f.y + 0.5, 6 + r * 14, (W - 0.3) / 6 - 0.04, 0.08, 9 - (i % 3), cols[(i + r) % 6], false);
    }
  }),
  F('lareira', 'Lareira', 'sala', 2, 1, '#c9c2b8', (g, cam, f, W, D, t) => {
    const { B, O } = H(g, cam, f);
    B(0.05, 0.1, 0, W - 0.1, D - 0.5, 34, f.color!);
    B(0, 0.05, 34, W, D - 0.4, 3, shade(f.color!, 0.9));
    const fl = 4 + Math.sin(t * 10) * 1.5;
    O(W / 2, 0.6, 6 + fl, 0.12, '#ff9f43'); O(W / 2 + 0.15, 0.6, 5, 0.09, '#ffd23f');
  }),
  F('planta', 'Planta grande', 'sala', 1, 1, '#3ccf91', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.22, 10, '#c8603a');
    O(0.5, 0.5, 20, 0.32, f.color!); O(0.35, 0.6, 28, 0.22, shade(f.color!, 1.1)); O(0.62, 0.4, 32, 0.2, shade(f.color!, 0.9));
  }),
  // ---------------- Cozinha ----------------
  F('geladeira', 'Geladeira', 'cozinha', 1, 1, '#eef4f8', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 52, f.color!);
    const a = iso(cam, f.x + W - 0.1, f.y + 0.3, 40); g.fillStyle = '#9aa0a6'; g.fillRect(a.x, a.y, 1, 8);
    const b = iso(cam, f.x + 0.3, f.y + D - 0.1, 40); g.fillRect(b.x, b.y, 1, 8);
  }, { use: 'snack' }),
  F('fogao', 'Fogão', 'cozinha', 1, 1, '#ffffff', (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 20, f.color!);
    for (const [x, y] of [[0.32, 0.32], [0.68, 0.32], [0.32, 0.68], [0.68, 0.68]]) C(x, y, 20, 0.1, 0, '#2b2d42');
  }, { use: 'snack' }),
  F('balcao', 'Balcão', 'cozinha', 2, 1, '#bdf5e0', (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    B(0.05, 0.1, 0, W - 0.1, D - 0.2, 20, f.color!);
    B(0, 0.05, 20, W, D - 0.1, 2, WHITE);
    C(W * 0.7, 0.5, 22, 0.12, 6, '#ff5fa2');
  }),
  F('bolo', 'Bolo de aniversário', 'cozinha', 1, 1, '#ffc2d9', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.35, 10, f.color!); C(0.5, 0.5, 10, 0.25, 8, '#ffffff');
    O(0.5, 0.5, 21, 0.06, '#e63946');
  }, { use: 'snack' }),
  // ---------------- Banheiro ----------------
  F('banheira', 'Banheira', 'banheiro', 2, 1, '#ffffff', (g, cam, f, W, D) => {
    const { B, O } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 14, f.color!);
    box(g, cam, f.x + 0.25, f.y + 0.25, 13, W - 0.5, D - 0.5, 0, '#7fd3ff', false);
    O(0.6, 0.5, 15, 0.1, '#ffffff'); O(0.9, 0.4, 16, 0.08, '#ffffff');
  }),
  F('pia', 'Pia', 'banheiro', 1, 1, '#ffffff', (g, cam, f) => {
    const { C } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.1, 16, '#dfe7ee'); C(0.5, 0.5, 16, 0.32, 4, f.color!);
  }),
  F('espelho', 'Espelho', 'banheiro', 1, 1, '#c7e5ff', (g, cam, f) => {
    const { B } = H(g, cam, f);
    B(0.4, 0.4, 0, 0.2, 0.2, 2, '#ffd23f'); B(0.45, 0.45, 2, 0.1, 0.1, 40, '#ffd23f');
  }),
  // ---------------- Jardim ----------------
  F('arvore', 'Árvore', 'jardim', 1, 1, '#3ccf91', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.1, 26, '#8d5b3a'); O(0.5, 0.5, 40, 0.5, f.color!); O(0.3, 0.6, 50, 0.32, shade(f.color!, 1.1)); O(0.65, 0.35, 54, 0.3, shade(f.color!, 0.92));
  }),
  F('cerejeira', 'Cerejeira', 'jardim', 1, 1, '#ffb3d9', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.1, 26, '#8d5b3a'); O(0.5, 0.5, 40, 0.5, f.color!); O(0.3, 0.6, 50, 0.32, shade(f.color!, 1.1)); O(0.65, 0.35, 54, 0.3, shade(f.color!, 0.92));
  }),
  F('flores', 'Canteiro de flores', 'jardim', 1, 1, '#ff5fa2', (g, cam, f) => {
    box(g, cam, f.x + 0.1, f.y + 0.1, 0, 0.8, 0.8, 4, '#8d5b3a');
    const cols = [f.color!, '#ffd23f', '#ffffff', '#c77dff'];
    for (let i = 0; i < 6; i++) ball(g, cam, f.x + 0.25 + (i % 3) * 0.25, f.y + 0.3 + Math.floor(i / 3) * 0.35, 8, 0.09, cols[i % 4]);
  }),
  F('arbusto', 'Arbusto', 'jardim', 1, 1, '#2fae63', (g, cam, f) => {
    ball(g, cam, f.x + 0.5, f.y + 0.5, 10, 0.4, f.color!); ball(g, cam, f.x + 0.35, f.y + 0.55, 14, 0.25, shade(f.color!, 1.1));
  }),
  F('fonte', 'Fonte', 'jardim', 2, 2, '#c7e5ff', (g, cam, f, W, D, t) => {
    const { C, O } = H(g, cam, f);
    C(W / 2, D / 2, 0, 0.9, 8, '#dcd6cc'); C(W / 2, D / 2, 8, 0.75, 0, '#7fd3ff');
    C(W / 2, D / 2, 8, 0.12, 18, '#dcd6cc'); C(W / 2, D / 2, 26, 0.35, 3, '#dcd6cc');
    O(W / 2, D / 2, 34 + Math.sin(t * 5) * 2, 0.15, '#bfe9ff');
  }),
  F('banco', 'Banco de praça', 'jardim', 2, 1, WOOD, (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.2, 0.3, 0, 0.1, 0.4, 9, '#4a4e57'); B(W - 0.3, 0.3, 0, 0.1, 0.4, 9, '#4a4e57');
    B(0.1, 0.25, 9, W - 0.2, 0.5, 2, f.color!);
    if (f.rot) B(0.1, 0.25, 11, 0.1, D - 0.5, 12, f.color!); else B(0.1, 0.25, 11, W - 0.2, 0.08, 12, f.color!);
  }, { use: 'sit' }),
  F('piscina', 'Piscina', 'jardim', 3, 3, '#5ac8f0', (g, cam, f, W, D, t) => {
    box(g, cam, f.x, f.y, 0, W, D, 3, '#f0f0f0');
    box(g, cam, f.x + 0.2, f.y + 0.2, 3, W - 0.4, D - 0.4, 0, `hsl(195,80%,${58 + Math.sin(t * 2) * 4}%)`, false);
  }, { use: 'swim', walk: true }),
  F('grama', 'Piso de grama', 'jardim', 1, 1, '#79c95a', (g, cam, f) => {
    box(g, cam, f.x, f.y, 0, 1, 1, 0, f.color!, false);
  }, { walk: true }),
  // ---------------- Diversão ----------------
  F('pista-danca', 'Piso de dança', 'diversao', 1, 1, '#ff5fa2', (g, cam, f, _W, _D, t) => {
    const k = Math.floor(t * 3 + f.x * 1.7 + f.y * 2.3) % 4;
    box(g, cam, f.x, f.y, 0, 1, 1, 1, ['#ff5fa2', '#5ab0ff', '#ffd23f', '#3ccf91'][k], false);
  }, { walk: true, use: 'dance' }),
  F('jukebox', 'Caixa de música', 'diversao', 1, 1, '#9d4edd', (g, cam, f, _W, _D, t) => {
    const { B, C } = H(g, cam, f);
    B(0.15, 0.15, 0, 0.7, 0.7, 30, f.color!); C(0.5, 0.5, 30, 0.35, 6, shade(f.color!, 1.2));
    if (f.on) { const c = iso(cam, f.x + 0.5, f.y + 0.5, 46 + Math.sin(t * 4) * 3); g.fillStyle = '#ffffff'; g.font = '8px sans-serif'; g.fillText('♪', c.x - 2, c.y); }
  }, { use: 'toggle' }),
  F('piano', 'Piano', 'diversao', 2, 1, '#2b2d42', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.5, 30, f.color!);
    B(0.1, D - 0.4, 14, W - 0.2, 0.25, 3, '#ffffff');
  }, { use: 'toggle' }),
  F('cama-elastica', 'Cama elástica', 'diversao', 2, 2, '#9d4edd', (g, cam, f, W, D) => {
    const { C } = H(g, cam, f);
    C(W / 2, D / 2, 0, 0.9, 8, '#4a4e57'); C(W / 2, D / 2, 8, 0.8, 1, f.color!); C(W / 2, D / 2, 9, 0.6, 0, '#222831');
  }, { use: 'dance', walk: true }),
  F('ursao', 'Ursinho gigante', 'diversao', 1, 1, '#c8a27a', (g, cam, f) => {
    const { O } = H(g, cam, f);
    O(0.5, 0.5, 10, 0.32, f.color!); O(0.5, 0.5, 26, 0.24, f.color!); O(0.35, 0.5, 34, 0.08, f.color!); O(0.62, 0.42, 34, 0.08, f.color!);
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 27); g.fillStyle = '#222'; g.fillRect(c.x - 3, c.y - 1, 1, 1); g.fillRect(c.x + 2, c.y - 1, 1, 1);
  }),
  F('baloes', 'Balões', 'diversao', 1, 1, '#ff5fa2', (g, cam, f, _W, _D, t) => {
    const cols = [f.color!, '#ffd23f', '#5ab0ff', '#3ccf91'];
    for (let i = 0; i < 4; i++) {
      const z = 40 + i * 5 + Math.sin(t * 2 + i) * 2;
      const c = iso(cam, f.x + 0.5, f.y + 0.5, 0), b = iso(cam, f.x + 0.3 + (i % 2) * 0.35, f.y + 0.3 + Math.floor(i / 2) * 0.35, z);
      g.strokeStyle = '#999'; g.beginPath(); g.moveTo(c.x + 0.5, c.y + 0.5); g.lineTo(b.x + 0.5, b.y + 6); g.stroke();
      ball(g, cam, f.x + 0.3 + (i % 2) * 0.35, f.y + 0.3 + Math.floor(i / 2) * 0.35, z, 0.16, cols[i]);
    }
  }),
  // ---------------- Especiais ----------------
  F('trono', 'Trono real', 'especiais', 1, 1, '#ffd23f', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 12, '#e63946');
    if (f.rot) B(0.1, 0.1, 12, 0.2, D - 0.2, 32, f.color!); else B(0.1, 0.1, 12, W - 0.2, 0.2, 32, f.color!);
  }, { use: 'sit' }),
  F('arco-iris', 'Arco-íris', 'especiais', 3, 1, '#ff5fa2', (g, cam, f, W) => {
    const cols = ['#ff5f5f', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
    const c = iso(cam, f.x + W / 2, f.y + 0.5, 0);
    cols.forEach((col, i) => { g.beginPath(); g.arc(c.x, c.y, 40 - i * 4, Math.PI, 0); g.lineWidth = 4; g.strokeStyle = col; g.stroke(); });
    g.lineWidth = 1;
  }),
  F('estatua-unicornio', 'Estátua de unicórnio', 'especiais', 1, 1, '#ffffff', (g, cam, f) => {
    const { B, O, C } = H(g, cam, f);
    B(0.15, 0.15, 0, 0.7, 0.7, 8, '#d4b8ff');
    O(0.5, 0.5, 20, 0.3, f.color!); O(0.62, 0.38, 32, 0.18, f.color!); C(0.68, 0.32, 38, 0.03, 9, '#ffd23f');
  }),
  F('aquario', 'Aquário', 'especiais', 2, 1, '#5ab0ff', (g, cam, f, W, D, t) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.2, 0, W - 0.2, D - 0.4, 14, WOOD);
    g.globalAlpha = 0.6; B(0.15, 0.25, 14, W - 0.3, D - 0.5, 20, f.color!); g.globalAlpha = 1;
    const c = iso(cam, f.x + W / 2 + Math.sin(t) * 0.4, f.y + 0.5, 22); g.fillStyle = '#ff7b54'; g.fillRect(c.x - 2, c.y, 4, 2);
  }),
  F('neon', 'Coração neon', 'especiais', 1, 1, '#ff5fa2', (g, cam, f, _W, _D, t) => {
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 30);
    g.fillStyle = f.color!; g.shadowColor = f.color!; g.shadowBlur = 6 + Math.sin(t * 4) * 3;
    g.beginPath(); g.arc(c.x - 4, c.y - 4, 5, 0, 7); g.arc(c.x + 4, c.y - 4, 5, 0, 7); g.moveTo(c.x - 9, c.y - 2); g.lineTo(c.x, c.y + 9); g.lineTo(c.x + 9, c.y - 2); g.fill();
    g.shadowBlur = 0;
    box(g, cam, f.x + 0.45, f.y + 0.45, 0, 0.1, 0.1, 22, '#4a4e57');
  }),
  // ---------------- Parede ----------------
  F('quadro', 'Quadro', 'parede', 1, 1, '#5ab0ff', () => undefined, { wall: true }),
  F('janela', 'Janela', 'parede', 1, 1, '#bfe9ff', () => undefined, { wall: true }),
  F('prateleira', 'Prateleira', 'parede', 1, 1, WOOD, () => undefined, { wall: true }),
  F('relogio', 'Relógio', 'parede', 1, 1, '#ffd23f', () => undefined, { wall: true }),
  F('poster', 'Pôster de estrela', 'parede', 1, 1, '#ff8fc7', () => undefined, { wall: true }),
];

// ======================= MAIS MÓVEIS =======================
const MORE: FurniDef[] = [
  // Quarto
  F('beliche', 'Beliche', 'quarto', 1, 2, '#5ab0ff', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    for (const z of [6, 30]) { B(0.08, 0.08, z, W - 0.16, D - 0.16, 5, WHITE); B(0.08, 0.08, z + 5, W - 0.16, D * 0.6, 2, f.color!); }
    for (const [x, y] of [[0.05, 0.05], [W - 0.15, 0.05], [0.05, D - 0.15], [W - 0.15, D - 0.15]]) B(x, y, 0, 0.1, 0.1, 48, WOOD);
  }, { use: 'lay' }),
  F('penteadeira', 'Penteadeira', 'quarto', 1, 1, '#ffc2d9', (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    B(0.1, 0.25, 0, W - 0.2, D - 0.5, 18, f.color!);
    B(0.2, 0.25, 18, W - 0.4, 0.1, 22, '#ffd23f'); B(0.25, 0.27, 21, W - 0.5, 0.06, 16, '#c7e5ff');
    C(0.3, 0.6, 18, 0.06, 4, '#ff5fa2'); C(0.6, 0.6, 18, 0.05, 3, '#9d4edd');
  }, { use: 'look' }),
  F('comoda', 'Cômoda', 'quarto', 2, 1, '#fff3e0', (g, cam, f, W, D) => {
    const { B, O } = H(g, cam, f);
    B(0.1, 0.15, 0, W - 0.2, D - 0.3, 24, f.color!);
    for (const z of [6, 14, 22]) { const a = iso(cam, f.x + W * 0.5, f.y + D - 0.15, z); g.fillStyle = '#ffd23f'; g.fillRect(a.x - 2, a.y, 4, 1); }
    O(W * 0.3, 0.5, 30, 0.12, '#ff8fc7');
  }),
  F('pufe', 'Pufe fofinho', 'quarto', 1, 1, '#c77dff', (g, cam, f) => { const { C } = H(g, cam, f); C(0.5, 0.5, 0, 0.32, 9, f.color!); C(0.5, 0.5, 9, 0.28, 1, shade(f.color!, 1.2)); }, { use: 'sit' }),
  F('casinha-boneca', 'Casinha de boneca', 'quarto', 1, 1, '#ffb3d9', (g, cam, f) => {
    const { B } = H(g, cam, f);
    B(0.15, 0.15, 0, 0.7, 0.7, 18, f.color!);
    poly(g, [iso(cam, f.x + 0.1, f.y + 0.1, 18), iso(cam, f.x + 0.9, f.y + 0.1, 18), iso(cam, f.x + 0.5, f.y + 0.5, 32)], '#9d4edd', '#5a2a7a');
    poly(g, [iso(cam, f.x + 0.9, f.y + 0.1, 18), iso(cam, f.x + 0.9, f.y + 0.9, 18), iso(cam, f.x + 0.5, f.y + 0.5, 32)], shade('#9d4edd', 0.75), '#5a2a7a');
    const d = iso(cam, f.x + 0.5, f.y + 0.85, 8); g.fillStyle = '#5a3a26'; g.fillRect(d.x - 2, d.y - 4, 4, 6);
  }),
  F('estante-brinquedos', 'Estante de brinquedos', 'quarto', 2, 1, '#7ee8c7', (g, cam, f, W, D) => {
    const { B, O } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.6, 36, f.color!);
    const cols = ['#ff5f5f', '#ffd23f', '#5ab0ff', '#ff8fc7'];
    for (let i = 0; i < 4; i++) O(0.35 + i * 0.42, 0.55, 14 + (i % 2) * 14, 0.1, cols[i]);
  }),
  // Sala
  F('sofa-grande', 'Sofá grande', 'sala', 3, 1, '#ff7b54', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.05, 0.1, 0, W - 0.1, D - 0.2, 10, f.color!);
    if (f.rot) B(0.05, 0.1, 10, 0.25, D - 0.2, 13, shade(f.color!, 0.92)); else B(0.05, 0.1, 10, W - 0.1, 0.25, 13, shade(f.color!, 0.92));
    for (let i = 0; i < 3; i++) if (!f.rot) B(0.15 + i, 0.35, 10, 0.8, 0.5, 2, shade(f.color!, 1.15)); else B(0.35, 0.15 + i, 10, 0.5, 0.8, 2, shade(f.color!, 1.15));
  }, { use: 'sit' }),
  F('mesa-centro', 'Mesa de centro', 'sala', 2, 1, WOOD, (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    B(0.15, 0.2, 0, W - 0.3, D - 0.4, 8, shade(f.color!, 0.85)); B(0.1, 0.15, 8, W - 0.2, D - 0.3, 2, f.color!);
    C(W * 0.35, 0.5, 10, 0.08, 4, '#5ab0ff'); C(W * 0.65, 0.5, 10, 0.1, 2, '#ffd23f');
  }),
  F('rack-som', 'Caixa de som', 'sala', 1, 1, '#2b2d42', (g, cam, f, _W, _D, t) => {
    const { B, C } = H(g, cam, f);
    B(0.2, 0.2, 0, 0.6, 0.6, 26, f.color!);
    const p = 1 + (f.on ? Math.sin(t * 12) * 0.15 : 0);
    C(0.5, 0.82, 16, 0.12 * p, 0, '#9aa0a6'); C(0.5, 0.82, 7, 0.08 * p, 0, '#9aa0a6');
  }, { use: 'toggle' }),
  F('luminaria', 'Luminária de chão', 'sala', 1, 1, '#ffffff', (g, cam, f, _W, _D, t) => {
    const { C } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.2, 2, '#4a4e57'); C(0.5, 0.5, 2, 0.03, 40, '#4a4e57'); C(0.5, 0.5, 40, 0.26, 8, f.on ? '#fff6b0' : f.color!);
    if (f.on) { const c = iso(cam, f.x + 0.5, f.y + 0.5, 30); const gr = g.createRadialGradient(c.x, c.y, 2, c.x, c.y, 40 + Math.sin(t * 2)); gr.addColorStop(0, 'rgba(255,240,170,0.35)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(c.x - 45, c.y - 45, 90, 90); }
  }, { use: 'toggle' }),
  F('tapete-redondo', 'Tapete redondo', 'sala', 2, 2, '#ffd23f', (g, cam, f, W, D) => { cyl(g, cam, f.x + W / 2, f.y + D / 2, 0, 0.95, 1, f.color!); cyl(g, cam, f.x + W / 2, f.y + D / 2, 1, 0.55, 0, shade(f.color!, 1.25), false); }, { walk: true }),
  F('tapete-arcoiris', 'Tapete arco-íris', 'sala', 3, 2, '#ff5fa2', (g, cam, f, W, D) => {
    const cols = ['#ff5f5f', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
    cols.forEach((c, i) => box(g, cam, f.x + (f.rot ? 0.1 : 0.1 + i * (W - 0.2) / 6), f.y + (f.rot ? 0.1 + i * (D - 0.2) / 6 : 0.1), 0, f.rot ? W - 0.2 : (W - 0.2) / 6, f.rot ? (D - 0.2) / 6 : D - 0.2, 1, c, false));
  }, { walk: true }),
  // Cozinha
  F('pia-cozinha', 'Pia da cozinha', 'cozinha', 1, 1, '#bdf5e0', (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 20, f.color!); B(0.05, 0.05, 20, W - 0.1, D - 0.1, 2, WHITE);
    box(g, cam, f.x + 0.25, f.y + 0.25, 21, 0.5, 0.5, 0, '#9fd8ff', false); C(0.3, 0.3, 22, 0.04, 8, '#9aa0a6');
  }),
  F('armario-cozinha', 'Armário da cozinha', 'cozinha', 2, 1, '#ffd6e8', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.2, 0, W - 0.2, D - 0.4, 22, f.color!); B(0.05, 0.15, 22, W - 0.1, D - 0.3, 2, WHITE);
    B(0.15, 0.2, 24, 0.3, 0.3, 6, '#ff5f5f'); B(W - 0.5, 0.2, 24, 0.3, 0.2, 9, '#ffd23f');
  }),
  F('mesa-jantar', 'Mesa de jantar', 'cozinha', 2, 2, WHITE, (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    for (const [x, y] of [[0.3, 0.3], [W - 0.4, 0.3], [0.3, D - 0.4], [W - 0.4, D - 0.4]]) B(x, y, 0, 0.1, 0.1, 16, WOOD);
    B(0.2, 0.2, 16, W - 0.4, D - 0.4, 3, f.color!);
    C(W / 2, D / 2, 19, 0.2, 2, '#ffd23f'); C(W / 2 - 0.4, D / 2, 19, 0.08, 6, '#ff5fa2');
  }),
  F('microondas', 'Micro-ondas', 'cozinha', 1, 1, '#eef4f8', (g, cam, f, _W, _D, t) => {
    const { B } = H(g, cam, f);
    B(0.2, 0.25, 0, 0.6, 0.5, 14, f.color!);
    if (f.on) { const a = iso(cam, f.x + 0.5, f.y + 0.75, 8); g.fillStyle = `rgba(255,220,120,${0.5 + Math.sin(t * 6) * 0.3})`; g.fillRect(a.x - 4, a.y - 3, 6, 4); }
  }, { use: 'toggle' }),
  F('cesta-frutas', 'Cesta de frutas', 'cozinha', 1, 1, '#c8a27a', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.3, 6, f.color!);
    O(0.4, 0.45, 9, 0.1, '#ff5f5f'); O(0.6, 0.5, 9, 0.1, '#ffd23f'); O(0.5, 0.6, 12, 0.09, '#69db7c');
  }, { use: 'snack' }),
  // Banheiro
  F('chuveiro', 'Chuveiro', 'banheiro', 1, 1, '#c7e5ff', (g, cam, f, _W, _D, t) => {
    const { B, C } = H(g, cam, f);
    B(0.05, 0.05, 0, 0.9, 0.9, 2, WHITE);
    g.globalAlpha = 0.35; B(0.05, 0.05, 2, 0.9, 0.9, 48, f.color!); g.globalAlpha = 1;
    C(0.5, 0.5, 48, 0.12, 2, '#9aa0a6');
    if (f.on) for (let i = 0; i < 6; i++) { const d = iso(cam, f.x + 0.35 + (i % 3) * 0.15, f.y + 0.45, 44 - ((t * 60 + i * 9) % 40)); g.fillStyle = '#5ab0ff'; g.fillRect(d.x, d.y, 1, 2); }
  }, { use: 'toggle' }),
  F('vaso', 'Vaso sanitário', 'banheiro', 1, 1, '#ffffff', (g, cam, f) => {
    const { B, C } = H(g, cam, f);
    C(0.5, 0.55, 0, 0.22, 10, f.color!); C(0.5, 0.55, 10, 0.26, 2, '#e8eef4');
    if (f.rot) B(0.15, 0.2, 0, 0.2, 0.7, 20, f.color!); else B(0.2, 0.15, 0, 0.6, 0.2, 20, f.color!);
  }, { use: 'sit' }),
  F('tapete-banho', 'Tapete de banho', 'banheiro', 1, 1, '#7ee8c7', (g, cam, f) => box(g, cam, f.x + 0.1, f.y + 0.2, 0, 0.8, 0.6, 1, f.color!), { walk: true }),
  // Jardim
  F('palmeira', 'Palmeira', 'jardim', 1, 1, '#3ccf91', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    for (let i = 0; i < 6; i++) C(0.5 + i * 0.02, 0.5, i * 8, 0.09, 8, i % 2 ? '#a8673a' : '#8d5b3a');
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; O(0.5 + Math.cos(a) * 0.35, 0.5 + Math.sin(a) * 0.35, 46, 0.18, shade(f.color!, k % 2 ? 1 : 0.85)); }
    O(0.55, 0.5, 48, 0.12, '#8d5b3a');
  }),
  F('pinheiro', 'Pinheiro', 'jardim', 1, 1, '#1f9e63', (g, cam, f) => {
    const { C } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.08, 10, '#8d5b3a');
    for (let i = 0; i < 4; i++) { const c = iso(cam, f.x + 0.5, f.y + 0.5, 10 + i * 11); const w2 = 14 - i * 3; g.beginPath(); g.moveTo(c.x, c.y - 14); g.lineTo(c.x + w2, c.y + 2); g.lineTo(c.x - w2, c.y + 2); g.closePath(); g.fillStyle = shade(f.color!, 0.9 + i * 0.08); g.fill(); g.strokeStyle = shade(f.color!, 0.5); g.stroke(); }
  }),
  F('cerca', 'Cerquinha', 'jardim', 1, 1, '#ffffff', (g, cam, f) => {
    const { B } = H(g, cam, f);
    if (f.rot) { for (const y of [0.1, 0.5, 0.85]) B(0.45, y, 0, 0.08, 0.08, 14, f.color!); B(0.47, 0.05, 9, 0.04, 0.9, 2, f.color!); B(0.47, 0.05, 4, 0.04, 0.9, 2, f.color!); }
    else { for (const x of [0.1, 0.5, 0.85]) B(x, 0.45, 0, 0.08, 0.08, 14, f.color!); B(0.05, 0.47, 9, 0.9, 0.04, 2, f.color!); B(0.05, 0.47, 4, 0.9, 0.04, 2, f.color!); }
  }),
  F('poste', 'Poste de luz', 'jardim', 1, 1, '#4a4e57', (g, cam, f, _W, _D, t) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.12, 3, f.color!); C(0.5, 0.5, 3, 0.04, 50, f.color!); O(0.5, 0.5, 56, 0.16, '#fff3a6');
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 56); const gr = g.createRadialGradient(c.x, c.y, 1, c.x, c.y, 26 + Math.sin(t)); gr.addColorStop(0, 'rgba(255,240,170,0.4)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(c.x - 30, c.y - 30, 60, 60);
  }),
  F('balanco', 'Balanço', 'jardim', 2, 1, '#ff5fa2', (g, cam, f, W, D, t) => {
    const { B } = H(g, cam, f);
    B(0.05, 0.4, 0, 0.1, 0.2, 40, '#4a4e57'); B(W - 0.15, 0.4, 0, 0.1, 0.2, 40, '#4a4e57'); B(0.05, 0.45, 40, W - 0.1, 0.1, 3, '#4a4e57');
    const sw = Math.sin(t * 2) * 0.15;
    B(0.6, 0.35 + sw, 12, 0.8, 0.3, 2, f.color!);
    const a = iso(cam, f.x + 0.65, f.y + 0.5, 40), b = iso(cam, f.x + 0.65, f.y + 0.5 + sw, 14); g.strokeStyle = '#999'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    const c2 = iso(cam, f.x + 1.35, f.y + 0.5, 40), d2 = iso(cam, f.x + 1.35, f.y + 0.5 + sw, 14); g.beginPath(); g.moveTo(c2.x, c2.y); g.lineTo(d2.x, d2.y); g.stroke();
    void D;
  }, { use: 'sit' }),
  F('escorregador', 'Escorregador', 'jardim', 1, 2, '#5ab0ff', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.2, 0.1, 0, 0.6, 0.5, 30, '#ffd23f');
    poly(g, [iso(cam, f.x + 0.2, f.y + 0.6, 30), iso(cam, f.x + 0.8, f.y + 0.6, 30), iso(cam, f.x + 0.8, f.y + D, 2), iso(cam, f.x + 0.2, f.y + D, 2)], f.color!, shade(f.color!, 0.5));
    void W;
  }, { use: 'jump' }),
  F('guarda-sol', 'Guarda-sol', 'jardim', 1, 1, '#ff7b54', (g, cam, f) => {
    const { C } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.03, 40, '#ffffff');
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 46);
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(c.x, c.y - 6); g.lineTo(c.x + Math.cos((i / 8) * Math.PI * 2) * 22, c.y + Math.sin((i / 8) * Math.PI * 2) * 10); g.lineTo(c.x + Math.cos(((i + 1) / 8) * Math.PI * 2) * 22, c.y + Math.sin(((i + 1) / 8) * Math.PI * 2) * 10); g.closePath(); g.fillStyle = i % 2 ? f.color! : '#ffffff'; g.fill(); }
  }),
  F('espreguicadeira', 'Espreguiçadeira', 'jardim', 1, 2, '#ffd23f', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.15, 0.1, 0, W - 0.3, D - 0.2, 6, '#ffffff'); B(0.18, 0.15, 6, W - 0.36, D - 0.3, 2, f.color!);
    if (f.rot) B(W - 0.4, 0.15, 8, 0.2, D - 0.3, 8, f.color!); else B(0.18, D - 0.4, 8, W - 0.36, 0.2, 8, f.color!);
  }, { use: 'lay' }),
  F('pedras', 'Caminho de pedras', 'jardim', 1, 1, '#c9c2b8', (g, cam, f) => { for (const [x, y] of [[0.3, 0.3], [0.7, 0.4], [0.4, 0.75]]) cyl(g, cam, f.x + x, f.y + y, 0, 0.14, 1, f.color!); }, { walk: true }),
  // Diversão
  F('videogame', 'Videogame', 'diversao', 2, 1, '#2b2d42', (g, cam, f, W, D, t) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.2, 0, W - 0.2, D - 0.4, 10, '#9d4edd'); B(0.25, 0.4, 10, W - 0.5, 0.15, 20, f.color!);
    const scr = [iso(cam, f.x + 0.35, f.y + 0.55, 28), iso(cam, f.x + W - 0.35, f.y + 0.55, 28), iso(cam, f.x + W - 0.35, f.y + 0.55, 13), iso(cam, f.x + 0.35, f.y + 0.55, 13)];
    poly(g, scr, f.on ? `hsl(${120 + Math.sin(t * 3) * 40},70%,55%)` : '#1a1a2e');
    if (f.on) { const p = iso(cam, f.x + 0.5 + ((t * 0.5) % 1) * (W - 1), f.y + 0.55, 20); g.fillStyle = '#ffd23f'; g.fillRect(p.x, p.y, 2, 2); }
  }, { use: 'toggle' }),
  F('karaoke', 'Karaokê', 'diversao', 1, 1, '#ff5fa2', (g, cam, f, _W, _D, t) => {
    const { B, C, O } = H(g, cam, f);
    B(0.1, 0.1, 0, 0.8, 0.8, 4, f.color!); C(0.5, 0.5, 4, 0.03, 26, '#4a4e57'); O(0.5, 0.5, 32, 0.08, '#9aa0a6');
    if (f.on) { const c = iso(cam, f.x + 0.5, f.y + 0.5, 42 + Math.sin(t * 5) * 3); g.fillStyle = '#ff5fa2'; g.font = '8px sans-serif'; g.fillText('♫', c.x + 4, c.y); }
  }, { use: 'toggle' }),
  F('piscina-bolinhas', 'Piscina de bolinhas', 'diversao', 2, 2, '#ffffff', (g, cam, f, W, D) => {
    cyl(g, cam, f.x + W / 2, f.y + D / 2, 0, 0.9, 10, f.color!);
    const cols = ['#ff5f5f', '#ffd23f', '#5ab0ff', '#3ccf91', '#c77dff'];
    for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 0.15 + (i % 4) * 0.15; ball(g, cam, f.x + W / 2 + Math.cos(a) * r, f.y + D / 2 + Math.sin(a) * r, 11, 0.08, cols[i % 5]); }
  }, { use: 'dance', walk: true }),
  F('castelo-inflavel', 'Castelo inflável', 'diversao', 3, 3, '#ff8fc7', (g, cam, f, W, D) => {
    box(g, cam, f.x + 0.1, f.y + 0.1, 0, W - 0.2, D - 0.2, 8, f.color!);
    for (const [x, y] of [[0.3, 0.3], [W - 0.3, 0.3], [0.3, D - 0.3], [W - 0.3, D - 0.3]]) { cyl(g, cam, f.x + x, f.y + y, 8, 0.25, 30, '#ffd23f'); cyl(g, cam, f.x + x, f.y + y, 38, 0.3, 4, '#5ab0ff'); }
  }, { use: 'dance', walk: true }),
  F('carrossel', 'Mini carrossel', 'diversao', 2, 2, '#ffb3d9', (g, cam, f, W, D, t) => {
    const cx = f.x + W / 2, cy = f.y + D / 2;
    cyl(g, cam, cx, cy, 0, 0.9, 4, '#ffffff'); cyl(g, cam, cx, cy, 4, 0.05, 36, '#ffd23f');
    const cols = ['#ff5f5f', '#5ab0ff', '#3ccf91', '#c77dff'];
    for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * Math.PI / 2; ball(g, cam, cx + Math.cos(a) * 0.6, cy + Math.sin(a) * 0.6, 12 + Math.sin(t * 3 + i) * 3, 0.14, cols[i]); }
    cyl(g, cam, cx, cy, 40, 0.95, 6, f.color!);
  }),
  F('mesa-pingpong', 'Mesa de pingue-pongue', 'diversao', 2, 1, '#3ccf91', (g, cam, f, W, D, t) => {
    const { B } = H(g, cam, f);
    B(0.2, 0.3, 0, 0.1, 0.4, 16, '#4a4e57'); B(W - 0.3, 0.3, 0, 0.1, 0.4, 16, '#4a4e57');
    B(0.05, 0.05, 16, W - 0.1, D - 0.1, 2, f.color!); B(W / 2 - 0.02, 0.05, 18, 0.04, D - 0.1, 4, '#ffffff');
    const p = iso(cam, f.x + 0.3 + Math.abs(Math.sin(t * 2)) * (W - 0.6), f.y + 0.5, 22 + Math.abs(Math.sin(t * 4)) * 6); g.fillStyle = '#ffffff'; g.fillRect(p.x, p.y, 2, 2);
  }),
  // Especiais
  F('foguete', 'Foguete', 'especiais', 1, 1, '#ffffff', (g, cam, f) => {
    const { C } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.25, 44, f.color!);
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 44); g.beginPath(); g.moveTo(c.x - 9, c.y); g.lineTo(c.x, c.y - 18); g.lineTo(c.x + 9, c.y); g.closePath(); g.fillStyle = '#e63946'; g.fill();
    const w2 = iso(cam, f.x + 0.5, f.y + 0.75, 30); g.fillStyle = '#5ad1ff'; g.beginPath(); g.arc(w2.x, w2.y, 3, 0, 7); g.fill();
  }),
  F('nuvem', 'Nuvem fofinha', 'especiais', 2, 1, '#ffffff', (g, cam, f, W, _D, t) => {
    const z = 30 + Math.sin(t * 1.5) * 3;
    for (const [x, zz, r] of [[0.4, 0, 0.3], [0.9, 4, 0.38], [1.4, 0, 0.3]]) ball(g, cam, f.x + x * (W / 2), f.y + 0.5, z + zz, r, f.color!);
  }),
  F('coracao', 'Coração gigante', 'especiais', 1, 1, '#ff5fa2', (g, cam, f, _W, _D, t) => {
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 22 + Math.sin(t * 3) * 2);
    g.fillStyle = f.color!; g.strokeStyle = shade(f.color!, 0.5);
    g.beginPath(); g.arc(c.x - 6, c.y - 6, 7, 0, 7); g.arc(c.x + 6, c.y - 6, 7, 0, 7); g.fill();
    g.beginPath(); g.moveTo(c.x - 13, c.y - 3); g.lineTo(c.x, c.y + 13); g.lineTo(c.x + 13, c.y - 3); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(c.x - 8, c.y - 9, 3, 2);
  }),
  F('estrela', 'Estrela gigante', 'especiais', 1, 1, '#ffd23f', (g, cam, f, _W, _D, t) => {
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 26 + Math.sin(t * 2) * 3);
    g.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 14; const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + t * 0.5; const px = c.x + Math.cos(a) * r, py = c.y + Math.sin(a) * r; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.closePath(); g.fillStyle = f.color!; g.fill(); g.strokeStyle = shade(f.color!, 0.5); g.stroke();
  }),
  F('cristal', 'Cristal brilhante', 'especiais', 1, 1, '#c77dff', (g, cam, f, _W, _D, t) => {
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 0);
    for (const [dx, h, w2] of [[0, 30, 6], [-7, 18, 4], [7, 22, 4]]) { g.beginPath(); g.moveTo(c.x + dx - w2, c.y); g.lineTo(c.x + dx, c.y - h); g.lineTo(c.x + dx + w2, c.y); g.closePath(); g.fillStyle = shade(f.color!, 0.9 + Math.sin(t * 3 + dx) * 0.15); g.fill(); g.strokeStyle = shade(f.color!, 0.5); g.stroke(); }
  }),
  F('portal', 'Portal mágico', 'especiais', 1, 1, '#9d4edd', (g, cam, f, _W, _D, t) => {
    const c = iso(cam, f.x + 0.5, f.y + 0.5, 24);
    g.beginPath(); g.ellipse(c.x, c.y, 12, 20, 0, 0, 7); g.lineWidth = 3; g.strokeStyle = f.color!; g.stroke(); g.lineWidth = 1;
    g.fillStyle = `hsla(${(t * 60) % 360},80%,70%,0.7)`; g.beginPath(); g.ellipse(c.x, c.y, 9, 17, 0, 0, 7); g.fill();
  }),
  F('trono-arcoiris', 'Trono arco-íris', 'presentes', 1, 1, '#ff8fc7', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    const cols = ['#ff5f5f', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
    B(0.1, 0.1, 0, W - 0.2, D - 0.2, 12, f.color!);
    cols.forEach((c, i) => (f.rot ? B(0.1, 0.1 + i * 0.13, 12, 0.2, 0.13, 30 - Math.abs(i - 2.5) * 3, c) : B(0.1 + i * 0.13, 0.1, 12, 0.13, 0.2, 30 - Math.abs(i - 2.5) * 3, c)));
  }, { use: 'sit', gift: true }),
  F('unicornio-pelucia', 'Unicórnio de pelúcia', 'presentes', 1, 1, '#ffffff', (g, cam, f, _W, _D, t) => {
    const c = iso(cam, f.x + 0.5, f.y + 0.6, 0);
    import('./avatar').then(() => undefined);
    g.save(); g.translate(c.x, c.y); g.fillStyle = f.color!; g.beginPath(); g.ellipse(0, -8, 9, 6, 0, 0, 7); g.fill(); g.strokeStyle = '#999'; g.stroke();
    g.beginPath(); g.ellipse(8, -16 + Math.sin(t * 2), 5, 5, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(9, -20); g.lineTo(12, -30); g.lineTo(12, -20); g.fill();
    ['#ff8fc7', '#5ab0ff', '#ffd23f'].forEach((m, i) => { g.fillStyle = m; g.fillRect(2 - i * 2, -20 + i * 3, 3, 3); });
    g.fillStyle = '#222'; g.fillRect(9, -17, 1, 1); g.restore();
  }, { gift: true }),
  F('bolo-gigante', 'Bolo gigante', 'presentes', 2, 2, '#ffc2d9', (g, cam, f, W, D, t) => {
    const cx = f.x + W / 2, cy = f.y + D / 2;
    cyl(g, cam, cx, cy, 0, 0.9, 16, f.color!); cyl(g, cam, cx, cy, 16, 0.65, 14, '#ffffff'); cyl(g, cam, cx, cy, 30, 0.4, 10, '#ff8fc7');
    for (let i = 0; i < 5; i++) { const a = i * 1.256; cyl(g, cam, cx + Math.cos(a) * 0.25, cy + Math.sin(a) * 0.25, 40, 0.03, 8, '#ffd23f'); ball(g, cam, cx + Math.cos(a) * 0.25, cy + Math.sin(a) * 0.25, 50 + Math.sin(t * 8 + i), 0.04, '#ff9f43'); }
  }, { gift: true, use: 'snack' }),
  F('fonte-estrelas', 'Fonte de estrelas', 'presentes', 2, 2, '#d4b8ff', (g, cam, f, W, D, t) => {
    const cx = f.x + W / 2, cy = f.y + D / 2;
    cyl(g, cam, cx, cy, 0, 0.9, 8, f.color!); cyl(g, cam, cx, cy, 8, 0.75, 0, '#bfe9ff');
    for (let i = 0; i < 6; i++) { const a = t * 2 + i; const p = iso(cam, cx + Math.cos(a) * 0.4, cy + Math.sin(a) * 0.4, 14 + ((t * 30 + i * 8) % 30)); g.fillStyle = '#ffe066'; g.fillRect(p.x, p.y, 2, 2); }
  }, { gift: true }),
  F('castelo-princesa', 'Castelo de princesa', 'presentes', 2, 2, '#ffc2d9', (g, cam, f, W, D) => {
    box(g, cam, f.x + 0.2, f.y + 0.2, 0, W - 0.4, D - 0.4, 30, f.color!);
    for (const [x, y] of [[0.25, 0.25], [W - 0.25, 0.25], [0.25, D - 0.25], [W - 0.25, D - 0.25]]) {
      cyl(g, cam, f.x + x, f.y + y, 0, 0.2, 44, '#ffffff');
      const c = iso(cam, f.x + x, f.y + y, 44); g.beginPath(); g.moveTo(c.x - 7, c.y); g.lineTo(c.x, c.y - 16); g.lineTo(c.x + 7, c.y); g.closePath(); g.fillStyle = '#9d4edd'; g.fill(); g.strokeStyle = '#5a2a7a'; g.stroke();
    }
    const d = iso(cam, f.x + W / 2, f.y + D - 0.2, 0); g.fillStyle = '#8d5b3a'; g.fillRect(d.x - 3, d.y - 12, 6, 12);
  }, { gift: true }),
  // Parede
  F('cortina', 'Janela com cortina', 'parede', 1, 1, '#ff8fc7', () => undefined, { wall: true }),
  F('espelho-parede', 'Espelho de parede', 'parede', 1, 1, '#c7e5ff', () => undefined, { wall: true, use: 'look' }),
  F('luzinhas', 'Varal de luzinhas', 'parede', 1, 1, '#ffe066', () => undefined, { wall: true }),
  F('tv-parede', 'TV de parede', 'parede', 1, 1, '#2b2d42', () => undefined, { wall: true }),
  F('estrelas-parede', 'Estrelinhas brilhantes', 'parede', 1, 1, '#ffd23f', () => undefined, { wall: true }),
  F('prateleira-flores', 'Prateleira de flores', 'parede', 1, 1, '#ff5fa2', () => undefined, { wall: true }),
  F('telao', 'Telão de cinema', 'parede', 1, 1, '#ffffff', () => undefined, { wall: true }),
];
FURNI.push(...MORE);

// ======================= FAZENDA =======================
export const CROP_TIME = 40; // segundos para crescer
const CROPS = ['#ff9f43', '#ff5f5f', '#ffd23f', '#69db7c'];
FURNI.push(
  F('celeiro', 'Celeiro', 'fazenda', 3, 3, '#e63946', (g, cam, f, W, D) => {
    box(g, cam, f.x + 0.15, f.y + 0.15, 0, W - 0.3, D - 0.3, 40, f.color!);
    // telhado de duas águas
    const a = iso(cam, f.x + 0.05, f.y + 0.05, 40), b = iso(cam, f.x + W - 0.05, f.y + 0.05, 40), c = iso(cam, f.x + W - 0.05, f.y + D - 0.05, 40), d = iso(cam, f.x + 0.05, f.y + D - 0.05, 40);
    const r1 = iso(cam, f.x + 0.05, f.y + D / 2, 66), r2 = iso(cam, f.x + W - 0.05, f.y + D / 2, 66);
    poly(g, [a, b, r2, r1], shade('#f4f1ec', 0.95), '#7a6a5a');
    poly(g, [r1, r2, c, d], '#f4f1ec', '#7a6a5a');
    poly(g, [b, r2, c], shade(f.color!, 0.6), shade(f.color!, 0.4));
    // porta com X
    const p1 = iso(cam, f.x + W / 2 - 0.5, f.y + D - 0.15, 0), p2 = iso(cam, f.x + W / 2 + 0.5, f.y + D - 0.15, 26);
    g.fillStyle = '#ffffff'; g.fillRect(p1.x, p2.y, p2.x - p1.x, p1.y - p2.y + (p2.y - p1.y) * 0);
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(p1.x + 1, p2.y + 1, p2.x - p1.x - 2, 24); g.lineWidth = 1;
    g.strokeStyle = shade(f.color!, 0.5); g.beginPath(); g.moveTo(p1.x + 2, p2.y + 2); g.lineTo(p2.x - 2, p2.y + 24); g.moveTo(p2.x - 2, p2.y + 2); g.lineTo(p1.x + 2, p2.y + 24); g.stroke();
  }),
  F('trator', 'Trator', 'fazenda', 2, 1, '#3ccf91', (g, cam, f, W, D) => {
    const { B, C } = H(g, cam, f);
    B(0.2, 0.2, 6, W - 0.4, D - 0.4, 10, f.color!); B(0.2, 0.2, 16, 0.8, D - 0.4, 14, f.color!);
    g.globalAlpha = 0.6; B(0.25, 0.25, 18, 0.7, D - 0.5, 10, '#bfe9ff'); g.globalAlpha = 1;
    C(0.5, 0.15, 10, 0.3, 4, '#2b2d42'); C(0.5, D - 0.15, 10, 0.3, 4, '#2b2d42'); C(W - 0.4, 0.15, 6, 0.2, 3, '#2b2d42'); C(W - 0.4, D - 0.15, 6, 0.2, 3, '#2b2d42');
    C(W - 0.5, 0.5, 16, 0.05, 10, '#555');
  }),
  F('horta', 'Canteiro da horta', 'fazenda', 1, 1, '#8d5b3a', (g, cam, f, _W, _D, t) => {
    box(g, cam, f.x + 0.05, f.y + 0.05, 0, 0.9, 0.9, 3, f.color!);
    for (let i = 0; i < 3; i++) box(g, cam, f.x + 0.12, f.y + 0.15 + i * 0.27, 3, 0.76, 0.12, 1, shade(f.color!, 0.8), false);
    if (f.t0) {
      const grow = Math.min(1, (Date.now() - f.t0) / 1000 / CROP_TIME);
      const col = CROPS[(f.uid.charCodeAt(f.uid.length - 1) || 0) % 4];
      for (let i = 0; i < 6; i++) {
        const x = f.x + 0.25 + (i % 3) * 0.25, y = f.y + 0.25 + Math.floor(i / 3) * 0.45;
        const h = 3 + grow * 9;
        const p = iso(cam, x, y, 4);
        g.fillStyle = '#2f9e44'; g.fillRect(p.x, p.y - h, 1, h); g.fillRect(p.x - 2, p.y - h + 1, 2, 1); g.fillRect(p.x + 1, p.y - h + 2, 2, 1);
        if (grow >= 1) { g.fillStyle = col; g.fillRect(p.x - 1, p.y - h - 2, 3, 3); }
      }
      if (grow >= 1) { const s2 = iso(cam, f.x + 0.5, f.y + 0.5, 26 + Math.sin(t * 4) * 2); g.fillStyle = '#ffe066'; g.fillRect(s2.x - 1, s2.y, 3, 3); }
    }
  }, { use: 'farm' }),
  F('feno', 'Fardo de feno', 'fazenda', 1, 1, '#ffd23f', (g, cam, f) => {
    const { B } = H(g, cam, f);
    B(0.12, 0.2, 0, 0.76, 0.6, 14, f.color!);
    for (const z of [4, 10]) box(g, cam, f.x + 0.12, f.y + 0.2, z, 0.76, 0.6, 1, shade(f.color!, 0.75), false);
  }, { use: 'sit' }),
  F('espantalho', 'Espantalho', 'fazenda', 1, 1, '#5ab0ff', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.04, 40, '#8d5b3a');
    const a = iso(cam, f.x + 0.5, f.y + 0.5, 30); g.fillStyle = '#8d5b3a'; g.fillRect(a.x - 12, a.y, 24, 2);
    box(g, cam, f.x + 0.38, f.y + 0.38, 20, 0.24, 0.24, 14, f.color!);
    O(0.5, 0.5, 40, 0.14, '#ffe7a6');
    const h = iso(cam, f.x + 0.5, f.y + 0.5, 46); g.fillStyle = '#c8603a'; g.fillRect(h.x - 8, h.y, 16, 2); g.fillRect(h.x - 4, h.y - 5, 8, 5);
  }),
  F('poco', 'Poço dos desejos', 'fazenda', 1, 1, '#9aa0a6', (g, cam, f) => {
    const { C, B } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.4, 12, f.color!); C(0.5, 0.5, 12, 0.3, 0, '#2b5a8a');
    B(0.1, 0.45, 12, 0.08, 0.1, 22, '#8d5b3a'); B(0.82, 0.45, 12, 0.08, 0.1, 22, '#8d5b3a');
    poly(g, [iso(cam, f.x + 0.05, f.y + 0.5, 34), iso(cam, f.x + 0.95, f.y + 0.5, 34), iso(cam, f.x + 0.5, f.y + 0.5, 44)], '#c0392b', '#7a2020');
  }, { use: 'jump' }),
  F('arvore-frutas', 'Macieira', 'fazenda', 1, 1, '#3ccf91', (g, cam, f) => {
    const { C, O } = H(g, cam, f);
    C(0.5, 0.5, 0, 0.1, 24, '#8d5b3a'); O(0.5, 0.5, 38, 0.5, f.color!); O(0.3, 0.6, 46, 0.3, shade(f.color!, 1.1));
    for (const [x, y, z] of [[0.3, 0.4, 36], [0.65, 0.55, 40], [0.45, 0.7, 30], [0.6, 0.3, 46]]) O(x, y, z, 0.07, '#ff3b3b');
  }, { use: 'snack' }),
  F('cocho', 'Cocho dos animais', 'fazenda', 2, 1, '#8d5b3a', (g, cam, f, W, D) => {
    const { B } = H(g, cam, f);
    B(0.1, 0.2, 0, W - 0.2, D - 0.4, 8, f.color!); box(g, cam, f.x + 0.2, f.y + 0.3, 7, W - 0.4, D - 0.6, 0, '#ffd23f', false);
  }),
  F('lago', 'Laguinho', 'fazenda', 2, 2, '#5ac8f0', (g, cam, f, W, D, t) => {
    cyl(g, cam, f.x + W / 2, f.y + D / 2, 0, 0.95, 1, '#8fbf7c', false);
    cyl(g, cam, f.x + W / 2, f.y + D / 2, 1, 0.78, 0, `hsl(195,75%,${58 + Math.sin(t * 2) * 4}%)`, false);
    const p = iso(cam, f.x + W / 2 + Math.cos(t * 0.5) * 0.4, f.y + D / 2 + Math.sin(t * 0.5) * 0.3, 2);
    g.fillStyle = '#ffffff'; g.fillRect(p.x - 3, p.y - 3, 5, 3); g.fillStyle = '#ffb066'; g.fillRect(p.x + 2, p.y - 3, 2, 1);
  }, { walk: true, use: 'swim' }),
  F('galinheiro', 'Galinheiro', 'fazenda', 2, 2, '#ffb066', (g, cam, f, W, D) => {
    box(g, cam, f.x + 0.3, f.y + 0.3, 0, W - 0.6, D - 0.6, 18, f.color!);
    poly(g, [iso(cam, f.x + 0.2, f.y + 0.2, 18), iso(cam, f.x + W - 0.2, f.y + 0.2, 18), iso(cam, f.x + W - 0.2, f.y + D - 0.2, 18), iso(cam, f.x + 0.2, f.y + D - 0.2, 18), iso(cam, f.x + W / 2, f.y + D / 2, 30)], '#c0392b', '#7a2020');
    const d = iso(cam, f.x + W / 2, f.y + D - 0.3, 4); g.fillStyle = '#2b1a3a'; g.fillRect(d.x - 3, d.y - 6, 6, 6);
  }),
  F('cerca-madeira', 'Cerca de madeira', 'fazenda', 1, 1, '#a8673a', (g, cam, f) => {
    const { B } = H(g, cam, f);
    if (f.rot) { for (const y of [0.05, 0.9]) B(0.45, y, 0, 0.1, 0.1, 16, f.color!); B(0.47, 0, 11, 0.06, 1, 3, f.color!); B(0.47, 0, 5, 0.06, 1, 3, f.color!); }
    else { for (const x of [0.05, 0.9]) B(x, 0.45, 0, 0.1, 0.1, 16, f.color!); B(0, 0.47, 11, 1, 0.06, 3, f.color!); B(0, 0.47, 5, 1, 0.06, 3, f.color!); }
  }),
  F('terra', 'Piso de terra', 'fazenda', 1, 1, '#b5835a', (g, cam, f) => { box(g, cam, f.x, f.y, 0, 1, 1, 0, f.color!, false); }, { walk: true }),
);
export const FURNI_MAP: Record<string, FurniDef> = Object.fromEntries(FURNI.map((f) => [f.id, f]));
export const dims = (f: PFurni) => { const d = FURNI_MAP[f.type]; return f.rot ? [d.d, d.w] : [d.w, d.d]; };

/** Itens de parede: desenhados sobre a parede esquerda (L, ao longo de y) ou direita (R, ao longo de x) */
export function drawWallItem(g: CanvasRenderingContext2D, cam: Cam, f: PFurni, t: number) {
  const pos = f.wpos ?? 1;
  const L = f.wall === 'L';
  const at = (a: number, z: number) => (L ? iso(cam, 0, pos + a, z) : iso(cam, pos + a, 0, z));
  const quad = (a0: number, a1: number, z0: number, z1: number, c: string, st = true) => poly(g, [at(a0, z1), at(a1, z1), at(a1, z0), at(a0, z0)], c, st ? shade(c, 0.5) : undefined);
  const c = f.color ?? FURNI_MAP[f.type].color;
  switch (f.type) {
    case 'quadro': quad(0.15, 0.85, 34, 58, '#ffd23f'); quad(0.22, 0.78, 37, 55, c, false); { const s = at(0.5, 47); g.fillStyle = '#ffe066'; g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill(); } break;
    case 'janela': quad(0.08, 0.92, 26, 62, '#ffffff'); quad(0.15, 0.85, 29, 59, c, false); quad(0.48, 0.52, 29, 59, '#ffffff', false); quad(0.15, 0.85, 43, 45, '#ffffff', false); break;
    case 'prateleira': quad(0.05, 0.95, 36, 39, c); for (let i = 0; i < 3; i++) quad(0.15 + i * 0.25, 0.3 + i * 0.25, 39, 46 + i * 2, ['#ff5f5f', '#5ab0ff', '#3ccf91'][i]); break;
    case 'relogio': { const s = at(0.5, 48); g.fillStyle = c; g.beginPath(); g.ellipse(s.x, s.y, 7, 8, 0, 0, 7); g.fill(); g.strokeStyle = shade(c, 0.5); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s.x, s.y, 5, 6, 0, 0, 7); g.fill(); g.strokeStyle = '#333'; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + Math.cos(t) * 4, s.y + Math.sin(t) * 4); g.stroke(); break; }
    case 'cortina': quad(0.08, 0.92, 26, 62, '#ffffff'); quad(0.15, 0.85, 29, 59, '#bfe9ff', false); quad(0.02, 0.3, 24, 66, c); quad(0.7, 0.98, 24, 66, c); quad(0.0, 1.0, 64, 68, shade(c, 0.8)); break;
    case 'espelho-parede': quad(0.2, 0.8, 22, 64, '#ffd23f'); quad(0.27, 0.73, 25, 61, c, false); quad(0.35, 0.45, 40, 58, '#ffffff', false); break;
    case 'luzinhas': for (let i = 0; i < 6; i++) { const s = at(0.08 + i * 0.17, 60 - Math.sin((i / 5) * Math.PI) * 6); g.fillStyle = ['#ff5f5f', '#ffd23f', '#5ab0ff', '#3ccf91', '#ff8fc7', '#c77dff'][(i + Math.floor(t * 3)) % 6]; g.fillRect(s.x - 1, s.y, 3, 3); } break;
    case 'tv-parede': quad(0.05, 0.95, 32, 58, '#2b2d42'); quad(0.1, 0.9, 34, 56, `hsl(${(t * 40) % 360},60%,60%)`, false); break;
    case 'estrelas-parede': for (let i = 0; i < 4; i++) { const s = at(0.15 + (i % 2) * 0.55, 40 + Math.floor(i / 2) * 16 + (i % 2) * 5); g.fillStyle = c; g.globalAlpha = 0.6 + Math.sin(t * 3 + i) * 0.4; g.fillRect(s.x - 1, s.y - 3, 2, 7); g.fillRect(s.x - 3, s.y - 1, 7, 2); g.globalAlpha = 1; } break;
    case 'prateleira-flores': quad(0.05, 0.95, 34, 37, WOOD); for (let i = 0; i < 3; i++) { quad(0.15 + i * 0.28, 0.3 + i * 0.28, 37, 42, '#c8603a'); const s = at(0.22 + i * 0.28, 46); g.fillStyle = [c, '#ffd23f', '#c77dff'][i]; g.fillRect(s.x - 2, s.y - 2, 4, 4); } break;
    case 'telao': quad(-1.2, 2.2, 18, 70, '#2b2d42'); quad(-1.1, 2.1, 20, 68, `hsl(${(t * 25) % 360},55%,${55 + Math.sin(t * 2) * 10}%)`, false); { const s = at(0.5, 44); g.fillStyle = '#fff'; g.font = '10px sans-serif'; g.fillText(['🐰', '🦄', '🐲', '🧜‍♀️'][Math.floor(t / 4) % 4], s.x - 6, s.y + 4); } break;
    case 'poster': quad(0.18, 0.82, 30, 60, c); { const s = at(0.5, 46); g.fillStyle = '#ffe066'; g.font = '12px sans-serif'; g.fillText('★', s.x - 5, s.y + 4); } break;
  }
}

export { TW, TH, WALL_H };
