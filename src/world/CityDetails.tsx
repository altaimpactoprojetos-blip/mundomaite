import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROADS } from '../data/world';
import { mat } from '../systems/materials';
import { signTexture } from '../systems/textures';
import { Bx, Cy } from '../game/prims';
import { useNear } from '../game/hooks';
import { isFree } from './Nature';

const XS = [-260, -130, 0, 130];
const ZS = [-170, -60, 50, 160];
const roadW = (axis: 'x' | 'z', v: number) => ROADS.find((r) => (axis === 'x' ? r.x1 === r.x2 && r.x1 === v : r.z1 === r.z2 && r.z1 === v))?.w ?? 10;
const NAMES_X: Record<number, string> = { [-260]: 'Av. das Hortênsias', [-130]: 'Av. Arco-Íris', 0: 'Av. Central', 130: 'Av. dos Sonhos' };
const NAMES_Z: Record<number, string> = { [-170]: 'Rua das Estrelas', [-60]: 'Rua das Margaridas', 50: 'Rua dos Girassóis', 160: 'Rua da Praia' };

function Instanced({ items, geo, material }: { items: { x: number; y: number; z: number; sx: number; sz: number; r: number; c?: string }[]; geo: THREE.BufferGeometry; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(-Math.PI / 2, 0, it.r);
      o.scale.set(it.sx, it.sz, 1);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      if (it.c) ref.current.setColorAt(i, col.set(it.c));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, material, items.length]} frustumCulled={false} raycast={() => null} />;
}

const plane = new THREE.PlaneGeometry(1, 1);
const circle = new THREE.CircleGeometry(0.5, 14);

export function CityDetails() {
  // faixas de pedestre (zebradas) em todos os cruzamentos
  const zebra = useMemo(() => {
    const out: { x: number; y: number; z: number; sx: number; sz: number; r: number }[] = [];
    for (const X of XS) for (const Z of ZS) {
      const wx = roadW('x', X), wz = roadW('z', Z);
      for (const sd of [-1, 1]) {
        // atravessando a avenida N-S (faixa ao norte/sul do cruzamento)
        for (let k = -wx / 2 + 0.6; k <= wx / 2 - 0.4; k += 1.2) out.push({ x: X + k, y: 0.035, z: Z + sd * (wz / 2 + 1.8), sx: 0.6, sz: 2.6, r: 0 });
        for (let k = -wz / 2 + 0.6; k <= wz / 2 - 0.4; k += 1.2) out.push({ x: X + sd * (wx / 2 + 1.8), y: 0.035, z: Z + k, sx: 2.6, sz: 0.6, r: 0 });
      }
    }
    return out;
  }, []);
  // ciclovias (faixa verde na borda das avenidas do centro e bairro)
  const bikes = useMemo(() => {
    const out: { x: number; y: number; z: number; sx: number; sz: number; r: number }[] = [];
    for (const r of ROADS) {
      const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
      if (len < 60) continue;
      const rot = Math.atan2(r.x2 - r.x1, r.z2 - r.z1);
      const nx = Math.cos(rot), nz = -Math.sin(rot);
      const off = r.w / 2 - 0.75;
      for (const sd of [-1, 1]) out.push({ x: (r.x1 + r.x2) / 2 + nx * off * sd, y: 0.03, z: (r.z1 + r.z2) / 2 + nz * off * sd, sx: 1.3, sz: len, r: rot });
    }
    return out;
  }, []);
  // manchas de grama em tons diferentes + canteiros de flores
  const patches = useMemo(() => {
    const out: { x: number; y: number; z: number; sx: number; sz: number; r: number; c: string }[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const tones = ['#5fb043', '#7fd35e', '#8ad86a', '#58a83d', '#9be07a', '#6ccf55'];
    for (let i = 0; i < 520; i++) {
      const x = -390 + rnd() * 780, z = -390 + rnd() * 555;
      if (!isFree(x, z, 1)) continue;
      const s = 4 + rnd() * 14;
      out.push({ x, y: 0.004 + (i % 3) * 0.001, z, sx: s, sz: s * (0.6 + rnd() * 0.6), r: rnd() * 6, c: tones[i % tones.length] });
    }
    return out;
  }, []);
  const flowers = useMemo(() => {
    const out: { x: number; y: number; z: number; sx: number; sz: number; r: number; c: string }[] = [];
    let seed = 99;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const cols = ['#ff5fa2', '#ffd23f', '#ffffff', '#c77dff', '#ff7b54', '#5ab0ff'];
    for (let i = 0; i < 900; i++) {
      const x = -390 + rnd() * 780, z = -390 + rnd() * 555;
      if (!isFree(x, z, 1)) continue;
      out.push({ x, y: 0.03, z, sx: 0.35, sz: 0.35, r: 0, c: cols[i % cols.length] });
    }
    return out;
  }, []);
  return (
    <group>
      <Instanced items={zebra} geo={plane} material={mat('#ffffff', { emissive: 0.15 })} />
      <Instanced items={bikes} geo={plane} material={mat('#3a9d6a')} />
      <Instanced items={patches} geo={circle} material={mat('#ffffff', { tex: 'grama', repeat: 2 })} />
      <Instanced items={flowers} geo={circle} material={mat('#ffffff', { emissive: 0.2 })} />
      <StreetSigns />
    </group>
  );
}

function SignPost({ x, z, a, b }: { x: number; z: number; a: string; b: string }) {
  const ta = useMemo(() => signTexture(a, '#2f6fdf', '#ffffff', '🛣️'), [a]);
  const tb = useMemo(() => signTexture(b, '#1f9e63', '#ffffff', '🛣️'), [b]);
  const near = useNear(x, z, 70);
  if (!near) return null;
  return (
    <group position={[x, 0, z]}>
      <Cy c="#4a4e57" p={[0, 1.6, 0]} s={[0.12, 3.2, 0.12]} low />
      {[0, Math.PI].map((r) => <mesh key={r} position={[0, 3.0, 0]} rotation={[0, r, 0]}><planeGeometry args={[2.6, 0.55]} /><meshBasicMaterial map={ta} transparent /></mesh>)}
      {[Math.PI / 2, -Math.PI / 2].map((r) => <mesh key={r} position={[0, 2.4, 0]} rotation={[0, r, 0]}><planeGeometry args={[2.6, 0.55]} /><meshBasicMaterial map={tb} transparent /></mesh>)}
      {/* poste de luz da esquina */}
      <Cy c="#4a4e57" p={[0.6, 2.4, 0.6]} s={[0.12, 4.8, 0.12]} low />
      <Bx c="#fff3a6" e={1} p={[0.6, 4.85, 0.6]} s={[0.4, 0.2, 0.4]} />
    </group>
  );
}

function StreetSigns() {
  const list = useMemo(() => {
    const out: { x: number; z: number; a: string; b: string }[] = [];
    for (const X of XS) for (const Z of ZS) {
      const ox = roadW('x', X) / 2 + 2.6, oz = roadW('z', Z) / 2 + 2.6;
      out.push({ x: X + ox, z: Z + oz, a: NAMES_Z[Z], b: NAMES_X[X] });
    }
    return out;
  }, []);
  return <>{list.map((s, i) => <SignPost key={i} {...s} />)}</>;
}

