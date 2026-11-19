import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VehicleModel } from '../game/VehicleModel';
import type { VehicleType } from '../types';
import { rt } from '../systems/runtime';
import { registerInteractable } from '../systems/interactions';
import { useGame } from '../store/gameStore';
import { sfx } from '../systems/audio';
import { Avatar } from '../game/Avatar';
import { npcLook } from '../game/NPCs';
import { NPC_MAP } from '../data/npcs';

type Path = [number, number][];
const loop = (x0: number, z0: number, x1: number, z1: number, inset = 2.6): Path => [
  [x0 + inset, z0 + inset], [x1 - inset, z0 + inset], [x1 - inset, z1 - inset], [x0 + inset, z1 - inset],
];

const ROUTES: { type: VehicleType; color: string; path: Path; speed: number; offset: number; bus?: boolean }[] = [
  { type: 'onibus', color: '#ffd23f', path: loop(-130, -60, 130, 50), speed: 8, offset: 0, bus: true },
  { type: 'carro', color: '#ff8fc7', path: loop(-130, -60, 130, 50), speed: 11, offset: 0.5 },
  { type: 'suv', color: '#5ab0ff', path: loop(-130, -170, 130, 160, -2.6), speed: 12, offset: 0.2 },
  { type: 'conversivel', color: '#ffd23f', path: loop(-260, -60, 0, 160), speed: 10, offset: 0.7 },
  { type: 'viatura', color: '#222831', path: loop(0, -170, 130, 50), speed: 10, offset: 0.4 },
  { type: 'caminhonete', color: '#3ccf91', path: loop(-390, -170, -130, 160, -2.6), speed: 11, offset: 0.1 },
  { type: 'carrinho', color: '#ffffff', path: loop(130, -170, 390, 160, -2.6), speed: 8, offset: 0.6 },
];

function pathLen(p: Path) {
  let l = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    l += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return l;
}
function pointAt(p: Path, d: number): [number, number, number] {
  let rest = d;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (rest <= seg) {
      const t = rest / seg;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[0] - a[0], b[1] - a[1])];
    }
    rest -= seg;
  }
  return [p[0][0], p[0][1], 0];
}

function Car({ r }: { r: (typeof ROUTES)[number] }) {
  const g = useRef<THREE.Group>(null!);
  const len = useMemo(() => pathLen(r.path), [r.path]);
  const d = useRef(len * r.offset);
  const speed = useRef(r.speed);
  const yaw = useRef(0);
  const stopT = useRef(0);
  const pos = useRef(new THREE.Vector3());
  const lastHonk = useRef(0);
  const driver = useMemo(() => npcLook(NPC_MAP['seu-ze'] ?? { id: 'motorista', name: '', role: '', icon: '', personality: 'tranquila', look: {}, routine: [], lines: [] }), []);

  useEffect(() => {
    if (!r.bus) return;
    return registerInteractable({
      id: 'bus', label: 'Entrar no ônibus do Seu Zé', icon: '🚌', radius: 6, pos: () => (rt.player.ride === 'bus' ? null : pos.current),
      action: () => {
        rt.player.ride = 'bus';
        useGame.getState().toast('Seu Zé: "Bem-vinda a bordo! Ande para descer." 🚌', '🚌');
        useGame.getState().track('drive');
        sfx('honk');
      },
    });
  }, [r.bus]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const [x, z, a] = pointAt(r.path, d.current % len);
    // parar se a jogadora estiver na frente
    const fx = Math.sin(a), fz = Math.cos(a);
    const P = rt.vehicle.id ? rt.vehicle.pos : rt.player.pos;
    const dx = P.x - x, dz = P.z - z;
    const ahead = dx * fx + dz * fz;
    const side = Math.abs(dx * fz - dz * fx);
    const blocked = ahead > 0 && ahead < 9 && side < 2.8 && P.y < 4 && rt.player.ride !== 'bus';
    let target = blocked ? 0 : r.speed;
    if (r.bus) {
      // para no ponto (a cada esquina)
      const seg = Math.floor(((d.current % len) / len) * 4);
      const segStart = (seg / 4) * len;
      const into = (d.current % len) - segStart;
      if (into < 0.5 && stopT.current <= 0) stopT.current = 5;
      if (stopT.current > 0) { stopT.current -= dt; target = 0; if (stopT.current <= 0) d.current += 0.6; }
    }
    if (blocked && rt.time - lastHonk.current > 4 && ahead < 6) { lastHonk.current = rt.time; sfx('honk'); }
    speed.current = THREE.MathUtils.lerp(speed.current, target, Math.min(1, dt * 3));
    d.current += speed.current * dt;
    let diff = a - yaw.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    yaw.current += diff * Math.min(1, dt * 5);
    pos.current.set(x, 0, z);
    g.current.position.set(x, 0, z);
    g.current.rotation.y = yaw.current;
    if (r.bus && rt.player.ride === 'bus') {
      rt.player.pos.set(x - fz * 0.6, 1.1, z + fx * 0.6);
      rt.player.yaw = yaw.current;
      rt.player.rideExit = new THREE.Vector3(x + fz * 3, 0, z - fx * 3);
    }
  });
  const sr = useRef(r.speed);
  useFrame(() => { sr.current = speed.current; });
  return (
    <group ref={g}>
      <VehicleModel vtype={r.type} color={r.color} speedRef={sr} />
      {r.type !== 'onibus' && <group position={[-0.45, 0.25, -0.2]}><Avatar look={driver} anim="drive" /></group>}
    </group>
  );
}

export function Traffic() {
  return <>{ROUTES.map((r, i) => <Car key={i} r={r} />)}</>;
}
