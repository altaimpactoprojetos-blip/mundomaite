import { box, cyl, ball, iso, shade, poly, type Cam, TW, TH, WALL_H } from './iso';

export interface PFurni { uid: string; type: string; x: number; y: number; rot: 0 | 1; color?: string; on?: boolean; wall?: 'L' | 'R'; wpos?: number }
export type FurniCat = 'quarto' | 'sala' | 'cozinha' | 'banheiro' | 'jardim' | 'diversao' | 'especiais' | 'parede';
export interface FurniDef {
  id: string; name: string; cat: FurniCat; w: number; d: number; color: string;
  use?: 'sit' | 'lay' | 'toggle' | 'dance' | 'snack' | 'swim'; walk?: boolean; wall?: boolean;
  draw: (g: CanvasRenderingContext2D, cam: Cam, f: PFurni, W: number, D: number, t: number) => void;
}

export const FURNI_CATS: { id: FurniCat; name: string; icon: string }[] = [
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
    case 'poster': quad(0.18, 0.82, 30, 60, c); { const s = at(0.5, 46); g.fillStyle = '#ffe066'; g.font = '12px sans-serif'; g.fillText('★', s.x - 5, s.y + 4); } break;
  }
}

export { TW, TH, WALL_H };
