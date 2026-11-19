import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { rt } from '../systems/runtime';

/** Verdadeiro quando a jogadora (ou o veículo) está perto do ponto — usado para desenhar só o que está perto (bom para celular). */
export function useNear(x: number, z: number, r: number) {
  const [near, setNear] = useState(false);
  const acc = useRef(Math.random() * 0.5);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.4) return;
    acc.current = 0;
    const p = rt.vehicle.id ? rt.vehicle.pos : rt.player.pos;
    const d = Math.hypot(p.x - x, p.z - z);
    const n = near ? d < r * 1.1 : d < r;
    if (n !== near) setNear(n);
  });
  return near;
}

export function toWorld(ox: number, oz: number, rot: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return [ox + lx * c + lz * s, oz - lx * s + lz * c];
}
