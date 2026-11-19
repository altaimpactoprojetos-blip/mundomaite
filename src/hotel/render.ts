import { iso, poly, shade, tile, box, type Cam, TW, TH, WALL_H } from './iso';
void TW;
import { FURNI_MAP, dims, drawWallItem, type PFurni } from './furni';
import type { HotelRoom } from './rooms';
import { drawAvatar, drawPet } from './avatar';
import { hs, floorItemAt } from './engine';
import type { Appearance } from '../types';

export function roomCam(room: HotelRoom, lw: number, lh: number, pan: { x: number; y: number }): Cam {
  const cx = (room.w / 2 - room.h / 2) * (TW / 2);
  const cy = (room.w / 2 + room.h / 2) * (TH / 2);
  return { ox: Math.round(lw / 2 - cx + pan.x), oy: Math.round(lh / 2 - cy + 18 + pan.y) };
}

function drawWalls(g: CanvasRenderingContext2D, cam: Cam, room: HotelRoom) {
  const { w, h } = room;
  const lc = shade(room.wall, 0.9), rc = room.wall;
  // parede esquerda (ao longo de y, em x=0) e direita (ao longo de x, em y=0)
  poly(g, [iso(cam, 0, 0, WALL_H), iso(cam, 0, h, WALL_H), iso(cam, 0, h, 0), iso(cam, 0, 0, 0)], lc);
  poly(g, [iso(cam, 0, 0, WALL_H), iso(cam, w, 0, WALL_H), iso(cam, w, 0, 0), iso(cam, 0, 0, 0)], rc);
  // padrão do papel de parede
  g.save();
  const pat = room.wallPat;
  for (let i = 0; i < Math.max(w, h) * 4; i++) {
    const a = i / 4;
    if (pat === 'listras' && i % 2 === 0) {
      if (a < h) poly(g, [iso(cam, 0, a, WALL_H), iso(cam, 0, a + 0.25, WALL_H), iso(cam, 0, a + 0.25, 0), iso(cam, 0, a, 0)], shade(lc, 0.94));
      if (a < w) poly(g, [iso(cam, a, 0, WALL_H), iso(cam, a + 0.25, 0, WALL_H), iso(cam, a + 0.25, 0, 0), iso(cam, a, 0, 0)], shade(rc, 0.94));
    }
    if (pat === 'bolinhas' && i % 2 === 0) {
      for (let z = 12; z < WALL_H - 6; z += 14) {
        const zz = z + (i % 4 ? 7 : 0);
        if (a < h) { const p = iso(cam, 0, a + 0.12, zz); g.fillStyle = shade(lc, 1.15); g.fillRect(p.x - 1, p.y - 1, 3, 2); }
        if (a < w) { const p = iso(cam, a + 0.12, 0, zz); g.fillStyle = shade(rc, 1.15); g.fillRect(p.x - 1, p.y - 1, 3, 2); }
      }
    }
  }
  if (pat === 'tijolo') {
    for (let z = 6; z < WALL_H; z += 6) {
      g.strokeStyle = shade(rc, 0.85);
      const a = iso(cam, 0, 0, z), b = iso(cam, w, 0, z), c = iso(cam, 0, h, z);
      g.beginPath(); g.moveTo(a.x, a.y + 0.5); g.lineTo(b.x, b.y + 0.5); g.moveTo(a.x, a.y + 0.5); g.lineTo(c.x, c.y + 0.5); g.stroke();
    }
  }
  g.restore();
  // sombreamento: mais escuro embaixo e no canto
  const top0 = iso(cam, 0, 0, WALL_H), bot0 = iso(cam, 0, 0, 0);
  const vg = g.createLinearGradient(0, top0.y, 0, bot0.y + (Math.max(w, h) * TH) / 2);
  vg.addColorStop(0, 'rgba(255,255,255,0.10)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.16)');
  poly(g, [iso(cam, 0, 0, WALL_H), iso(cam, 0, h, WALL_H), iso(cam, 0, h, 0), iso(cam, 0, 0, 0)], vg);
  poly(g, [iso(cam, 0, 0, WALL_H), iso(cam, w, 0, WALL_H), iso(cam, w, 0, 0), iso(cam, 0, 0, 0)], vg);
  const cg = g.createLinearGradient(top0.x - 14, 0, top0.x + 14, 0);
  cg.addColorStop(0, 'rgba(0,0,0,0)'); cg.addColorStop(0.5, 'rgba(0,0,0,0.16)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = cg; g.fillRect(top0.x - 14, top0.y, 28, bot0.y - top0.y);
  // rodapé
  poly(g, [iso(cam, 0, 0, 4), iso(cam, 0, h, 4), iso(cam, 0, h, 0), iso(cam, 0, 0, 0)], shade(lc, 0.7));
  poly(g, [iso(cam, 0, 0, 4), iso(cam, w, 0, 4), iso(cam, w, 0, 0), iso(cam, 0, 0, 0)], shade(rc, 0.7));
  // espessura do topo da parede
  const T = 0.18;
  poly(g, [iso(cam, -T, -T, WALL_H), iso(cam, -T, h, WALL_H), iso(cam, 0, h, WALL_H), iso(cam, 0, 0, WALL_H)], shade(lc, 1.15), shade(lc, 0.6));
  poly(g, [iso(cam, -T, -T, WALL_H), iso(cam, w, -T, WALL_H), iso(cam, w, 0, WALL_H), iso(cam, 0, 0, WALL_H)], shade(rc, 1.15), shade(rc, 0.6));
  poly(g, [iso(cam, -T, h, WALL_H), iso(cam, 0, h, WALL_H), iso(cam, 0, h, 0), iso(cam, -T, h, 0)], shade(lc, 0.75));
  poly(g, [iso(cam, w, -T, WALL_H), iso(cam, w, 0, WALL_H), iso(cam, w, 0, 0), iso(cam, w, -T, 0)], shade(rc, 0.75));
  // porta
  const d = room.door;
  poly(g, [iso(cam, 0, d, 46), iso(cam, 0, d + 1, 46), iso(cam, 0, d + 1, 0), iso(cam, 0, d, 0)], '#2b1a3a', '#7a5a3a');
  poly(g, [iso(cam, 0, d + 0.05, 44), iso(cam, 0, d + 0.95, 44), iso(cam, 0, d + 0.95, 0), iso(cam, 0, d + 0.05, 0)], '#3d2a4f');
}

function drawFloor(g: CanvasRenderingContext2D, cam: Cam, room: HotelRoom) {
  const { w, h } = room;
  // espessura do piso
  poly(g, [iso(cam, 0, h, 0), iso(cam, w, h, 0), iso(cam, w, h, -6), iso(cam, 0, h, -6)], shade(room.floor, 0.62));
  poly(g, [iso(cam, w, 0, 0), iso(cam, w, h, 0), iso(cam, w, h, -6), iso(cam, w, 0, -6)], shade(room.floor, 0.5));
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    let c = room.floor;
    if (room.floorPat === 'xadrez' && (x + y) % 2) c = shade(c, 0.88);
    if (room.floorPat === 'listras' && x % 2) c = shade(c, 0.92);
    // pequenas variações de tom (piso menos chapado)
    const hsh = ((x * 73856093) ^ (y * 19349663)) & 7;
    if (hsh < 3) c = shade(c, hsh === 0 ? 0.96 : hsh === 1 ? 1.06 : 0.98);
    tile(g, cam, x, y, c, shade(room.floor, 0.82));
    if (room.floorPat === 'madeira') {
      g.strokeStyle = shade(room.floor, 0.86);
      for (let k = 1; k < 3; k++) { const a = iso(cam, x + k / 3, y), b = iso(cam, x + k / 3, y + 1); g.beginPath(); g.moveTo(a.x + 0.5, a.y + 0.5); g.lineTo(b.x + 0.5, b.y + 0.5); g.stroke(); }
    }
  }
  // sombra perto das paredes (duas faixas, bem suave)
  g.globalAlpha = 0.09;
  poly(g, [iso(cam, 0, 0), iso(cam, w, 0), iso(cam, w, 0.7), iso(cam, 0.7, 0.7), iso(cam, 0.7, h), iso(cam, 0, h)], '#000000');
  poly(g, [iso(cam, 0, 0), iso(cam, w, 0), iso(cam, w, 0.3), iso(cam, 0.3, 0.3), iso(cam, 0.3, h), iso(cam, 0, h)], '#000000');
  g.globalAlpha = 1;
  // luz das janelas entrando no chão
  for (const f of room.furni) {
    if (f.type !== 'janela' && f.type !== 'cortina') continue;
    const p0 = f.wpos ?? 0;
    const pts = f.wall === 'L'
      ? [iso(cam, 0, p0 + 0.1), iso(cam, 0, p0 + 0.9), iso(cam, Math.min(w, 3.6), p0 + 2.0), iso(cam, Math.min(w, 3.6), p0 + 0.9)]
      : [iso(cam, p0 + 0.1, 0), iso(cam, p0 + 0.9, 0), iso(cam, p0 + 2.0, Math.min(h, 3.6)), iso(cam, p0 + 0.9, Math.min(h, 3.6))];
    const lg = g.createLinearGradient(pts[0].x, pts[0].y, pts[2].x, pts[2].y);
    lg.addColorStop(0, 'rgba(255,250,210,0.34)'); lg.addColorStop(1, 'rgba(255,250,210,0)');
    poly(g, pts, lg);
  }
}

export interface Ent { depth: number; draw: () => void }

export function drawScene(g: CanvasRenderingContext2D, cam: Cam, room: HotelRoom, look: Appearance, t: number, pet: null | { species: string; color: string }) {
  drawWalls(g, cam, room);
  for (const f of room.furni) if (FURNI_MAP[f.type]?.wall) drawWallItem(g, cam, f, t);
  drawFloor(g, cam, room);
  if (hs.hover && hs.mode === 'walk') tile(g, cam, hs.hover.x, hs.hover.y, 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0.7)');
  // pisos / tapetes primeiro
  const flat = room.furni.filter((f) => FURNI_MAP[f.type]?.walk);
  flat.sort((a, b) => a.x + a.y - (b.x + b.y)).forEach((f) => { const d = FURNI_MAP[f.type]; const [W, D] = dims(f); d.draw(g, cam, { ...f, color: f.color ?? d.color }, W, D, t); });
  const ents: Ent[] = [];
  // sombras suaves dos móveis no chão
  g.fillStyle = 'rgba(20,10,40,0.16)';
  for (const f of room.furni) {
    const d = FURNI_MAP[f.type];
    if (!d || d.walk || d.wall) continue;
    const [W, D] = dims(f);
    const o = 0.28;
    const a = iso(cam, f.x + 0.12 + o, f.y + D - 0.05 + o), b2 = iso(cam, f.x + W - 0.05 + o, f.y + D - 0.05 + o), c2 = iso(cam, f.x + W - 0.05 + o, f.y + 0.12 + o), d0 = iso(cam, f.x + W - 0.1, f.y + 0.1), e0 = iso(cam, f.x + 0.1, f.y + D - 0.1);
    g.beginPath(); g.moveTo(e0.x, e0.y); g.lineTo(a.x, a.y); g.lineTo(b2.x, b2.y); g.lineTo(c2.x, c2.y); g.lineTo(d0.x, d0.y); g.lineTo(iso(cam, f.x + W - 0.1, f.y + D - 0.1).x, iso(cam, f.x + W - 0.1, f.y + D - 0.1).y); g.closePath(); g.fill();
  }
  for (const f of room.furni) {
    const d = FURNI_MAP[f.type];
    if (!d || d.walk || d.wall) continue;
    const [W, D] = dims(f);
    ents.push({ depth: f.x + f.y + (W - 1) + (D - 1) + 0.5, draw: () => d.draw(g, cam, { ...f, color: f.color ?? d.color }, W, D, t) });
  }
  const seatZ = (seat: string | null) => {
    if (!seat) return 0;
    const f = room.furni.find((x) => x.uid === seat);
    if (!f) return 0;
    return f.type === 'cama' || f.type === 'cama-princesa' ? 12 : f.type === 'trono' ? 6 : 4;
  };
  const avatar = (w: typeof hs.me, lk: Appearance, held: string | null, mounted = false) => {
    const fl = floorItemAt(room, Math.round(w.x), Math.round(w.y));
    const swim = fl?.type === 'piscina' && !w.path.length;
    let anim = w.anim;
    if (swim && anim === 'idle') anim = 'swim';
    const p = iso(cam, w.x + 0.5, w.y + 0.5, (mounted ? 14 : 0) + seatZ(w.seat));
    if (mounted) anim = 'ride';
    drawAvatar(g, p.x, p.y + (swim ? 6 : 0), lk, w.dir, anim, t, held);
  };
  ents.push({ depth: hs.me.x + hs.me.y + (hs.me.seat ? 1.2 : 0.6), draw: () => {
    if (hs.mounted && pet) { const p = iso(cam, hs.me.x + 0.5, hs.me.y + 0.5); drawPet(g, p.x, p.y, pet.species, pet.color, hs.me.dir, t, hs.me.path.length > 0); }
    avatar(hs.me, look, hs.held, hs.mounted);
  } });
  for (const b of hs.bots) ents.push({ depth: b.x + b.y + 0.6, draw: () => avatar(b, b.look, null) });
  if (pet && !hs.mounted) ents.push({ depth: hs.pet.x + hs.pet.y + 0.55, draw: () => { const p = iso(cam, hs.pet.x + 0.5, hs.pet.y + 0.5); drawPet(g, p.x, p.y, pet.species, pet.color, hs.pet.dir, t, hs.pet.moving, t < hs.pet.happyUntil); } });
  for (const rp of hs.roomPets) ents.push({ depth: rp.x + rp.y + 0.5, draw: () => { const p = iso(cam, rp.x + 0.5, rp.y + 0.5); drawPet(g, p.x, p.y, rp.species, rp.color, rp.dir, t, rp.moving, t < rp.happyUntil); } });
  ents.sort((a, b) => a.depth - b.depth).forEach((e) => e.draw());
  // fantasma ao colocar/mover
  if ((hs.mode === 'place' || hs.mode === 'move') && hs.ghost) {
    const type = hs.mode === 'place' ? hs.placeType : room.furni.find((f) => f.uid === hs.moveUid)?.type;
    const d = type ? FURNI_MAP[type] : null;
    if (d && !d.wall) {
      const gf: PFurni = { uid: 'ghost', type: d.id, x: hs.ghost.x, y: hs.ghost.y, rot: hs.placeRot, color: hs.placeColor || d.color };
      const [W, D] = dims(gf);
      g.globalAlpha = 0.55;
      for (let x = 0; x < W; x++) for (let y = 0; y < D; y++) tile(g, cam, gf.x + x, gf.y + y, 'rgba(60,207,145,0.5)');
      d.draw(g, cam, gf, W, D, t);
      g.globalAlpha = 1;
    }
  }
  // corações
  hs.hearts = hs.hearts.filter((h) => t - h.t0 < 1.4);
  for (const h of hs.hearts) {
    const a = t - h.t0;
    if (a < 0) continue;
    const p = iso(cam, h.x + 0.5, h.y + 0.5, 40 + a * 26);
    g.globalAlpha = 1 - a / 1.4;
    g.fillStyle = '#ff5fa2';
    g.fillRect(p.x - 2, p.y, 2, 2); g.fillRect(p.x + 1, p.y, 2, 2); g.fillRect(p.x - 1, p.y + 2, 3, 1); g.fillRect(p.x, p.y + 3, 1, 1);
    g.globalAlpha = 1;
  }
  void box;
}
