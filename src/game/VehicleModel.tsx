import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { VehicleType } from '../types';
import { Bx, Cy, Sp, Co } from './prims';

const TIRE = '#222831';
const GLASS = '#9fd8ff';

function Wheel({ p, r = 0.38, w = 0.28, spin }: { p: [number, number, number]; r?: number; w?: number; spin: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => { ref.current.rotation.x = spin.current; });
  return (
    <group position={p}>
      <group ref={ref}>
        <Cy c={TIRE} s={[r * 2, w, r * 2]} r={[0, 0, Math.PI / 2]} low />
        <Cy c="#e0e0e0" s={[r * 1.1, w + 0.02, r * 1.1]} r={[0, 0, Math.PI / 2]} low />
        <Bx c="#bbb" s={[w + 0.04, r * 1.6, 0.08]} />
      </group>
    </group>
  );
}

function Prop({ p, size = 1.4, axis = 'z', speed }: { p: [number, number, number]; size?: number; axis?: 'y' | 'z'; speed: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { ref.current.rotation[axis] += dt * (6 + Math.abs(speed.current) * 2); });
  return <group position={p}><group ref={ref}><Bx c="#4a4e57" s={axis === 'z' ? [size, 0.15, 0.05] : [size, 0.05, 0.2]} /><Bx c="#4a4e57" s={axis === 'z' ? [0.15, size, 0.05] : [0.2, 0.05, size]} /></group></group>;
}

interface Props { vtype: VehicleType; color: string; color2?: string; speedRef?: React.MutableRefObject<number>; lights?: boolean }

const vShadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25, depthWrite: false });
const vShadowGeo = new THREE.CircleGeometry(0.5, 20);
const SHADOW: Partial<Record<VehicleType, [number, number]>> = { moto: [1, 2.4], bicicleta: [0.8, 2], patinete: [0.6, 1.2], onibus: [3.2, 10], 'caminhao-bombeiro': [3, 8], aviao: [7, 7], jatinho: [6, 8], helicoptero: [3, 6], barco: [0, 0], lancha: [0, 0], jetski: [0, 0], trator: [2.4, 3.6], carrinho: [1.9, 3] };
function Model(props: Props) {
  const sh = SHADOW[props.vtype] ?? [2.4, 4.6];
  return (
    <>
      {sh[0] > 0 && <mesh geometry={vShadowGeo} material={vShadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[sh[0], sh[1], 1]} raycast={() => null} />}
      <ModelBody {...props} />
    </>
  );
}
function ModelBody({ vtype, color, color2 = '#ffffff', speedRef }: Props) {
  const local = useRef(0);
  const spin = useRef(0);
  const sp = speedRef ?? local;
  useFrame((_, dt) => { spin.current += (sp.current * dt) / 0.38; });
  const car = (len: number, wid: number, h: number, cabin: [number, number, number, number], extra?: React.ReactNode, wheelR = 0.4) => (
    <group>
      <Bx c={color} p={[0, 0.55 + h / 2 - 0.2, 0]} s={[wid, h, len]} />
      <Bx c={color} p={[0, 0.55 + h - 0.2 + cabin[1] / 2, cabin[2]]} s={[wid * cabin[0], cabin[1], cabin[3]]} />
      <Bx c={GLASS} o={0.7} p={[0, 0.55 + h - 0.2 + cabin[1] / 2, cabin[2] + cabin[3] / 2 + 0.01]} s={[wid * cabin[0] - 0.1, cabin[1] - 0.15, 0.03]} />
      <Bx c="#fff3a6" e={0.8} p={[-wid / 2 + 0.3, 0.7, len / 2 + 0.01]} s={[0.35, 0.18, 0.03]} />
      <Bx c="#fff3a6" e={0.8} p={[wid / 2 - 0.3, 0.7, len / 2 + 0.01]} s={[0.35, 0.18, 0.03]} />
      <Bx c="#ff5f5f" e={0.5} p={[-wid / 2 + 0.3, 0.7, -len / 2 - 0.01]} s={[0.3, 0.15, 0.03]} />
      <Bx c="#ff5f5f" e={0.5} p={[wid / 2 - 0.3, 0.7, -len / 2 - 0.01]} s={[0.3, 0.15, 0.03]} />
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => <Wheel key={`${sx}${sz}`} spin={spin} r={wheelR} p={[sx * (wid / 2 - 0.05), wheelR, sz * (len / 2 - 0.8)]} />)}
      {extra}
    </group>
  );
  switch (vtype) {
    case 'carro': return car(3.8, 1.9, 0.8, [0.85, 0.7, -0.2, 1.8], <Sp c={color2} p={[0, 2.05, -0.2]} s={[0.3, 0.3, 0.3]} />);
    case 'esportivo': return car(4.2, 2, 0.55, [0.75, 0.5, -0.4, 1.6], <Bx c={color2} p={[0, 1.35, -1.9]} s={[1.9, 0.08, 0.4]} />, 0.36);
    case 'suv': return car(4.4, 2.1, 1, [0.92, 0.85, -0.3, 2.8], <Bx c="#4a4e57" p={[0, 2.5, -0.3]} s={[1.6, 0.08, 2.4]} />, 0.48);
    case 'caminhonete': return car(5, 2.1, 0.9, [0.92, 0.85, 0.7, 1.8], <><Bx c={color2} p={[-1, 1.5, -1.3]} s={[0.1, 0.5, 2.2]} /><Bx c={color2} p={[1, 1.5, -1.3]} s={[0.1, 0.5, 2.2]} /></>, 0.48);
    case 'conversivel': return car(4.2, 1.9, 0.7, [0.85, 0.05, 0.6, 0.2], <Bx c={GLASS} o={0.6} p={[0, 1.5, 0.6]} s={[1.6, 0.5, 0.05]} r={[-0.3, 0, 0]} />);
    case 'viatura': return car(4.2, 2, 0.8, [0.85, 0.7, -0.2, 2], <><Bx c="#ffffff" p={[0, 0.95, 0]} s={[2.02, 0.35, 2]} /><Bx c="#ff3b3b" e={1.5} p={[-0.3, 2.15, -0.2]} s={[0.4, 0.2, 0.3]} /><Bx c="#3b7bff" e={1.5} p={[0.3, 2.15, -0.2]} s={[0.4, 0.2, 0.3]} /></>);
    case 'carrinho':
      return (
        <group>
          <Bx c={color} p={[0, 0.55, 0]} s={[1.4, 0.3, 2.4]} />
          <Bx c={color2} p={[0, 0.9, -0.3]} s={[1.3, 0.5, 0.6]} />
          {[[-0.6, 0.9], [0.6, 0.9], [-0.6, -0.9], [0.6, -0.9]].map(([x, z]) => <Cy key={`${x}${z}`} c="#ccc" p={[x, 1.4, z]} s={[0.06, 1.5, 0.06]} />)}
          <Bx c={color} p={[0, 2.15, 0]} s={[1.5, 0.08, 2.4]} />
          {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => <Wheel key={`${sx}${sz}`} spin={spin} r={0.3} p={[sx * 0.68, 0.3, sz * 0.8]} />)}
        </group>
      );
    case 'trator':
      return (
        <group>
          <Bx c={color} p={[0, 1, 0.6]} s={[1.2, 0.9, 1.8]} />
          <Bx c={color} p={[0, 1.6, -0.6]} s={[1.4, 1.4, 1.2]} />
          <Bx c={GLASS} o={0.5} p={[0, 1.9, -0.6]} s={[1.42, 0.7, 1.22]} />
          <Cy c="#555" p={[0.3, 1.9, 1.2]} s={[0.15, 0.8, 0.15]} />
          <Wheel spin={spin} r={0.8} w={0.5} p={[-0.9, 0.8, -0.8]} /><Wheel spin={spin} r={0.8} w={0.5} p={[0.9, 0.8, -0.8]} />
          <Wheel spin={spin} r={0.45} p={[-0.75, 0.45, 1]} /><Wheel spin={spin} r={0.45} p={[0.75, 0.45, 1]} />
        </group>
      );
    case 'onibus':
      return (
        <group>
          <Bx c={color} p={[0, 1.7, 0]} s={[2.6, 2.6, 9]} />
          <Bx c={GLASS} o={0.7} p={[0, 2.2, 0]} s={[2.62, 1, 8]} />
          <Bx c={GLASS} o={0.7} p={[0, 2, 4.51]} s={[2.2, 1.4, 0.03]} />
          <Bx c="#ffffff" p={[0, 1.1, 0]} s={[2.62, 0.25, 9.02]} />
          {[[-1, 3], [1, 3], [-1, -3], [1, -3]].map(([sx, sz]) => <Wheel key={`${sx}${sz}`} spin={spin} r={0.55} p={[sx * 1.25, 0.55, sz]} />)}
        </group>
      );
    case 'caminhao-bombeiro':
      return (
        <group>
          <Bx c={color} p={[0, 1.5, -0.8]} s={[2.4, 2, 5]} />
          <Bx c={color} p={[0, 1.6, 2.4]} s={[2.4, 2.2, 1.8]} />
          <Bx c={GLASS} o={0.7} p={[0, 2.1, 3.31]} s={[2.1, 0.9, 0.03]} />
          <Bx c="#c9c9c9" p={[0, 2.7, -1]} s={[0.6, 0.3, 5]} r={[0.05, 0, 0]} />
          <Bx c="#ff3b3b" e={1.5} p={[0, 2.8, 2.4]} s={[1.2, 0.2, 0.4]} />
          {[[-1, 2.3], [1, 2.3], [-1, -2.2], [1, -2.2]].map(([sx, sz]) => <Wheel key={`${sx}${sz}`} spin={spin} r={0.55} p={[sx * 1.15, 0.55, sz]} />)}
        </group>
      );
    case 'moto':
      return (
        <group>
          <Wheel spin={spin} r={0.4} w={0.18} p={[0, 0.4, 0.8]} /><Wheel spin={spin} r={0.4} w={0.18} p={[0, 0.4, -0.75]} />
          <Bx c={color} p={[0, 0.75, 0]} s={[0.4, 0.4, 1.3]} />
          <Bx c="#222" p={[0, 1, -0.2]} s={[0.36, 0.12, 0.8]} />
          <Cy c="#999" p={[0, 1.15, 0.7]} s={[0.05, 0.7, 0.05]} r={[0.4, 0, 0]} />
          <Cy c="#222" p={[0, 1.45, 0.82]} s={[0.04, 0.8, 0.04]} r={[0, 0, Math.PI / 2]} />
          <Sp c="#fff3a6" e={1} p={[0, 1.1, 0.88]} s={[0.2, 0.2, 0.1]} />
        </group>
      );
    case 'bicicleta':
      return (
        <group>
          <Wheel spin={spin} r={0.38} w={0.06} p={[0, 0.38, 0.62]} /><Wheel spin={spin} r={0.38} w={0.06} p={[0, 0.38, -0.62]} />
          <Cy c={color} p={[0, 0.62, 0]} s={[0.05, 1.3, 0.05]} r={[Math.PI / 2 - 0.3, 0, 0]} />
          <Cy c={color} p={[0, 0.65, -0.3]} s={[0.05, 0.7, 0.05]} />
          <Bx c="#222" p={[0, 0.98, -0.3]} s={[0.18, 0.06, 0.3]} />
          <Cy c={color} p={[0, 0.85, 0.6]} s={[0.04, 0.8, 0.04]} />
          <Cy c="#222" p={[0, 1.22, 0.6]} s={[0.04, 0.6, 0.04]} r={[0, 0, Math.PI / 2]} />
          <Bx c="#ffffff" p={[0, 0.85, 0.75]} s={[0.35, 0.25, 0.25]} />
        </group>
      );
    case 'patinete':
      return (
        <group>
          <Wheel spin={spin} r={0.12} w={0.06} p={[0, 0.12, 0.45]} /><Wheel spin={spin} r={0.12} w={0.06} p={[0, 0.12, -0.45]} />
          <Bx c={color} p={[0, 0.16, 0]} s={[0.2, 0.05, 0.9]} />
          <Cy c={color} p={[0, 0.6, 0.45]} s={[0.05, 0.9, 0.05]} />
          <Cy c="#222" p={[0, 1.05, 0.45]} s={[0.04, 0.5, 0.04]} r={[0, 0, Math.PI / 2]} />
        </group>
      );
    case 'barco':
      return (
        <group>
          <Bx c={color} p={[0, 0.3, 0]} s={[2.4, 0.8, 4.6]} />
          <Co c={color} p={[0, 0.3, 2.8]} s={[2.4, 1.2, 0.8]} r={[Math.PI / 2, 0, 0]} />
          <Bx c="#8d5b3a" p={[0, 0.72, 0]} s={[2.2, 0.05, 4.4]} />
          <Cy c="#8d5b3a" p={[0, 2.6, 0.3]} s={[0.12, 4, 0.12]} />
          <mesh position={[0.05, 2.7, 0.3]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[2.2, 3.2]} />
            <meshStandardMaterial color={color2} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case 'lancha':
      return (
        <group>
          <Bx c={color} p={[0, 0.3, -0.3]} s={[2.2, 0.8, 4.4]} />
          <Co c={color} p={[0, 0.3, 2.3]} s={[2.2, 1.2, 0.8]} r={[Math.PI / 2, 0, 0]} />
          <Bx c="#ffffff" p={[0, 0.75, -0.6]} s={[2, 0.1, 3]} />
          <Bx c={GLASS} o={0.7} p={[0, 1.1, 0.8]} s={[1.8, 0.6, 0.05]} r={[-0.5, 0, 0]} />
        </group>
      );
    case 'jetski':
      return (
        <group>
          <Bx c={color} p={[0, 0.3, 0]} s={[0.9, 0.5, 2.4]} />
          <Co c={color} p={[0, 0.3, 1.4]} s={[0.9, 0.6, 0.5]} r={[Math.PI / 2, 0, 0]} />
          <Bx c="#222" p={[0, 0.65, -0.3]} s={[0.5, 0.2, 1]} />
          <Cy c="#222" p={[0, 0.95, 0.6]} s={[0.04, 0.7, 0.04]} r={[0, 0, Math.PI / 2]} />
        </group>
      );
    case 'aviao':
    case 'jatinho': {
      const jet = vtype === 'jatinho';
      return (
        <group>
          <Cy c={color} p={[0, 1.2, 0]} s={[1.3, 6, 1.3]} r={[Math.PI / 2, 0, 0]} />
          <Sp c={color} p={[0, 1.2, 3]} s={[1.3, 1.3, 1.6]} />
          <Co c={color} p={[0, 1.4, -3.4]} s={[1.3, 1.4, 1.3]} r={[-Math.PI / 2, 0, 0]} />
          <Bx c={GLASS} o={0.7} p={[0, 1.75, 1.6]} s={[0.9, 0.5, 1.4]} />
          <Bx c={color2} p={[0, 1.2, 0.3]} s={[jet ? 7 : 8, 0.12, 1.5]} />
          <Bx c={color2} p={[0, 1.4, -3.2]} s={[2.8, 0.1, 0.8]} />
          <Bx c={color2} p={[0, 2.1, -3.2]} s={[0.1, 1.4, 0.9]} />
          {!jet && <Prop p={[0, 1.2, 3.85]} speed={sp} />}
          {jet && [-1.8, 1.8].map((x) => <Cy key={x} c="#4a4e57" p={[x, 0.9, 0]} s={[0.5, 1.4, 0.5]} r={[Math.PI / 2, 0, 0]} />)}
          <Cy c="#222" p={[0, 0.3, 2]} s={[0.4, 0.15, 0.4]} r={[0, 0, Math.PI / 2]} />
          <Cy c="#222" p={[-1, 0.3, -0.3]} s={[0.4, 0.15, 0.4]} r={[0, 0, Math.PI / 2]} />
          <Cy c="#222" p={[1, 0.3, -0.3]} s={[0.4, 0.15, 0.4]} r={[0, 0, Math.PI / 2]} />
          <Cy c="#999" p={[0, 0.6, 2]} s={[0.06, 0.6, 0.06]} />
        </group>
      );
    }
    case 'helicoptero':
      return (
        <group>
          <Sp c={color} p={[0, 1.3, 0.6]} s={[2, 1.8, 2.6]} />
          <Sp c={GLASS} o={0.7} p={[0, 1.5, 1.3]} s={[1.6, 1.2, 1.4]} />
          <Cy c={color} p={[0, 1.5, -1.8]} s={[0.4, 3.2, 0.4]} r={[Math.PI / 2, 0, 0]} />
          <Bx c={color2} p={[0, 1.9, -3.3]} s={[0.1, 1, 0.6]} />
          <Prop p={[0, 2.35, 0.5]} size={6} axis="y" speed={sp} />
          <Prop p={[0.15, 1.9, -3.3]} size={1} axis="z" speed={sp} />
          {[-0.8, 0.8].map((x) => <Bx key={x} c="#4a4e57" p={[x, 0.1, 0.5]} s={[0.1, 0.1, 2.6]} />)}
        </group>
      );
  }
  return <Bx c={color} p={[0, 0.8, 0]} s={[2, 1.2, 4]} />;
}

export const VehicleModel = memo(Model);
