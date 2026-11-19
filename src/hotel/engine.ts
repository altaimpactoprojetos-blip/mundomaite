import { useGame } from '../store/gameStore';
import type { Appearance } from '../types';
import { FURNI_MAP, dims, type PFurni } from './furni';
import { PUBLIC_ROOMS, type BotDef, type HotelRoom } from './rooms';
import type { HAnim } from './avatar';
import { DEFAULT_APPEARANCE } from '../store/defaults';
import { sfx } from '../systems/audio';

export interface Walker { x: number; y: number; path: { x: number; y: number }[]; dir: number; anim: HAnim; emote: HAnim | null; emoteUntil: number; seat: string | null; arrive: (() => void) | null }
export interface Bot extends Walker { def: BotDef; look: Appearance; next: number; talkAt: number }
export interface Bubble { who: string; name: string; text: string; t0: number; color: string }

export const hs = {
  t: 0,
  roomId: '',
  me: { x: 0, y: 0, path: [], dir: 0, anim: 'idle', emote: null, emoteUntil: 0, seat: null, arrive: null } as Walker,
  mounted: false,
  held: null as string | null,
  pet: { x: 1, y: 1, dir: 0, moving: false, happyUntil: 0 },
  bots: [] as Bot[],
  bubbles: [] as Bubble[],
  hearts: [] as { x: number; y: number; t0: number }[],
  zoom: 0,
  pan: { x: 0, y: 0 },
  mode: 'walk' as 'walk' | 'place' | 'move',
  placeType: '' as string,
  placeColor: '' as string,
  placeRot: 0 as 0 | 1,
  moveUid: '' as string,
  ghost: null as null | { x: number; y: number },
  hover: null as null | { x: number; y: number },
};

export function currentRoom(): HotelRoom & { bots?: BotDef[] } {
  const pub = PUBLIC_ROOMS.find((r) => r.id === hs.roomId);
  if (pub) return pub;
  const s = useGame.getState();
  return s.hotelRooms.find((r) => r.id === hs.roomId) ?? s.hotelRooms[0];
}
export const isOwn = () => !PUBLIC_ROOMS.some((r) => r.id === hs.roomId);

export function updateRoom(fn: (r: HotelRoom) => HotelRoom) {
  if (!isOwn()) return;
  const s = useGame.getState();
  s.set({ hotelRooms: s.hotelRooms.map((r) => (r.id === hs.roomId ? fn(r) : r)) });
}

/** Mapa de ocupação: cada ladrilho → móvel que o ocupa (ignora pisos/tapetes) */
export function occupancy(room: HotelRoom) {
  const occ = new Map<string, PFurni>();
  for (const f of room.furni) {
    const d = FURNI_MAP[f.type];
    if (!d || d.wall || d.walk) continue;
    const [W, D] = dims(f);
    for (let x = f.x; x < f.x + W; x++) for (let y = f.y; y < f.y + D; y++) occ.set(`${x},${y}`, f);
  }
  return occ;
}
export function floorItemAt(room: HotelRoom, x: number, y: number) {
  return room.furni.find((f) => { const d = FURNI_MAP[f.type]; if (!d?.walk) return false; const [W, D] = dims(f); return x >= f.x && x < f.x + W && y >= f.y && y < f.y + D; });
}

/** Caminho (A*) em 8 direções desviando dos móveis */
export function findPath(room: HotelRoom, sx: number, sy: number, tx: number, ty: number, allowEnd = false) {
  const occ = occupancy(room);
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < room.w && y < room.h;
  const free = (x: number, y: number) => inside(x, y) && (!occ.has(`${x},${y}`) || (allowEnd && x === tx && y === ty));
  if (!inside(tx, ty)) return null;
  const start = `${sx},${sy}`;
  const open: { k: string; x: number; y: number; g: number; f: number }[] = [{ k: start, x: sx, y: sy, g: 0, f: 0 }];
  const came = new Map<string, string>();
  const gs = new Map<string, number>([[start, 0]]);
  let guard = 0;
  while (open.length && guard++ < 4000) {
    open.sort((a, b) => a.f - b.f);
    const c = open.shift()!;
    if (c.x === tx && c.y === ty) {
      const out: { x: number; y: number }[] = [];
      let k: string | undefined = c.k;
      while (k && k !== start) { const [x, y] = k.split(',').map(Number); out.unshift({ x, y }); k = came.get(k); }
      return out;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = c.x + dx, ny = c.y + dy;
      if (!free(nx, ny)) continue;
      if (dx && dy && (!free(c.x + dx, c.y) || !free(c.x, c.y + dy))) continue;
      const ng = c.g + (dx && dy ? 1.41 : 1);
      const nk = `${nx},${ny}`;
      if (ng < (gs.get(nk) ?? Infinity)) {
        gs.set(nk, ng);
        came.set(nk, c.k);
        open.push({ k: nk, x: nx, y: ny, g: ng, f: ng + Math.hypot(tx - nx, ty - ny) });
      }
    }
  }
  return null;
}

export function walkTo(w: Walker, tx: number, ty: number, arrive: (() => void) | null = null, allowEnd = false) {
  const room = currentRoom();
  const sx = Math.round(w.x), sy = Math.round(w.y);
  const p = findPath(room, sx, sy, tx, ty, allowEnd);
  w.seat = null;
  if (!p) return false;
  w.path = p;
  w.arrive = arrive;
  if (!p.length && arrive) { arrive(); w.arrive = null; }
  return true;
}

/** Vai até um ladrilho vizinho do alvo */
export function walkNear(w: Walker, tx: number, ty: number, tw: number, td: number, arrive: () => void) {
  const room = currentRoom();
  const occ = occupancy(room);
  const cands: { x: number; y: number; d: number }[] = [];
  for (let x = tx - 1; x <= tx + tw; x++) for (let y = ty - 1; y <= ty + td; y++) {
    if (x >= tx && x < tx + tw && y >= ty && y < ty + td) continue;
    if (x < 0 || y < 0 || x >= room.w || y >= room.h || occ.has(`${x},${y}`)) continue;
    cands.push({ x, y, d: Math.hypot(x - w.x, y - w.y) });
  }
  cands.sort((a, b) => a.d - b.d);
  for (const c of cands) {
    if (Math.round(w.x) === c.x && Math.round(w.y) === c.y) { arrive(); return true; }
    if (walkTo(w, c.x, c.y, arrive)) return true;
  }
  return false;
}

export function stepWalker(w: Walker, dt: number, speed = 3.6) {
  if (!w.path.length) return false;
  const n = w.path[0];
  const dx = n.x - w.x, dy = n.y - w.y;
  const d = Math.hypot(dx, dy);
  const st = speed * dt;
  if (d <= st) {
    w.x = n.x; w.y = n.y; w.path.shift();
    if (!w.path.length && w.arrive) { const a = w.arrive; w.arrive = null; a(); }
  } else { w.x += (dx / d) * st; w.y += (dy / d) * st; }
  // direção: +x → frente-direita (0), +y → frente-esquerda (1), -x → costas-esquerda (2), -y → costas-direita (3)
  if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
    if (Math.abs(dx) >= Math.abs(dy)) w.dir = dx > 0 ? 0 : 2; else w.dir = dy > 0 ? 1 : 3;
  }
  return true;
}

export function faceTo(w: Walker, x: number, y: number) {
  const dx = x - w.x, dy = y - w.y;
  if (Math.abs(dx) >= Math.abs(dy)) w.dir = dx > 0 ? 0 : 2; else w.dir = dy > 0 ? 1 : 3;
}

export function say(who: string, name: string, text: string, color = '#ffffff') {
  hs.bubbles.push({ who, name, text, t0: hs.t, color });
  if (hs.bubbles.length > 8) hs.bubbles.shift();
}
export function hearts(x: number, y: number) {
  for (let i = 0; i < 4; i++) hs.hearts.push({ x: x + (Math.random() - 0.5) * 0.6, y: y + (Math.random() - 0.5) * 0.6, t0: hs.t + i * 0.12 });
}

const REPLIES: [RegExp, string[]][] = [
  [/\b(oi|ola|olá|eai|e ai|oie)\b/i, ['Oiê, {n}! 👋', 'Olá! Que bom te ver! 💕', 'Oi oi! Tudo bem?']],
  [/tudo bem|como (você|vc) est/i, ['Tudo ótimo! E com você? 😊', 'Estou super feliz hoje! ☀️']],
  [/dan[cç]/i, ['Bora dançar! 💃', 'Eu amo dançar! 🎶']],
  [/nome/i, ['Meu nome é {b}! E o seu é {n}, né? 😄']],
  [/amig/i, ['Claro que somos amigas! 💖', 'Você é minha melhor amiga do hotel! 🥰']],
  [/unic[oó]rnio|purpurina|pet|cachorr|gat/i, ['Que pet mais fofo! 🦄', 'Posso fazer carinho? 🥺']],
  [/fome|comer|sorvete|bolo|chocolate|bebida/i, ['Hmm, vamos ao Café Nuvem de Leite! ☕', 'Sorvete é tudo de bom! 🍦']],
  [/tchau|até|bye/i, ['Tchau, {n}! Volte sempre! 👋', 'Até logo! 💕']],
  [/lindo|linda|bonit/i, ['Obrigada! Você também está linda! ✨']],
];
export function botReply(text: string, b: Bot) {
  const name = useGame.getState().appearance.name || 'Maitê';
  for (const [re, opts] of REPLIES) if (re.test(text)) return opts[Math.floor(Math.random() * opts.length)].replace('{n}', name).replace('{b}', b.def.name.split(' ').pop()!);
  const gen = ['Que legal! 😄', 'Uau! Me conta mais!', 'Hahaha! 😂', 'Adorei! 💕', 'Verdade! ✨', 'Hmm, que interessante! 🤔'];
  return gen[Math.floor(Math.random() * gen.length)];
}

export function botLook(def: BotDef): Appearance {
  return { ...DEFAULT_APPEARANCE, accessories: [], hairStyle: 'curto', topColor: '#5ab0ff', bottom: 'calca', bottomColor: '#2b2d42', shoesColor: '#ffffff', skin: '#eebb99', ...def.look } as Appearance;
}

export function enterRoom(id: string) {
  hs.roomId = id;
  const room = currentRoom();
  hs.me.x = 0; hs.me.y = Math.min(room.h - 1, room.door);
  hs.me.path = []; hs.me.seat = null; hs.me.dir = 0;
  walkTo(hs.me, 1, Math.min(room.h - 1, room.door));
  hs.pet.x = 0; hs.pet.y = Math.min(room.h - 1, room.door + 1);
  hs.pan = { x: 0, y: 0 };
  hs.mode = 'walk';
  hs.bubbles = [];
  const occ = occupancy(room);
  const freeTile = () => {
    for (let i = 0; i < 80; i++) { const x = 1 + Math.floor(Math.random() * (room.w - 1)), y = 1 + Math.floor(Math.random() * (room.h - 1)); if (!occ.has(`${x},${y}`)) return { x, y }; }
    return { x: room.w - 1, y: room.h - 1 };
  };
  hs.bots = (room.bots ?? []).map((def) => {
    let p = freeTile();
    if (def.dance) { const df = room.furni.filter((f) => f.type === 'pista-danca'); if (df.length) { const f = df[Math.floor(Math.random() * df.length)]; p = { x: f.x, y: f.y }; } }
    if (def.job) { const bal = room.furni.find((f) => f.type === 'balcao'); if (bal) p = { x: bal.x + 1, y: bal.y + 1 }; }
    return { def, look: botLook(def), x: p.x, y: p.y, path: [], dir: 1, anim: 'idle' as HAnim, emote: null, emoteUntil: 0, seat: null, arrive: null, next: hs.t + 2 + Math.random() * 4, talkAt: hs.t + 3 + Math.random() * 6 };
  });
  useGame.getState().set({ hotelLast: id });
  sfx('door');
  if (room.bots?.length) setTimeout(() => { const b = hs.bots[0]; if (b) say(b.def.id, b.def.name, room.pub ? `Bem-vinda ao ${room.name}! 💕` : 'Oi!'); }, 900);
}

export function newRoomId() {
  return 'q-' + Math.random().toString(36).slice(2, 8);
}
