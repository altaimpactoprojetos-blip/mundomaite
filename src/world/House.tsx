import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Fixture, HouseConfig, PropertyDef } from '../types';
import { Bx, Co, Cy, Sp } from '../game/prims';
import { mat } from '../systems/materials';
import { localBox, setGroup, removeGroup, type Box } from '../systems/colliders';
import { setPools } from '../systems/terrain';
import { registerInteractable } from '../systems/interactions';
import { rt } from '../systems/runtime';
import { useGame } from '../store/gameStore';
import { FixtureMeshes, useFixtureLogic } from './Fixtures';
import { FurnitureModel } from '../game/Furniture';
import { toWorld, useNear } from '../game/hooks';
import { signTexture } from '../systems/textures';

export const ROOM_W = 6;
export const FLOOR_H = 3.4;
const T = 0.3;
const DOOR = 2.4;
const DOOR_H = 2.7;
const HOUSE_Z = -2; // deslocamento da casa dentro do lote

export function houseDims(h: HouseConfig) {
  return { W: h.rooms * ROOM_W, D: h.depth, H: h.floors * FLOOR_H };
}

type Side = 'back' | 'left' | 'right' | 'front' | 'in';
interface Seg { lx: number; ly: number; lz: number; w: number; h: number; d: number; floor: number; kind: 'wall' | 'slab' | 'part'; side?: Side }
const SIDE_N: Record<Side, [number, number]> = { back: [0, -1], left: [-1, 0], right: [1, 0], front: [0, 1], in: [0, 0] };

/** Gera as peças estruturais (paredes, lajes) de uma casa paramétrica — usadas para desenhar e para colisão. */
function houseSegments(h: HouseConfig): Seg[] {
  const { W, D } = houseDims(h);
  const segs: Seg[] = [];
  const z0 = HOUSE_Z;
  for (let f = 0; f < h.floors; f++) {
    const y = f * FLOOR_H;
    const wh = FLOOR_H;
    segs.push({ lx: 0, ly: y, lz: z0 - D / 2 + T / 2, w: W, h: wh, d: T, floor: f, kind: 'wall', side: 'back' });
    segs.push({ lx: -W / 2 + T / 2, ly: y, lz: z0, w: T, h: wh, d: D, floor: f, kind: 'wall', side: 'left' });
    segs.push({ lx: W / 2 - T / 2, ly: y, lz: z0, w: T, h: wh, d: D, floor: f, kind: 'wall', side: 'right' });
    if (f === 0) {
      const side = (W - DOOR) / 2;
      segs.push({ lx: -W / 2 + side / 2, ly: y, lz: z0 + D / 2 - T / 2, w: side, h: wh, d: T, floor: f, kind: 'wall', side: 'front' });
      segs.push({ lx: W / 2 - side / 2, ly: y, lz: z0 + D / 2 - T / 2, w: side, h: wh, d: T, floor: f, kind: 'wall', side: 'front' });
      segs.push({ lx: 0, ly: y + DOOR_H, lz: z0 + D / 2 - T / 2, w: DOOR, h: wh - DOOR_H, d: T, floor: f, kind: 'wall', side: 'front' });
    } else {
      segs.push({ lx: 0, ly: y, lz: z0 + D / 2 - T / 2, w: W, h: wh, d: T, floor: f, kind: 'wall', side: 'front' });
    }
    // divisórias entre cômodos (com passagem)
    for (let r = 1; r < h.rooms; r++) {
      const x = -W / 2 + r * ROOM_W;
      const gap = 1.8;
      const part = (D - gap) / 2;
      segs.push({ lx: x, ly: y, lz: z0 - D / 2 + part / 2, w: 0.15, h: wh, d: part, floor: f, kind: 'part' });
      segs.push({ lx: x, ly: y, lz: z0 + D / 2 - part / 2, w: 0.15, h: wh, d: part, floor: f, kind: 'part' });
    }
    // laje do andar de cima com buraco para a escada
    if (f > 0) {
      const sy = y - 0.2;
      segs.push({ lx: 1, ly: sy, lz: z0, w: W - 2, h: 0.2, d: D, floor: f, kind: 'slab' });
      segs.push({ lx: -W / 2 + 1, ly: sy, lz: z0 + 2.6, w: 2, h: 0.2, d: D - 5.2, floor: f, kind: 'slab' });
    }
  }
  return segs;
}

function stairsBoxes(h: HouseConfig, ox: number, oz: number, rot: number): Box[] {
  const { W, D } = houseDims(h);
  const out: Box[] = [];
  for (let f = 0; f < h.floors - 1; f++) {
    for (let i = 0; i < 10; i++) {
      const top = f * FLOOR_H + ((i + 1) / 10) * FLOOR_H;
      // sobe em direção ao fundo (-z)
      const lz = HOUSE_Z - D / 2 + 0.4 + 5 - (i + 0.5) * 0.5;
      out.push(localBox(ox, 0, oz, rot, -W / 2 + 1.1, f * FLOOR_H, lz, 1.4, top - f * FLOOR_H, 0.52));
    }
  }
  return out;
}

function autoFurniture(h: HouseConfig): Fixture[] {
  if (!h.furnished) return [];
  const { W, D } = houseDims(h);
  const out: Fixture[] = [];
  const zb = HOUSE_Z - D / 2 + 1;
  const zf = HOUSE_Z + D / 2 - 1.5;
  for (let f = 0; f < h.floors; f++) {
    const y = f * FLOOR_H + 0.1;
    for (let r = 0; r < h.rooms; r++) {
      const cx = -W / 2 + r * ROOM_W + ROOM_W / 2 + (r === 0 ? 1 : 0);
      const add = (model: string, dx: number, z: number, rot = 0, extra: Partial<Fixture> = {}) => out.push({ model, x: cx + dx, z, y, rot, ...extra });
      if (f === 0) {
        const role = r % 4;
        if (role === 0) { add('sofa', 0.5, zb + 0.8, 0, { color: '#ff8fc7' }); add('tv', 0.5, HOUSE_Z + 1.5, Math.PI); add('tapete', 0.5, HOUSE_Z - 1, 0, { color: '#d4b8ff' }); add('planta', 2, zf); }
        if (role === 1) { add('geladeira', -2, zb + 0.2); add('fogao', -0.8, zb + 0.2); add('pia', 0.6, zb + 0.2); add('mesa', 0, HOUSE_Z + 1, 0, { color: '#ffffff' }); add('cadeira', -0.6, HOUSE_Z + 2, Math.PI); add('cadeira', 0.6, HOUSE_Z + 2, Math.PI); add('cadeira', 0, HOUSE_Z, 0); }
        if (role === 2) { add('banheira', -1.3, zb + 0.5); add('espelho', 1.5, zb - 0.3); add('vaso-flor', 2, zf); }
        if (role === 3) { add('piano', 0, zb + 0.4); add('estante', 2, HOUSE_Z + 1, -Math.PI / 2); add('poltrona', -1.5, HOUSE_Z + 1, Math.PI / 2, { color: '#5ab0ff' }); }
      } else {
        add(r % 2 ? 'cama' : 'cama-princesa', 0.5, zb + 1.2, 0, { color: ['#ffb3d9', '#c7e5ff', '#d4b8ff', '#bdf5e0'][r % 4] });
        add('guarda-roupa', 2, HOUSE_Z + 1.5, -Math.PI / 2);
        add('abajur', -1.4, zb + 0.3);
        add('bau', -1.4, HOUSE_Z + 2.5, Math.PI / 2, { color: '#ff7b54' });
        add('tapete-redondo', 0.5, HOUSE_Z + 1.5, 0, { color: '#ffe066' });
      }
    }
  }
  return out;
}

function Roof({ h, W, D }: { h: HouseConfig; W: number; D: number }) {
  const y = h.floors * FLOOR_H;
  if (h.style === 'moderna' || h.style === 'mansao') {
    return (
      <group position={[0, y, HOUSE_Z]}>
        <Bx c={h.roofColor} p={[0, 0.15, 0]} s={[W + 1, 0.3, D + 1]} />
        <Bx c={h.wallColor} p={[0, 0.6, D / 2 + 0.4]} s={[W + 1, 0.7, 0.2]} />
        {h.style === 'mansao' && [-1, 1].map((s) => <Cy key={s} c="#ffffff" p={[s * (DOOR + 0.5), -y / 2, D / 2 + 1.5]} s={[0.6, y, 0.6]} />)}
        {h.style === 'mansao' && <Bx c={h.roofColor} p={[0, 0, D / 2 + 1.5]} s={[DOOR + 3, 0.3, 3.2]} />}
      </group>
    );
  }
  if (h.style === 'castelinho') {
    return (
      <group position={[0, y, HOUSE_Z]}>
        <Bx c={h.wallColor} p={[0, 0.15, 0]} s={[W, 0.3, D]} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[sx * W / 2, 0, sz * D / 2]}>
            <Cy c={h.wallColor} p={[0, -y / 2 + 1, 0]} s={[2.2, y + 2, 2.2]} />
            <Co c={h.roofColor} p={[0, 3, 0]} s={[2.8, 2.5, 2.8]} />
          </group>
        ))}
        {Array.from({ length: Math.floor(W / 2) }).map((_, i) => <Bx key={i} c={h.wallColor} p={[-W / 2 + 1 + i * 2, 0.6, D / 2]} s={[1, 0.8, 0.4]} />)}
      </group>
    );
  }
  const rh = h.style === 'chale' ? 3.6 : 2.6;
  return (
    <group position={[0, y, HOUSE_Z]}>
      <mesh rotation={[0, Math.PI / 2, 0]} scale={[D / 2 + 0.6, rh, W / 2 + 0.6]} position={[0, rh / 2, 0]} material={mat(h.roofColor, { tex: 'tijolo', repeat: 3 })}>
        <cylinderGeometry args={[0, 1, 1, 3, 1]} />
      </mesh>
      {h.style === 'praia' && <Bx c="#ffffff" p={[0, -0.1, D / 2 + 1.2]} s={[W, 0.15, 2.4]} />}
    </group>
  );
}

function HouseImpl({ def }: { def: PropertyDef }) {
  const owned = useGame((s) => s.properties[def.id]);
  const cfg: HouseConfig | null = owned ? owned.house : def.preset;
  const isOwned = !!owned?.owned;
  const [x, z] = def.pos;
  const rot = def.rot;
  const near = useNear(x, z, 60);
  const mid = useNear(x, z, 140);
  const floorsRef = useRef<(THREE.Group | null)[]>([]);
  const roofRef = useRef<THREE.Group>(null!);
  const sideRefs = useRef<Record<string, THREE.Group | null>>({});
  const winRefs = useRef<(THREE.Group | null)[]>([]);

  const segs = useMemo(() => (cfg ? houseSegments(cfg) : []), [cfg]);
  const fixtures = useMemo(() => (cfg ? autoFurniture(cfg) : []), [cfg]);
  const dims = cfg ? houseDims(cfg) : { W: 0, D: 0, H: 0 };

  // colisões e piscina
  useEffect(() => {
    if (!cfg) { removeGroup(`house-${def.id}`); setPools(`house-${def.id}`, []); return; }
    const boxes = segs.map((s) => localBox(x, 0, z, rot, s.lx, s.ly, s.lz, s.w, s.h, s.d));
    boxes.push(...stairsBoxes(cfg, x, z, rot));
    if (cfg.garage) {
      const gx = dims.W / 2 + 3.5;
      boxes.push(localBox(x, 0, z, rot, gx, 0, HOUSE_Z - 3.4, 6, 3, 0.2), localBox(x, 0, z, rot, gx + 3, 0, HOUSE_Z, 0.2, 3, 7));
    }
    setGroup(`house-${def.id}`, boxes);
    if (cfg.pool) {
      const [px, pz] = toWorld(x, z, rot, 0, HOUSE_Z - dims.D / 2 - 5);
      const rw = Math.abs(Math.cos(rot)) > 0.5 ? [8, 4] : [4, 8];
      setPools(`house-${def.id}`, [{ minX: px - rw[0] / 2, maxX: px + rw[0] / 2, minZ: pz - rw[1] / 2, maxZ: pz + rw[1] / 2, level: 0.06 }]);
    } else setPools(`house-${def.id}`, []);
    return () => { removeGroup(`house-${def.id}`); setPools(`house-${def.id}`, []); };
  }, [cfg, segs, x, z, rot, def.id, dims.W, dims.D]);

  useFixtureLogic(`hfx-${def.id}`, fixtures, x, 0, z, rot);

  // caixa de correio: comprar / gerenciar
  useEffect(() => {
    const [mx, mz] = toWorld(x, z, rot, 3, def.lot[1] / 2 - 1.5);
    const p = new THREE.Vector3(mx, 0, mz);
    return registerInteractable({
      id: `mail-${def.id}`, label: isOwned ? `Minha casa: ${cfg?.name ?? 'Terreno'}` : `${def.name} — à venda`, icon: isOwned ? '🏡' : '🔑', radius: 2.5,
      pos: () => p, action: () => useGame.getState().openPanel('house', def.id), priority: 1,
    });
  }, [x, z, rot, def.id, def.lot, def.name, isOwned, cfg?.name]);
  // garagem
  useEffect(() => {
    if (!cfg?.garage || !isOwned) return;
    const [gx, gz] = toWorld(x, z, rot, dims.W / 2 + 3.5, HOUSE_Z + 2);
    const p = new THREE.Vector3(gx, 0, gz);
    return registerInteractable({ id: `garage-${def.id}`, label: 'Garagem', icon: '🚗', radius: 3, pos: () => p, action: () => useGame.getState().openPanel('vehicles') });
  }, [cfg?.garage, isOwned, x, z, rot, def.id, dims.W]);

  useFrame(({ camera }) => {
    if (!cfg) return;
    const p = rt.player.pos;
    const c = Math.cos(-rot), s = Math.sin(-rot);
    const dx = p.x - x, dz = p.z - z;
    const lx = dx * c + dz * s, lz = -dx * s + dz * c - HOUSE_Z;
    const inside = Math.abs(lx) < dims.W / 2 && Math.abs(lz) < dims.D / 2;
    const level = Math.floor((p.y + 0.6) / FLOOR_H);
    if (roofRef.current) roofRef.current.visible = !inside;
    floorsRef.current.forEach((g, f) => { if (g) g.visible = !inside || f <= level; });
    // corte estilo Habbo: esconde as paredes viradas para a câmera quando está dentro
    const cdx = camera.position.x - x, cdz = camera.position.z - z;
    for (const k in sideRefs.current) {
      const g = sideRefs.current[k];
      if (!g) continue;
      const side = k.split('-')[1] as Side;
      const [nx, nz] = SIDE_N[side];
      const wx = nx * Math.cos(rot) + nz * Math.sin(rot);
      const wz = -nx * Math.sin(rot) + nz * Math.cos(rot);
      g.visible = !(inside && wx * cdx + wz * cdz > 0);
    }
    winRefs.current.forEach((g) => { if (g) g.visible = !inside; });
  });

  const sale = useMemo(() => signTexture(isOwned ? (cfg?.name ?? 'Meu terreno') : 'À VENDA', isOwned ? '#ffffff' : '#ffe066', '#e83e8c', isOwned ? '🏡' : '🔑'), [isOwned, cfg?.name]);
  const [lw, ld] = def.lot;

  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* lote */}
      <Bx c={cfg ? '#a6e08f' : '#b8e6a0'} tex="grama" rep={6} p={[0, 0.02, 0]} s={[lw, 0.04, ld]} />
      <Bx c="#e8d5b7" p={[0, 0.05, (ld / 2 + HOUSE_Z + dims.D / 2) / 2]} s={[2.4, 0.05, ld / 2 - HOUSE_Z - dims.D / 2 + 0.5]} />
      {/* placa / caixa de correio */}
      <group position={[3, 0, ld / 2 - 1.5]}>
        <Cy c="#8d5b3a" p={[0, 0.6, 0]} s={[0.12, 1.2, 0.12]} />
        <Bx c={isOwned ? '#ff8fc7' : '#5ab0ff'} p={[0, 1.3, 0]} s={[0.5, 0.4, 0.7]} />
        <mesh position={[0, 2.1, 0]}><planeGeometry args={[2.6, 0.65]} /><meshBasicMaterial map={sale} transparent side={THREE.DoubleSide} /></mesh>
      </group>
      {!cfg && mid && (
        <>
          {[-1, 1].map((sd) => <Bx key={sd} c="#ffffff" p={[sd * lw / 2, 0.4, 0]} s={[0.1, 0.8, ld]} />)}
          <Bx c="#ffffff" p={[0, 0.4, -ld / 2]} s={[lw, 0.8, 0.1]} />
        </>
      )}
      {cfg && (
        <>
          {/* piso térreo */}
          <Bx c={cfg.floorColor} tex="madeira" rep={3} p={[0, 0.05, HOUSE_Z]} s={[dims.W, 0.1, dims.D]} />
          {Array.from({ length: cfg.floors }).map((_, f) => (
            <group key={f} ref={(g) => (floorsRef.current[f] = g)}>
              {(['in', 'back', 'left', 'right', 'front'] as Side[]).map((side) => (
                <group key={side} ref={(g) => { if (side !== 'in') sideRefs.current[`${f}-${side}`] = g; }}>
                  {segs.filter((s) => s.floor === f && (s.side ?? 'in') === side).map((s, i) => (
                    <Bx key={i} c={s.kind === 'slab' ? cfg.floorColor : s.kind === 'part' ? '#fffaf3' : cfg.wallColor} tex={s.kind === 'slab' ? 'madeira' : undefined}
                      p={[s.lx, s.ly + s.h / 2, s.lz]} s={[s.w, s.h, s.d]} />
                  ))}
                </group>
              ))}
              {mid && <group ref={(g) => (winRefs.current[f] = g)}><HouseWindows W={dims.W} D={dims.D} f={f} trim="#ffffff" accent={cfg.roofColor} /></group>}
              {f < cfg.floors - 1 && near && <Stairs W={dims.W} D={dims.D} f={f} />}
            </group>
          ))}
          {/* porta */}
          <Bx c="#ffffff" p={[0, DOOR_H + 0.1, HOUSE_Z + dims.D / 2 + 0.05]} s={[DOOR + 0.4, 0.2, 0.15]} />
          <Bx c="#c9c2b8" p={[0, 0.12, HOUSE_Z + dims.D / 2 + 0.8]} s={[DOOR + 1.4, 0.24, 1.4]} />
          {/* porta de madeira aberta */}
          <Bx c="#8d5b3a" tex="madeira" p={[DOOR / 2 - 0.05, DOOR_H / 2, HOUSE_Z + dims.D / 2 - 0.3 - DOOR / 2]} s={[0.08, DOOR_H, DOOR]} />
          <Sp c="#ffd23f" p={[DOOR / 2 - 0.15, DOOR_H / 2, HOUSE_Z + dims.D / 2 - 0.3 - DOOR + 0.2]} s={[0.1, 0.1, 0.1]} />
          {/* quinas e rodapé */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
            <Bx key={`${sx}${sz}`} c="#ffffff" p={[sx * dims.W / 2, dims.H / 2, HOUSE_Z + sz * dims.D / 2]} s={[0.45, dims.H, 0.45]} />
          ))}
          <Bx c="#9aa0a6" tex="tijolo" rep={6} p={[0, 0.25, HOUSE_Z]} s={[dims.W + 0.15, 0.5, dims.D + 0.15]} />
          {Array.from({ length: cfg.floors - 1 }).map((_, i) => <Bx key={i} c="#ffffff" p={[0, (i + 1) * FLOOR_H, HOUSE_Z]} s={[dims.W + 0.2, 0.2, dims.D + 0.2]} />)}
          {/* varanda / alpendre */}
          {(cfg.style === 'casa' || cfg.style === 'chale' || cfg.style === 'praia') && (
            <group position={[0, 0, HOUSE_Z + dims.D / 2]}>
              {[-1, 1].map((sd) => <Cy key={sd} c="#ffffff" p={[sd * (DOOR / 2 + 0.9), 1.45, 1.6]} s={[0.22, 2.9, 0.22]} />)}
              <Bx c={cfg.roofColor} p={[0, 3.0, 0.9]} s={[DOOR + 2.6, 0.18, 2]} r={[0.12, 0, 0]} />
            </group>
          )}
          {/* chaminé */}
          {(cfg.style === 'casa' || cfg.style === 'chale') && <Bx c="#b5523b" tex="tijolo" p={[dims.W / 2 - 1.5, dims.H + 1.6, HOUSE_Z - 1.5]} s={[0.9, 2.4, 0.9]} />}
          <group ref={roofRef}><Roof h={cfg} W={dims.W} D={dims.D} /></group>
          {cfg.garage && (
            <group position={[dims.W / 2 + 3.5, 0, HOUSE_Z]}>
              <Bx c={cfg.wallColor} p={[0, 1.5, -3.4]} s={[6, 3, 0.2]} />
              <Bx c={cfg.wallColor} p={[3, 1.5, 0]} s={[0.2, 3, 7]} />
              <Bx c={cfg.roofColor} p={[0, 3.05, 0]} s={[6.4, 0.2, 7.2]} />
              <Bx c="#9aa0a6" p={[0, 0.04, 2]} s={[5.6, 0.05, 11]} />
            </group>
          )}
          {cfg.pool && (
            <group position={[0, 0, HOUSE_Z - dims.D / 2 - 5]}>
              <FurnitureModel model="piscina" />
              {near && <group position={[5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><FurnitureModel model="guarda-sol" color="#ff8fc7" /></group>}
            </group>
          )}
          {cfg.garden && mid && <Garden W={dims.W} lw={lw} ld={ld} />}
          {near && <Fence lw={lw} ld={ld} color={cfg.style === 'moderna' || cfg.style === 'mansao' ? '#4a4e57' : '#ffffff'} />}
          {near && <group><FixtureMeshes fixtures={fixtures} /></group>}
        </>
      )}
    </group>
  );
}

function HouseWindows({ W, D, f, trim, accent = '#4a7bff' }: { W: number; D: number; f: number; trim: string; accent?: string }) {
  const glass = mat('#bfe6ff', { emissive: 0.15 });
  const fr = mat(trim);
  const y = f * FLOOR_H + 1.7;
  const list: [number, number, number][] = [];
  for (let r = 0; r < W / ROOM_W; r++) {
    const x = -W / 2 + r * ROOM_W + ROOM_W / 2;
    if (!(f === 0 && Math.abs(x) < DOOR + 0.5)) list.push([x, HOUSE_Z + D / 2 + 0.02, 0]);
    list.push([x, HOUSE_Z - D / 2 - 0.02, Math.PI]);
  }
  list.push([W / 2 + 0.02, HOUSE_Z, Math.PI / 2], [-W / 2 - 0.02, HOUSE_Z, -Math.PI / 2]);
  return (
    <>
      {list.map(([x, z, r], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, r, 0]}>
          <Bx m={fr} c="" s={[1.8, 1.4, 0.06]} />
          <Bx m={glass} c="" p={[0, 0, 0.03]} s={[1.5, 1.1, 0.02]} />
          <Bx m={fr} c="" p={[0, 0, 0.05]} s={[0.07, 1.1, 0.02]} />
          <Bx m={fr} c="" p={[0, 0, 0.05]} s={[1.5, 0.07, 0.02]} />
          {[-1, 1].map((sd) => <Bx key={sd} c={accent} p={[sd * 1.15, 0, 0.04]} s={[0.45, 1.4, 0.05]} />)}
          <Bx c="#8d5b3a" p={[0, -0.82, 0.18]} s={[1.6, 0.25, 0.32]} />
          {[-0.5, -0.17, 0.17, 0.5].map((x, k) => <Sp key={x} c={['#ff5fa2', '#ffd23f', '#e63946', '#c77dff'][k]} p={[x, -0.62, 0.18]} s={[0.26, 0.22, 0.24]} />)}
        </group>
      ))}
    </>
  );
}

function Stairs({ W, D, f }: { W: number; D: number; f: number }) {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => {
        const h = ((i + 1) / 10) * FLOOR_H;
        const lz = HOUSE_Z - D / 2 + 0.4 + 5 - (i + 0.5) * 0.5;
        return <Bx key={i} c="#c8a27a" p={[-W / 2 + 1.1, f * FLOOR_H + h / 2, lz]} s={[1.4, h, 0.52]} />;
      })}
    </>
  );
}

function Garden({ W, lw, ld }: { W: number; lw: number; ld: number }) {
  const items: [string, number, number, string?][] = [
    ['arvore-flor', -lw / 2 + 2.5, ld / 2 - 3], ['arbusto', lw / 2 - 2, ld / 2 - 2], ['flores', -4, ld / 2 - 2, '#ff8fc7'],
    ['flores', -6, ld / 2 - 3, '#ffe066'], ['arvore', lw / 2 - 2.5, -ld / 2 + 3], ['flores', 6, ld / 2 - 4, '#d4b8ff'],
  ];
  return (
    <>
      {items.filter(([, x]) => Math.abs(x) > W / 2 + 1 || true).map(([m, x, z, c], i) => (
        <group key={i} position={[x, 0, z]}><FurnitureModel model={m} color={c} /></group>
      ))}
    </>
  );
}

export const House = memo(HouseImpl);

function Fence({ lw, ld, color }: { lw: number; ld: number; color: string }) {
  const posts: [number, number][] = [];
  for (let x = -lw / 2; x <= lw / 2 + 0.01; x += 2) if (Math.abs(x) > 2) posts.push([x, ld / 2]);
  for (let z = -ld / 2; z < ld / 2; z += 2) { posts.push([-lw / 2, z]); posts.push([lw / 2, z]); }
  const side = (lw - 4) / 2;
  return (
    <group>
      {posts.map(([x, z], i) => <Bx key={i} c={color} p={[x, 0.5, z]} s={[0.14, 1, 0.14]} />)}
      {[0.35, 0.75].map((y) => (
        <group key={y}>
          <Bx c={color} p={[-lw / 2 + side / 2, y, ld / 2]} s={[side, 0.1, 0.06]} />
          <Bx c={color} p={[lw / 2 - side / 2, y, ld / 2]} s={[side, 0.1, 0.06]} />
          <Bx c={color} p={[-lw / 2, y, 0]} s={[0.06, 0.1, ld]} />
          <Bx c={color} p={[lw / 2, y, 0]} s={[0.06, 0.1, ld]} />
        </group>
      ))}
    </group>
  );
}
