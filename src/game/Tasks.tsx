import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import type { WorldTask } from '../types';
import { registerInteractable } from '../systems/interactions';
import { emote, rt, spawnEffect } from '../systems/runtime';
import { emojiTexture } from '../systems/textures';
import { mat } from '../systems/materials';
import { sfx } from '../systems/audio';

export function makeTask(kind: WorldTask['kind']): WorldTask {
  const r = (a: number, b: number) => a + Math.random() * (b - a);
  if (kind === 'fires') {
    const spots: [number, number][] = [[-60, 48], [20, -58], [110, 48], [-128, -20], [60, 100], [-20, 160], [128, -100], [0, -150], [-90, 50], [80, -60]];
    const pick = spots.sort(() => Math.random() - 0.5).slice(0, 5);
    return { kind, title: 'Apagar os focos de fogo', reward: 150, targets: pick.map(([x, z], i) => ({ id: `f${i}`, pos: [x + r(-3, 3), 0, z + r(-2, 2)], done: false, icon: '🔥', name: 'Fogo' })) };
  }
  if (kind === 'lost') {
    const items: [string, string][] = [['🐱', 'Gatinho perdido'], ['🧸', 'Ursinho'], ['🎈', 'Balão'], ['👛', 'Bolsinha'], ['🐶', 'Cachorrinho'], ['🔑', 'Chaves'], ['📚', 'Livro']];
    const spots: [number, number][] = [[70, 20], [-200, -10], [180, -40], [-40, 195], [-300, 100], [230, 100], [-330, -320], [40, -240], [250, -200], [-150, -150]];
    const sp = spots.sort(() => Math.random() - 0.5).slice(0, 4);
    return { kind, title: 'Encontrar os objetos perdidos', reward: 160, targets: sp.map(([x, z], i) => ({ id: `l${i}`, pos: [x + r(-4, 4), 0, z + r(-4, 4)], done: false, icon: items[i][0], name: items[i][1] })) };
  }
  const pens: [number, number][] = [[205, 124], [240, 124], [275, 124], [310, 124], [222, 124]];
  return { kind: 'farm', title: 'Dar comida aos animais', reward: 120, targets: pens.map(([x, z], i) => ({ id: `a${i}`, pos: [x, 0, z], done: false, icon: '🌾', name: 'Cocho' })) };
}

function Fire({ pos }: { pos: [number, number, number] }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    g.current.children.forEach((c, i) => { c.scale.y = 1 + Math.sin(clock.elapsedTime * 9 + i * 2) * 0.25; });
  });
  return (
    <group position={pos}>
      <group ref={g}>
        {[[0, 0, 1.4], [0.6, 0.3, 1], [-0.5, -0.4, 0.9]].map(([x, z, s], i) => (
          <mesh key={i} position={[x, s * 0.8, z]} material={mat(i ? '#ffd23f' : '#ff7b54', { emissive: 1.4 })}><coneGeometry args={[0.6 * s, 1.8 * s, 8]} /></mesh>
        ))}
      </group>
      <pointLight position={[0, 2, 0]} color="#ff9f43" intensity={10} distance={10} />
    </group>
  );
}

function Lost({ pos, icon }: { pos: [number, number, number]; icon: string }) {
  const s = useRef<THREE.Sprite>(null!);
  const tex = useMemo(() => emojiTexture(icon), [icon]);
  useFrame(({ clock }) => { s.current.position.y = 1 + Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.5; });
  return (
    <group position={pos}>
      <sprite ref={s} scale={[1.4, 1.4, 1.4]}><spriteMaterial map={tex} transparent /></sprite>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#ffe066', { emissive: 0.8, opacity: 0.6 })}><ringGeometry args={[0.8, 1.1, 24]} /></mesh>
    </group>
  );
}

function Marker({ pos }: { pos: [number, number, number] }) {
  const tex = useMemo(() => emojiTexture('⬇️'), []);
  const s = useRef<THREE.Sprite>(null!);
  useFrame(({ clock }) => { s.current.position.y = 6 + Math.sin(clock.elapsedTime * 3) * 0.5; });
  return <sprite ref={s} position={[pos[0], 6, pos[2]]} scale={[2, 2, 2]}><spriteMaterial map={tex} transparent depthTest={false} /></sprite>;
}

export function Tasks() {
  const task = useGame((s) => s.task);
  useEffect(() => {
    if (!task) return;
    const offs = task.targets.filter((t) => !t.done).map((t) => {
      const p = new THREE.Vector3(...t.pos);
      const label = task.kind === 'fires' ? 'Apagar o fogo!' : task.kind === 'lost' ? `Pegar: ${t.name}` : 'Encher o cocho de comida';
      return registerInteractable({
        id: `task-${t.id}`, label, icon: task.kind === 'fires' ? '🧯' : t.icon, radius: 3.5, priority: 2, pos: () => p,
        action: () => {
          if (task.kind === 'fires') { spawnEffect('water', p); spawnEffect('splash', p); sfx('splash'); emote('work', 1.2); }
          else { spawnEffect('hearts', p); emote('cheer', 1.2); }
          useGame.getState().completeTarget(t.id);
        },
      });
    });
    return () => offs.forEach((o) => o());
  }, [task]);
  if (!task) return null;
  return (
    <>
      {task.targets.filter((t) => !t.done).map((t) => (
        <group key={t.id}>
          {task.kind === 'fires' ? <Fire pos={t.pos} /> : task.kind === 'lost' ? <Lost pos={t.pos} icon={t.icon} /> : (
            <group position={t.pos}>
              <mesh position={[0, 0.4, 0]} material={mat('#8d5b3a')}><boxGeometry args={[2, 0.8, 1]} /></mesh>
              <Lost pos={[0, 0.2, 0]} icon="🌾" />
            </group>
          )}
          <Marker pos={t.pos} />
        </group>
      ))}
    </>
  );
}

export { rt };
