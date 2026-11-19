import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetSpecies } from '../types';
import { Bx, Cy, Sp, Co, To } from './prims';

interface Props { species: PetSpecies; color: string; accessory: string; accColor: string; getAnim: () => 'idle' | 'walk' | 'run' | 'jump' | 'sleep' | 'happy' | 'fly' }

function PetImpl({ species, color, accessory, accColor, getAnim }: Props) {
  const body = useRef<THREE.Group>(null!);
  const legs = useRef<THREE.Group[]>([]);
  const tail = useRef<THREE.Group>(null!);
  const wings = useRef<THREE.Group[]>([]);
  const head = useRef<THREE.Group>(null!);
  const ph = useRef(Math.random() * 10);
  useFrame((_, dt) => {
    const a = getAnim();
    ph.current += dt * (a === 'run' ? 14 : a === 'walk' ? 9 : 3);
    const t = ph.current;
    legs.current.forEach((l, i) => { if (l) l.rotation.x = a === 'walk' || a === 'run' ? Math.sin(t + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.6 : 0; });
    if (tail.current) tail.current.rotation.y = Math.sin(t * (a === 'happy' ? 3 : 1)) * (a === 'happy' ? 0.8 : 0.3);
    wings.current.forEach((w, i) => { if (w) w.rotation.z = (i ? -1 : 1) * (a === 'fly' ? Math.sin(t * 3) * 0.7 + 0.3 : 0.2); });
    if (body.current) {
      body.current.position.y = a === 'happy' || a === 'jump' ? Math.abs(Math.sin(t * 1.5)) * 0.35 : a === 'fly' ? Math.sin(t * 0.5) * 0.15 : 0;
      body.current.rotation.z = a === 'sleep' ? 1.2 : 0;
    }
    if (head.current) head.current.rotation.x = a === 'idle' ? Math.sin(t * 0.4) * 0.1 : 0;
  });
  const dark = new THREE.Color(color).multiplyScalar(0.75).getStyle();
  const eyes = (z: number, y: number, sp = 0.09) => [-1, 1].map((s) => <group key={s}><Sp c="#1a1a2e" p={[s * sp, y, z]} s={[0.07, 0.08, 0.05]} /><Sp c="#ffffff" e={0.5} p={[s * sp + 0.015, y + 0.02, z + 0.02]} s={[0.025, 0.025, 0.02]} /></group>);
  const legSet = (h: number, w: number, xs: number, zs: number, c = color) =>
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
      <group key={i} ref={(g) => { if (g) legs.current[i] = g; }} position={[x * xs, h, z * zs]}>
        <Cy c={c} p={[0, -h / 2, 0]} s={[w, h, w]} low />
      </group>
    ));
  const acc = (y: number, z: number, scale = 1) => {
    switch (accessory) {
      case 'laco': return <group position={[0.12 * scale, y + 0.05, z]}>{[-1, 1].map((s) => <Co key={s} c={accColor} p={[s * 0.06, 0, 0]} s={[0.09 * scale, 0.12 * scale, 0.06]} r={[0, 0, s * Math.PI / 2]} />)}</group>;
      case 'coroa': return <group position={[0, y + 0.05, z]}><Cy c="#ffd23f" e={0.3} s={[0.2 * scale, 0.1, 0.2 * scale]} />{[0, 1, 2, 3].map((k) => <Co key={k} c="#ffd23f" p={[Math.cos(k * 1.57) * 0.08 * scale, 0.08, Math.sin(k * 1.57) * 0.08 * scale]} s={[0.05, 0.08, 0.05]} />)}</group>;
      case 'chapeu': return <group position={[0, y + 0.05, z]}><Cy c="#222831" s={[0.32 * scale, 0.03, 0.32 * scale]} /><Cy c="#222831" p={[0, 0.1, 0]} s={[0.18 * scale, 0.2, 0.18 * scale]} /><Cy c={accColor} p={[0, 0.03, 0]} s={[0.19 * scale, 0.05, 0.19 * scale]} /></group>;
      case 'oculos': return <group position={[0, y - 0.12, z + 0.12 * scale]}>{[-1, 1].map((s) => <Sp key={s} c="#222" p={[s * 0.08 * scale, 0, 0]} s={[0.1, 0.08, 0.03]} />)}</group>;
      default: return null;
    }
  };
  const neck = (y: number, z: number, r: number) =>
    accessory === 'coleira' ? <To c={accColor} p={[0, y, z]} s={[r, r, r]} r={[Math.PI / 2, 0, 0]} /> : accessory === 'bandana' ? <Co c={accColor} p={[0, y - 0.05, z + 0.05]} s={[r * 0.9, 0.2, r * 0.6]} r={[Math.PI, 0, 0]} /> : null;

  let model: React.ReactNode = null;
  switch (species) {
    case 'cachorro':
    case 'gato':
    case 'raposa': {
      const cat = species !== 'cachorro';
      const crystal = species === 'raposa';
      const mc = { c: color, e: crystal ? 0.25 : 0, o: crystal ? 0.85 : 1 };
      model = (
        <group>
          <Sp {...mc} p={[0, 0.4, 0]} s={[0.42, 0.38, 0.7]} />
          {legSet(0.3, 0.12, 0.13, 0.22)}
          <group ref={head} position={[0, 0.65, 0.35]}>
            <Sp {...mc} s={[0.4, 0.36, 0.36]} />
            <Sp c={cat ? color : dark} p={[0, -0.05, 0.16]} s={[0.2, 0.15, 0.16]} />
            <Sp c="#1a1a2e" p={[0, -0.02, 0.25]} s={[0.06, 0.05, 0.04]} />
            {eyes(0.15, 0.05)}
            {cat ? [-1, 1].map((s) => <Co key={s} {...mc} p={[s * 0.12, 0.2, 0]} s={[0.12, 0.18, 0.08]} />) : [-1, 1].map((s) => <Sp key={s} c={dark} p={[s * 0.18, 0.02, -0.02]} s={[0.1, 0.24, 0.08]} r={[0, 0, s * 0.3]} />)}
            {acc(0.2, 0)}
          </group>
          {neck(0.55, 0.28, 0.32)}
          <group ref={tail} position={[0, 0.5, -0.33]}>
            <Cy {...mc} p={[0, 0.15, -0.1]} s={[crystal ? 0.2 : 0.07, 0.35, crystal ? 0.2 : 0.07]} r={[-0.7, 0, 0]} />
            {crystal && <Sp c="#ffffff" e={0.8} p={[0, 0.3, -0.25]} s={[0.15, 0.15, 0.15]} />}
          </group>
        </group>
      );
      break;
    }
    case 'coelho':
    case 'hamster':
      model = (
        <group>
          <Sp c={color} p={[0, 0.3, 0]} s={[0.45, 0.45, 0.55]} />
          <group ref={head} position={[0, 0.55, 0.2]}>
            <Sp c={color} s={[0.38, 0.36, 0.36]} />
            {eyes(0.16, 0.04, 0.08)}
            <Sp c="#ff8fb1" p={[0, -0.03, 0.18]} s={[0.05, 0.04, 0.03]} />
            {species === 'coelho' ? [-1, 1].map((s) => <Cy key={s} c={color} p={[s * 0.07, 0.3, -0.04]} s={[0.08, 0.35, 0.05]} r={[0, 0, s * 0.15]} />) : [-1, 1].map((s) => <Sp key={s} c="#ff8fb1" p={[s * 0.14, 0.16, 0]} s={[0.08, 0.08, 0.04]} />)}
            {acc(0.2, 0)}
          </group>
          {legSet(0.12, 0.1, 0.12, 0.15)}
          <group ref={tail} position={[0, 0.3, -0.27]}><Sp c="#ffffff" s={[0.14, 0.14, 0.14]} /></group>
        </group>
      );
      break;
    case 'cavalo':
    case 'unicornio': {
      const uni = species === 'unicornio';
      const mane = uni ? ['#ff8fc7', '#ffd23f', '#5ab0ff', '#9d4edd'] : [dark, dark, dark, dark];
      model = (
        <group>
          <Sp c={color} p={[0, 0.95, 0]} s={[0.55, 0.55, 1.1]} />
          {legSet(0.75, 0.14, 0.17, 0.35)}
          <group ref={head} position={[0, 1.35, 0.55]}>
            <Cy c={color} p={[0, 0, 0]} s={[0.26, 0.6, 0.3]} r={[0.6, 0, 0]} />
            <Sp c={color} p={[0, 0.25, 0.22]} s={[0.28, 0.28, 0.45]} />
            {eyes(0.32, 0.32, 0.12)}
            {[-1, 1].map((s) => <Co key={s} c={color} p={[s * 0.08, 0.45, 0.12]} s={[0.07, 0.15, 0.05]} />)}
            {uni && <Co c="#ffd23f" e={0.6} p={[0, 0.55, 0.3]} s={[0.07, 0.35, 0.07]} r={[0.4, 0, 0]} />}
            {mane.map((m, i) => <Sp key={i} c={m} p={[0, 0.3 - i * 0.12, -0.08 - i * 0.04]} s={[0.12, 0.16, 0.16]} />)}
            {acc(0.4, 0.1, 1.3)}
          </group>
          {neck(1.15, 0.4, 0.4)}
          <group ref={tail} position={[0, 1.05, -0.55]}>
            {mane.map((m, i) => <Sp key={i} c={m} p={[0, -0.1 - i * 0.12, -0.05 - i * 0.03]} s={[0.15, 0.18, 0.15]} />)}
          </group>
          <Bx c="#e63946" p={[0, 1.2, 0]} s={[0.58, 0.06, 0.4]} />
        </group>
      );
      break;
    }
    case 'passaro':
      model = (
        <group position={[0, 0.2, 0]}>
          <Sp c={color} p={[0, 0.2, 0]} s={[0.3, 0.3, 0.38]} />
          <group ref={head} position={[0, 0.38, 0.1]}>
            <Sp c={color} s={[0.24, 0.24, 0.24]} />
            <Co c="#ffb066" p={[0, -0.02, 0.15]} s={[0.07, 0.12, 0.07]} r={[Math.PI / 2, 0, 0]} />
            {eyes(0.09, 0.03, 0.07)}
            {acc(0.12, 0, 0.7)}
          </group>
          {[-1, 1].map((s, i) => <group key={s} ref={(g) => { if (g) wings.current[i] = g; }} position={[s * 0.14, 0.24, 0]}><Sp c={dark} p={[s * 0.1, 0, 0]} s={[0.25, 0.06, 0.2]} /></group>)}
          <group ref={tail}><Bx c={dark} p={[0, 0.2, -0.22]} s={[0.15, 0.03, 0.15]} /></group>
        </group>
      );
      break;
    case 'tartaruga':
      model = (
        <group>
          <Sp c={dark} p={[0, 0.25, 0]} s={[0.6, 0.38, 0.7]} />
          <Sp c="#b8f27c" p={[0, 0.12, 0]} s={[0.55, 0.12, 0.65]} />
          <group ref={head} position={[0, 0.25, 0.4]}><Sp c="#b8f27c" s={[0.22, 0.2, 0.25]} />{eyes(0.1, 0.03, 0.07)}{acc(0.08, 0, 0.6)}</group>
          {legSet(0.12, 0.12, 0.2, 0.2, '#b8f27c')}
        </group>
      );
      break;
    case 'pinguim':
      model = (
        <group>
          <Sp c={color} p={[0, 0.45, 0]} s={[0.45, 0.75, 0.42]} />
          <Sp c="#ffffff" p={[0, 0.42, 0.08]} s={[0.34, 0.6, 0.32]} />
          <group ref={head} position={[0, 0.82, 0.02]}><Sp c={color} s={[0.32, 0.3, 0.3]} />{eyes(0.13, 0.03, 0.07)}<Co c="#ffb066" p={[0, -0.03, 0.18]} s={[0.07, 0.12, 0.07]} r={[Math.PI / 2, 0, 0]} />{acc(0.14, 0, 0.8)}</group>
          {[-1, 1].map((s, i) => <group key={s} ref={(g) => { if (g) wings.current[i] = g; }} position={[s * 0.22, 0.55, 0]}><Bx c={color} p={[s * 0.04, -0.15, 0]} s={[0.05, 0.35, 0.18]} /></group>)}
          {legSet(0.05, 0.12, 0.1, 0.05, '#ffb066')}
        </group>
      );
      break;
    case 'dragao':
      model = (
        <group position={[0, 0.3, 0]}>
          <Sp c={color} p={[0, 0.35, 0]} s={[0.5, 0.5, 0.65]} />
          <Sp c="#fff3a6" p={[0, 0.3, 0.12]} s={[0.36, 0.38, 0.4]} />
          <group ref={head} position={[0, 0.7, 0.25]}>
            <Sp c={color} s={[0.42, 0.38, 0.42]} />
            {eyes(0.18, 0.05, 0.1)}
            {[-1, 1].map((s) => <Co key={s} c="#ffd23f" p={[s * 0.1, 0.22, -0.05]} s={[0.07, 0.16, 0.07]} r={[-0.3, 0, 0]} />)}
            {acc(0.22, 0)}
          </group>
          {[-1, 1].map((s, i) => <group key={s} ref={(g) => { if (g) wings.current[i] = g; }} position={[s * 0.22, 0.5, -0.1]}><Bx c={dark} p={[s * 0.25, 0.05, 0]} s={[0.5, 0.04, 0.35]} /></group>)}
          <group ref={tail} position={[0, 0.25, -0.3]}><Co c={color} p={[0, 0, -0.2]} s={[0.15, 0.45, 0.15]} r={[-Math.PI / 2, 0, 0]} /></group>
          {legSet(0.15, 0.12, 0.14, 0.15)}
        </group>
      );
      break;
    case 'panda':
      model = (
        <group position={[0, 0.25, 0]}>
          <Sp c="#ffffff" o={0.9} p={[0, -0.05, 0]} s={[0.9, 0.3, 0.7]} />
          <Sp c={color} p={[0, 0.35, 0]} s={[0.5, 0.5, 0.5]} />
          <group ref={head} position={[0, 0.72, 0.05]}>
            <Sp c={color} s={[0.45, 0.42, 0.42]} />
            {[-1, 1].map((s) => <Sp key={s} c="#222" p={[s * 0.1, 0.03, 0.17]} s={[0.12, 0.14, 0.05]} />)}
            {eyes(0.2, 0.04, 0.1)}
            {[-1, 1].map((s) => <Sp key={s} c="#222" p={[s * 0.17, 0.2, 0]} s={[0.13, 0.13, 0.08]} />)}
            {acc(0.24, 0)}
          </group>
          {legSet(0.1, 0.16, 0.16, 0.12, '#222')}
        </group>
      );
      break;
  }
  return <group ref={body}>{model}</group>;
}

export const PetModel = memo(PetImpl);
