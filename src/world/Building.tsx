import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { LodAvatar } from '../game/Avatar';
import { npcLook } from '../game/NPCs';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuildingDef } from '../types';
import { Bx, Cy } from '../game/prims';
import { setGroup, removeGroup, localBox } from '../systems/colliders';
import { signTexture } from '../systems/textures';
import { interiorFor } from '../data/interiors';
import { FixtureMeshes, useFixtureLogic } from './Fixtures';
import { useNear, useNight } from '../game/hooks';
import { rt } from '../systems/runtime';
import { mat } from '../systems/materials';

export const DOOR_W = 3.6;
export const DOOR_H = 3.4;
const T = 0.4; // espessura da parede

/** Caixas de colisão de uma "casca" retangular com porta na frente (+z). */
export function shellBoxes(x: number, y: number, z: number, rot: number, w: number, h: number, d: number, door = DOOR_W, doorH = DOOR_H) {
  const lb = (lx: number, ly: number, lz: number, bw: number, bh: number, bd: number) => localBox(x, y, z, rot, lx, ly, lz, bw, bh, bd);
  const side = (w - door) / 2;
  return [
    lb(0, 0, -d / 2 + T / 2, w, h, T),
    lb(-w / 2 + T / 2, 0, 0, T, h, d),
    lb(w / 2 - T / 2, 0, 0, T, h, d),
    lb(-w / 2 + side / 2, 0, d / 2 - T / 2, side, h, T),
    lb(w / 2 - side / 2, 0, d / 2 - T / 2, side, h, T),
    lb(0, doorH, d / 2 - T / 2, door, h - doorH, T),
    lb(0, h, 0, w, 0.4, d),
  ];
}

function Windows({ w, d, h, color, lit }: { w: number; d: number; h: number; color: string; lit: boolean }) {
  const glass = lit ? mat('#ffe39a', { emissive: 1.1 }) : mat('#9fd4f5', { emissive: 0.12, rough: 0.15, metal: 0.3 });
  const frame = mat(color);
  const list: [number, number, number, number][] = [];
  const nx = Math.max(1, Math.floor((w - 6) / 6));
  for (let i = 0; i < nx; i++) {
    const x = -w / 2 + 3 + (i + 0.5) * ((w - 6) / nx);
    if (Math.abs(x) > DOOR_W) list.push([x, d / 2 + 0.02, 0, 1]);
    list.push([x, -d / 2 - 0.02, Math.PI, 1]);
  }
  const nz = Math.max(1, Math.floor((d - 4) / 6));
  for (let i = 0; i < nz; i++) {
    const z = -d / 2 + 2 + (i + 0.5) * ((d - 4) / nz);
    list.push([w / 2 + 0.02, z, Math.PI / 2, 0]);
    list.push([-w / 2 - 0.02, z, -Math.PI / 2, 0]);
  }
  const floors = Math.max(1, Math.floor(h / 3.5));
  return (
    <>
      {list.map(([a, b, r, front], i) =>
        Array.from({ length: floors }).map((_, f) => (
          <group key={`${i}-${f}`} position={[a, 1.9 + f * 3.4, b]} rotation={[0, r, 0]}>
            <Bx m={frame} c="" s={[2.2, 1.7, 0.08]} />
            <Bx m={glass} c="" p={[0, 0, 0.05]} s={[1.9, 1.4, 0.02]} />
          </group>
        )),
      )}
    </>
  );
}

function BuildingImpl({ b }: { b: BuildingDef }) {
  const [x, z] = b.pos;
  const [w, h, d] = b.size;
  const roof = useRef<THREE.Group>(null!);
  const near = useNear(x, z, Math.max(w, d) / 2 + 28);
  const lowQ = useGame((s) => s.settings.quality === 'baixa');
  const mid = useNear(x, z, Math.max(w, d) / 2 + (lowQ ? 55 : 90));
  const night = useNight();
  const fixtures = useMemo(() => interiorFor(b.type, w, d), [b.type, w, d]);
  const sign = useMemo(() => signTexture(b.name, '#ffffff', '#e83e8c', b.icon), [b.name, b.icon]);

  useEffect(() => {
    setGroup(`bld-${b.id}`, shellBoxes(x, 0, z, b.rot, w, h, d));
    return () => removeGroup(`bld-${b.id}`);
  }, [b.id, x, z, b.rot, w, h, d]);
  useFixtureLogic(`fx-${b.id}`, fixtures, x, 0.1, z, b.rot);

  const sides = useRef<{ g: THREE.Group | null; n: [number, number] }[]>([]);
  const extRef = useRef<THREE.Group>(null!);
  const cornerRef = useRef<THREE.Group | null>(null);
  useFrame(({ camera }) => {
    if (!roof.current) return;
    const p = rt.player.pos;
    const c = Math.cos(-b.rot), s = Math.sin(-b.rot);
    const dx = p.x - x, dz = p.z - z;
    const lx = dx * c + dz * s, lz = -dx * s + dz * c;
    const inside = Math.abs(lx) < w / 2 && Math.abs(lz) < d / 2 && p.y < h;
    roof.current.visible = !inside;
    if (extRef.current) extRef.current.visible = !inside;
    if (cornerRef.current) cornerRef.current.visible = !inside;
    const cdx = camera.position.x - x, cdz = camera.position.z - z;
    for (const sd of sides.current) {
      if (!sd.g) continue;
      const [nx, nz] = sd.n;
      const wx = nx * Math.cos(b.rot) + nz * Math.sin(b.rot);
      const wz = -nx * Math.sin(b.rot) + nz * Math.cos(b.rot);
      sd.g.visible = !(inside && wx * cdx + wz * cdz > 0);
    }
  });
  const sideRef = (i: number, n: [number, number]) => (g: THREE.Group | null) => { sides.current[i] = { g, n }; };

  const wallM = mat(b.color);
  const inner = mat('#fffaf3');
  const side = (w - DOOR_W) / 2;
  return (
    <group position={[x, 0, z]} rotation={[0, b.rot, 0]}>
      {/* piso */}
      <Bx c="#efe3d0" tex="azulejo" rep={Math.round(w / 4)} p={[0, 0.05, 0]} s={[w - 0.2, 0.1, d - 0.2]} />
      {/* paredes externas */}
      <group ref={sideRef(0, [0, -1])}><Bx m={wallM} c="" p={[0, h / 2, -d / 2 + T / 2]} s={[w, h, T]} /></group>
      <group ref={sideRef(1, [-1, 0])}><Bx m={wallM} c="" p={[-w / 2 + T / 2, h / 2, 0]} s={[T, h, d]} /></group>
      <group ref={sideRef(2, [1, 0])}><Bx m={wallM} c="" p={[w / 2 - T / 2, h / 2, 0]} s={[T, h, d]} /></group>
      <group ref={sideRef(3, [0, 1])}>
      <Bx m={wallM} c="" p={[-w / 2 + side / 2, h / 2, d / 2 - T / 2]} s={[side, h, T]} />
      <Bx m={wallM} c="" p={[w / 2 - side / 2, h / 2, d / 2 - T / 2]} s={[side, h, T]} />
      <Bx m={wallM} c="" p={[0, DOOR_H + (h - DOOR_H) / 2, d / 2 - T / 2]} s={[DOOR_W, h - DOOR_H, T]} />
      {/* faixa decorativa */}
      <Bx c={b.trim} p={[0, 0.3, d / 2 + 0.02]} s={[w + 0.1, 0.6, 0.05]} />
      {/* moldura da porta + toldo */}
      <Bx c={b.trim} p={[0, DOOR_H + 0.15, d / 2 + 0.1]} s={[DOOR_W + 0.6, 0.3, 0.2]} />
      <Bx c={b.roof} tex="listras" p={[0, DOOR_H + 0.7, d / 2 + 1]} s={[DOOR_W + 3, 0.12, 2]} r={[0.3, 0, 0]} />
      {/* placa */}
      <mesh position={[0, Math.min(h - 1.1, DOOR_H + 2.1), d / 2 + 0.12]}>
        <planeGeometry args={[Math.min(w - 2, 14), Math.min(w - 2, 14) / 4]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
      </group>
      <group ref={extRef}>
        {mid && <Windows w={w} d={d} h={h} color={b.trim} lit={night} />}
        {mid && !lowQ && <Facade w={w} d={d} h={h} trim={b.trim} roof={b.roof} lit={night} />}
      </group>
      {/* pilares nas quinas, rodapé e cornija */}
      <group ref={(g) => { if (g) cornerRef.current = g; }}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => <Bx key={`${sx}${sz}`} c={b.trim} p={[sx * (w / 2), h / 2, sz * (d / 2)]} s={[0.7, h + 0.2, 0.7]} />)}
        <Bx c="#8a8f99" p={[0, 0.35, 0]} s={[w + 0.25, 0.7, d + 0.25]} />
        <Bx c={b.trim} p={[0, h - 0.25, 0]} s={[w + 0.35, 0.5, d + 0.35]} />
        {[-1, 1].map((sd) => <Cy key={sd} c={b.trim} p={[sd * (DOOR_W / 2 + 0.6), DOOR_H / 2, d / 2 + 0.5]} s={[0.4, DOOR_H, 0.4]} />)}
      </group>
      {/* telhado (some quando a jogadora entra) */}
      <group ref={roof}>
        <Bx c={b.roof} p={[0, h + 0.2, 0]} s={[w + 0.6, 0.4, d + 0.6]} />
        <Bx c={b.trim} p={[0, h + 0.55, d / 2 + 0.2]} s={[w + 0.6, 0.3, 0.3]} />
      </group>
      {near && (
        <group position={[0, 0.1, 0]}>
          {/* parede interna mais clara */}
          <Bx m={inner} c="" p={[0, h / 2, -d / 2 + T + 0.01]} s={[w - 2 * T, h - 0.2, 0.02]} />
          <FixtureMeshes fixtures={fixtures} />
          {b.type === 'cinema' && <CinemaScreen w={w} d={d} h={h} />}
          {b.type === 'escola' && <SchoolLife d={d} />}
          <pointLight position={[0, h - 1, 0]} intensity={12} distance={Math.max(w, d)} color="#fff3e0" />
        </group>
      )}
    </group>
  );
}

function CinemaScreen({ w, d, h }: { w: number; d: number; h: number }) {
  const mref = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mref.current.color.setHSL((t * 0.05) % 1, 0.6, 0.6 + Math.sin(t * 2) * 0.1);
  });
  return (
    <mesh position={[0, h / 2, -d / 2 + T + 0.05]}>
      <planeGeometry args={[w - 6, h - 2.5]} />
      <meshBasicMaterial ref={mref} />
    </mesh>
  );
}

export const Building = memo(BuildingImpl);

const STUDENTS = ['Pedro', 'Ana', 'Léo', 'Bia', 'Caio', 'Duda'];
function SchoolLife({ d }: { d: number }) {
  const board = useGame((s) => s.schoolBoard);
  const tex = useMemo(() => {
    if (!board) return null;
    const t = new THREE.TextureLoader().load(board);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [board]);
  const [cls, setCls] = useState(false);
  useFrame(() => { const c = rt.hour >= 7 && rt.hour < 16; if (c !== cls) setCls(c); });
  const kids = useMemo(() => STUDENTS.map((n, i) => npcLook({ id: `aluno-${i}`, name: n, role: '', icon: '', personality: 'curiosa', look: { height: 0.8 }, routine: [], lines: [] })), []);
  const bz = -d / 2 + 1.2;
  const seats: [number, number][] = [[-9, -2.2], [-4.5, -2.2], [4.5, -2.2], [9, -2.2], [-4.5, 0.8], [4.5, 0.8]];
  return (
    <group>
      {/* lousa: mostra o que a Maitê escreveu */}
      <mesh position={[0, 2.56, bz - 0.5 + 0.075]}>
        <planeGeometry args={[5.3, 1.45]} />
        {tex ? <meshBasicMaterial map={tex} /> : <meshStandardMaterial color="#1f5f43" />}
      </mesh>
      {cls && seats.map(([x, z], i) => (
        <group key={i} position={[x, 0.15, z]} rotation={[0, Math.PI, 0]}>
          <LodAvatar look={kids[i]} anim="sit" seed={i} getLook={() => rt.player.pos.clone().setY(rt.player.pos.y + 1.3)} />
        </group>
      ))}
    </group>
  );
}

/** Vitrines no térreo e varandas no andar de cima */
function Facade({ w, d, h, trim, roof, lit }: { w: number; d: number; h: number; trim: string; roof: string; lit: boolean }) {
  const glass = lit ? mat('#ffe9b0', { emissive: 0.9 }) : mat('#cfeeff', { emissive: 0.25, rough: 0.05, metal: 0.4, opacity: 0.85 });
  const z = d / 2 + 0.06;
  const xs = [-(DOOR_W / 2 + 3.4), DOOR_W / 2 + 3.4].filter((x) => Math.abs(x) + 2.4 < w / 2 - 0.6);
  const balcony = h >= 6.5;
  return (
    <group>
      {xs.map((x) => (
        <group key={x} position={[x, 0, z]}>
          <Bx c={trim} p={[0, 1.6, 0]} s={[4.6, 2.9, 0.1]} />
          <Bx m={glass} c="" p={[0, 1.6, 0.06]} s={[4.2, 2.5, 0.04]} />
          <Bx c={trim} p={[0, 1.6, 0.09]} s={[0.08, 2.5, 0.03]} />
          <Bx c={roof} tex="listras" p={[0, 3.25, 0.6]} s={[4.8, 0.1, 1.3]} r={[0.25, 0, 0]} />
          {/* produtos na vitrine */}
          {[-1.3, 0, 1.3].map((px, i) => <Bx key={px} c={['#ff8fc7', '#ffd23f', '#5ab0ff'][i]} p={[px, 0.75, 0.15]} s={[0.6, 0.5 + i * 0.15, 0.2]} />)}
        </group>
      ))}
      {balcony && [-w / 4, w / 4].map((x) => (
        <group key={x} position={[x, 3.7, z]}>
          <Bx c="#ffffff" p={[0, 0, 0.7]} s={[3.2, 0.18, 1.4]} />
          <Bx c={trim} p={[0, 0.55, 1.38]} s={[3.2, 0.08, 0.06]} />
          {[-1.5, -0.75, 0, 0.75, 1.5].map((bx) => <Bx key={bx} c={trim} p={[bx, 0.28, 1.38]} s={[0.06, 0.55, 0.06]} />)}
          <Bx c="#3ccf91" p={[1.1, 0.25, 0.9]} s={[0.4, 0.35, 0.3]} />
        </group>
      ))}
    </group>
  );
}
