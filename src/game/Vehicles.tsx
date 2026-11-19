import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import type { OwnedVehicle } from '../types';
import { VehicleModel } from './VehicleModel';
import { VEHICLES } from '../data/vehicles';
import { rt, spawnEffect } from '../systems/runtime';
import { registerInteractable } from '../systems/interactions';
import { consume, moveVector, wantsUp, wantsDown } from '../systems/input';
import { blocked, floorAt } from './physics';
import { groundAt, clampWorld, SEA_LIMIT } from '../systems/terrain';
import { sfx } from '../systems/audio';
import { Avatar } from './Avatar';
import { WORLD_HALF } from '../data/world';

export function enterVehicle(v: OwnedVehicle) {
  if (!v.parked) return;
  rt.vehicle.id = v.id;
  rt.vehicle.pos.set(...v.parked.pos);
  rt.vehicle.yaw = v.parked.rotY;
  rt.vehicle.speed = 0;
  rt.vehicle.alt = 0;
  rt.player.seat = null;
  rt.player.mounted = null;
  rt.cam.yaw = v.parked.rotY + Math.PI;
  useGame.getState().track('drive');
  sfx('door');
}

export function exitVehicle(): boolean {
  const id = rt.vehicle.id;
  if (!id) return false;
  const s = useGame.getState();
  const v = s.vehicles.find((x) => x.id === id);
  if (!v) { rt.vehicle.id = null; return true; }
  const def = VEHICLES[v.vtype];
  if (def.medium === 'air' && rt.vehicle.alt > 1.5) {
    s.toast('Pouse primeiro para sair! Segure ⬇️ para descer.', '🛬');
    return false;
  }
  const p = rt.vehicle.pos;
  s.updateVehicle(id, { parked: { pos: [p.x, p.y - rt.vehicle.alt, p.z], rotY: rt.vehicle.yaw } });
  rt.vehicle.id = null;
  // sai pela lateral
  const side = def.size[0] / 2 + 0.9;
  rt.player.pos.set(p.x + Math.cos(rt.vehicle.yaw) * side, p.y - rt.vehicle.alt + 0.3, p.z - Math.sin(rt.vehicle.yaw) * side);
  rt.player.velY = 0;
  sfx('door');
  return true;
}

/** Leva um veículo até a jogadora (ou ao porto / aeroporto). */
export function summonVehicle(v: OwnedVehicle) {
  const s = useGame.getState();
  const def = VEHICLES[v.vtype];
  const P = rt.player.pos;
  let pos: [number, number, number];
  let yaw = rt.player.yaw;
  if (def.medium === 'water') {
    const g = groundAt(P.x, P.z + 8);
    if (g.water !== null && g.y < -0.6) pos = [P.x, -0.15, P.z + 8];
    else {
      pos = [310, -0.15, 250];
      yaw = Math.PI;
      rt.player.pos.set(300, 0.4, 226);
      s.toast(`${v.name} está te esperando no Porto! ⚓`, '⛵');
    }
  } else if (def.medium === 'air' && !def.hover) {
    pos = [180, 0, -300];
    yaw = Math.PI / 2;
    rt.player.pos.set(176, 0, -296);
    s.toast(`${v.name} está pronto na pista do aeroporto! ✈️`, '🛫');
  } else {
    const side = 3 + def.size[0];
    pos = [P.x + Math.cos(yaw) * side, Math.max(0, P.y), P.z - Math.sin(yaw) * side];
  }
  s.updateVehicle(v.id, { parked: { pos, rotY: yaw } });
  spawnEffect('sparkles', new THREE.Vector3(...pos));
  sfx('whoosh');
  s.openPanel(null);
}

function ParkedVehicle({ v }: { v: OwnedVehicle }) {
  useEffect(() => {
    if (!v.parked) return;
    const p = new THREE.Vector3(...v.parked.pos);
    const def = VEHICLES[v.vtype];
    return registerInteractable({
      id: `veh-${v.id}`, label: `Entrar: ${v.name}`, icon: def.icon, radius: Math.max(def.size[0], def.size[2]) / 2 + 1.5,
      pos: () => (rt.vehicle.id === v.id ? null : p), action: () => enterVehicle(v), priority: 0.5,
    });
  }, [v]);
  const driving = useRef(false);
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    driving.current = rt.vehicle.id === v.id;
    g.current.visible = !driving.current;
  });
  if (!v.parked) return null;
  const water = VEHICLES[v.vtype].medium === 'water';
  return (
    <group ref={g} position={v.parked.pos} rotation={[0, v.parked.rotY, 0]}>
      <group position={[0, water ? -0.25 : 0, 0]}><VehicleModel vtype={v.vtype} color={v.color} color2={v.color2} /></group>
    </group>
  );
}

function Driven() {
  const vehicles = useGame((s) => s.vehicles);
  const look = useGame((s) => s.appearance);
  const group = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const speedRef = useRef(0);
  const idRef = useRef<string | null>(null);
  const [, force] = useState(0);
  const vRef = useRef<OwnedVehicle | null>(null);
  vRef.current = vehicles.find((x) => x.id === rt.vehicle.id) ?? null;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    if (idRef.current !== rt.vehicle.id) {
      idRef.current = rt.vehicle.id;
      force((n) => n + 1);
    }
    const v = vehicles.find((x) => x.id === rt.vehicle.id);
    if (!v) { group.current.visible = false; return; }
    group.current.visible = true;
    const def = VEHICLES[v.vtype];
    const s = useGame.getState();
    const ui = s.panel !== null || s.minigame !== null || s.dialog !== null;
    const V = rt.vehicle;
    if (!ui && consume('e')) { exitVehicle(); return; }
    if (!ui && consume('h')) sfx('honk');

    const mv = ui ? { x: 0, y: 0 } : moveVector();
    // aceleração
    const target = mv.y * def.maxSpeed * (mv.y < 0 ? 0.45 : 1);
    const a = Math.abs(target) > Math.abs(V.speed) ? def.accel : def.accel * 1.6;
    V.speed += THREE.MathUtils.clamp(target - V.speed, -a * dt, a * dt);
    const steerFactor = def.medium === 'air' ? 1 : THREE.MathUtils.clamp(Math.abs(V.speed) / 6, 0, 1) * Math.sign(V.speed || 1);
    const steer = -mv.x * def.turn * steerFactor * dt;
    V.yaw += steer;
    V.roll = THREE.MathUtils.lerp(V.roll, def.medium === 'ground' ? 0 : -mv.x * 0.35, dt * 4);

    const fx = Math.sin(V.yaw), fz = Math.cos(V.yaw);
    const dx = fx * V.speed * dt, dz = fz * V.speed * dt;
    const r = Math.min(def.size[0], def.size[2]) / 2;
    const fl = floorAt(V.pos.x, V.pos.z, r, V.pos.y - V.alt, 0.8);
    const baseY = V.pos.y - V.alt;

    // altitude (aviões)
    if (def.medium === 'air') {
      const canLift = def.hover || Math.abs(V.speed) > def.maxSpeed * 0.35;
      if (!ui && wantsUp() && canLift) V.alt = Math.min(140, V.alt + 9 * dt);
      else if (!ui && wantsDown()) V.alt = Math.max(0, V.alt - 9 * dt);
      else if (!canLift && V.alt > 0) V.alt = Math.max(0, V.alt - 6 * dt);
      V.pitch = THREE.MathUtils.lerp(V.pitch, wantsUp() && canLift ? -0.2 : wantsDown() && V.alt > 0 ? 0.15 : 0, dt * 3);
    }
    const nx = clampWorld(V.pos.x + dx, WORLD_HALF);
    const nz = Math.max(-WORLD_HALF, Math.min(SEA_LIMIT, V.pos.z + dz));
    const flying = def.medium === 'air' && V.alt > 3;
    const y0 = baseY + V.alt + 0.7;
    const hitObj = !flying && blocked(nx, nz, r, y0, y0 + def.size[1]);
    const g2 = groundAt(nx, nz);
    const deep = g2.water !== null && g2.y < -0.6;
    let ok = !hitObj;
    if (def.medium === 'ground' && deep) ok = false;
    if (def.medium === 'water' && !deep) ok = false;
    if (def.medium === 'air' && !flying && deep) ok = false;
    if (ok) { V.pos.x = nx; V.pos.z = nz; }
    else { V.speed *= -0.25; if (Math.abs(V.speed) > 3) { sfx('pop'); rt.cam.shake = 0.15; } }

    // chão
    let floorY = fl.top;
    if (def.medium === 'water') floorY = -0.15 + Math.sin(rt.time * 2 + V.pos.x) * 0.06;
    V.pos.y = THREE.MathUtils.lerp(baseY, floorY, Math.min(1, dt * 10)) + V.alt;

    speedRef.current = V.speed;
    group.current.position.copy(V.pos);
    group.current.rotation.set(0, V.yaw, 0);
    body.current.rotation.set(V.pitch, 0, V.roll);
    if (def.medium === 'water' && Math.abs(V.speed) > 6 && Math.random() < dt * 6) spawnEffect('splash', V.pos.clone().add(new THREE.Vector3(-fx * 2, 0, -fz * 2)));
    rt.player.pos.set(V.pos.x, V.pos.y, V.pos.z);
  });

  const v = vRef.current;
  if (!v) return <group ref={group}><group ref={body} /></group>;
  const def = VEHICLES[v.vtype];
  const bike = ['moto', 'bicicleta', 'patinete', 'jetski'].includes(v.vtype);
  const seatZ = ['aviao', 'jatinho'].includes(v.vtype) ? 1.6 : v.vtype === 'helicoptero' ? 1 : bike ? -0.2 : v.vtype === 'onibus' ? 3.5 : v.vtype === 'caminhao-bombeiro' ? 2.4 : -0.2;
  const seatX = bike || ['aviao', 'jatinho', 'helicoptero'].includes(v.vtype) ? 0 : -0.45;
  return (
    <group ref={group}>
      <group ref={body}>
        <group position={[0, def.medium === 'water' ? -0.25 : 0, 0]}>
          <VehicleModel vtype={v.vtype} color={v.color} color2={v.color2} speedRef={speedRef} />
          {def.open && (
            <group position={[seatX, def.seatY + (v.vtype === 'patinete' ? 0.05 : 0), seatZ]}>
              <group position={[0, v.vtype === 'patinete' ? 0 : -0.25, 0]}>
                <Avatar look={look} anim={v.vtype === 'patinete' ? 'idle' : bike ? 'ride' : 'drive'} />
              </group>
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

export function Vehicles() {
  const vehicles = useGame((s) => s.vehicles);
  const parked = useMemo(() => vehicles.filter((v) => v.parked), [vehicles]);
  return (
    <>
      {parked.map((v) => <ParkedVehicle key={v.id} v={v} />)}
      <Driven />
    </>
  );
}
