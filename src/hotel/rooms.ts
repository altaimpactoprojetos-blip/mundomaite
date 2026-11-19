import type { PFurni } from './furni';
import type { Appearance } from '../types';

export interface HotelRoom {
  id: string; name: string; w: number; h: number;
  floor: string; floorPat: 'liso' | 'xadrez' | 'madeira' | 'listras';
  wall: string; wallPat: 'liso' | 'listras' | 'bolinhas' | 'tijolo';
  door: number; furni: PFurni[]; pub?: boolean; icon?: string; pets?: { species: string; color: string }[];
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

// ---------------- quartos extras da Maitê ----------------
export function extraRooms(): HotelRoom[] {
  return [
    { id: 'sala-maite', name: 'Sala da Maitê', w: 10, h: 9, floor: '#e8d5b7', floorPat: 'madeira', wall: '#fff3a6', wallPat: 'listras', door: 4, furni: [
      P('sofa-grande', 2, 0, 0, '#ff7b54'), P('mesa-centro', 3, 2, 0), P('tapete-arcoiris', 2, 3), P('tv', 3, 6, 0, '#2b2d42'), P('lareira', 7, 0), P('luminaria', 1, 0, 0, '#ffffff', { on: true }),
      P('poltrona', 6, 3, 1, '#5ab0ff'), P('planta', 9, 0), P('estante', 7, 7, 0), P('aquario', 0, 7, 1), P('pufe', 6, 5, 0, '#c77dff'), P('rack-som', 9, 4, 0, '#2b2d42'),
      Wl('cortina', 'R', 1, '#ff8fc7'), Wl('cortina', 'R', 5, '#ff8fc7'), Wl('quadro', 'L', 2, '#3ccf91'), Wl('luzinhas', 'R', 3), Wl('luzinhas', 'R', 7),
    ] },
    { id: 'jardim-maite', name: 'Jardim da Maitê', w: 12, h: 10, floor: '#79c95a', floorPat: 'listras', wall: '#bfe9ff', wallPat: 'liso', door: 5, furni: [
      P('piscina', 6, 5), P('espreguicadeira', 5, 1), P('espreguicadeira', 3, 1, 0, '#ff8fc7'), P('guarda-sol', 4, 3, 0, '#ff7b54'), P('palmeira', 11, 0), P('palmeira', 10, 9),
      P('balanco', 0, 0, 0, '#ff5fa2'), P('escorregador', 8, 0), P('flores', 2, 8, 0, '#ff5fa2'), P('flores', 3, 8, 0, '#ffd23f'), P('arbusto', 0, 9), P('cerejeira', 9, 3), P('pedras', 1, 5), P('pedras', 2, 5), P('pedras', 3, 5), P('poste', 11, 5),
    ] },
    { id: 'brinquedoteca', name: 'Brinquedoteca', w: 9, h: 9, floor: '#ffe7a6', floorPat: 'xadrez', wall: '#c7e5ff', wallPat: 'bolinhas', door: 4, furni: [
      P('piscina-bolinhas', 5, 5), P('casinha-boneca', 0, 0, 0, '#ffb3d9'), P('estante-brinquedos', 2, 0), P('videogame', 6, 0, 0, '#2b2d42'), P('pufe', 6, 2, 0, '#ff5fa2'), P('pufe', 7, 2, 0, '#5ab0ff'),
      P('ursao', 8, 8), P('karaoke', 0, 5, 0, '#ff5fa2'), P('baloes', 8, 0), P('bau', 4, 0), P('carrossel', 1, 6), P('tapete-redondo', 3, 3, 0, '#d4b8ff'),
      Wl('estrelas-parede', 'R', 4), Wl('poster', 'L', 2, '#ffd23f'), Wl('tv-parede', 'L', 6),
    ] },
  ];
}

export const TEMPLATES: { id: string; name: string; icon: string; make: () => Partial<HotelRoom> }[] = [
  { id: 'vazio', name: 'Vazio', icon: '⬜', make: () => ({ furni: [] }) },
  { id: 'quarto', name: 'Quarto', icon: '🛏️', make: () => ({ floor: '#f3d9e8', floorPat: 'madeira', wall: '#d4b8ff', wallPat: 'bolinhas', furni: [P('cama', 0, 0, 0, '#5ab0ff'), P('guarda-roupa', 3, 0), P('abajur', 2, 0, 0, '#ffe066', { on: true }), P('tapete', 3, 3, 0, '#ffd23f'), P('penteadeira', 6, 0), Wl('janela', 'R', 1), Wl('quadro', 'L', 2)] }) },
  { id: 'sala', name: 'Sala', icon: '🛋️', make: () => ({ floor: '#e8d5b7', floorPat: 'madeira', wall: '#fff3a6', wallPat: 'listras', furni: [P('sofa', 2, 0, 0, '#ff8fc7'), P('tv', 2, 5), P('tapete', 2, 2, 0, '#5ab0ff'), P('planta', 0, 0), P('luminaria', 5, 0, 0, '#ffffff', { on: true }), Wl('cortina', 'R', 4)] }) },
  { id: 'cozinha', name: 'Cozinha', icon: '🍳', make: () => ({ floor: '#ffffff', floorPat: 'xadrez', wall: '#bdf5e0', wallPat: 'tijolo', furni: [P('geladeira', 0, 0), P('fogao', 1, 0), P('pia-cozinha', 2, 0), P('armario-cozinha', 3, 0), P('microondas', 5, 0), P('mesa-jantar', 3, 4), P('cadeira', 2, 4), P('cadeira', 5, 5), P('cesta-frutas', 6, 7)] }) },
  { id: 'banheiro', name: 'Banheiro', icon: '🛁', make: () => ({ floor: '#c7e5ff', floorPat: 'xadrez', wall: '#ffffff', wallPat: 'tijolo', furni: [P('banheira', 0, 0), P('chuveiro', 3, 0), P('pia', 4, 0), P('vaso', 6, 0), P('tapete-banho', 1, 2), P('espelho', 5, 0), Wl('espelho-parede', 'L', 3)] }) },
  { id: 'jardim', name: 'Jardim', icon: '🌷', make: () => ({ floor: '#79c95a', floorPat: 'listras', wall: '#bfe9ff', wallPat: 'liso', furni: [P('arvore', 0, 0), P('cerejeira', 6, 0), P('fonte', 3, 3), P('banco', 1, 6), P('flores', 6, 6, 0, '#ff5fa2'), P('balanco', 4, 0)] }) },
  { id: 'festa', name: 'Festa', icon: '🎉', make: () => ({ floor: '#2b2d42', floorPat: 'xadrez', wall: '#5a2a7a', wallPat: 'bolinhas', furni: [...Array.from({ length: 9 }, (_, i) => P('pista-danca', 3 + (i % 3), 3 + Math.floor(i / 3))), P('jukebox', 0, 0, 0, '#9d4edd', { on: true }), P('karaoke', 7, 0, 0, '#ff5fa2', { on: true }), P('baloes', 0, 7), P('bolo', 7, 7), Wl('luzinhas', 'R', 2), Wl('luzinhas', 'R', 5)] }) },
];

PUBLIC_ROOMS.push(
  {
    id: 'cinema', name: 'Cinema do Hotel', icon: '🎬', desc: 'Filminhos no telão', pub: true, w: 10, h: 10, floor: '#5a2a3a', floorPat: 'liso', wall: '#2b1a3a', wallPat: 'liso', door: 8,
    furni: [
      ...[2, 4, 6].flatMap((y) => [2, 3, 4, 5, 6, 7].map((x) => P('poltrona', x, y + 1, 0, '#e63946'))),
      P('balcao', 0, 0, 0, '#ffd23f'), P('rack-som', 9, 0, 0, '#2b2d42', { on: true }), P('rack-som', 9, 9, 0, '#2b2d42', { on: true }),
      Wl('telao', 'R', 4), Wl('estrelas-parede', 'L', 2),
    ],
    bots: [{ id: 'max', name: 'Bilheteiro Max', job: 'sorvete', look: { hairStyle: 'black', hairColor: '#2b1a12', skin: '#6b3d24', top: 'uniforme', topColor: '#9d4edd' }, lines: ['Hoje passa "O Coelho Espacial"! 🐰🚀', 'Pegue uma pipoca e sente! 🍿', 'Silêncio, o filme vai começar!'] }],
  },
  {
    id: 'salao', name: 'Salão de Beleza', icon: '💇', desc: 'Mude seu visual', pub: true, w: 9, h: 8, floor: '#ffe5ec', floorPat: 'xadrez', wall: '#ffb3d9', wallPat: 'listras', door: 4,
    furni: [P('penteadeira', 1, 0), P('penteadeira', 3, 0), P('penteadeira', 5, 0), P('poltrona', 1, 1, 0, '#ff5fa2'), P('poltrona', 3, 1, 0, '#ff5fa2'), P('poltrona', 5, 1, 0, '#ff5fa2'), P('sofa', 6, 6, 0, '#d4b8ff'), P('planta', 8, 0), P('vaso', 0, 7, 0, '#ffffff'),
      Wl('espelho-parede', 'R', 2), Wl('espelho-parede', 'R', 4), Wl('espelho-parede', 'R', 6), Wl('prateleira-flores', 'L', 2)],
    bots: [{ id: 'tati', name: 'Cabeleireira Tati', look: { hairStyle: 'cacheado', hairColor: '#ff7eb6', top: 'blusa-babado', topColor: '#d4b8ff' }, lines: ['Sente na penteadeira para mudar o visual! 💇‍♀️', 'Cabelo colorido é tudo! 🌈', 'Você está linda!'] }],
  },
  {
    id: 'biblioteca', name: 'Biblioteca', icon: '📚', desc: 'Histórias mágicas', pub: true, w: 10, h: 9, floor: '#c8a27a', floorPat: 'madeira', wall: '#ffe7c2', wallPat: 'liso', door: 4,
    furni: [P('estante', 0, 0), P('estante', 2, 0), P('estante', 4, 0), P('estante', 6, 0), P('tapete-redondo', 3, 4, 0, '#ff8fc7'), P('pufe', 3, 4, 0, '#5ab0ff'), P('pufe', 5, 5, 0, '#ffd23f'), P('poltrona', 8, 4, 1, '#3ccf91'), P('mesa', 7, 7), P('luminaria', 9, 0, 0, '#ffffff', { on: true }), P('globo-deco', 0, 8)].filter((f) => f.type !== 'globo-deco'),
    bots: [{ id: 'livia', name: 'Bibliotecária Lívia', look: { hairStyle: 'franja', hairColor: '#7a4b2a', top: 'sueter', topColor: '#ffd23f', accessories: ['oculos-coracao'] }, lines: ['Já leu "A Sereia que Queria Voar"? 🧜‍♀️', 'Ler é viajar sem sair do lugar! 📖', 'Psiu... aqui é cantinho de leitura 🤫'] }],
  },
  {
    id: 'petshop', name: 'Pet Shop Patinhas', icon: '🐾', desc: 'Bichinhos fofos', pub: true, w: 10, h: 10, floor: '#bdf5e0', floorPat: 'xadrez', wall: '#7ee8c7', wallPat: 'bolinhas', door: 5,
    furni: [P('balcao', 1, 0, 0, '#ff8fc7'), P('banheira', 5, 0), P('tapete-redondo', 4, 4, 0, '#ffd23f'), P('bau', 8, 0), P('planta', 9, 9), P('arbusto', 0, 9), P('cesta-frutas', 3, 0)],
    pets: [{ species: 'cachorro', color: '#c8a27a' }, { species: 'gato', color: '#ffb066' }, { species: 'coelho', color: '#ffffff' }, { species: 'cachorro', color: '#ffffff' }, { species: 'gato', color: '#555a66' }],
    bots: [{ id: 'carol', name: 'Veterinária Carol', look: { hairStyle: 'trancas', hairColor: '#2b1a12', skin: '#6b3d24', top: 'jaleco', topColor: '#bdf5e0' }, lines: ['Os bichinhos adoram carinho! 🐶', 'Toque num pet para brincar com ele!', 'Esse gatinho se chama Pipoca 🐱'] }],
  },
  {
    id: 'terraco', name: 'Terraço das Estrelas', icon: '🌙', desc: 'Céu estrelado', pub: true, w: 11, h: 11, floor: '#3d3a6a', floorPat: 'xadrez', wall: '#1a1d4a', wallPat: 'bolinhas', door: 5,
    furni: [P('foguete', 9, 0), P('cristal', 0, 0, 0, '#c77dff'), P('cristal', 10, 10, 0, '#5ad1ff'), P('nuvem', 4, 2), P('estrela', 2, 7), P('estrela', 8, 5, 0, '#ff8fc7'), P('portal', 5, 9), P('banco', 3, 4), P('banco', 6, 4), P('poste', 0, 10), P('fonte', 4, 6, 0, '#d4b8ff'),
      Wl('estrelas-parede', 'R', 2), Wl('estrelas-parede', 'R', 6), Wl('estrelas-parede', 'L', 3), Wl('luzinhas', 'R', 4)],
    bots: [{ id: 'nina-ciencia', name: 'Cientista Nina', look: { hairStyle: 'black', hairColor: '#2b1a12', skin: '#4f2c1a', top: 'jaleco', topColor: '#ffffff' }, lines: ['Olha aquela estrela cadente! 🌠', 'Um dia vamos morar na Lua! 🌙', 'As estrelas são sóis bem longe!'] }],
  },
  {
    id: 'sorveteria', name: 'Sorveteria Geladinha', icon: '🍦', desc: 'Sorvetes coloridos', pub: true, w: 8, h: 8, floor: '#ffe5ec', floorPat: 'xadrez', wall: '#bdf5e0', wallPat: 'listras', door: 4,
    furni: [P('balcao', 1, 0, 0, '#ff8fc7'), P('balcao', 3, 0, 0, '#ff8fc7'), P('mesa-redonda', 2, 4, 0, '#ffffff'), P('pufe', 1, 4, 0, '#5ab0ff'), P('pufe', 3, 4, 0, '#ffd23f'), P('mesa-redonda', 5, 5, 0, '#ffffff'), P('pufe', 6, 5, 0, '#ff5fa2'), P('baloes', 7, 0)],
    bots: [{ id: 'gui', name: 'Sorveteiro Gui', job: 'sorvete', look: { hairStyle: 'franja', hairColor: '#4a2c1a', top: 'listrada', topColor: '#ff8fc7' }, lines: ['Sorvete de unicórnio! 🦄🍦', 'Uma bola ou duas?', 'Picolé de manga é o melhor!'] }],
  },
);

export const FRIENDS = () => PUBLIC_ROOMS.flatMap((r) => r.bots).filter((b) => !b.job);

function farmFurni(big: boolean): PFurni[] {
  const out: PFurni[] = [P('celeiro', 1, 1), P('trator', 5, 1), P('galinheiro', 13, 1), P('poco', 9, 1), P('espantalho', 8, 6), P('lago', 13, 11)];
  for (let x = 3; x < 9; x++) for (let y = 8; y < 11; y++) out.push(P('horta', x, y));
  for (let x = 0; x < (big ? 18 : 14); x++) if (x < 3 || x > 9) out.push(P('cerca-madeira', x, 15, 0));
  out.push(P('feno', 1, 6), P('feno', 2, 6), P('feno', 1, 7), P('cocho', 12, 6), P('arvore-frutas', 16, 4), P('arvore-frutas', 16, 7), P('arvore-frutas', 0, 12), P('cerejeira', 10, 12), P('flores', 11, 9, 0, '#ffd23f'), P('flores', 12, 9, 0, '#ff5fa2'), P('banco', 5, 13));
  return out;
}

PUBLIC_ROOMS.push({
  id: 'fazenda', name: 'Fazendinha Feliz', icon: '🚜', desc: 'Animais e horta', pub: true, w: 18, h: 16, floor: '#79c95a', floorPat: 'listras', wall: '#bfe9ff', wallPat: 'liso', door: 8,
  furni: farmFurni(true),
  pets: [{ species: 'vaca', color: '#ffffff' }, { species: 'vaca', color: '#ffffff' }, { species: 'porco', color: '#ffb3c6' }, { species: 'porco', color: '#ffb3c6' }, { species: 'ovelha', color: '#ffffff' }, { species: 'ovelha', color: '#ffffff' }, { species: 'galinha', color: '#ffffff' }, { species: 'galinha', color: '#ffffff' }, { species: 'galinha', color: '#ffffff' }, { species: 'cavalo', color: '#8d5b3a' }],
  bots: [{ id: 'ana', name: 'Fazendeira Ana', look: { hairStyle: 'trancas', hairColor: '#d9a35b', top: 'macacao', topColor: '#5ab0ff', accessories: ['chapeu-sol'] }, lines: ['Toque nos canteiros para plantar e colher! 🥕', 'As galinhas botaram ovinhos 🥚', 'A vaca Mimosa adora carinho 🐄'] }],
});

TEMPLATES.push({ id: 'fazenda', name: 'Fazenda grande', icon: '🚜', make: () => ({ w: 18, h: 16, floor: '#79c95a', floorPat: 'listras', wall: '#bfe9ff', wallPat: 'liso', door: 8, furni: farmFurni(true), pets: [{ species: 'vaca', color: '#ffffff' }, { species: 'galinha', color: '#ffffff' }, { species: 'galinha', color: '#ffffff' }, { species: 'porco', color: '#ffb3c6' }, { species: 'ovelha', color: '#ffffff' }] }) });
