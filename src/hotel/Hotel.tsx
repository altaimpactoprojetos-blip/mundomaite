import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { hs, currentRoom, isOwn, enterRoom, stepWalker, walkTo, walkNear, faceTo, say, hearts, botReply, updateRoom, occupancy, floorItemAt, newRoomId } from './engine';
import { roomCam, drawScene } from './render';
import { tileAt, TW, TH, WALL_H, iso } from './iso';
import { FURNI, FURNI_CATS, FURNI_MAP, dims, CROP_TIME, type FurniCat, type PFurni } from './furni';
import { PUBLIC_ROOMS, starterRoom, extraRooms, TEMPLATES, FRIENDS, type HotelRoom } from './rooms';
import { PhotosPanel } from '../ui/MiscPanels';
import { todayKey } from '../data/quests';
import { botLook } from './engine';
import { drawAvatar } from './avatar';
import { sfx, unlockAudio, startMusic } from '../systems/audio';
import { PETS } from '../data/pets';
import { SettingsPanel, HelpPanel } from '../ui/SettingsPanel';
import { BUILD_COLORS, CLOTH_COLORS, HAIR_COLORS, SKIN_TONES, EYE_COLORS } from '../data/palette';
import type { Appearance, HairStyle } from '../types';
import { saveNow } from '../store/persistence';
import './hotel.css';

function activePet() {
  const s = useGame.getState();
  const p = s.pets.find((x) => x.id === s.activePet) ?? s.pets.find((x) => x.species === 'unicornio');
  return p ? { species: p.species, color: p.color, name: p.name, id: p.id } : null;
}

// --------------------------------------------------------------------------
export function Hotel() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const low = useMemo(() => document.createElement('canvas'), []);
  const screen = useGame((s) => s.screen);
  const [panel, setPanel] = useState<null | 'nav' | 'cat' | 'look' | 'room' | 'invite' | 'gift'>(null);
  const giftDay = useGame((s) => s.hotelGiftDay);
  const [menu, setMenu] = useState<null | { kind: 'furni' | 'bot' | 'pet'; id: string }>(null);
  const [, force] = useState(0);
  const [chat, setChat] = useState('');
  const storePanel = useGame((s) => s.panel);
  const geom = useRef({ scale: 2, cam: { ox: 0, oy: 0 }, lw: 0, lh: 0 });

  // primeira vez: garante o Purpurina e entra no último quarto
  useEffect(() => {
    const s = useGame.getState();
    if (!s.pets.length) { const p = s.adoptPet('unicornio', '#ffffff'); s.updatePet(p.id, { name: 'Purpurina', accessory: 'laco', accColor: '#ff5fa2' }); }
    if (!s.hotelRooms.length) s.set({ hotelRooms: [starterRoom()] });
    if ((s.hotelSeed ?? 0) < 2) {
      const have = new Set(useGame.getState().hotelRooms.map((r) => r.id));
      useGame.getState().set({ hotelRooms: [...useGame.getState().hotelRooms, ...extraRooms().filter((r) => !have.has(r.id))], hotelSeed: 2 });
    }
    const last = useGame.getState().hotelLast;
    enterRoom(PUBLIC_ROOMS.some((r) => r.id === last) || useGame.getState().hotelRooms.some((r) => r.id === last) ? last : useGame.getState().hotelRooms[0].id);
  }, []);

  // laço de desenho
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      hs.t += dt;
      update(dt);
      const c = canvas.current;
      if (c) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const W = Math.floor(c.clientWidth * dpr), H = Math.floor(c.clientHeight * dpr);
        if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
        const room = currentRoom();
        const roomPxW = (room.w + room.h) * (TW / 2) + 40, roomPxH = (room.w + room.h) * (TH / 2) + WALL_H + 60;
        const fit = Math.max(1, Math.floor(Math.min(W / roomPxW, H / roomPxH) * 2) / 2);
        const scale = Math.max(1, Math.min(8, fit + hs.zoom));
        const lw = Math.ceil(W / scale), lh = Math.ceil(H / scale);
        const SS = 2; // dobro de definição no desenho
        if (low.width !== lw * SS || low.height !== lh * SS) { low.width = lw * SS; low.height = lh * SS; }
        const g = low.getContext('2d')!;
        g.setTransform(SS, 0, 0, SS, 0, 0);
        g.imageSmoothingEnabled = false;
        const bg = g.createLinearGradient(0, 0, 0, lh);
        bg.addColorStop(0, '#1e2a5a'); bg.addColorStop(1, '#3a2a6a');
        g.fillStyle = bg; g.fillRect(0, 0, lw, lh);
        // estrelinhas no fundo
        for (let i = 0; i < 40; i++) { const sx = (i * 97) % lw, sy = (i * 53) % lh; g.fillStyle = `rgba(255,255,255,${0.15 + 0.25 * Math.abs(Math.sin(hs.t * 0.8 + i))})`; g.fillRect(sx, sy, 1, 1); }
        const cam = roomCam(room, lw, lh, hs.pan);
        geom.current = { scale, cam, lw, lh };
        drawScene(g, cam, room, useGame.getState().appearance, hs.t, activePet());
        const out = c.getContext('2d')!;
        out.imageSmoothingEnabled = scale / SS < 1;
        out.drawImage(low, 0, 0, lw * scale, lh * scale);
        // vinheta suave nas bordas
        const vg = out.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
        vg.addColorStop(0, 'rgba(10,5,30,0)'); vg.addColorStop(1, 'rgba(10,5,30,0.35)');
        out.fillStyle = vg; out.fillRect(0, 0, W, H);
        drawBubbles(out, cam, scale, dpr);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [low]);

  // ---------------- lógica por quadro ----------------
  function update(dt: number) {
    const me = hs.me;
    const moving = stepWalker(me, dt);
    me.anim = moving ? 'walk' : me.seat ? seatAnim(me.seat) : me.emote && hs.t < me.emoteUntil ? me.emote : 'idle';
    if (!moving && me.seat) {
      const f = currentRoom().furni.find((x) => x.uid === me.seat);
      if (f) { const [W, D] = dims(f); me.x = f.x + (W - 1) / 2; me.y = f.y + (D - 1) / 2; }
    }
    // pet segue a Maitê
    const P = hs.pet;
    const dx = me.x - P.x, dy = me.y - P.y;
    const d = Math.hypot(dx, dy);
    P.moving = d > 1.3 && !hs.mounted;
    if (P.moving) { P.x += (dx / d) * Math.min(d - 1.2, 3.8 * dt); P.y += (dy / d) * Math.min(d - 1.2, 3.8 * dt); P.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3; }
    // personagens do hotel
    const room = currentRoom();
    for (const rp of hs.roomPets) {
      const ddx = rp.tx - rp.x, ddy = rp.ty - rp.y, dd = Math.hypot(ddx, ddy);
      rp.moving = dd > 0.05;
      if (rp.moving) { const st = Math.min(dd, 1.6 * dt); rp.x += (ddx / dd) * st; rp.y += (ddy / dd) * st; rp.dir = Math.abs(ddx) >= Math.abs(ddy) ? (ddx > 0 ? 0 : 2) : ddy > 0 ? 1 : 3; }
      else if (hs.t > rp.next) {
        rp.next = hs.t + 2 + Math.random() * 4;
        const occ = occupancy(room);
        const nx = Math.max(0, Math.min(room.w - 1, Math.round(rp.x + (Math.random() - 0.5) * 4))), ny = Math.max(0, Math.min(room.h - 1, Math.round(rp.y + (Math.random() - 0.5) * 4)));
        if (!occ.has(`${nx},${ny}`)) { rp.tx = nx; rp.ty = ny; }
      }
    }
    for (const b of hs.bots) {
      const mv = stepWalker(b, dt, 2.2);
      const onDance = floorItemAt(room, Math.round(b.x), Math.round(b.y))?.type === 'pista-danca';
      b.anim = mv ? 'walk' : b.emote && hs.t < b.emoteUntil ? b.emote : b.def.dance && onDance ? 'dance' : 'idle';
      if (!mv && hs.t > b.next && !b.def.job) {
        b.next = hs.t + 4 + Math.random() * 6;
        const occ = occupancy(room);
        for (let k = 0; k < 10; k++) {
          const tx = b.def.dance ? Math.round(b.x + (Math.random() - 0.5) * 4) : Math.floor(Math.random() * room.w);
          const ty = b.def.dance ? Math.round(b.y + (Math.random() - 0.5) * 4) : Math.floor(Math.random() * room.h);
          if (tx < 0 || ty < 0 || tx >= room.w || ty >= room.h || occ.has(`${tx},${ty}`)) continue;
          if (b.def.dance && floorItemAt(room, tx, ty)?.type !== 'pista-danca') continue;
          walkTo(b, tx, ty);
          break;
        }
      }
      if (hs.t > b.talkAt) { b.talkAt = hs.t + 10 + Math.random() * 12; say(b.def.id, b.def.name, b.def.lines[Math.floor(Math.random() * b.def.lines.length)]); }
      if (!mv && Math.hypot(b.x - me.x, b.y - me.y) < 3) faceTo(b, me.x, me.y);
    }
  }
  function seatAnim(uid: string) {
    const f = currentRoom().furni.find((x) => x.uid === uid);
    return f && FURNI_MAP[f.type]?.use === 'lay' ? 'lay' : 'sit';
  }

  // ---------------- balões de conversa (texto nítido) ----------------
  function drawBubbles(out: CanvasRenderingContext2D, cam: { ox: number; oy: number }, scale: number, dpr: number) {
    hs.bubbles = hs.bubbles.filter((b) => hs.t - b.t0 < 6);
    let prevTop = Infinity;
    const list = [...hs.bubbles].reverse();
    out.font = `bold ${Math.round(12 * dpr)}px "Baloo 2", sans-serif`;
    for (const b of list) {
      const w = b.who === 'me' ? hs.me : hs.bots.find((x) => x.def.id === b.who);
      if (!w) continue;
      const p = iso(cam, w.x + 0.5, w.y + 0.5, 62);
      const text = `${b.name}: ${b.text}`;
      const tw = out.measureText(text).width + 16 * dpr;
      // balões sobem em coluna, sem se sobrepor (o mais novo embaixo)
      const y = Math.min(p.y * scale - 20 * dpr, prevTop - 24 * dpr);
      prevTop = y;
      const x = Math.max(4, Math.min(out.canvas.width - tw - 4, p.x * scale - tw / 2));
      out.globalAlpha = Math.min(1, (6 - (hs.t - b.t0)) * 2);
      out.fillStyle = b.who === 'me' ? '#ffe3f1' : '#ffffff';
      out.strokeStyle = '#3b2a4a';
      out.lineWidth = 2 * dpr;
      out.beginPath(); out.roundRect(x, y, tw, 20 * dpr, 8 * dpr); out.fill(); out.stroke();
      out.fillStyle = '#3b2a4a';
      out.fillText(text, x + 8 * dpr, y + 14.5 * dpr);
      out.globalAlpha = 1;
    }
  }

  // ---------------- toque / mouse ----------------
  useEffect(() => {
    const c = canvas.current!;
    const ptrs = new Map<number, { x: number; y: number }>();
    let down: { x: number; y: number; moved: number; t: number } | null = null;
    let pinch = 0;
    const toLow = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const dpr = c.width / r.width;
      const { scale, cam } = geom.current;
      const lx = ((e.clientX - r.left) * dpr) / scale, ly = ((e.clientY - r.top) * dpr) / scale;
      return { lx, ly, t: tileAt(cam, lx, ly) };
    };
    const pd = (e: PointerEvent) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); down = ptrs.size === 1 ? { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() } : null; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } unlockAudio(); };
    const pm = (e: PointerEvent) => {
      const { t } = toLow(e);
      hs.hover = { x: Math.floor(t.x), y: Math.floor(t.y) };
      if (hs.mode !== 'walk') hs.ghost = { x: Math.floor(t.x), y: Math.floor(t.y) };
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (Math.abs(d - pinch) > 40) { hs.zoom = Math.max(-2, Math.min(4, hs.zoom + (d > pinch ? 0.5 : -0.5))); pinch = d; } return; }
      if (down) { down.moved += Math.abs(dx) + Math.abs(dy); if (down.moved > 12) { const k = (c.width / c.getBoundingClientRect().width) / geom.current.scale; hs.pan.x += dx * k; hs.pan.y += dy * k; } }
    };
    const pu = (e: PointerEvent) => {
      ptrs.delete(e.pointerId);
      const d = down;
      down = null;
      if (!d || d.moved > 12) return;
      tap(toLow(e).t);
    };
    const wh = (e: WheelEvent) => { hs.zoom = Math.max(-2, Math.min(4, hs.zoom + (e.deltaY < 0 ? 0.5 : -0.5))); };
    c.addEventListener('pointerdown', pd);
    c.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    c.addEventListener('wheel', wh, { passive: true });
    return () => { c.removeEventListener('pointerdown', pd); c.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); c.removeEventListener('wheel', wh); };
  }, []);

  function tap(t: { x: number; y: number }) {
    if (useGame.getState().screen !== 'game') return;
    const room = currentRoom();
    const tx = Math.floor(t.x), ty = Math.floor(t.y);
    setMenu(null);
    // colocar / mover móveis
    if (hs.mode === 'place' || hs.mode === 'move') {
      if (!isOwn()) { toast('Os quartos do hotel não podem ser mudados. Decore os seus quartos! 🏠'); return; }
      const type = hs.mode === 'place' ? hs.placeType : room.furni.find((f) => f.uid === hs.moveUid)?.type;
      const d = type ? FURNI_MAP[type] : null;
      if (!d) return;
      if (d.wall) {
        const wall: 'L' | 'R' = t.x < t.y ? 'L' : 'R';
        const wpos = Math.max(0, Math.min((wall === 'L' ? room.h : room.w) - 1, Math.floor(wall === 'L' ? t.y : t.x)));
        if (hs.mode === 'place') updateRoom((r) => ({ ...r, furni: [...r.furni, { uid: newRoomId(), type: d.id, x: 0, y: 0, rot: 0, wall, wpos, color: hs.placeColor || d.color }] }));
        else { updateRoom((r) => ({ ...r, furni: r.furni.map((f) => (f.uid === hs.moveUid ? { ...f, wall, wpos } : f)) })); hs.mode = 'walk'; }
        sfx('pop');
        return;
      }
      const W = hs.placeRot ? d.d : d.w, D = hs.placeRot ? d.w : d.d;
      if (tx < 0 || ty < 0 || tx + W > room.w || ty + D > room.h) { sfx('error'); return; }
      const occ = occupancy(room);
      for (let x = tx; x < tx + W; x++) for (let y = ty; y < ty + D; y++) { const o = occ.get(`${x},${y}`); if (o && o.uid !== hs.moveUid && !d.walk) { sfx('error'); return; } }
      if (hs.mode === 'place') updateRoom((r) => ({ ...r, furni: [...r.furni, { uid: newRoomId(), type: d.id, x: tx, y: ty, rot: hs.placeRot, color: hs.placeColor || d.color }] }));
      else { updateRoom((r) => ({ ...r, furni: r.furni.map((f) => (f.uid === hs.moveUid ? { ...f, x: tx, y: ty, rot: hs.placeRot } : f)) })); hs.mode = 'walk'; force((n) => n + 1); }
      sfx('pop');
      return;
    }
    // porta → navegador
    if (tx <= 0 && Math.abs(t.y - (room.door + 0.5)) < 0.8 && t.x < 0.3) { setPanel('nav'); return; }
    if (tx < 0 || ty < 0 || tx >= room.w || ty >= room.h) {
      // toque na parede: item de parede?
      if (isOwn()) {
        const wall = t.x < t.y ? 'L' : 'R';
        const pos = Math.floor(wall === 'L' ? t.y : t.x);
        const it = room.furni.find((f) => f.wall === wall && f.wpos === pos);
        if (it) setMenu({ kind: 'furni', id: it.uid });
      }
      return;
    }
    // personagem
    const bot = hs.bots.find((b) => Math.hypot(b.x - tx, b.y - ty) < 0.9);
    if (bot) { walkNear(hs.me, Math.round(bot.x), Math.round(bot.y), 1, 1, () => { faceTo(hs.me, bot.x, bot.y); setMenu({ kind: 'bot', id: bot.def.id }); }); return; }
    const rpet = hs.roomPets.find((p) => Math.hypot(p.x - tx, p.y - ty) < 0.9);
    if (rpet) { walkNear(hs.me, Math.round(rpet.x), Math.round(rpet.y), 1, 1, () => { rpet.happyUntil = hs.t + 3; hearts(rpet.x, rpet.y); faceTo(hs.me, rpet.x, rpet.y); hs.me.emote = 'hug'; hs.me.emoteUntil = hs.t + 1.5; say('me', nameOf(), rpet.species === 'gato' ? 'Que gatinho fofo! 🐱' : rpet.species === 'coelho' ? 'Coelhinho lindo! 🐰' : 'Oi, cachorrinho! 🐶'); sfx(rpet.species === 'gato' ? 'meow' : rpet.species === 'cachorro' ? 'bark' : 'sparkle'); }); return; }
    // pet
    const pet = activePet();
    if (pet && !hs.mounted && Math.hypot(hs.pet.x - tx, hs.pet.y - ty) < 1) { setMenu({ kind: 'pet', id: pet.id }); return; }
    // móvel
    const occ = occupancy(room);
    const f = occ.get(`${tx},${ty}`) ?? floorItemAt(room, tx, ty);
    if (f && !FURNI_MAP[f.type].walk) {
      if (isOwn()) setMenu({ kind: 'furni', id: f.uid });
      else useFurni(f);
      return;
    }
    if (f && FURNI_MAP[f.type].use === 'dance') { walkTo(hs.me, tx, ty, () => { hs.me.emote = 'dance'; hs.me.emoteUntil = hs.t + 30; }); return; }
    walkTo(hs.me, tx, ty);
  }

  function useFurni(f: PFurni) {
    const d = FURNI_MAP[f.type];
    const [W, D] = dims(f);
    setMenu(null);
    if (d.use === 'sit' || d.use === 'lay') {
      walkNear(hs.me, f.x, f.y, W, D, () => { hs.me.seat = f.uid; sfx('pop'); });
      return;
    }
    walkNear(hs.me, f.x, f.y, W, D, () => {
      faceTo(hs.me, f.x + W / 2, f.y + D / 2);
      if (d.use === 'toggle') { updateRoom((r) => ({ ...r, furni: r.furni.map((x) => (x.uid === f.uid ? { ...x, on: !x.on } : x)) })); if (!isOwn()) { const pf = currentRoom().furni.find((x) => x.uid === f.uid); if (pf) pf.on = !pf.on; } sfx(f.type === 'piano' ? 'note' : 'click', 1 + Math.random()); }
      if (d.use === 'look') { setPanel('look'); return; }
      if (d.use === 'farm') {
        const cur = currentRoom().furni.find((x) => x.uid === f.uid);
        const grown = cur?.t0 && (Date.now() - cur.t0) / 1000 >= CROP_TIME;
        const nt0 = !cur?.t0 ? Date.now() : grown ? undefined : cur.t0;
        if (isOwn()) updateRoom((r) => ({ ...r, furni: r.furni.map((x) => (x.uid === f.uid ? { ...x, t0: nt0 } : x)) }));
        else if (cur) cur.t0 = nt0;
        hs.me.emote = 'hug'; hs.me.emoteUntil = hs.t + 1;
        if (!cur?.t0) { say('me', nameOf(), 'Plantei uma sementinha! 🌱'); sfx('pop'); }
        else if (grown) { say('me', nameOf(), 'Colhi! Que delícia! 🥕🍓'); hearts(f.x, f.y); sfx('coin'); useGame.getState().track('harvest'); }
        else { say('me', nameOf(), `Ainda está crescendo... ⏳`); }
        return;
      }
      if (d.use === 'jump') { hs.me.emote = 'dance'; hs.me.emoteUntil = hs.t + 2; hearts(hs.me.x, hs.me.y); sfx('jump', 1.4); return; }
      if (d.use === 'snack') { hs.held = 'sorvete'; say('me', nameOf(), 'Hmm, que delícia! 😋'); sfx('pop'); }
    });
  }

  const nameOf = () => useGame.getState().appearance.name || 'Maitê';
  const toast = (t: string) => useGame.getState().toast(t, '🏨');

  function sendChat(text: string) {
    const tx = text.trim();
    if (!tx) return;
    say('me', nameOf(), tx.slice(0, 80));
    setChat('');
    if (/dan[cç]/i.test(tx)) { hs.me.emote = 'dance'; hs.me.emoteUntil = hs.t + 8; }
    if (/^(oi|ola|olá|tchau)/i.test(tx)) { hs.me.emote = 'wave'; hs.me.emoteUntil = hs.t + 2; }
    const near = [...hs.bots].sort((a, b) => Math.hypot(a.x - hs.me.x, a.y - hs.me.y) - Math.hypot(b.x - hs.me.x, b.y - hs.me.y))[0];
    if (near) setTimeout(() => { say(near.def.id, near.def.name, botReply(tx, near)); faceTo(near, hs.me.x, hs.me.y); if (/dan[cç]/i.test(tx)) { near.emote = 'dance'; near.emoteUntil = hs.t + 8; } }, 900 + Math.random() * 700);
  }

  const photo = () => {
    const c = canvas.current;
    if (!c) return;
    const W = 720, H = Math.round((c.height / c.width) * W);
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const g = off.getContext('2d')!; g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(0, H - 34, W, 34); g.fillStyle = '#e83e8c'; g.font = 'bold 20px sans-serif'; g.fillText(`📸 Hotel da Maitê · ${currentRoom().name}`, 12, H - 11);
    useGame.getState().addPhoto(off.toDataURL('image/jpeg', 0.8), currentRoom().name);
    sfx('camera');
    toast('Foto do quarto guardada no álbum! 📸');
  };
  const emote = (a: 'dance' | 'wave' | 'hug', secs = 4) => { hs.me.seat = null; hs.me.emote = a; hs.me.emoteUntil = hs.t + secs; if (a === 'hug') hearts(hs.me.x, hs.me.y); sfx('pop'); };
  const room = currentRoom();
  const own = isOwn();

  return (
    <div className="hotel">
      <canvas ref={canvas} className="hotel-canvas" />
      {screen === 'title' ? <HotelTitle /> : (
        <>
          <div className="h-top">
            <div className="h-chip">{room.icon ?? '🏠'} {room.name}</div>
            <div style={{ flex: 1 }} />
            <button className="h-btn" onClick={() => { hs.zoom = Math.min(4, hs.zoom + 0.5); }}>🔍+</button>
            <button className="h-btn" onClick={() => { hs.zoom = Math.max(-2, hs.zoom - 0.5); }}>🔍−</button>
            <button className="h-btn" onClick={() => useGame.getState().openPanel('settings')}>⚙️</button>
          </div>
          {(hs.mode === 'place' || hs.mode === 'move') && (
            <div className="h-place">
              <b>{hs.mode === 'place' ? `Toque no chão para colocar: ${FURNI_MAP[hs.placeType]?.name}` : 'Toque onde quer colocar o móvel'}</b>
              <button className="btn small" onClick={() => { hs.placeRot = hs.placeRot ? 0 : 1; force((n) => n + 1); }}>⟳ Girar</button>
              <button className="btn small pink" onClick={() => { hs.mode = 'walk'; hs.ghost = null; force((n) => n + 1); }}>✅ Pronto</button>
            </div>
          )}
          {menu && <ContextMenu menu={menu} close={() => setMenu(null)} useFurni={useFurni} emote={emote} />}
          <div className="h-bar" onPointerDown={(e) => e.stopPropagation()}>
            <button className="h-tool" onClick={() => setPanel('nav')}><span>🏨</span>Quartos</button>
            <button className="h-tool" onClick={() => setPanel('cat')}><span>🛍️</span>Catálogo</button>
            <button className="h-tool" onClick={() => setPanel('look')}><span>👗</span>Visual</button>
            {own && <button className="h-tool" onClick={() => setPanel('room')}><span>🎨</span>Quarto</button>}
            {own && <button className="h-tool" onClick={() => setPanel('invite')}><span>👭</span>Convidar</button>}
            <button className="h-tool" onClick={() => emote('dance', 10)}><span>💃</span>Dançar</button>
            <button className="h-tool" onClick={photo}><span>📸</span>Foto</button>
            <button className="h-tool" onClick={() => useGame.getState().openPanel('photos')}><span>🖼️</span>Álbum</button>
            {giftDay !== todayKey() && <button className="h-tool gift" onClick={() => setPanel('gift')}><span>🎁</span>Presente</button>}
            <button className="h-tool" onClick={() => emote('wave', 2.5)}><span>👋</span>Oi</button>
            <form className="h-chat" onSubmit={(e) => { e.preventDefault(); sendChat(chat); }}>
              <input value={chat} maxLength={80} placeholder="Escreva algo..." onChange={(e) => setChat(e.target.value)} />
              <button className="btn small pink" type="submit">💬</button>
            </form>
          </div>
          {panel === 'nav' && <Navigator close={() => setPanel(null)} />}
          {panel === 'cat' && <Catalog close={() => setPanel(null)} start={(type, color) => { hs.mode = 'place'; hs.placeType = type; hs.placeColor = color; hs.placeRot = 0; setPanel(null); if (!own) toast('Vá para um dos seus quartos para decorar! 🏠'); force((n) => n + 1); }} />}
          {panel === 'look' && <LookEditor close={() => setPanel(null)} />}
          {panel === 'room' && own && <RoomSettings close={() => setPanel(null)} />}
          {storePanel === 'settings' && <SettingsPanel />}
          {storePanel === 'help' && <HelpPanel />}
          {storePanel === 'photos' && <PhotosPanel />}
          {panel === 'invite' && <Invite close={() => setPanel(null)} />}
          {panel === 'gift' && <DailyGift close={() => setPanel(null)} />}
        </>
      )}
    </div>
  );
}

// ------------------------- menu ao tocar -------------------------
function ContextMenu({ menu, close, useFurni, emote }: { menu: { kind: 'furni' | 'bot' | 'pet'; id: string }; close: () => void; useFurni: (f: PFurni) => void; emote: (a: 'dance' | 'wave' | 'hug', s?: number) => void }) {
  const g = useGame.getState;
  const name = g().appearance.name || 'Maitê';
  if (menu.kind === 'furni') {
    const f = currentRoom().furni.find((x) => x.uid === menu.id);
    if (!f) return null;
    const d = FURNI_MAP[f.type];
    return (
      <div className="h-menu" onPointerDown={(e) => e.stopPropagation()}>
        <div className="h-menu-title">{d.name}</div>
        {d.use && <button className="btn small pink" onClick={() => useFurni(f)}>{d.use === 'sit' ? '🪑 Sentar' : d.use === 'lay' ? '😴 Deitar' : d.use === 'toggle' ? (f.on ? '⏻ Desligar' : '💡 Ligar') : d.use === 'snack' ? '😋 Lanche' : '✨ Usar'}</button>}
        {!d.wall && <button className="btn small" onClick={() => { updateRoom((r) => ({ ...r, furni: r.furni.map((x) => (x.uid === f.uid ? { ...x, rot: x.rot ? 0 : 1 } : x)) })); sfx('click'); }}>⟳ Girar</button>}
        <button className="btn small" onClick={() => { hs.mode = 'move'; hs.moveUid = f.uid; hs.placeRot = f.rot; close(); }}>✋ Mover</button>
        <div className="swatches" style={{ maxWidth: 260 }}>{BUILD_COLORS.slice(0, 14).map((c) => <button key={c} className="sw" style={{ background: c, width: 24, height: 24 }} onClick={() => updateRoom((r) => ({ ...r, furni: r.furni.map((x) => (x.uid === f.uid ? { ...x, color: c } : x)) }))} />)}</div>
        <button className="btn small" onClick={() => { updateRoom((r) => ({ ...r, furni: r.furni.filter((x) => x.uid !== f.uid) })); sfx('pop'); close(); }}>🗑️ Guardar</button>
        <button className="btn small ghost" onClick={close}>✖</button>
      </div>
    );
  }
  if (menu.kind === 'bot') {
    const b = hs.bots.find((x) => x.def.id === menu.id);
    if (!b) return null;
    const react = (txt: string, anim?: 'dance' | 'wave' | 'hug') => { say(b.def.id, b.def.name, txt); if (anim) { b.emote = anim; b.emoteUntil = hs.t + 5; } };
    return (
      <div className="h-menu" onPointerDown={(e) => e.stopPropagation()}>
        <div className="h-menu-title">{b.def.name}</div>
        <button className="btn small" onClick={() => { say('me', name, 'Oi! 👋'); emote('wave', 2); setTimeout(() => react(b.def.lines[Math.floor(Math.random() * b.def.lines.length)], 'wave'), 700); close(); }}>💬 Conversar</button>
        <button className="btn small pink" onClick={() => { emote('dance', 8); react('Bora dançar! 💃', 'dance'); close(); }}>💃 Dançar juntas</button>
        <button className="btn small lilac" onClick={() => { emote('hug', 2.5); hearts(b.x, b.y); react('Que abraço gostoso! 🤗💕', 'hug'); sfx('hug'); close(); }}>🤗 Abraçar</button>
        {b.def.job && <button className="btn small yellow" onClick={() => { hs.held = b.def.job === 'bebida' ? 'bebida' : 'sorvete'; react(b.def.job === 'bebida' ? 'Aqui está seu chocolate quente! ☕' : 'Um sorvete de morango para você! 🍦'); sfx('coin'); close(); }}>{b.def.job === 'bebida' ? '☕ Pedir bebida' : '🍦 Pedir sorvete'}</button>}
        <button className="btn small ghost" onClick={close}>✖</button>
      </div>
    );
  }
  const pet = useGame.getState().pets.find((p) => p.id === menu.id);
  if (!pet) return null;
  const def = PETS[pet.species];
  return (
    <div className="h-menu" onPointerDown={(e) => e.stopPropagation()}>
      <div className="h-menu-title">{def.icon} {pet.name}</div>
      <button className="btn small pink" onClick={() => { hs.pet.happyUntil = hs.t + 2.5; hearts(hs.pet.x, hs.pet.y); g().petCare(pet.id, 'pet'); say('me', name, `Te amo, ${pet.name}! 💕`); sfx('sparkle'); close(); }}>🤲 Carinho</button>
      {def.rideable && <button className="btn small lilac" onClick={() => { hs.mounted = !hs.mounted; hs.me.seat = null; sfx('sparkle'); close(); }}>{hs.mounted ? '🧍 Descer' : '🏇 Montar'}</button>}
      <button className="btn small ghost" onClick={close}>✖</button>
    </div>
  );
}

// ------------------------- navegador de quartos -------------------------
function Navigator({ close }: { close: () => void }) {
  const rooms = useGame((s) => s.hotelRooms);
  const go = (id: string) => { enterRoom(id); close(); };
  return (
    <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="panel" onPointerDown={(e) => e.stopPropagation()}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>🏨</span><h2>Navegador do Hotel</h2><button className="close" onClick={close}>✖</button></div>
        <div className="panel-body">
          <div className="section">Meus quartos</div>
          <div className="grid">
            {rooms.map((r) => <button key={r.id} className={`card ${r.id === hs.roomId ? 'on' : ''}`} onClick={() => go(r.id)}><div className="ic">🏠</div><div className="nm">{r.name}</div><div className="muted" style={{ fontSize: 11 }}>{r.w}×{r.h}</div></button>)}
          </div>
          <div className="section">Criar um quarto novo</div>
          <div className="grid">
            {TEMPLATES.map((tp) => (
              <button key={tp.id} className="card" onClick={() => {
                const id = newRoomId();
                const nr: HotelRoom = { id, name: `${tp.name} ${rooms.length + 1}`, w: 8, h: 8, floor: '#e8d5b7', floorPat: 'madeira', wall: '#c7e5ff', wallPat: 'liso', door: 4, furni: [], ...tp.make() } as HotelRoom;
                nr.furni = nr.furni.map((f) => ({ ...f, uid: newRoomId() }));
                useGame.getState().set({ hotelRooms: [...rooms, nr] });
                enterRoom(id); close();
              }}><div className="ic">{tp.icon}</div><div className="nm">{tp.name}</div><div className="muted" style={{ fontSize: 11 }}>➕ criar</div></button>
            ))}
          </div>
          <div className="section">Lugares do Hotel</div>
          <div className="grid">
            {PUBLIC_ROOMS.map((r) => <button key={r.id} className={`card ${r.id === hs.roomId ? 'on' : ''}`} onClick={() => go(r.id)}><div className="ic">{r.icon}</div><div className="nm">{r.name}</div><div className="muted" style={{ fontSize: 11 }}>{r.desc}</div></button>)}
          </div>
          <div className="section">Outros</div>
          <button className="btn blue" onClick={() => { useGame.getState().set({ mode: 'mundo', screen: 'game' }); }}>🌍 Ir para o Mundo 3D</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------- catálogo grátis -------------------------
const thumbCache = new Map<string, string>();
function thumb(type: string, color: string) {
  const k = type + color;
  if (thumbCache.has(k)) return thumbCache.get(k)!;
  const c = document.createElement('canvas');
  c.width = 72; c.height = 72;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const d = FURNI_MAP[type];
  const f: PFurni = { uid: 't', type, x: 0, y: 0, rot: 0, color, on: true, wall: 'R', wpos: 0 };
  if (d.wall) {
    const cam = { ox: 36 - 8, oy: 92 };
    g.fillStyle = '#e0ecf8'; g.fillRect(8, 8, 56, 56);
    import('./furni').then(({ drawWallItem }) => { drawWallItem(g, cam, f, 1); thumbCache.set(k, c.toDataURL()); });
  } else {
    const W = d.w, D = d.d;
    const cam = { ox: 36 - ((W - D) * TW) / 4, oy: 60 - ((W + D) * TH) / 2 + (W + D > 4 ? 14 : 0) };
    d.draw(g, cam, f, W, D, 1);
  }
  const url = c.toDataURL();
  thumbCache.set(k, url);
  return url;
}

function Catalog({ close, start }: { close: () => void; start: (type: string, color: string) => void }) {
  const [cat, setCat] = useState<FurniCat>('quarto');
  const [color, setColor] = useState<string | null>(null);
  const gifts = useGame((s) => s.hotelGifts);
  return (
    <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="panel" style={{ width: 'min(980px, 100%)' }} onPointerDown={(e) => e.stopPropagation()}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>🛍️</span><h2>Catálogo — tudo grátis!</h2><button className="close" onClick={close}>✖</button></div>
        <div className="panel-body">
          <div className="tabs wrap">{FURNI_CATS.map((c) => <button key={c.id} className={`tab ${c.id === cat ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.icon} {c.name}</button>)}</div>
          <div className="row" style={{ marginBottom: 8 }}><span className="muted">Cor:</span>
            <button className={`btn small ${!color ? 'pink' : ''}`} onClick={() => setColor(null)}>Original</button>
            <div className="swatches">{BUILD_COLORS.slice(0, 16).map((c) => <button key={c} className={`sw ${c === color ? 'on' : ''}`} style={{ background: c, width: 26, height: 26 }} onClick={() => setColor(c)} />)}</div>
          </div>
          <div className="grid">
            {cat === 'presentes' && <p className="muted" style={{ gridColumn: '1/-1' }}>🎁 Todo dia tem um presente surpresa com um móvel exclusivo! Toque em 🎁 Presente na barra.</p>}
            {FURNI.filter((f) => f.cat === cat && (!f.gift || gifts.includes(f.id))).map((f) => (
              <button key={f.id} className="card" onClick={() => start(f.id, color ?? f.color)}>
                <img src={thumb(f.id, color ?? f.color)} alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />
                <div className="nm">{f.name}</div>
                <div className="pr" style={{ color: '#1f9e63' }}>Grátis</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------- configurar quarto -------------------------
function RoomSettings({ close }: { close: () => void }) {
  const room = useGame((s) => s.hotelRooms.find((r) => r.id === hs.roomId));
  if (!room) return null;
  const up = (p: Partial<HotelRoom>) => { updateRoom((r) => ({ ...r, ...p })); sfx('click'); };
  return (
    <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="panel" onPointerDown={(e) => e.stopPropagation()}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>🎨</span><h2>Meu quarto</h2><button className="close" onClick={close}>✖</button></div>
        <div className="panel-body">
          <input value={room.name} maxLength={24} onChange={(e) => updateRoom((r) => ({ ...r, name: e.target.value }))} style={{ fontSize: 18, padding: '6px 12px', borderRadius: 14, border: '3px solid #ffd6e8', width: '100%' }} />
          <div className="section">Tamanho</div>
          <div className="row">
            <span>Largura {room.w}</span><button className="btn small" onClick={() => up({ w: Math.max(4, room.w - 1) })}>➖</button><button className="btn small mint" onClick={() => up({ w: Math.min(20, room.w + 1) })}>➕</button>
            <span>Fundo {room.h}</span><button className="btn small" onClick={() => up({ h: Math.max(4, room.h - 1), door: Math.min(room.door, room.h - 2) })}>➖</button><button className="btn small mint" onClick={() => up({ h: Math.min(20, room.h + 1) })}>➕</button>
          </div>
          <div className="section">Piso</div>
          <div className="row">{(['liso', 'xadrez', 'madeira', 'listras'] as const).map((p) => <button key={p} className={`btn small ${room.floorPat === p ? 'pink' : ''}`} onClick={() => up({ floorPat: p })}>{p}</button>)}</div>
          <div className="swatches" style={{ marginTop: 6 }}>{BUILD_COLORS.map((c) => <button key={c} className={`sw ${c === room.floor ? 'on' : ''}`} style={{ background: c }} onClick={() => up({ floor: c })} />)}</div>
          <div className="section">Papel de parede</div>
          <div className="row">{(['liso', 'listras', 'bolinhas', 'tijolo'] as const).map((p) => <button key={p} className={`btn small ${room.wallPat === p ? 'pink' : ''}`} onClick={() => up({ wallPat: p })}>{p}</button>)}</div>
          <div className="swatches" style={{ marginTop: 6 }}>{BUILD_COLORS.map((c) => <button key={c} className={`sw ${c === room.wall ? 'on' : ''}`} style={{ background: c }} onClick={() => up({ wall: c })} />)}</div>
          <div className="section">Porta</div>
          <div className="row"><button className="btn small" onClick={() => up({ door: Math.max(0, room.door - 1) })}>⬅</button><span>posição {room.door}</span><button className="btn small" onClick={() => up({ door: Math.min(room.h - 1, room.door + 1) })}>➡</button></div>
          {useGame.getState().hotelRooms.length > 1 && <button className="btn small" style={{ marginTop: 12 }} onClick={() => { const s = useGame.getState(); const rest = s.hotelRooms.filter((r) => r.id !== room.id); s.set({ hotelRooms: rest }); enterRoom(rest[0].id); close(); }}>🗑️ Apagar este quarto</button>}
        </div>
      </div>
    </div>
  );
}

// ------------------------- visual da Maitê -------------------------
const HAIRS: [HairStyle, string][] = [['chiquinhas', 'Maria-chiquinha'], ['rabo', 'Rabo de cavalo'], ['longo', 'Longo'], ['coque', 'Coque'], ['cacheado', 'Cacheado'], ['trancas', 'Tranças'], ['franja', 'Franjinha'], ['black', 'Black power'], ['curto', 'Curtinho']];
const TOPS: [string, string][] = [['vestido', 'Vestido'], ['vestido-princesa', 'Princesa'], ['vestido-babados', 'Babados'], ['camiseta', 'Camiseta'], ['listrada', 'Listrada'], ['estrela', 'Estrela'], ['moletom', 'Moletom'], ['regata', 'Regata']];
const BOTTOMS: [string, string][] = [['legging', 'Legging'], ['saia', 'Saia'], ['shorts', 'Shorts'], ['calca', 'Calça']];
const ACCS: [string, string][] = [['laco', '🎀 Laço'], ['coroa', '👑 Coroa'], ['tiara', 'Tiara'], ['oculos-coracao', '😎 Óculos'], ['chapeu-sol', '👒 Chapéu'], ['bone', '🧢 Boné'], ['orelhas-coelho', '🐰 Orelhas'], ['asas-fada', '🧚 Asas'], ['mochila', '🎒 Mochila']];

function Preview({ look }: { look: Appearance }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const c = ref.current;
      if (c) {
        const g = c.getContext('2d')!;
        g.imageSmoothingEnabled = false;
        g.clearRect(0, 0, c.width, c.height);
        const t = performance.now() / 1000;
        drawAvatar(g, 22, 58, look, 0, 'idle', t);
        drawAvatar(g, 62, 58, look, 3, 'idle', t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [look]);
  return <canvas ref={ref} width={84} height={64} style={{ width: 252, height: 192, imageRendering: 'pixelated', background: 'linear-gradient(#ffe3f1,#e0f1ff)', borderRadius: 18 }} />;
}

function LookEditor({ close }: { close: () => void }) {
  const look = useGame((s) => s.appearance);
  const set = useGame((s) => s.setAppearance);
  const [snap] = useState(() => ({ ...useGame.getState().appearance }));
  const Sw = ({ colors, v, on }: { colors: string[]; v: string; on: (c: string) => void }) => <div className="swatches">{colors.map((c) => <button key={c} className={`sw ${c === v ? 'on' : ''}`} style={{ background: c, width: 28, height: 28 }} onClick={() => on(c)} />)}</div>;
  return (
    <div className="backdrop">
      <div className="panel" style={{ width: 'min(860px,100%)' }} onPointerDown={(e) => e.stopPropagation()}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>👗</span><h2>Meu visual</h2><button className="close" onClick={() => { void saveNow(); close(); }}>✖</button></div>
        <div className="panel-body" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Preview look={look} />
            <input value={look.name} maxLength={16} onChange={(e) => set({ name: e.target.value })} style={{ fontSize: 18, padding: 6, borderRadius: 12, border: '3px solid #ffd6e8', width: 200, textAlign: 'center' }} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="section">Cabelo</div>
            <div className="row">{HAIRS.map(([id, n]) => <button key={id} className={`btn small ${look.hairStyle === id ? 'pink' : ''}`} onClick={() => set({ hairStyle: id })}>{n}</button>)}</div>
            <Sw colors={HAIR_COLORS} v={look.hairColor} on={(c) => set({ hairColor: c })} />
            <div className="section">Pele e olhos</div>
            <Sw colors={SKIN_TONES} v={look.skin} on={(c) => set({ skin: c })} />
            <Sw colors={EYE_COLORS} v={look.eyeColor} on={(c) => set({ eyeColor: c })} />
            <div className="section">Roupa</div>
            <div className="row">{TOPS.map(([id, n]) => <button key={id} className={`btn small ${look.top === id ? 'pink' : ''}`} onClick={() => set({ top: id })}>{n}</button>)}</div>
            <Sw colors={CLOTH_COLORS} v={look.topColor} on={(c) => set({ topColor: c })} />
            <div className="row" style={{ marginTop: 6 }}>{BOTTOMS.map(([id, n]) => <button key={id} className={`btn small ${look.bottom === id ? 'pink' : ''}`} onClick={() => set({ bottom: id })}>{n}</button>)}</div>
            <Sw colors={CLOTH_COLORS} v={look.bottomColor} on={(c) => set({ bottomColor: c })} />
            <div className="section">Sapatos</div>
            <Sw colors={CLOTH_COLORS} v={look.shoesColor} on={(c) => set({ shoesColor: c })} />
            <div className="section">Acessórios</div>
            <div className="row">{ACCS.map(([id, n]) => <button key={id} className={`btn small ${look.accessories.includes(id) ? 'pink' : ''}`} onClick={() => set({ accessories: look.accessories.includes(id) ? look.accessories.filter((a) => a !== id) : [...look.accessories, id] })}>{n}</button>)}</div>
            <Sw colors={CLOTH_COLORS} v={look.accColor} on={(c) => set({ accColor: c })} />
          </div>
        </div>
        <div className="editor-foot">
          <button className="btn" onClick={() => { set(snap); close(); }}>↩️ Cancelar</button>
          <button className="btn pink" onClick={() => { void saveNow(); useGame.getState().toast('Visual salvo! 💖', '💾'); close(); }}>💾 Salvar visual</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------- tela inicial do hotel -------------------------
function HotelTitle() {
  const enter = () => { unlockAudio(); startMusic(); sfx('fanfare'); useGame.getState().set({ screen: 'game' }); };
  return (
    <div className="h-title">
      <div className="logo">
        <h1>Hotel da <br />Maitê 🏨</h1>
        <p>Seu hotel só seu — tudo grátis, para decorar e brincar!</p>
      </div>
      <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
        <button className="btn big pink" onClick={enter}>🏨 Entrar no Hotel</button>
        <button className="btn big" onClick={() => useGame.getState().set({ mode: 'mundo', screen: 'title' })}>🌍 Mundo 3D</button>
      </div>
    </div>
  );
}

export { occupancy };

// ------------------------- convidar amigas -------------------------
function Invite({ close }: { close: () => void }) {
  const list = FRIENDS();
  return (
    <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="panel" onPointerDown={(e) => e.stopPropagation()}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>👭</span><h2>Convidar para o quarto</h2><button className="close" onClick={close}>✖</button></div>
        <div className="panel-body">
          <p className="muted">As amigas do hotel vêm visitar seu quarto! (Só personagens do jogo, nada de estranhos 💕)</p>
          <div className="grid">
            {list.map((b) => {
              const here = hs.bots.some((x) => x.def.id === b.id);
              return (
                <button key={b.id} className={`card ${here ? 'on' : ''}`} onClick={() => {
                  if (here) { hs.bots = hs.bots.filter((x) => x.def.id !== b.id); return close(); }
                  const room = currentRoom();
                  hs.bots.push({ def: b, look: botLook(b), x: 0, y: room.door, path: [], dir: 0, anim: 'idle', emote: null, emoteUntil: 0, seat: null, arrive: null, next: hs.t + 1, talkAt: hs.t + 2 });
                  walkTo(hs.bots[hs.bots.length - 1], 1 + Math.floor(Math.random() * (room.w - 2)), 1 + Math.floor(Math.random() * (room.h - 2)));
                  setTimeout(() => say(b.id, b.name, 'Oiê! Que quarto lindo! 😍'), 1200);
                  sfx('door');
                  close();
                }}>
                  <div className="ic">{here ? '✅' : '🙋'}</div><div className="nm">{b.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------- presente do dia -------------------------
function DailyGift({ close }: { close: () => void }) {
  const [opened, setOpened] = useState<string | null>(null);
  const open = () => {
    const s = useGame.getState();
    const pool = FURNI.filter((f) => f.gift && !s.hotelGifts.includes(f.id));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    s.set({ hotelGiftDay: todayKey(), hotelGifts: pick ? [...s.hotelGifts, pick.id] : s.hotelGifts });
    setOpened(pick ? pick.name : 'Muitos corações de amor! 💖');
    sfx('fanfare');
    hearts(hs.me.x, hs.me.y);
  };
  return (
    <div className="backdrop">
      <div className="panel" style={{ width: 'min(420px,100%)' }} onPointerDown={(e) => e.stopPropagation()}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>🎁</span><h2>Presente do dia</h2><button className="close" onClick={close}>✖</button></div>
        <div className="panel-body mg">
          {!opened ? (
            <><button style={{ fontSize: 110, background: 'none', animation: 'float 1.2s infinite' }} onClick={open}>🎁</button><div style={{ fontWeight: 800 }}>Toque no presente para abrir!</div></>
          ) : (
            <><div style={{ fontSize: 80 }}>🎉</div><div className="bubble">Você ganhou: <b>{opened}</b>! Está no Catálogo → 🎁 Presentes.</div><button className="btn pink" onClick={close}>Obaaa! 💖</button></>
          )}
        </div>
      </div>
    </div>
  );
}
