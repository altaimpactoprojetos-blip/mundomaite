import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bx, Cy, Sp, Co, To } from './prims';
import { mat } from '../systems/materials';
import { signTexture } from '../systems/textures';
import type { TextureKind } from '../types';
import { getModel } from '../data/models';

interface FP { model: string; color?: string; texture?: TextureKind; label?: string; ghost?: boolean }

const WOOD = '#c8a27a';
const DARK = '#4a4e57';
const WHITE = '#ffffff';
const RAINBOW = ['#ff5f5f', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];

function Spin({ speed = 1, children, axis = 'y' }: { speed?: number; children: React.ReactNode; axis?: 'y' | 'z' }) {
  const r = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { r.current.rotation[axis] += dt * speed; });
  return <group ref={r}>{children}</group>;
}
function Bob({ amp = 0.15, speed = 1.5, children }: { amp?: number; speed?: number; children: React.ReactNode }) {
  const r = useRef<THREE.Group>(null!);
  const off = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => { r.current.position.y = Math.sin(clock.elapsedTime * speed + off) * amp; });
  return <group ref={r}>{children}</group>;
}
function Water({ w, d, y }: { w: number; d: number; y: number }) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4fc3f7', transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0.1 }), []);
  useFrame(({ clock }) => { m.color.setHSL(0.54, 0.85, 0.6 + Math.sin(clock.elapsedTime * 2) * 0.03); });
  return <mesh material={m} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w, d]} /></mesh>;
}
function Sign({ text, w, h, bg, fg }: { text: string; w: number; h: number; bg: string; fg: string }) {
  const t = useMemo(() => signTexture(text, bg, fg), [text, bg, fg]);
  return <mesh position={[0, 0, 0.08]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={t} transparent /></mesh>;
}

function Model({ model, color, texture, label }: FP) {
  const def = getModel(model);
  const c = color ?? def.color;
  const tex = texture && texture !== 'liso' ? texture : undefined;
  const [W, H, D] = def.size;
  const m = mat(c, { tex, repeat: Math.max(1, Math.round(Math.max(W, D) / 2)) });
  const M = { m, c };
  switch (model) {
    // ---------------- construção ----------------
    case 'parede': case 'meia-parede':
      return <Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} />;
    case 'vidro':
      return <group><Bx c={c} o={0.35} p={[0, H / 2, 0]} s={[W, H, D]} /><Bx c={WHITE} p={[0, H - 0.05, 0]} s={[W, 0.1, D + 0.05]} /><Bx c={WHITE} p={[0, 0.05, 0]} s={[W, 0.1, D + 0.05]} /></group>;
    case 'parede-janela':
      return (
        <group>
          <Bx {...M} p={[0, 0.5, 0]} s={[W, 1, D]} /><Bx {...M} p={[0, H - 0.4, 0]} s={[W, 0.8, D]} />
          <Bx {...M} p={[-1.5, 1.6, 0]} s={[1, 1.2, D]} /><Bx {...M} p={[1.5, 1.6, 0]} s={[1, 1.2, D]} />
          <Bx c="#c7e5ff" o={0.45} p={[0, 1.6, 0]} s={[2, 1.2, 0.05]} />
          <Bx c={WHITE} p={[0, 1.6, 0]} s={[0.08, 1.2, D + 0.04]} />
        </group>
      );
    case 'parede-porta':
      return (
        <group>
          <Bx {...M} p={[-1.35, H / 2, 0]} s={[1.3, H, D]} /><Bx {...M} p={[1.35, H / 2, 0]} s={[1.3, H, D]} />
          <Bx {...M} p={[0, H - 0.3, 0]} s={[1.4, 0.6, D]} />
          <Bx c={WHITE} p={[0, H - 0.62, 0]} s={[1.5, 0.08, D + 0.06]} />
        </group>
      );
    case 'piso': case 'plataforma': case 'bloco':
      return <Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} />;
    case 'telhado':
      return <mesh position={[0, H / 2, 0]} scale={[W * 0.71, H, D]} rotation={[0, 0, 0]} material={m}><cylinderGeometry args={[0, 1, 1, 4, 1, false, Math.PI / 4]} /></mesh>;
    case 'escada':
      return <group>{Array.from({ length: 9 }).map((_, i) => <Bx key={i} {...M} p={[0, (i + 0.5) * (H / 9) / 2 + 0.01, -D / 2 + (i + 0.5) * (D / 9)]} s={[W, (i + 0.5) * (H / 9), D / 9]} />)}<Bx c={WHITE} p={[W / 2, H / 2 + 0.5, 0]} s={[0.08, 0.08, D * 1.1]} r={[Math.atan2(H, D), 0, 0]} /></group>;
    case 'rampa':
      return <Bx {...M} p={[0, H / 2, 0]} s={[W, 0.12, Math.hypot(D, H)]} r={[-Math.atan2(H, D), 0, 0]} />;
    case 'coluna':
      return <group><Cy {...M} p={[0, H / 2, 0]} s={[0.45, H, 0.45]} /><Bx c={c} p={[0, 0.1, 0]} s={[0.6, 0.2, 0.6]} /><Bx c={c} p={[0, H - 0.1, 0]} s={[0.6, 0.2, 0.6]} /></group>;
    case 'cerca':
      return <group>{[-1.3, -0.65, 0, 0.65, 1.3].map((x) => <Bx key={x} {...M} p={[x, 0.5, 0]} s={[0.14, 1, 0.08]} />)}<Bx {...M} p={[0, 0.7, 0]} s={[W, 0.1, 0.06]} /><Bx {...M} p={[0, 0.35, 0]} s={[W, 0.1, 0.06]} /></group>;
    case 'arco':
      return <group><Bx {...M} p={[-1.7, 1.5, 0]} s={[0.6, 3, D]} /><Bx {...M} p={[1.7, 1.5, 0]} s={[0.6, 3, D]} /><mesh material={m} position={[0, 2.6, 0]}><torusGeometry args={[1.7, 0.3, 8, 20, Math.PI]} /></mesh></group>;

    // ---------------- móveis ----------------
    case 'sofa':
      return <group><Bx {...M} p={[0, 0.25, 0.05]} s={[W, 0.5, D - 0.1]} /><Bx {...M} p={[0, 0.7, -0.38]} s={[W, 0.7, 0.24]} />{[-1, 1].map((s) => <Bx key={s} {...M} p={[s * (W / 2 - 0.12), 0.55, 0.05]} s={[0.24, 0.5, D - 0.1]} />)}<Bx c={WHITE} p={[-0.5, 0.55, 0.05]} s={[0.8, 0.12, 0.6]} /><Bx c={WHITE} p={[0.5, 0.55, 0.05]} s={[0.8, 0.12, 0.6]} /></group>;
    case 'poltrona':
      return <group><Bx {...M} p={[0, 0.25, 0]} s={[W, 0.5, D]} /><Bx {...M} p={[0, 0.7, -0.38]} s={[W, 0.7, 0.22]} />{[-1, 1].map((s) => <Bx key={s} {...M} p={[s * 0.45, 0.55, 0]} s={[0.2, 0.4, D]} />)}</group>;
    case 'cama': case 'cama-casal':
      return <group><Bx c={WOOD} p={[0, 0.2, 0]} s={[W, 0.4, D]} /><Bx c={WHITE} p={[0, 0.5, 0.05]} s={[W - 0.1, 0.22, D - 0.2]} /><Bx {...M} p={[0, 0.63, 0.35]} s={[W - 0.05, 0.06, D * 0.6]} /><Bx c={WOOD} p={[0, 0.6, -D / 2 + 0.05]} s={[W, 1.2, 0.1]} /><Bx c="#fff" p={[0, 0.66, -D / 2 + 0.4]} s={[W * 0.7, 0.14, 0.4]} /></group>;
    case 'cama-princesa':
      return <group><Bx c={WHITE} p={[0, 0.25, 0]} s={[W, 0.5, D]} /><Bx {...M} p={[0, 0.6, 0.1]} s={[W - 0.1, 0.2, D - 0.3]} />{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Cy key={`${x}${z}`} c="#ffd23f" p={[x * (W / 2 - 0.08), 1.3, z * (D / 2 - 0.08)]} s={[0.1, 2.6, 0.1]} />)}<Co c={c} o={0.6} p={[0, 2.3, 0]} s={[W * 1.3, 0.8, D * 1.2]} /><Sp c="#ffd23f" e={0.6} p={[0, 2.8, 0]} s={[0.2, 0.2, 0.2]} /></group>;
    case 'beliche':
      return <group>{[0.35, 1.45].map((y) => <group key={y}><Bx c={WHITE} p={[0, y, 0]} s={[W - 0.1, 0.25, D - 0.1]} /><Bx {...M} p={[0, y + 0.15, 0.3]} s={[W - 0.12, 0.06, D * 0.6]} /></group>)}{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Bx key={`${x}${z}`} c={WOOD} p={[x * (W / 2 - 0.05), H / 2, z * (D / 2 - 0.05)]} s={[0.1, H, 0.1]} />)}</group>;
    case 'mesa':
      return <group><Bx {...M} p={[0, H - 0.05, 0]} s={[W, 0.1, D]} />{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Bx key={`${x}${z}`} {...M} p={[x * (W / 2 - 0.1), (H - 0.1) / 2, z * (D / 2 - 0.1)]} s={[0.1, H - 0.1, 0.1]} />)}</group>;
    case 'mesa-redonda':
      return <group><Cy {...M} p={[0, H - 0.04, 0]} s={[W, 0.08, D]} /><Cy c={c} p={[0, H / 2, 0]} s={[0.12, H, 0.12]} /><Cy c={c} p={[0, 0.03, 0]} s={[0.6, 0.06, 0.6]} /></group>;
    case 'cadeira':
      return <group><Bx {...M} p={[0, 0.48, 0]} s={[W, 0.08, D]} /><Bx {...M} p={[0, 0.8, -D / 2 + 0.04]} s={[W, 0.6, 0.08]} />{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Bx key={`${x}${z}`} {...M} p={[x * (W / 2 - 0.05), 0.22, z * (D / 2 - 0.05)]} s={[0.06, 0.45, 0.06]} />)}</group>;
    case 'banquinho':
      return <group><Cy {...M} p={[0, 0.56, 0]} s={[W, 0.08, D]} /><Cy c={DARK} p={[0, 0.27, 0]} s={[0.08, 0.54, 0.08]} /></group>;
    case 'estante':
      return <group><Bx {...M} p={[0, H / 2, 0]} s={[W, H, 0.08]} />{[0.05, 0.6, 1.15, 1.7, 2.15].map((y) => <Bx key={y} {...M} p={[0, y, 0.2]} s={[W, 0.06, D - 0.1]} />)}{[0.6, 1.15, 1.7].map((y, r) => Array.from({ length: 7 }).map((_, i) => <Bx key={`${r}${i}`} c={RAINBOW[(i + r) % 6]} p={[-0.7 + i * 0.22, y - 0.25, 0.2]} s={[0.16, 0.42 - (i % 3) * 0.05, 0.3]} />))}</group>;
    case 'guarda-roupa':
      return <group><Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} /><Bx c="#c7e5ff" o={0.5} p={[0.45, 1.3, D / 2 + 0.01]} s={[0.7, 1.4, 0.02]} />{[-0.1, 0.1].map((x) => <Bx key={x} c="#ffd23f" p={[x, 1.2, D / 2 + 0.03]} s={[0.05, 0.25, 0.04]} />)}<Bx c={DARK} p={[0, 0.02, 0]} s={[W, 0.04, D]} /></group>;
    case 'escrivaninha':
      return <group><Bx {...M} p={[0, H - 0.04, 0]} s={[W, 0.08, D]} /><Bx {...M} p={[-W / 2 + 0.25, (H - 0.08) / 2, 0]} s={[0.5, H - 0.08, D]} /><Bx c={c} p={[W / 2 - 0.05, (H - 0.08) / 2, 0]} s={[0.08, H - 0.08, D]} /><Cy c="#ffd23f" p={[0.4, H + 0.2, 0]} s={[0.05, 0.4, 0.05]} /></group>;
    case 'geladeira':
      return <group><Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} /><Bx c="#9aa0a6" p={[0, 1.35, D / 2]} s={[W, 0.03, 0.02]} /><Bx c="#9aa0a6" p={[0.32, 1.6, D / 2 + 0.03]} s={[0.05, 0.35, 0.05]} /><Bx c="#9aa0a6" p={[0.32, 0.9, D / 2 + 0.03]} s={[0.05, 0.5, 0.05]} /><Sp c="#ff5fa2" p={[-0.2, 1.65, D / 2 + 0.02]} s={[0.1, 0.1, 0.03]} /></group>;
    case 'fogao':
      return <group><Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} /><Bx c="#222" o={0.7} p={[0, 0.45, D / 2]} s={[W - 0.2, 0.45, 0.02]} />{[[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].map(([x, z]) => <Cy key={`${x}${z}`} c="#222" p={[x, H + 0.01, z]} s={[0.24, 0.02, 0.24]} />)}</group>;
    case 'pia':
      return <group><Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} /><Bx c="#c7e5ff" p={[0, H, 0]} s={[0.7, 0.04, 0.45]} /><Cy c="#9aa0a6" p={[0, H + 0.2, -0.25]} s={[0.05, 0.4, 0.05]} /></group>;
    case 'armario':
      return <group><Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} /><Bx c={WHITE} p={[0, H + 0.02, 0]} s={[W, 0.05, D]} />{[-0.45, 0.45].map((x) => <Bx key={x} c="#ffd23f" p={[x, 0.7, D / 2 + 0.02]} s={[0.2, 0.04, 0.04]} />)}</group>;
    case 'banheira':
      return <group><Bx {...M} p={[0, 0.35, 0]} s={[W, 0.7, D]} /><Bx c="#81d4fa" o={0.8} p={[0, 0.6, 0]} s={[W - 0.2, 0.05, D - 0.2]} />{[-0.3, 0, 0.3].map((x) => <Sp key={x} c={WHITE} p={[x, 0.68, 0.1]} s={[0.25, 0.15, 0.25]} />)}</group>;
    case 'tv':
      return <group><Bx c={WOOD} p={[0, 0.25, 0]} s={[W, 0.5, D]} /><Bx c="#222831" p={[0, 0.95, 0]} s={[W - 0.1, 0.8, 0.08]} /><Bx c="#5ad1ff" e={0.6} p={[0, 0.95, 0.05]} s={[W - 0.25, 0.68, 0.01]} /></group>;
    case 'computador':
      return <group><Bx c={c} p={[0, 0.75, 0]} s={[W, 0.06, D]} />{[-0.5, 0.5].map((x) => <Bx key={x} c={c} p={[x, 0.36, 0]} s={[0.06, 0.72, D]} />)}<Bx c="#222" p={[0, 1.05, -0.1]} s={[0.6, 0.4, 0.04]} /><Bx c="#9d4edd" e={0.6} p={[0, 1.05, -0.07]} s={[0.54, 0.34, 0.01]} /></group>;
    case 'piano':
      return <group><Bx {...M} p={[0, 0.75, -0.15]} s={[W, 1.3, 0.5]} /><Bx c={WHITE} p={[0, 0.8, 0.2]} s={[W - 0.1, 0.06, 0.3]} />{Array.from({ length: 10 }).map((_, i) => <Bx key={i} c="#111" p={[-0.7 + i * 0.16, 0.84, 0.15]} s={[0.06, 0.04, 0.18]} />)}{[-0.8, 0.8].map((x) => <Bx key={x} c={c} p={[x, 0.4, 0.2]} s={[0.1, 0.8, 0.1]} />)}</group>;
    case 'abajur':
      return <group><Cy c={WOOD} p={[0, 0.05, 0]} s={[0.3, 0.1, 0.3]} /><Cy c={WOOD} p={[0, 0.6, 0]} s={[0.05, 1.1, 0.05]} /><Co c={c} e={0.5} p={[0, 1.25, 0]} s={[0.5, 0.4, 0.5]} /></group>;
    case 'tapete':
      return <Bx {...M} p={[0, 0.015, 0]} s={[W, 0.03, D]} />;
    case 'tapete-redondo':
      return <Cy {...M} p={[0, 0.015, 0]} s={[W, 0.03, D]} />;
    case 'espelho':
      return <group><Bx c="#ffd23f" p={[0, 1.1, 0]} s={[W, 1.8, 0.1]} /><Bx c="#e0f4ff" e={0.3} p={[0, 1.1, 0.06]} s={[W - 0.15, 1.65, 0.01]} /><Bx c="#ffd23f" p={[0, 0.1, 0]} s={[0.7, 0.2, 0.4]} /></group>;
    case 'penteadeira':
      return <group><Bx {...M} p={[0, 0.4, 0]} s={[W, 0.8, D]} /><Cy c="#c7e5ff" p={[0, 1.35, -0.2]} s={[0.9, 0.9, 0.05]} r={[Math.PI / 2, 0, 0]} /><To c="#ffd23f" p={[0, 1.35, -0.18]} s={[0.92, 0.92, 0.5]} /></group>;
    case 'bau':
      return <group><Bx {...M} p={[0, 0.3, 0]} s={[W, 0.6, D]} /><Cy c={c} p={[0, 0.6, 0]} s={[D, W, D]} r={[0, 0, Math.PI / 2]} /><Bx c="#ffd23f" p={[0, 0.5, D / 2]} s={[0.15, 0.2, 0.04]} /></group>;

    // ---------------- decoração ----------------
    case 'quadro':
      return <group position={[0, 1.6, 0]}><Bx c="#ffd23f" s={[W, H, D]} /><Bx {...M} p={[0, 0, 0.04]} s={[W - 0.15, H - 0.15, 0.01]} /><Sp c="#ffe066" p={[0.3, 0.15, 0.05]} s={[0.2, 0.2, 0.01]} /><Co c="#3ccf91" p={[-0.2, -0.15, 0.05]} s={[0.6, 0.4, 0.01]} /></group>;
    case 'vaso-flor':
      return <group><Cy c={WHITE} p={[0, 0.2, 0]} s={[0.35, 0.4, 0.35]} />{[0, 1, 2, 3, 4].map((i) => <group key={i}><Cy c="#3ccf91" p={[Math.cos(i) * 0.08, 0.55, Math.sin(i) * 0.08]} s={[0.02, 0.35, 0.02]} /><Sp c={i % 2 ? c : '#ffe066'} p={[Math.cos(i) * 0.1, 0.75, Math.sin(i) * 0.1]} s={[0.14, 0.14, 0.14]} /></group>)}</group>;
    case 'planta':
      return <group><Cy c="#c8603a" p={[0, 0.25, 0]} s={[0.5, 0.5, 0.5]} />{[0, 1, 2, 3, 4, 5].map((i) => <Sp key={i} {...M} p={[Math.cos(i) * 0.2, 0.8 + (i % 3) * 0.25, Math.sin(i) * 0.2]} s={[0.4, 0.5, 0.4]} />)}</group>;
    case 'relogio':
      return <group position={[0, 1.8, 0]}><Cy {...M} s={[W, 0.08, W]} r={[Math.PI / 2, 0, 0]} /><Cy c={WHITE} p={[0, 0, 0.05]} s={[W - 0.1, 0.02, W - 0.1]} r={[Math.PI / 2, 0, 0]} /><Spin speed={-0.5} axis="z"><Bx c="#222" p={[0, 0.12, 0.07]} s={[0.03, 0.25, 0.01]} /></Spin></group>;
    case 'aquario':
      return <group><Bx c={WOOD} p={[0, 0.35, 0]} s={[W, 0.7, D]} /><Bx c="#81d4fa" o={0.5} p={[0, 1.05, 0]} s={[W - 0.1, 0.7, D - 0.1]} /><Bob amp={0.08}><Sp c="#ff7b54" p={[0.2, 1.05, 0]} s={[0.18, 0.1, 0.06]} /><Sp c="#ffd23f" p={[-0.3, 0.95, 0.1]} s={[0.14, 0.08, 0.05]} /></Bob></group>;
    case 'globo':
      return <group><Cy c={WOOD} p={[0, 0.2, 0]} s={[0.3, 0.4, 0.3]} /><Spin speed={0.5}><Sp c="#5ab0ff" p={[0, 0.7, 0]} s={[0.5, 0.5, 0.5]} /><Sp c="#3ccf91" p={[0.1, 0.78, 0.15]} s={[0.2, 0.2, 0.2]} /></Spin></group>;
    case 'trofeu':
      return <group><Bx c={DARK} p={[0, 0.1, 0]} s={[0.3, 0.2, 0.3]} /><Cy c={c} p={[0, 0.3, 0]} s={[0.08, 0.2, 0.08]} /><Co c={c} e={0.3} p={[0, 0.6, 0]} s={[0.4, 0.4, 0.4]} r={[Math.PI, 0, 0]} /></group>;
    case 'luzinhas':
      return <group position={[0, 2.4, 0]}>{Array.from({ length: 10 }).map((_, i) => <Sp key={i} c={RAINBOW[i % 6]} e={1} p={[-1.8 + i * 0.4, -Math.sin((i / 9) * Math.PI) * 0.3, 0]} s={[0.12, 0.16, 0.12]} />)}</group>;
    case 'baloes':
      return <Bob amp={0.1}>{[0, 1, 2, 3, 4].map((i) => <group key={i}><Cy c={WHITE} p={[Math.cos(i * 1.3) * 0.15, 0.9, Math.sin(i * 1.3) * 0.15]} s={[0.01, 1.8, 0.01]} /><Sp c={i === 0 ? c : RAINBOW[i]} p={[Math.cos(i * 1.3) * 0.3, 2 + (i % 2) * 0.3, Math.sin(i * 1.3) * 0.3]} s={[0.45, 0.55, 0.45]} /></group>)}</Bob>;
    case 'letreiro':
      return <group position={[0, 1.5, 0]}><Bx c={c} s={[W, H, D]} /><Sign text={label || 'Minha Loja'} w={W - 0.1} h={H - 0.1} bg={c} fg="#e83e8c" /></group>;
    case 'neon':
      return <group position={[0, 1.8, 0]}>{[-1, 1].map((s) => <Sp key={s} c={c} e={1.5} p={[s * 0.25, 0.15, 0]} s={[0.6, 0.6, 0.08]} />)}<Co c={c} e={1.5} p={[0, -0.2, 0]} s={[1.05, 0.7, 0.08]} r={[0, 0, Math.PI]} /></group>;
    case 'ursao':
      return <group><Sp {...M} p={[0, 0.6, 0]} s={[1.2, 1.1, 1]} /><Sp {...M} p={[0, 1.4, 0]} s={[0.8, 0.75, 0.75]} />{[-1, 1].map((s) => <group key={s}><Sp {...M} p={[s * 0.3, 1.75, 0]} s={[0.25, 0.25, 0.2]} /><Sp {...M} p={[s * 0.55, 0.8, 0.2]} s={[0.3, 0.5, 0.3]} /><Sp {...M} p={[s * 0.35, 0.15, 0.35]} s={[0.35, 0.3, 0.4]} /><Sp c="#222" p={[s * 0.13, 1.48, 0.35]} s={[0.07, 0.07, 0.05]} /></group>)}<Sp c="#fdf6ec" p={[0, 1.33, 0.32]} s={[0.3, 0.22, 0.2]} /><Bx c="#ff5fa2" p={[0, 1.05, 0.33]} s={[0.4, 0.15, 0.05]} /></group>;

    // ---------------- jardim ----------------
    case 'arvore': case 'arvore-flor':
      return <group><Cy c="#8d5b3a" p={[0, 1.2, 0]} s={[0.4, 2.4, 0.4]} low /><Sp {...M} low p={[0, 3.2, 0]} s={[2.8, 2.4, 2.8]} /><Sp {...M} low p={[0.6, 3.9, 0.3]} s={[1.6, 1.4, 1.6]} /></group>;
    case 'palmeira':
      return <group><Cy c="#a8673a" p={[0, 2.6, 0]} s={[0.35, 5.2, 0.35]} low r={[0, 0, 0.08]} />{[0, 1, 2, 3, 4, 5].map((i) => <Bx key={i} {...M} p={[Math.cos(i * 1.05) * 1, 5.2, Math.sin(i * 1.05) * 1]} s={[2.2, 0.08, 0.6]} r={[0, -i * 1.05, -0.35]} />)}<Sp c="#8d5b3a" p={[0.1, 5.1, 0]} s={[0.4, 0.4, 0.4]} /></group>;
    case 'pinheiro':
      return <group><Cy c="#8d5b3a" p={[0, 0.8, 0]} s={[0.35, 1.6, 0.35]} low />{[0, 1, 2].map((i) => <Co key={i} {...M} low p={[0, 2 + i * 1.2, 0]} s={[2.4 - i * 0.6, 2, 2.4 - i * 0.6]} />)}</group>;
    case 'arbusto':
      return <group><Sp {...M} low p={[0, 0.5, 0]} s={[1.5, 1, 1.4]} /><Sp c="#ff8fc7" p={[0.4, 0.8, 0.4]} s={[0.15, 0.15, 0.15]} /><Sp c="#ffe066" p={[-0.3, 0.9, 0.3]} s={[0.15, 0.15, 0.15]} /></group>;
    case 'flores':
      return <group>{Array.from({ length: 7 }).map((_, i) => { const a = i * 0.9, r = (i % 3) * 0.2; return <group key={i}><Cy c="#3ccf91" p={[Math.cos(a) * r, 0.18, Math.sin(a) * r]} s={[0.03, 0.36, 0.03]} /><Sp c={i % 2 ? c : RAINBOW[i % 6]} p={[Math.cos(a) * r, 0.4, Math.sin(a) * r]} s={[0.16, 0.12, 0.16]} /></group>; })}</group>;
    case 'canteiro':
      return <group><Bx c={WOOD} p={[0, 0.2, 0]} s={[W, 0.4, D]} /><Bx c="#6b4423" p={[0, 0.41, 0]} s={[W - 0.15, 0.02, D - 0.15]} />{Array.from({ length: 8 }).map((_, i) => <Sp key={i} c={i % 2 ? c : '#ff8fc7'} p={[-1.25 + i * 0.36, 0.55, (i % 2) * 0.2 - 0.1]} s={[0.2, 0.18, 0.2]} />)}</group>;
    case 'fonte':
      return <group><Cy c={c} p={[0, 0.3, 0]} s={[W, 0.6, D]} /><Water w={W * 0.7} d={D * 0.7} y={0.58} /><Cy c={c} p={[0, 1, 0]} s={[0.3, 1.4, 0.3]} /><Cy c={c} p={[0, 1.6, 0]} s={[1.2, 0.15, 1.2]} /><Bob amp={0.1} speed={4}><Sp c="#81d4fa" o={0.6} p={[0, 2, 0]} s={[0.5, 0.6, 0.5]} /></Bob></group>;
    case 'banco':
      return <group><Bx {...M} p={[0, 0.45, 0]} s={[W, 0.08, 0.5]} /><Bx {...M} p={[0, 0.75, -0.25]} s={[W, 0.4, 0.06]} />{[-0.8, 0.8].map((x) => <Bx key={x} c={DARK} p={[x, 0.22, 0]} s={[0.08, 0.45, 0.5]} />)}</group>;
    case 'poste':
      return <group><Cy c={c} p={[0, 2, 0]} s={[0.15, 4, 0.15]} low /><Sp c="#fff3a6" e={1.2} p={[0, 4.1, 0]} s={[0.5, 0.5, 0.5]} /></group>;
    case 'mesa-piquenique':
      return <group><Bx {...M} p={[0, 0.78, 0]} s={[W, 0.08, 0.9]} />{[-0.75, 0.75].map((z) => <Bx key={z} {...M} p={[0, 0.45, z]} s={[W, 0.06, 0.35]} />)}{[-0.8, 0.8].map((x) => <Bx key={x} {...M} p={[x, 0.4, 0]} s={[0.08, 0.8, 1.6]} />)}<Bx c="#ff5f5f" tex="xadrez" p={[0, 0.83, 0]} s={[1.4, 0.01, 0.8]} /></group>;
    case 'guarda-sol':
      return <group><Cy c={WHITE} p={[0, 1.3, 0]} s={[0.06, 2.6, 0.06]} /><Co {...M} p={[0, 2.5, 0]} s={[W, 0.6, W]} /></group>;
    case 'cogumelo':
      return <group><Cy c="#fdf6ec" p={[0, 0.6, 0]} s={[0.5, 1.2, 0.5]} /><Sp {...M} p={[0, 1.4, 0]} s={[W, 1, W]} />{[0, 1, 2, 3].map((i) => <Sp key={i} c={WHITE} p={[Math.cos(i * 1.6) * 0.5, 1.7, Math.sin(i * 1.6) * 0.5]} s={[0.2, 0.1, 0.2]} />)}</group>;
    case 'pedra':
      return <Sp {...M} low p={[0, 0.4, 0]} s={[W, H, D]} />;
    case 'casinha-passaro':
      return <group><Cy c={WOOD} p={[0, 0.7, 0]} s={[0.08, 1.4, 0.08]} /><Bx {...M} p={[0, 1.6, 0]} s={[0.5, 0.45, 0.5]} /><Co c="#e63946" p={[0, 2, 0]} s={[0.7, 0.35, 0.7]} r={[0, Math.PI / 4, 0]} /><Cy c="#222" p={[0, 1.6, 0.26]} s={[0.15, 0.02, 0.15]} r={[Math.PI / 2, 0, 0]} /></group>;
    case 'horta':
      return <group><Bx {...M} p={[0, 0.15, 0]} s={[W, 0.3, D]} />{[-0.6, 0, 0.6].map((x) => [-0.6, 0, 0.6].map((z) => <Co key={`${x}${z}`} c="#3ccf91" p={[x, 0.45, z]} s={[0.25, 0.3, 0.25]} />))}</group>;

    // ---------------- parque ----------------
    case 'balanco':
      return <group>{[-1.4, 1.4].map((x) => <group key={x}><Bx c={DARK} p={[x, 1.3, -0.5]} s={[0.1, 2.7, 0.1]} r={[0.35, 0, 0]} /><Bx c={DARK} p={[x, 1.3, 0.5]} s={[0.1, 2.7, 0.1]} r={[-0.35, 0, 0]} /></group>)}<Bx c={DARK} p={[0, 2.55, 0]} s={[3, 0.1, 0.1]} />{[-0.6, 0.6].map((x) => <group key={x}><Bx {...M} p={[x, 0.55, 0]} s={[0.6, 0.06, 0.35]} /><Bx c="#ccc" p={[x - 0.25, 1.55, 0]} s={[0.02, 2, 0.02]} /><Bx c="#ccc" p={[x + 0.25, 1.55, 0]} s={[0.02, 2, 0.02]} /></group>)}</group>;
    case 'escorregador':
      return <group><Bx c={DARK} p={[0, 1.1, -1.6]} s={[1, 2.2, 0.8]} o={0.4} /><Bx c="#ffd23f" p={[0, 2.2, -1.6]} s={[1.2, 0.1, 0.8]} /><Bx {...M} p={[0, 1.1, 0.3]} s={[0.9, 0.08, 3.4]} r={[0.68, 0, 0]} />{[-0.5, 0.5].map((x) => <Bx key={x} {...M} p={[x, 1.2, 0.3]} s={[0.06, 0.25, 3.4]} r={[0.68, 0, 0]} />)}</group>;
    case 'gangorra':
      return <group><Bx c={DARK} p={[0, 0.3, 0]} s={[0.3, 0.6, 0.4]} /><Bx {...M} p={[0, 0.62, 0]} s={[W, 0.1, 0.35]} r={[0, 0, 0.15]} /></group>;
    case 'cama-elastica':
      return <group><Cy c={DARK} p={[0, 0.35, 0]} s={[W, 0.7, D]} /><Cy c="#222831" p={[0, 0.71, 0]} s={[W - 0.3, 0.02, D - 0.3]} /><To {...M} p={[0, 0.72, 0]} s={[W * 1.0, W * 1.0, 1]} r={[Math.PI / 2, 0, 0]} /></group>;
    case 'castelo-inflavel':
      return <group><Bx {...M} p={[0, 0.4, 0]} s={[W, 0.8, D]} />{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <group key={`${x}${z}`}><Cy c="#ffd23f" p={[x * 1.7, 1.7, z * 1.7]} s={[0.7, 2.6, 0.7]} /><Co c="#5ab0ff" p={[x * 1.7, 3.2, z * 1.7]} s={[0.9, 0.6, 0.9]} /></group>)}<Bx c="#5ab0ff" o={0.5} p={[0, 1.5, -1.8]} s={[3, 1.4, 0.2]} /></group>;
    case 'caixa-areia':
      return <group><Bx c={WOOD} p={[0, 0.2, 0]} s={[W, 0.4, D]} /><Bx {...M} p={[0, 0.3, 0]} s={[W - 0.3, 0.2, D - 0.3]} /><Co c="#e63946" p={[0.6, 0.55, 0.5]} s={[0.3, 0.3, 0.3]} /></group>;
    case 'piscina':
      return <group><Bx c={WHITE} tex="azulejo" p={[-W / 2 - 0.2, 0.12, 0]} s={[0.4, 0.24, D + 0.8]} /><Bx c={WHITE} tex="azulejo" p={[W / 2 + 0.2, 0.12, 0]} s={[0.4, 0.24, D + 0.8]} /><Bx c={WHITE} tex="azulejo" p={[0, 0.12, -D / 2 - 0.2]} s={[W, 0.24, 0.4]} /><Bx c={WHITE} tex="azulejo" p={[0, 0.12, D / 2 + 0.2]} s={[W, 0.24, 0.4]} /><Water w={W} d={D} y={0.06} /></group>;
    case 'piscina-bolinhas':
      return <group><Cy c={c} p={[0, 0.4, 0]} s={[W, 0.8, D]} />{Array.from({ length: 22 }).map((_, i) => <Sp key={i} low c={RAINBOW[i % 6]} p={[Math.cos(i * 2.4) * (0.3 + (i % 4) * 0.25), 0.82, Math.sin(i * 2.4) * (0.3 + (i % 4) * 0.25)]} s={[0.25, 0.25, 0.25]} />)}</group>;

    // ---------------- loja ----------------
    case 'balcao':
      return <group><Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} /><Bx c={WHITE} p={[0, H + 0.03, 0]} s={[W + 0.1, 0.06, D + 0.1]} /></group>;
    case 'prateleira':
      return <group><Bx {...M} p={[0, H / 2, -0.25]} s={[W, H, 0.08]} />{[0.3, 0.8, 1.3, 1.8].map((y, r) => <group key={y}><Bx {...M} p={[0, y, 0]} s={[W, 0.05, D]} />{Array.from({ length: 6 }).map((_, i) => <Bx key={i} c={RAINBOW[(i + r * 2) % 6]} p={[-1 + i * 0.4, y + 0.16, 0]} s={[0.28, 0.28, 0.3]} />)}</group>)}</group>;
    case 'caixa-registradora':
      return <group><Bx c={WOOD} p={[0, 0.45, 0]} s={[W, 0.9, D]} /><Bx {...M} p={[0, 1.05, 0]} s={[0.6, 0.3, 0.5]} r={[-0.3, 0, 0]} /><Bx c="#222" p={[0, 1.25, -0.15]} s={[0.4, 0.2, 0.05]} /></group>;
    case 'arara':
      return <group>{[-0.95, 0.95].map((x) => <Cy key={x} c={c} p={[x, 0.9, 0]} s={[0.05, 1.8, 0.05]} />)}<Cy c={c} p={[0, 1.75, 0]} s={[0.04, 1.9, 0.04]} r={[0, 0, Math.PI / 2]} />{RAINBOW.map((cc, i) => <Bx key={i} c={cc} p={[-0.75 + i * 0.3, 1.25, 0]} s={[0.22, 0.85, 0.4]} />)}</group>;
    case 'vitrine':
      return <group><Bx {...M} p={[0, 0.4, 0]} s={[W, 0.8, D]} /><Bx c="#e0f4ff" o={0.4} p={[0, 1, 0]} s={[W, 0.4, D]} />{[-0.6, 0, 0.6].map((x, i) => <group key={x}><Cy c="#fff3e0" p={[x, 0.9, 0]} s={[0.35, 0.2, 0.35]} /><Sp c={['#ff8fc7', '#8d5b3a', '#ffe066'][i]} p={[x, 1.05, 0]} s={[0.25, 0.12, 0.25]} /></group>)}</group>;
    case 'maquina-cafe':
      return <group><Bx {...M} p={[0, 0.8, 0]} s={[W, 1.6, D]} /><Bx c="#222" p={[0, 0.7, 0.31]} s={[0.4, 0.3, 0.02]} /><Cy c={WHITE} p={[0, 0.6, 0.2]} s={[0.15, 0.18, 0.15]} /><Sp c="#ff5f5f" e={1} p={[0.25, 1.3, 0.31]} s={[0.07, 0.07, 0.02]} /></group>;
    case 'toldo':
      return <group>{[-1.8, 1.8].map((x) => <Cy key={x} c={WHITE} p={[x, 1.4, 0.7]} s={[0.06, 2.8, 0.06]} />)}<Bx {...M} tex="listras" p={[0, 2.85, 0]} s={[W, 0.08, D]} r={[0.25, 0, 0]} /></group>;
    case 'carrinho-pipoca': case 'carrinho-sorvete':
      return <group><Bx {...M} p={[0, 0.7, 0]} s={[W, 0.8, D]} />{[-0.5, 0.5].map((x) => <Cy key={x} c="#222" p={[x, 0.25, D / 2]} s={[0.4, 0.08, 0.4]} r={[Math.PI / 2, 0, 0]} />)}<Bx c="#fff3a6" o={0.5} p={[0, 1.4, 0]} s={[W - 0.2, 0.6, D - 0.2]} /><Co c={model === 'carrinho-pipoca' ? '#ffffff' : '#ff8fc7'} tex="listras" p={[0, 2, 0]} s={[1.6, 0.4, 1.4]} /></group>;
    case 'microfone':
      return <group><Bx {...M} p={[0, 0.25, 0]} s={[W, 0.5, D]} /><Cy c={DARK} p={[0, 1.1, 0.5]} s={[0.05, 1.2, 0.05]} /><Sp c="#9aa0a6" p={[0, 1.75, 0.5]} s={[0.15, 0.18, 0.15]} />{[-1.6, 1.6].map((x) => <Sp key={x} c="#ffe066" e={1} p={[x, 0.6, 1.3]} s={[0.25, 0.25, 0.25]} />)}</group>;
    case 'cavalete':
      return <group><Bx c={c} p={[-0.3, 0.9, 0]} s={[0.06, 1.8, 0.06]} r={[0.15, 0, 0.1]} /><Bx c={c} p={[0.3, 0.9, 0]} s={[0.06, 1.8, 0.06]} r={[0.15, 0, -0.1]} /><Bx c={WHITE} p={[0, 1.2, 0.08]} s={[0.8, 0.7, 0.03]} r={[-0.15, 0, 0]} /><Sp c="#ff5fa2" p={[-0.1, 1.25, 0.13]} s={[0.2, 0.2, 0.01]} /></group>;

    // ---------------- especiais ----------------
    case 'arco-iris':
      return <group>{RAINBOW.map((cc, i) => <mesh key={i} material={mat(cc, { emissive: 0.25 })} position={[0, 0, 0]}><torusGeometry args={[4 - i * 0.28, 0.14, 6, 30, Math.PI]} /></mesh>)}<Sp c={WHITE} p={[-3.3, 0.2, 0]} s={[1.6, 1, 1]} /><Sp c={WHITE} p={[3.3, 0.2, 0]} s={[1.6, 1, 1]} /></group>;
    case 'coracao':
      return <Bob><group position={[0, 1.3, 0]}>{[-1, 1].map((s) => <Sp key={s} {...M} p={[s * 0.5, 0.35, 0]} s={[1.2, 1.2, 0.7]} />)}<Co {...M} p={[0, -0.4, 0]} s={[2, 1.4, 0.7]} r={[0, 0, Math.PI]} /></group></Bob>;
    case 'estrela':
      return <Bob><Spin speed={0.6}><mesh material={mat(c, { emissive: 0.3 })} position={[0, 1.3, -0.3]}><extrudeGeometry args={[(() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.5 : 1.15; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return s; })(), { depth: 0.5, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 }]} /></mesh></Spin></Bob>;
    case 'nuvem':
      return <group>{[[-0.9, 0.6, 0, 1.4], [0, 0.8, 0, 1.6], [0.9, 0.6, 0, 1.3], [0, 0.5, 0.5, 1.2]].map(([x, y, z, s], i) => <Sp key={i} {...M} p={[x, y, z]} s={[s, s * 0.8, s]} />)}</group>;
    case 'bolo':
      return <group><Cy {...M} p={[0, 0.5, 0]} s={[2.4, 1, 2.4]} /><Cy c={WHITE} p={[0, 1.02, 0]} s={[2.45, 0.1, 2.45]} /><Cy c="#ff8fc7" p={[0, 1.5, 0]} s={[1.6, 0.9, 1.6]} /><Cy c={WHITE} p={[0, 1.96, 0]} s={[1.65, 0.08, 1.65]} />{[0, 1, 2, 3, 4].map((i) => <group key={i}><Cy c={RAINBOW[i]} p={[Math.cos(i * 1.256) * 0.4, 2.2, Math.sin(i * 1.256) * 0.4]} s={[0.08, 0.4, 0.08]} /><Sp c="#ffd23f" e={1.5} p={[Math.cos(i * 1.256) * 0.4, 2.45, Math.sin(i * 1.256) * 0.4]} s={[0.08, 0.12, 0.08]} /></group>)}<Sp c="#e63946" p={[0, 2.1, 0]} s={[0.3, 0.3, 0.3]} /></group>;
    case 'estatua-unicornio':
      return <group><Bx c="#d4b8ff" p={[0, 0.2, 0]} s={[1.6, 0.4, 2.4]} /><Sp {...M} p={[0, 1.2, 0]} s={[0.9, 0.8, 1.6]} />{[[-0.3, -0.5], [0.3, -0.5], [-0.3, 0.5], [0.3, 0.5]].map(([x, z]) => <Cy key={`${x}${z}`} {...M} p={[x, 0.6, z]} s={[0.2, 0.6, 0.2]} />)}<Sp {...M} p={[0, 1.9, 0.75]} s={[0.5, 0.55, 0.7]} /><Co c="#ffd23f" e={0.5} p={[0, 2.35, 0.95]} s={[0.12, 0.5, 0.12]} r={[0.5, 0, 0]} />{RAINBOW.slice(0, 4).map((cc, i) => <Sp key={i} c={cc} p={[0, 2.05 - i * 0.15, 0.45 - i * 0.05]} s={[0.25, 0.2, 0.2]} />)}</group>;
    case 'trono':
      return <group><Bx c="#e63946" p={[0, 0.4, 0]} s={[W, 0.8, D]} /><Bx {...M} p={[0, 1.4, -0.5]} s={[W, 2, 0.2]} />{[-1, 1].map((s) => <Bx key={s} {...M} p={[s * 0.6, 0.9, 0]} s={[0.2, 0.3, D]} />)}{[-0.4, 0, 0.4].map((x) => <Co key={x} c={c} e={0.3} p={[x, 2.55, -0.5]} s={[0.25, 0.35, 0.2]} />)}</group>;
    case 'foguete':
      return <group><Cy {...M} p={[0, 2.5, 0]} s={[1.6, 4, 1.6]} /><Co c="#e63946" p={[0, 5.2, 0]} s={[1.6, 1.6, 1.6]} /><Cy c="#5ad1ff" e={0.4} p={[0, 3.2, 0.78]} s={[0.6, 0.06, 0.6]} r={[Math.PI / 2, 0, 0]} />{[0, 1, 2].map((i) => <Bx key={i} c="#e63946" p={[Math.cos(i * 2.09) * 0.9, 0.8, Math.sin(i * 2.09) * 0.9]} s={[0.1, 1.4, 0.8]} r={[0, -i * 2.09 + Math.PI / 2, 0]} />)}<Co c="#ffa94d" e={1.5} p={[0, 0.2, 0]} s={[0.9, 0.8, 0.9]} r={[Math.PI, 0, 0]} /></group>;
    case 'portal':
      return <group><mesh material={mat(c, { emissive: 0.6 })} position={[0, 1.8, 0]}><torusGeometry args={[1.3, 0.2, 10, 30]} /></mesh><Spin speed={2} axis="z"><mesh position={[0, 1.8, 0]} material={mat('#d4b8ff', { emissive: 1, opacity: 0.6 })}><circleGeometry args={[1.15, 24]} /></mesh></Spin></group>;
    case 'carrossel':
      return <group><Cy c={WHITE} p={[0, 0.15, 0]} s={[W, 0.3, W]} /><Cy c="#ffd23f" p={[0, 1.6, 0]} s={[0.2, 3, 0.2]} /><Co {...M} tex="listras" p={[0, 3, 0]} s={[W + 0.4, 0.8, W + 0.4]} /><Spin speed={0.8}>{[0, 1, 2, 3].map((i) => <group key={i} position={[Math.cos(i * 1.57) * 1.4, 0, Math.sin(i * 1.57) * 1.4]}><Cy c="#ffd23f" p={[0, 1.6, 0]} s={[0.05, 2.6, 0.05]} /><Bob amp={0.2} speed={2}><Sp c={RAINBOW[i]} p={[0, 1.1, 0]} s={[0.4, 0.4, 0.8]} /><Sp c={RAINBOW[i]} p={[0, 1.4, 0.35]} s={[0.25, 0.35, 0.3]} /></Bob></group>)}</Spin></group>;
    case 'castelinho':
      return <group><Bx {...M} p={[0, 0.9, -1.3]} s={[W, 1.8, 0.2]} />{[-1, 1].map((s) => <Bx key={s} {...M} p={[s * 1.4, 0.9, 0]} s={[0.2, 1.8, D]} />)}<Bx {...M} p={[-1, 0.9, 1.4]} s={[1, 1.8, 0.2]} /><Bx {...M} p={[1, 0.9, 1.4]} s={[1, 1.8, 0.2]} /><Co c="#9d4edd" p={[0, 2.5, 0]} s={[W * 1.3, 1.4, D * 1.3]} r={[0, Math.PI / 4, 0]} /></group>;
  }
  return <Bx {...M} p={[0, H / 2, 0]} s={[W, H, D]} />;
}

export const FurnitureModel = memo(Model);
