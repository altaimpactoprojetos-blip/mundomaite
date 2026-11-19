import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import type { Pet } from '../types';
import { PETS } from '../data/pets';
import { PetModel } from './PetModel';
import { rt, spawnEffect } from '../systems/runtime';
import { registerInteractable } from '../systems/interactions';
import { floorAt } from './physics';
import { PROPERTIES } from '../data/world';

export const petFx = { happyUntil: 0, nuzzleUntil: 0, callAt: -10 };

/** Carinho: Maitê estende a mão e o pet encosta o focinho. */
export function petCuddle() {
  petFx.nuzzleUntil = rt.time + 2.6;
  petFx.happyUntil = rt.time + 3;
  rt.player.emote = { anim: 'pet', until: rt.time + 2.6 };
}

function FollowPet({ pet }: { pet: Pet }) {
  const def = PETS[pet.species];
  const g = useRef<THREE.Group>(null!);
  const pos = useRef(new THREE.Vector3().copy(rt.player.pos).add(new THREE.Vector3(1.5, 0, 1.5)));
  const yaw = useRef(0);
  const anim = useRef<'idle' | 'walk' | 'run' | 'happy' | 'fly' | 'sleep' | 'nuzzle'>('idle');
  useEffect(() => registerInteractable({
    id: `pet-${pet.id}`, label: def.rideable ? `Montar no ${pet.name}` : `Carinho no ${pet.name}`, icon: def.icon, radius: 2.4 * Math.max(1, def.scale * 0.8), priority: 0.8,
    pos: () => (rt.player.mounted === pet.id || rt.vehicle.id ? null : pos.current),
    action: () => useGame.getState().set({ petMenu: pet.id }),
  }), [pet.id, pet.name, def]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const P = rt.player;
    const p = pos.current;
    const inV = !!rt.vehicle.id;
    if (P.mounted === pet.id) {
      p.copy(P.pos);
      yaw.current = P.yaw;
      anim.current = P.moving ? 'run' : 'idle';
    } else if (rt.time < petFx.nuzzleUntil) {
      // vai para a frente da Maitê e encosta o focinho na mão dela
      const reach = def.rideable ? 1.9 : 1.0;
      const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
      const tx = P.pos.x + fx * reach, tz = P.pos.z + fz * reach;
      p.x = THREE.MathUtils.lerp(p.x, tx, Math.min(1, dt * 4));
      p.z = THREE.MathUtils.lerp(p.z, tz, Math.min(1, dt * 4));
      p.y = THREE.MathUtils.lerp(p.y, P.pos.y, Math.min(1, dt * 6));
      yaw.current = Math.atan2(P.pos.x - p.x, P.pos.z - p.z);
      anim.current = 'nuzzle';
      if (Math.random() < dt * 3) spawnEffect('hearts', p);
    } else {
      const behind = new THREE.Vector3(P.pos.x - Math.sin(P.yaw) * 1.8 + Math.cos(P.yaw) * 1, P.pos.y, P.pos.z - Math.cos(P.yaw) * 1.8 - Math.sin(P.yaw) * 1);
      const d = Math.hypot(behind.x - p.x, behind.z - p.z);
      if (d > 35 || inV && d > 25 || rt.time - petFx.callAt < 0.1) { p.copy(behind); if (rt.time - petFx.callAt < 0.1) spawnEffect('sparkles', p); }
      if (d > 1.2) {
        const sp = Math.min(d, (d > 6 ? 9 : 4.5) * def.speed) * dt;
        p.x += ((behind.x - p.x) / d) * sp;
        p.z += ((behind.z - p.z) / d) * sp;
        yaw.current = Math.atan2(behind.x - p.x, behind.z - p.z);
        anim.current = def.flies ? 'fly' : d > 6 ? 'run' : 'walk';
      } else {
        anim.current = rt.time < petFx.happyUntil ? 'happy' : def.flies ? 'fly' : 'idle';
        if (d < 3) yaw.current = THREE.MathUtils.lerp(yaw.current, Math.atan2(P.pos.x - p.x, P.pos.z - p.z), dt * 3);
      }
      const fl = floorAt(p.x, p.z, 0.3, P.pos.y + 0.5, 1);
      const targetY = def.flies ? Math.max(fl.top, P.pos.y) + 1.4 : fl.water !== null && fl.top < fl.water - 0.5 ? fl.water - 0.3 : fl.top;
      p.y = THREE.MathUtils.lerp(p.y, targetY, Math.min(1, dt * 8));
    }
    g.current.position.copy(p);
    g.current.rotation.y = yaw.current;
    g.current.visible = !inV;
    rt.petPos.copy(p);
  });
  return (
    <group ref={g}>
      <group scale={def.scale}>
        <PetModel species={pet.species} color={pet.color} accessory={pet.accessory} accColor={pet.accColor} getAnim={() => anim.current} />
      </group>
    </group>
  );
}

function HomePet({ pet, i }: { pet: Pet; i: number }) {
  const homeId = useGame((s) => s.homeId);
  const def = PETS[pet.species];
  const home = PROPERTIES.find((p) => p.id === homeId);
  const g = useRef<THREE.Group>(null!);
  const pos = useRef(new THREE.Vector3());
  const goal = useRef(new THREE.Vector3());
  const anim = useRef<'idle' | 'walk' | 'sleep'>('idle');
  useEffect(() => {
    if (!home) return;
    pos.current.set(home.pos[0] + (i % 3) * 2 - 2, 0, home.pos[1] + 8 * Math.cos(home.rot));
    goal.current.copy(pos.current);
  }, [home, i]);
  useEffect(() => registerInteractable({
    id: `hpet-${pet.id}`, label: `Brincar com ${pet.name}`, icon: def.icon, radius: 2.2, pos: () => (home ? pos.current : null),
    action: () => useGame.getState().openPanel('pets', pet.id),
  }), [pet.id, pet.name, def, home]);
  useFrame((_, dt) => {
    if (!home) return;
    const p = pos.current;
    const d = p.distanceTo(goal.current);
    if (d < 0.3) {
      anim.current = 'idle';
      if (Math.random() < dt * 0.3) goal.current.set(home.pos[0] + (Math.random() - 0.5) * 12, 0, home.pos[1] + 8 * Math.cos(home.rot) + (Math.random() - 0.5) * 6);
    } else {
      p.lerp(goal.current, Math.min(1, (dt * 2 * def.speed) / d));
      anim.current = 'walk';
    }
    g.current.position.copy(p);
    g.current.rotation.y = Math.atan2(goal.current.x - p.x, goal.current.z - p.z);
  });
  if (!home) return null;
  return (
    <group ref={g}>
      <group scale={def.scale}><PetModel species={pet.species} color={pet.color} accessory={pet.accessory} accColor={pet.accColor} getAnim={() => anim.current} /></group>
    </group>
  );
}

export function Pets() {
  const pets = useGame((s) => s.pets);
  const active = useGame((s) => s.activePet);
  return (
    <>
      {pets.map((p, i) => (p.id === active ? <FollowPet key={p.id} pet={p} /> : <HomePet key={p.id} pet={p} i={i} />))}
    </>
  );
}
