import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bx, Cy, Sp, Co } from '../game/prims';
import { mat } from '../systems/materials';
import { registerInteractable } from '../systems/interactions';
import { rt, spawnEffect } from '../systems/runtime';
import { useGame } from '../store/gameStore';
import { useNear } from '../game/hooks';
import { setGroup, boxAt } from '../systems/colliders';
import { WorldSet } from './Zones';
import type { Fixture } from '../types';
import { sfx } from '../systems/audio';
import { signTexture } from '../systems/textures';

const RAINBOW = ['#ff5f5f', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa', '#ff8fc7', '#5ad1ff'];

function useRide(id: string, label: string, base: THREE.Vector3) {
  useEffect(() => registerInteractable({
    id: `ride-${id}`, label, icon: '🎢', radius: 4, pos: () => base,
    action: () => {
      rt.player.ride = id;
      rt.player.rideExit = base.clone().add(new THREE.Vector3(0, 0, 3));
      useGame.getState().track('ride');
      useGame.getState().toast('Segure firme! Ande para descer 🎉', '🎢');
      sfx('fanfare');
    },
  }), [id, label, base]);
}

function FerrisWheel({ x, z }: { x: number; z: number }) {
  const wheel = useRef<THREE.Group>(null!);
  const cabins = useRef<THREE.Group[]>([]);
  const base = useMemo(() => new THREE.Vector3(x, 0, z + 5), [x, z]);
  useRide('roda', 'Andar na roda-gigante', base);
  const R = 14, CY = 17, N = 8;
  useFrame((_, dt) => {
    const a = (wheel.current.rotation.z += dt * 0.15);
    cabins.current.forEach((c, i) => {
      const t = a + (i / N) * Math.PI * 2;
      c.position.set(Math.cos(t) * R, CY + Math.sin(t) * R, 0);
    });
    if (rt.player.ride === 'roda') {
      const t = a;
      rt.player.pos.set(x + Math.cos(t) * R, CY + Math.sin(t) * R - 1.6, z + 0.3);
      rt.player.yaw = 0;
      if (Math.random() < dt * 0.5) spawnEffect('hearts', rt.player.pos);
    }
  });
  return (
    <group position={[x, 0, z]}>
      {[-1.5, 1.5].map((dz) => <group key={dz}><Bx c="#ffffff" p={[-4, CY / 2, dz]} s={[0.6, CY + 1, 0.6]} r={[0, 0, -0.25]} /><Bx c="#ffffff" p={[4, CY / 2, dz]} s={[0.6, CY + 1, 0.6]} r={[0, 0, 0.25]} /></group>)}
      <group ref={wheel} position={[0, CY, 0]}>
        <mesh material={mat('#ff8fc7', { emissive: 0.2 })}><torusGeometry args={[R, 0.3, 8, 40]} /></mesh>
        <mesh material={mat('#ffd6e8')}><torusGeometry args={[R * 0.6, 0.2, 8, 30]} /></mesh>
        {Array.from({ length: N }).map((_, i) => <Bx key={i} c="#ffffff" s={[R * 2, 0.2, 0.2]} r={[0, 0, (i / N) * Math.PI]} />)}
        {Array.from({ length: 16 }).map((_, i) => <Sp key={i} c={RAINBOW[i % 8]} e={1.2} p={[Math.cos((i / 16) * Math.PI * 2) * R, Math.sin((i / 16) * Math.PI * 2) * R, 0.4]} s={[0.5, 0.5, 0.5]} />)}
        <Cy c="#ffd23f" s={[2, 3.6, 2]} r={[Math.PI / 2, 0, 0]} />
      </group>
      {Array.from({ length: N }).map((_, i) => (
        <group key={i} ref={(g) => { if (g) cabins.current[i] = g; }}>
          <Bx c={RAINBOW[i]} p={[0, -1.4, 0]} s={[2.2, 1.6, 2]} />
          <Co c={RAINBOW[i]} p={[0, -0.2, 0]} s={[2.6, 0.8, 2.4]} />
          <Cy c="#999" p={[0, -0.3, 0]} s={[0.1, 0.6, 0.1]} />
        </group>
      ))}
      <Bx c="#9d4edd" p={[0, 0.3, 5]} s={[6, 0.6, 3]} />
    </group>
  );
}

function Carousel({ x, z }: { x: number; z: number }) {
  const top = useRef<THREE.Group>(null!);
  const horses = useRef<THREE.Group[]>([]);
  const base = useMemo(() => new THREE.Vector3(x, 0, z + 9), [x, z]);
  useRide('carrossel', 'Andar no carrossel', base);
  useEffect(() => setGroup('carousel', [boxAt(x, 0, z, 1.5, 6, 1.5)]), [x, z]);
  useFrame(({ clock }, dt) => {
    const a = (top.current.rotation.y += dt * 0.6);
    horses.current.forEach((h, i) => { h.position.y = 1.2 + Math.sin(clock.elapsedTime * 2 + i) * 0.35; });
    if (rt.player.ride === 'carrossel') {
      const t = a;
      rt.player.pos.set(x + Math.sin(t) * 5.5, 0.9 + Math.sin(clock.elapsedTime * 2) * 0.35, z + Math.cos(t) * 5.5);
      rt.player.yaw = t + Math.PI / 2;
    }
  });
  return (
    <group position={[x, 0, z]}>
      <Cy c="#ffffff" p={[0, 0.2, 0]} s={[15, 0.4, 15]} />
      <Cy c="#ffd23f" p={[0, 3, 0]} s={[1.4, 6, 1.4]} />
      <group ref={top}>
        <Co c="#ff8fc7" tex="listras" p={[0, 6.8, 0]} s={[16, 2.4, 16]} />
        {Array.from({ length: 12 }).map((_, i) => <Sp key={i} c={RAINBOW[i % 8]} e={1} p={[Math.sin(i * 0.52) * 7.8, 5.7, Math.cos(i * 0.52) * 7.8]} s={[0.4, 0.4, 0.4]} />)}
        {Array.from({ length: 8 }).map((_, i) => (
          <group key={i} position={[Math.sin(i * 0.785) * 5.5, 0, Math.cos(i * 0.785) * 5.5]} rotation={[0, i * 0.785 + Math.PI / 2, 0]}>
            <Cy c="#ffd23f" p={[0, 3.2, 0]} s={[0.1, 5, 0.1]} />
            <group ref={(g) => { if (g) horses.current[i] = g; }}>
              <Sp c={RAINBOW[i]} s={[0.6, 0.6, 1.3]} />
              <Sp c={RAINBOW[i]} p={[0, 0.5, 0.6]} s={[0.4, 0.6, 0.5]} />
              {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([a, b]) => <Cy key={`${a}${b}`} c={RAINBOW[i]} p={[a * 0.15, -0.5, b * 0.4]} s={[0.12, 0.6, 0.12]} />)}
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

function Coaster({ x, z }: { x: number; z: number }) {
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * 32, 5 + Math.sin(t * 3) * 3.5 + Math.cos(t) * 2, Math.sin(t * 2) * 12));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 240, 0.35, 6, true), [curve]);
  const cart = useRef<THREE.Group>(null!);
  const u = useRef(0);
  const base = useMemo(() => new THREE.Vector3(x + 32, 0, z + 4), [x, z]);
  useRide('montanha', 'Andar na montanha-russa', base);
  const supports = useMemo(() => Array.from({ length: 24 }, (_, i) => curve.getPointAt(i / 24)), [curve]);
  useFrame((_, dt) => {
    const p = curve.getPointAt(u.current);
    const p2 = curve.getPointAt((u.current + 0.002) % 1);
    const slope = p.y - p2.y;
    u.current = (u.current + dt * (0.05 + Math.max(-0.02, slope * 0.25))) % 1;
    cart.current.position.copy(p);
    cart.current.lookAt(p2.x, p2.y, p2.z);
    if (rt.player.ride === 'montanha') {
      rt.player.pos.set(x + p.x, p.y + 0.3, z + p.z);
      rt.player.yaw = Math.atan2(p2.x - p.x, p2.z - p.z);
      rt.cam.shake = 0.05;
    }
  });
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={tube} material={mat('#ff5fa2', { emissive: 0.15 })} />
      {supports.map((s, i) => <Cy key={i} c="#ffffff" p={[s.x, s.y / 2, s.z]} s={[0.3, s.y, 0.3]} low />)}
      <group ref={cart}>
        <Bx c="#ffd23f" p={[0, 0.5, 0]} s={[1.6, 0.8, 2.4]} />
        <Bx c="#5ab0ff" p={[0, 0.8, 1]} s={[1.6, 0.6, 0.3]} />
      </group>
      <Bx c="#9d4edd" p={[32, 0.3, 4]} s={[6, 0.6, 3]} />
    </group>
  );
}

export function AmusementPark() {
  const near = useNear(260, -5, 170);
  const fx = useMemo((): Fixture[] => [
    { model: 'castelo-inflavel', x: 190, z: 25, rot: 0 }, { model: 'carrinho-pipoca', x: 180, z: -30, rot: Math.PI / 2 },
    { model: 'carrinho-sorvete', x: 180, z: -20, rot: Math.PI / 2 }, { model: 'baloes', x: 150, z: -12, rot: 0 }, { model: 'baloes', x: 150, z: 2, rot: 0 },
    { model: 'piscina-bolinhas', x: 200, z: 35, rot: 0, color: '#ffffff' }, { model: 'cama-elastica', x: 175, z: 35, rot: 0, color: '#ff5fa2' },
    { model: 'mesa-piquenique', x: 210, z: -40, rot: 0 }, { model: 'mesa-piquenique', x: 222, z: -40, rot: 0 },
    { model: 'arco', x: 145, z: -5, rot: Math.PI / 2, color: '#ff8fc7', scale: [2.4, 2, 1] },
  ], []);
  const sign = useMemo(() => signTexture('Parque Arco-Íris', '#ffffff', '#9d4edd', '🎡'), []);
  return (
    <>
      <WorldSet id="parque" x={0} z={0} fixtures={fx} r={9999} />
      {near && (
        <group>
          <FerrisWheel x={320} z={-25} />
          <Carousel x={225} z={-18} />
          <Coaster x={300} z={25} />
          <mesh position={[145, 8.5, -5]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[10, 2.5]} /><meshBasicMaterial map={sign} transparent side={THREE.DoubleSide} /></mesh>
        </group>
      )}
    </>
  );
}

// ---------------- Fazenda ----------------
const CROP_ICON: Record<string, string> = { cenoura: '#ff9f43', morango: '#ff5f5f', abobora: '#ffa94d', girassol: '#ffe066', milho: '#ffd23f', alface: '#69db7c' };

function FarmPlotView({ id, x, z }: { id: string; x: number; z: number }) {
  const plot = useGame((s) => s.farm[id]);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 2000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const p = new THREE.Vector3(x, 0, z);
    return registerInteractable({
      id: `farm-${id}`, label: 'Horta: plantar / regar / colher', icon: '🌱', radius: 2.2, pos: () => p,
      action: () => { useGame.getState().farmAction(id); spawnEffect(plot?.crop ? 'water' : 'sparkles', p); },
    });
  }, [id, x, z, plot?.crop]);
  const grow = plot?.crop ? Math.min(1, (Date.now() - plot.planted) / 1000 / (plot.watered ? 30 : 60)) : 0;
  const c = plot?.crop ? CROP_ICON[plot.crop] ?? '#ff5f5f' : '#000';
  return (
    <group position={[x, 0, z]}>
      <Bx c={plot?.watered ? '#5a3a26' : '#8d5b3a'} p={[0, 0.12, 0]} s={[3, 0.24, 3]} />
      {plot?.crop && (
        <group scale={0.3 + grow * 0.7}>
          {[[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7], [0, 0]].map(([a, b], i) => (
            <group key={i} position={[a, 0.24, b]}>
              <Cy c="#3ccf91" p={[0, 0.35, 0]} s={[0.08, 0.7, 0.08]} />
              <Sp c="#69db7c" p={[0, 0.6, 0]} s={[0.5, 0.3, 0.5]} />
              {grow >= 1 && <Sp c={c} e={0.2} p={[0, 0.85, 0]} s={[0.35, 0.35, 0.35]} />}
            </group>
          ))}
        </group>
      )}
      {grow >= 1 && <Sp c="#ffe066" e={1} p={[0, 2.2, 0]} s={[0.3, 0.3, 0.3]} />}
    </group>
  );
}

const ANIMALS: { kind: 'vaca' | 'ovelha' | 'porco' | 'galinha'; pen: [number, number] }[] = [
  { kind: 'vaca', pen: [205, 130] }, { kind: 'vaca', pen: [205, 130] }, { kind: 'ovelha', pen: [240, 130] }, { kind: 'ovelha', pen: [240, 130] },
  { kind: 'ovelha', pen: [240, 130] }, { kind: 'porco', pen: [275, 130] }, { kind: 'porco', pen: [275, 130] }, { kind: 'galinha', pen: [310, 130] },
  { kind: 'galinha', pen: [310, 130] }, { kind: 'galinha', pen: [310, 130] },
];

function FarmAnimal({ kind, pen }: { kind: string; pen: [number, number] }) {
  const g = useRef<THREE.Group>(null!);
  const st = useRef({ p: new THREE.Vector3(pen[0] + (Math.random() - 0.5) * 10, 0, pen[1] + (Math.random() - 0.5) * 10), goal: new THREE.Vector3(pen[0], 0, pen[1]), t: 0 });
  useFrame((_, dt) => {
    const s = st.current;
    s.t += dt;
    const d = s.p.distanceTo(s.goal);
    if (d < 0.3) { if (Math.random() < dt * 0.4) s.goal.set(pen[0] + (Math.random() - 0.5) * 12, 0, pen[1] + (Math.random() - 0.5) * 12); }
    else {
      s.p.lerp(s.goal, Math.min(1, (dt * 1.2) / d));
      g.current.rotation.y = Math.atan2(s.goal.x - s.p.x, s.goal.z - s.p.z);
    }
    g.current.position.copy(s.p);
    g.current.position.y = d > 0.3 ? Math.abs(Math.sin(s.t * 6)) * 0.08 : 0;
  });
  const body = kind === 'vaca' ? '#ffffff' : kind === 'ovelha' ? '#fdf6ec' : kind === 'porco' ? '#ffb3c6' : '#ffffff';
  const sc = kind === 'vaca' ? 1.5 : kind === 'galinha' ? 0.45 : 1;
  return (
    <group ref={g}>
      <group scale={sc}>
        <Sp c={body} p={[0, 0.7, 0]} s={kind === 'ovelha' ? [0.9, 0.8, 1.1] : [0.7, 0.6, 1.1]} />
        {kind === 'vaca' && <><Sp c="#222831" p={[0.2, 0.85, 0.1]} s={[0.3, 0.3, 0.35]} /><Sp c="#222831" p={[-0.25, 0.75, -0.3]} s={[0.25, 0.3, 0.3]} /></>}
        <Sp c={kind === 'ovelha' ? '#555a66' : body} p={[0, 0.95, 0.55]} s={[0.45, 0.42, 0.45]} />
        <Sp c={kind === 'porco' ? '#ff8fb1' : kind === 'galinha' ? '#ffa94d' : '#ffc2d9'} p={[0, 0.88, 0.8]} s={[0.25, 0.18, 0.12]} />
        {kind === 'galinha' && <Co c="#e63946" p={[0, 1.25, 0.55]} s={[0.15, 0.2, 0.15]} />}
        {[-1, 1].map((sd) => <Sp key={sd} c="#1a1a2e" p={[sd * 0.12, 1.02, 0.75]} s={[0.07, 0.08, 0.04]} />)}
        {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([a, b]) => <Cy key={`${a}${b}`} c={kind === 'galinha' ? '#ffa94d' : '#555a66'} p={[a * 0.2, 0.2, b * 0.35]} s={[0.12, 0.4, 0.12]} low />)}
      </group>
    </group>
  );
}

export function Farm() {
  const near = useNear(260, 105, 160);
  const plots = useMemo(() => {
    const out: { id: string; x: number; z: number }[] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) out.push({ id: `p${i}${j}`, x: 290 + i * 5, z: 72 + j * 5 });
    return out;
  }, []);
  useEffect(() => setGroup('farm', [boxAt(350, 0, 80, 8, 14, 8)]), []);
  const fx = useMemo((): Fixture[] => [
    { model: 'cerca', x: 205, z: 122, rot: 0, scale: [5, 1, 1] }, { model: 'cerca', x: 240, z: 122, rot: 0, scale: [5, 1, 1] },
    { model: 'cerca', x: 275, z: 122, rot: 0, scale: [5, 1, 1] }, { model: 'cerca', x: 310, z: 122, rot: 0, scale: [5, 1, 1] },
    { model: 'cerca', x: 257, z: 144, rot: 0, scale: [40, 1, 1] },
    { model: 'mesa-piquenique', x: 330, z: 60, rot: 0 }, { model: 'arvore', x: 340, z: 110, rot: 0 }, { model: 'arvore', x: 360, z: 140, rot: 0 },
    { model: 'horta', x: 270, z: 82, rot: 0 }, { model: 'canteiro', x: 270, z: 74, rot: 0, color: '#ffe066' },
  ], []);
  return (
    <>
      <WorldSet id="fazenda" x={0} z={0} fixtures={fx} r={9999} />
      {plots.map((p) => <FarmPlotView key={p.id} {...p} />)}
      {near && (
        <group>
          {ANIMALS.map((a, i) => <FarmAnimal key={i} {...a} />)}
          <group position={[350, 0, 80]}>
            <Cy c="#c9c9c9" p={[0, 6, 0]} s={[7, 12, 7]} />
            <Sp c="#e63946" p={[0, 12, 0]} s={[7, 4, 7]} />
          </group>
          <group position={[255, 0, 65]}>
            <Cy c="#8d5b3a" p={[0, 1.2, 0]} s={[0.15, 2.4, 0.15]} />
            <Bx c="#8d5b3a" p={[0, 1.8, 0]} s={[2, 0.12, 0.12]} />
            <Sp c="#ffe7a6" p={[0, 2.5, 0]} s={[0.6, 0.6, 0.6]} />
            <Co c="#e63946" p={[0, 2.9, 0]} s={[0.9, 0.5, 0.9]} />
            <Bx c="#5ab0ff" p={[0, 1.6, 0]} s={[0.7, 0.9, 0.4]} />
          </group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[340, 0.05, 130]} material={mat('#4fc3f7', { opacity: 0.85 })}><circleGeometry args={[8, 20]} /></mesh>
        </group>
      )}
    </>
  );
}
