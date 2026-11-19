import type { PFurni } from './furni';
import type { Appearance } from '../types';

export interface HotelRoom {
  id: string; name: string; w: number; h: number;
  floor: string; floorPat: 'liso' | 'xadrez' | 'madeira' | 'listras';
  wall: string; wallPat: 'liso' | 'listras' | 'bolinhas' | 'tijolo';
  door: number; furni: PFurni[]; pub?: boolean; icon?: string;
}
export interface BotDef { id: string; name: string; look: Partial<Appearance>; lines: string[]; job?: 'bebida' | 'sorvete'; dance?: boolean }

let n = 0;
const P = (type: string, x: number, y: number, rot: 0 | 1 = 0, color?: string, extra: Partial<PFurni> = {}): PFurni => ({ uid: `p${n++}`, type, x, y, rot, color, ...extra });
const Wl = (type: string, wall: 'L' | 'R', wpos: number, color?: string): PFurni => ({ uid: `p${n++}`, type, x: 0, y: 0, rot: 0, wall, wpos, color });

export function starterRoom(): HotelRoom {
  return {
    id: 'quarto-maite', name: 'Quarto da Maitê', w: 8, h: 8, floor: '#f3d9e8', floorPat: 'madeira', wall: '#ffc2d9', wallPat: 'bolinhas', door: 5,
    furni: [
      P('cama-princesa', 0, 0, 0, '#ffb3d9'), P('tapete', 3, 3, 0, '#d4b8ff'), P('abajur', 2, 0, 0, '#ffe066', { on: true }),
      P('guarda-roupa', 7, 0, 0, '#ffffff'), P('ursao', 6, 0, 0, '#c8a27a'), P('bau', 0, 3, 0, '#ff7b54'), P('planta', 7, 6, 0),
      P('poltrona', 5, 4, 1, '#9d4edd'), P('escrivaninha', 4, 0, 0, '#ffffff'),
      Wl('janela', 'R', 2), Wl('quadro', 'R', 5, '#ff8fc7'), Wl('poster', 'L', 2, '#c77dff'), Wl('relogio', 'L', 0),
    ],
  };
}

export const PUBLIC_ROOMS: (HotelRoom & { bots: BotDef[]; desc: string })[] = [
  {
    id: 'recepcao', name: 'Recepção do Hotel', icon: '🛎️', desc: 'Onde tudo começa!', pub: true, w: 12, h: 11, floor: '#e8dcc8', floorPat: 'xadrez', wall: '#c7e5ff', wallPat: 'listras', door: 6,
    furni: [
      P('balcao', 1, 1, 0, '#ffc2d9'), P('balcao', 3, 1, 0, '#ffc2d9'), P('fonte', 6, 4), P('tapete', 5, 3, 0, '#ff8fc7'), P('tapete', 7, 5, 0, '#ff8fc7'),
      P('sofa', 9, 1, 0, '#9d4edd'), P('sofa', 9, 7, 0, '#9d4edd'), P('planta', 11, 0), P('planta', 0, 10), P('planta', 11, 10), P('mesa-redonda', 10, 4),
      P('poltrona', 10, 3, 0, '#ff8fc7'), P('poltrona', 10, 5, 0, '#ff8fc7'), P('baloes', 0, 5, 0, '#ff5fa2'),
      Wl('janela', 'R', 6), Wl('janela', 'R', 8), Wl('quadro', 'R', 4, '#5ab0ff'), Wl('relogio', 'L', 2), Wl('poster', 'L', 8, '#ffd23f'),
    ],
    bots: [
      { id: 'lia', name: 'Recepcionista Lia', look: { hairStyle: 'rabo', hairColor: '#c0392b', top: 'uniforme', topColor: '#5ab0ff', skin: '#d9a47c' }, lines: ['Bem-vinda ao Hotel da Maitê! 🛎️', 'Todos os móveis do catálogo são de graça! 🛍️', 'Quer conhecer a Discoteca? Fica no Navegador! 🪩'] },
      { id: 'teo', name: 'Mensageiro Téo', look: { hairStyle: 'curto', hairColor: '#2b1a12', top: 'jaqueta', topColor: '#e63946', bottom: 'calca', bottomColor: '#2b2d42', skin: '#8a5233' }, lines: ['Posso levar suas malas? 🧳', 'O seu quarto está lindo hoje!', 'Já viu a piscina do hotel? 🏊'] },
    ],
  },
  {
    id: 'cafe', name: 'Café Nuvem de Leite', icon: '☕', desc: 'Bebidas e docinhos', pub: true, w: 10, h: 9, floor: '#d9b892', floorPat: 'madeira', wall: '#ffe5cc', wallPat: 'tijolo', door: 4,
    furni: [
      P('balcao', 1, 0, 0, '#c8a27a'), P('balcao', 3, 0, 0, '#c8a27a'), P('bolo', 5, 0, 0, '#ffc2d9'),
      P('mesa-redonda', 3, 4, 0, '#ffffff'), P('cadeira', 2, 4, 0), P('cadeira', 4, 4, 0), P('mesa-redonda', 7, 4, 0, '#ffffff'), P('cadeira', 6, 4, 0), P('cadeira', 8, 4, 0),
      P('mesa-redonda', 5, 7, 0, '#ffffff'), P('cadeira', 4, 7, 0), P('cadeira', 6, 7, 0), P('planta', 9, 0), P('planta', 0, 8),
      Wl('quadro', 'R', 7, '#ffd23f'), Wl('janela', 'L', 1), Wl('janela', 'L', 6),
    ],
    bots: [
      { id: 'nina', name: 'Barista Nina', job: 'bebida', look: { hairStyle: 'coque', hairColor: '#4a2c1a', top: 'avental', topColor: '#c8a27a', skin: '#a86b45' }, lines: ['Chocolate quente saindo! ☕', 'Hoje tem bolo de morango 🍓', 'Fale comigo para pedir uma bebida!'] },
      { id: 'vovo', name: 'Vovó Lena', look: { hairStyle: 'coque', hairColor: '#ffffff', top: 'sueter', topColor: '#ffc2d9' }, lines: ['Que menina linda! 💕', 'Esse café é uma delícia!', 'Me dá um abraço?'] },
    ],
  },
  {
    id: 'disco', name: 'Discoteca Arco-Íris', icon: '🪩', desc: 'Dance muito!', pub: true, w: 11, h: 11, floor: '#2b2d42', floorPat: 'xadrez', wall: '#5a2a7a', wallPat: 'bolinhas', door: 5,
    furni: [
      ...Array.from({ length: 25 }, (_, i) => P('pista-danca', 3 + (i % 5), 3 + Math.floor(i / 5))),
      P('jukebox', 0, 0, 0, '#9d4edd', { on: true }), P('jukebox', 10, 0, 0, '#ff5fa2', { on: true }), P('neon', 5, 0, 0, '#ff5fa2'), P('neon', 0, 9, 0, '#5ad1ff'),
      P('sofa', 8, 9, 0, '#ff5fa2'), P('baloes', 10, 10, 0, '#ffd23f'),
    ],
    bots: [
      { id: 'dj', name: 'DJ Zeta', dance: true, look: { hairStyle: 'black', hairColor: '#ff7eb6', top: 'moletom', topColor: '#2b2d42', accessories: ['oculos-coracao'] }, lines: ['Aumenta o som! 🎶', 'Bora dançar! 💃', 'Essa música é a minha favorita!'] },
      { id: 'duda', name: 'Duda', dance: true, look: { hairStyle: 'chiquinhas', hairColor: '#9b59ff', top: 'vestido-babados', topColor: '#ffd23f' }, lines: ['Olha meu passinho! ✨', 'Dança comigo!', 'Uhuul!'] },
    ],
  },
  {
    id: 'piscina', name: 'Piscina do Sol', icon: '🏊', desc: 'Nadar e tomar sol', pub: true, w: 12, h: 12, floor: '#f3e2b8', floorPat: 'xadrez', wall: '#7fd3ff', wallPat: 'listras', door: 6,
    furni: [
      P('piscina', 3, 3), P('piscina', 6, 3), P('piscina', 3, 6), P('piscina', 6, 6),
      P('banco', 0, 1, 1), P('banco', 10, 1, 1), P('arvore', 11, 0), P('arvore', 0, 11), P('arbusto', 11, 11), P('flores', 10, 11),
    ],
    bots: [
      { id: 'bel', name: 'Salva-vidas Bel', look: { hairStyle: 'rabo', hairColor: '#f2d27a', top: 'regata', topColor: '#e63946', bottom: 'shorts', bottomColor: '#e63946' }, lines: ['Nade sempre com cuidado! 🏊', 'A água está quentinha!', 'Use protetor solar ☀️'] },
      { id: 'kai', name: 'Kai', job: 'sorvete', look: { hairStyle: 'cacheado', hairColor: '#d9a35b', top: 'regata', topColor: '#5ad1ff', skin: '#a86b45' }, lines: ['Quer um sorvete? 🍦', 'Que dia lindo!', 'Já pulou na piscina?'] },
    ],
  },
  {
    id: 'jardim', name: 'Jardim Secreto', icon: '🌷', desc: 'Flores e paz', pub: true, w: 11, h: 11, floor: '#79c95a', floorPat: 'listras', wall: '#bdf5e0', wallPat: 'liso', door: 4,
    furni: [
      P('fonte', 4, 4), P('cerejeira', 1, 1), P('cerejeira', 9, 1), P('arvore', 1, 9), P('arvore', 9, 9),
      P('flores', 3, 1, 0, '#ff5fa2'), P('flores', 7, 1, 0, '#ffd23f'), P('flores', 3, 9, 0, '#c77dff'), P('flores', 7, 9, 0, '#ff5fa2'),
      P('banco', 4, 8, 0), P('banco', 4, 1, 0), P('arbusto', 0, 5), P('arbusto', 10, 5), P('estatua-unicornio', 10, 0), P('arco-iris', 7, 6),
    ],
    bots: [
      { id: 'fada', name: 'Fada Luz', look: { hairStyle: 'longo', hairColor: '#7ee8c7', top: 'vestido-fada', topColor: '#bdf5e0', accessories: ['asas-fada'] }, lines: ['Psiu... este jardim é mágico ✨', 'As flores adoram música 🎶', 'Faça um pedido na fonte!'] },
    ],
  },
  {
    id: 'parquinho', name: 'Parquinho', icon: '🎈', desc: 'Pular e brincar', pub: true, w: 10, h: 10, floor: '#ffe7a6', floorPat: 'liso', wall: '#ff8fc7', wallPat: 'listras', door: 5,
    furni: [P('cama-elastica', 2, 2), P('cama-elastica', 6, 2, 0, '#5ab0ff'), P('baloes', 0, 0), P('baloes', 9, 0, 0, '#5ab0ff'), P('ursao', 9, 9), P('bau', 0, 9), P('piano', 5, 7)],
    bots: [
      { id: 'pedro', name: 'Pedrinho', look: { height: 0.85, hairStyle: 'curto', hairColor: '#4a2c1a', top: 'listrada', topColor: '#5ab0ff' }, lines: ['Vamos pular! 🤸', 'Tá com você! 🏃', 'Eu adoro balões!'] },
      { id: 'sofia', name: 'Sofia', look: { height: 0.85, hairStyle: 'trancas', hairColor: '#2b1a12', skin: '#6b3d24', top: 'vestido', topColor: '#3ccf91' }, lines: ['Quer ser minha amiga? 💕', 'Vem brincar!', 'Esse parquinho é o melhor!'] },
    ],
  },
];
