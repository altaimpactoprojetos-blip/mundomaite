import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AnimName, Appearance } from '../types';
import { Bx, Cy, Sp, Co, To, Cap } from './prims';
import { mat } from '../systems/materials';
import { isDress } from '../data/catalog';

const smileGeo = new THREE.TorusGeometry(0.07, 0.018, 6, 14, Math.PI);
const bigSmileGeo = new THREE.TorusGeometry(0.09, 0.022, 6, 14, Math.PI);
const ringGeo = new THREE.TorusGeometry(0.035, 0.015, 6, 12);
const wingGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.2, 0.5, 0.6, 0.6, 0.55, 0.15);
  s.bezierCurveTo(0.55, -0.1, 0.3, -0.35, 0, 0);
  return new THREE.ShapeGeometry(s);
})();

interface Props {
  look: Appearance;
  getAnim?: () => AnimName;
  anim?: AnimName;
  held?: string | null;
  seed?: number;
}

const LONG_SLEEVE = ['moletom', 'jaqueta', 'sueter', 'jaleco', 'uniforme'];
const SHORT_SLEEVE = ['camiseta', 'listrada', 'estrela', 'coracao', 'blusa-babado', 'vestido', 'vestido-floral', 'vestido-babados', 'vestido-princesa', 'avental'];

function Hair({ style, color }: { style: Appearance['hairStyle']; color: string }) {
  const m = mat(color, { rough: 0.6 });
  if (style === 'careca') return null;
  const cap = <Sp m={m} c={color} p={[0, 0.12, -0.05]} s={[0.74, 0.62, 0.74]} />;
  switch (style) {
    case 'curto':
      return <group>{cap}<Bx m={m} c={color} p={[0, 0.2, 0.22]} s={[0.5, 0.12, 0.2]} r={[0.4, 0, 0]} /></group>;
    case 'franja':
      return <group>{cap}<Bx m={m} c={color} p={[0, 0.18, 0.28]} s={[0.62, 0.16, 0.14]} r={[0.2, 0, 0]} /><Bx m={m} c={color} p={[0, -0.18, -0.2]} s={[0.66, 0.5, 0.3]} /></group>;
    case 'longo':
      return <group>{cap}<Bx m={m} c={color} p={[0, -0.32, -0.18]} s={[0.7, 0.85, 0.32]} /><Bx m={m} c={color} p={[0, 0.2, 0.26]} s={[0.55, 0.12, 0.12]} r={[0.3, 0, 0]} /></group>;
    case 'rabo':
      return <group>{cap}<Sp m={m} c={color} p={[0, 0.12, -0.42]} s={[0.22, 0.22, 0.22]} /><Cap m={m} c={color} p={[0, -0.2, -0.48]} s={[0.16, 0.25, 0.16]} r={[0.25, 0, 0]} /></group>;
    case 'chiquinhas':
      return (
        <group>
          {cap}
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Sp m={m} c={color} p={[sd * 0.38, 0.1, -0.08]} s={[0.2, 0.2, 0.2]} />
              <Cap m={m} c={color} p={[sd * 0.44, -0.18, -0.1]} s={[0.15, 0.22, 0.15]} r={[0, 0, sd * 0.25]} />
            </group>
          ))}
        </group>
      );
    case 'coque':
      return <group>{cap}<Sp m={m} c={color} p={[0, 0.42, -0.1]} s={[0.3, 0.28, 0.3]} /></group>;
    case 'cacheado':
      return (
        <group>
          {cap}
          {Array.from({ length: 14 }).map((_, i) => {
            const a = -0.15 * Math.PI + (i / 13) * 1.3 * Math.PI;
            const low = i % 2 ? -0.18 : 0.1;
            return <Sp key={i} m={m} c={color} low p={[Math.cos(a) * 0.36, low, -Math.sin(a) * 0.3 - 0.05]} s={[0.26, 0.26, 0.26]} />;
          })}
          {[-0.18, 0, 0.18].map((x) => <Sp key={x} m={m} c={color} low p={[x, 0.36, 0.05]} s={[0.24, 0.2, 0.24]} />)}
        </group>
      );
    case 'black':
      return <Sp m={m} c={color} p={[0, 0.12, -0.08]} s={[1.05, 0.95, 1]} />;
    case 'trancas':
      return (
        <group>
          {cap}
          {[-1, 1].map((sd) => [0, 1, 2, 3].map((k) => <Sp key={`${sd}${k}`} m={m} c={color} low p={[sd * 0.3, -0.12 - k * 0.14, -0.15]} s={[0.13, 0.15, 0.13]} />))}
        </group>
      );
  }
  return cap;
}

function Face({ look, blink }: { look: Appearance; blink: React.RefObject<THREE.Group> }) {
  const eye = mat(look.robot ? '#5ad1ff' : look.eyeColor, { emissive: look.robot ? 0.8 : 0, rough: 0.2 });
  const white = mat('#ffffff', { emissive: 0.4 });
  const mouthC = look.makeup.lips ? '#e83e6c' : '#c2185b';
  const wink = look.expression === 'piscadinha';
  const ex = look.expression;
  return (
    <group position={[0, -0.02, 0.33]}>
      <group ref={blink}>
        {[-1, 1].map((sd) =>
          wink && sd === 1 ? (
            <Bx key={sd} c="#3b2314" p={[0.12, 0.02, 0.01]} s={[0.1, 0.02, 0.02]} />
          ) : (
            <group key={sd} position={[sd * 0.12, 0.02, 0]}>
              <Sp m={eye} c="" s={ex === 'surpresa' ? [0.11, 0.13, 0.05] : [0.09, 0.11, 0.05]} />
              {look.eyeStyle !== 'redondo' && <Sp m={white} c="" p={[0.02, 0.025, 0.025]} s={[0.03, 0.03, 0.02]} />}
              {look.eyeStyle === 'cilios' && <Bx c="#222" p={[sd * 0.04, 0.06, 0]} s={[0.05, 0.015, 0.01]} r={[0, 0, sd * -0.5]} />}
            </group>
          ),
        )}
      </group>
      {/* sobrancelhas */}
      {!look.robot && [-1, 1].map((sd) => <Bx key={sd} c={look.hairColor} p={[sd * 0.12, ex === 'surpresa' ? 0.13 : 0.11, 0]} s={[0.08, 0.018, 0.01]} r={[0, 0, sd * (ex === 'calma' ? 0.1 : -0.12)]} />)}
      {/* boca */}
      {ex === 'surpresa' ? (
        <mesh geometry={ringGeo} material={mat(mouthC)} position={[0, -0.12, 0]} />
      ) : (
        <mesh geometry={ex === 'sorriso' || ex === 'lingua' ? bigSmileGeo : smileGeo} material={mat(mouthC)} position={[0, -0.09, 0]} rotation={[0, 0, Math.PI]} scale={ex === 'calma' ? [1, 0.4, 1] : 1} />
      )}
      {ex === 'lingua' && <Sp c="#ff7aa2" p={[0, -0.15, 0]} s={[0.06, 0.05, 0.03]} />}
      {look.makeup.blush && [-1, 1].map((sd) => <Sp key={sd} c="#ff8fb1" o={0.55} p={[sd * 0.2, -0.07, -0.02]} s={[0.09, 0.05, 0.02]} />)}
      {look.makeup.glitter && [-1, 1].map((sd) => <Sp key={sd} c="#ffe066" e={1} p={[sd * 0.22, 0.05, -0.02]} s={[0.025, 0.025, 0.02]} />)}
    </group>
  );
}

function Accessory({ id, color, wingRef }: { id: string; color: string; wingRef: React.RefObject<THREE.Group> }) {
  const gold = '#ffd23f';
  switch (id) {
    case 'laco':
      return <group position={[0.2, 0.36, 0]}>{[-1, 1].map((s) => <Co key={s} c={color} p={[s * 0.08, 0, 0]} s={[0.12, 0.16, 0.08]} r={[0, 0, s * Math.PI / 2]} />)}<Sp c={color} s={[0.06, 0.06, 0.06]} /></group>;
    case 'flor-cabelo':
      return <group position={[-0.24, 0.3, 0.1]}>{[0, 1, 2, 3, 4].map((k) => <Sp key={k} c={color} p={[Math.cos(k * 1.256) * 0.06, Math.sin(k * 1.256) * 0.06, 0]} s={[0.07, 0.07, 0.04]} />)}<Sp c="#ffd23f" s={[0.05, 0.05, 0.05]} /></group>;
    case 'tiara':
      return <To c={color} p={[0, 0.3, 0]} s={[0.66, 0.66, 0.3]} r={[Math.PI / 2 - 0.4, 0, 0]} />;
    case 'coroa':
    case 'coroa-arcoiris':
      return (
        <group position={[0, 0.4, -0.02]}>
          <Cy c={id === 'coroa' ? gold : '#ff8fc7'} e={0.2} s={[0.34, 0.12, 0.34]} />
          {[0, 1, 2, 3, 4].map((k) => (
            <Co key={k} c={id === 'coroa' ? gold : ['#ff5fa2', '#ffd23f', '#3ccf91', '#5ab0ff', '#9d4edd'][k]} e={0.3} p={[Math.cos(k * 1.256) * 0.15, 0.1, Math.sin(k * 1.256) * 0.15]} s={[0.07, 0.12, 0.07]} />
          ))}
        </group>
      );
    case 'oculos-coracao':
      return <group position={[0, -0.0, 0.36]}>{[-1, 1].map((s) => <To key={s} c={color} p={[s * 0.12, 0.02, 0]} s={[0.17, 0.17, 0.17]} />)}<Bx c={color} p={[0, 0.03, 0]} s={[0.06, 0.02, 0.02]} /></group>;
    case 'chapeu-sol':
      return <group position={[0, 0.32, -0.02]} rotation={[-0.1, 0, 0]}><Cy c={color} s={[1.1, 0.03, 1.1]} /><Sp c={color} p={[0, 0.06, 0]} s={[0.62, 0.36, 0.62]} /><Cy c="#ff5fa2" p={[0, 0.04, 0]} s={[0.63, 0.06, 0.63]} /></group>;
    case 'bone':
      return <group position={[0, 0.26, 0]}><Sp c={color} s={[0.74, 0.5, 0.74]} /><Bx c={color} p={[0, -0.02, 0.38]} s={[0.4, 0.03, 0.26]} /></group>;
    case 'fones-gato':
      return <group><To c={color} p={[0, 0.12, 0]} s={[0.82, 0.82, 0.6]} r={[0, Math.PI / 2, 0]} />{[-1, 1].map((s) => <group key={s}><Sp c={color} p={[s * 0.38, -0.02, 0]} s={[0.14, 0.18, 0.18]} /><Co c={color} p={[s * 0.2, 0.4, 0]} s={[0.12, 0.16, 0.08]} /></group>)}</group>;
    case 'orelhas-coelho':
      return <group>{[-1, 1].map((s) => <Cap key={s} c={color} p={[s * 0.12, 0.55, -0.05]} s={[0.1, 0.22, 0.06]} r={[0, 0, s * -0.15]} />)}</group>;
    case 'chapeu-chef':
      return <group position={[0, 0.34, -0.02]}><Cy c="#ffffff" s={[0.56, 0.18, 0.56]} /><Sp c="#ffffff" p={[0, 0.22, 0]} s={[0.66, 0.4, 0.66]} /></group>;
    case 'capacete':
      return <group position={[0, 0.2, 0]}><Sp c="#e63946" s={[0.8, 0.62, 0.8]} /><Cy c="#e63946" p={[0, -0.02, -0.05]} s={[0.92, 0.04, 0.98]} /><Bx c={gold} p={[0, 0.12, 0.38]} s={[0.12, 0.14, 0.04]} /></group>;
    case 'quepe':
      return <group position={[0, 0.3, 0]}><Cy c="#2b2d42" s={[0.66, 0.16, 0.66]} /><Bx c="#111" p={[0, -0.06, 0.32]} s={[0.36, 0.03, 0.2]} /><Bx c={gold} p={[0, 0.02, 0.33]} s={[0.08, 0.08, 0.02]} /></group>;
    case 'antena':
      return <group position={[0, 0.38, 0]}><Cy c="#9aa0a6" p={[0, 0.12, 0]} s={[0.03, 0.25, 0.03]} /><Sp c="#ff5fa2" e={1} p={[0, 0.27, 0]} s={[0.09, 0.09, 0.09]} /></group>;
    default:
      return null;
  }
}

function BodyAccessory({ id, color, wingRef }: { id: string; color: string; wingRef: React.RefObject<THREE.Group> }) {
  switch (id) {
    case 'colar':
      return <To c="#ffffff" p={[0, 0.5, 0.02]} s={[0.5, 0.5, 0.5]} r={[Math.PI / 2 - 0.2, 0, 0]} />;
    case 'estetoscopio':
      return <group><To c="#555a66" p={[0, 0.45, 0.06]} s={[0.46, 0.6, 0.46]} r={[Math.PI / 2 - 0.4, 0, 0]} /><Cy c="#c9c9c9" p={[0.08, 0.22, 0.2]} s={[0.07, 0.03, 0.07]} r={[Math.PI / 2, 0, 0]} /></group>;
    case 'asas-fada':
    case 'asas-arcoiris':
      return (
        <group ref={wingRef} position={[0, 0.35, -0.18]}>
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={wingGeo} material={mat(id === 'asas-fada' ? color : ['#ff8fc7', '#5ab0ff'][s > 0 ? 1 : 0], { opacity: 0.7, emissive: 0.3 })} scale={[s * 0.9, 0.9, 0.9]} rotation={[0, s * 0.3, 0]} />
          ))}
        </group>
      );
    case 'capa':
      return <Bx c={color} p={[0, 0.0, -0.2]} s={[0.55, 0.85, 0.03]} r={[0.15, 0, 0]} />;
    case 'mochila':
    case 'mochila-unicornio':
      return (
        <group position={[0, 0.25, -0.22]}>
          <Bx c={color} s={[0.4, 0.45, 0.16]} />
          {id === 'mochila-unicornio' && <Co c="#ffd23f" e={0.3} p={[0, 0.32, 0]} s={[0.07, 0.2, 0.07]} />}
        </group>
      );
    case 'bolsa-coracao':
    case 'bolsa-estrela':
      return <group position={[0.3, -0.05, 0.05]}><Bx c={color} s={[0.2, 0.18, 0.08]} r={[0, 0, id === 'bolsa-coracao' ? Math.PI / 4 : 0]} /><To c={color} p={[-0.12, 0.3, 0]} s={[0.6, 0.9, 0.4]} r={[0, Math.PI / 2, 0.4]} /></group>;
    case 'pochete':
      return <Bx c={color} p={[0, -0.02, 0.22]} s={[0.3, 0.12, 0.08]} />;
    default:
      return null;
  }
}

function HeldItem({ toy }: { toy: string }) {
  switch (toy) {
    case 'balao':
      return <group><Cy c="#ffffff" p={[0, 0.7, 0]} s={[0.01, 1.4, 0.01]} /><Sp c="#ff5fa2" p={[0, 1.5, 0]} s={[0.4, 0.48, 0.4]} /></group>;
    case 'bola':
      return <Sp c="#ffffff" p={[0, -0.12, 0.08]} s={[0.26, 0.26, 0.26]} />;
    case 'ursinho':
      return <group position={[0, -0.12, 0.1]}><Sp c="#c8a27a" s={[0.2, 0.24, 0.18]} /><Sp c="#c8a27a" p={[0, 0.17, 0]} s={[0.16, 0.16, 0.16]} /></group>;
    case 'varinha':
      return <group rotation={[0.6, 0, 0]}><Cy c="#ffffff" p={[0, 0.1, 0]} s={[0.03, 0.4, 0.03]} /><Sp c="#ffd23f" e={1} p={[0, 0.32, 0]} s={[0.1, 0.1, 0.1]} /></group>;
    case 'sorvete':
      return <group position={[0, 0, 0.05]}><Co c="#e0b070" r={[Math.PI, 0, 0]} s={[0.12, 0.2, 0.12]} /><Sp c="#ffb3d9" p={[0, 0.12, 0]} s={[0.14, 0.14, 0.14]} /></group>;
    case 'pipoca':
      return <group position={[0, -0.05, 0.05]}><Cy c="#e63946" s={[0.16, 0.2, 0.16]} /><Sp c="#fff3a6" p={[0, 0.11, 0]} s={[0.17, 0.08, 0.17]} /></group>;
    case 'algodao':
      return <group><Cy c="#ffffff" s={[0.02, 0.4, 0.02]} /><Sp c="#ff8fc7" p={[0, 0.25, 0]} s={[0.24, 0.24, 0.24]} /></group>;
    case 'microfone':
      return <group><Cy c="#222" s={[0.05, 0.22, 0.05]} /><Sp c="#9aa0a6" p={[0, 0.13, 0]} s={[0.09, 0.09, 0.09]} /></group>;
    case 'pipa':
      return <group><Cy c="#ffffff" p={[0, 1.1, -0.6]} s={[0.01, 2.6, 0.01]} r={[-0.5, 0, 0]} /><Bx c="#5ab0ff" p={[0, 2.3, -1.3]} s={[0.6, 0.6, 0.02]} r={[0, 0, Math.PI / 4]} /></group>;
    case 'ioio':
      return <Cy c="#e63946" p={[0, -0.25, 0]} s={[0.12, 0.05, 0.12]} r={[Math.PI / 2, 0, 0]} />;
    case 'bolhas':
      return <group><Cy c="#5ad1ff" s={[0.06, 0.16, 0.06]} /><To c="#c7e5ff" p={[0, 0.14, 0]} s={[0.15, 0.15, 0.15]} /></group>;
    case 'camera':
      return <Bx c="#222831" p={[0, 0, 0.06]} s={[0.18, 0.12, 0.08]} />;
    case 'pincel':
      return <Cy c="#c8a27a" p={[0, 0.05, 0]} s={[0.03, 0.3, 0.03]} />;
    default:
      return null;
  }
}

function AvatarImpl({ look, getAnim, anim = 'idle', held, seed = 0 }: Props) {
  const root = useRef<THREE.Group>(null!);
  const hips = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const blink = useRef<THREE.Group>(null!);
  const wings = useRef<THREE.Group>(null!);
  const phase = useRef(seed * 10);

  const dress = isDress(look.top) || look.top === 'jaleco';
  const skin = look.skin;
  const topC = look.topColor;
  const topTex = look.top === 'listrada' ? 'listras' : look.top === 'vestido-floral' ? 'bolinhas' : look.top === 'estrela' ? 'estrelas' : look.top === 'coracao' ? 'coracoes' : undefined;
  const topM = useMemo(() => mat(topC, { tex: topTex, repeat: 2 }), [topC, topTex]);
  const legFull = ['calca', 'legging'].includes(look.bottom);
  const legKnee = look.bottom === 'bermuda';
  const legC = (dress && look.bottom !== 'legging') ? skin : look.bottomColor;
  const sleeve = LONG_SLEEVE.includes(look.top) ? 'long' : SHORT_SLEEVE.includes(look.top) ? 'short' : 'none';

  useFrame((_, dt) => {
    const a = getAnim ? getAnim() : anim;
    const sp = a === 'run' ? 13 : a === 'walk' ? 8 : a === 'swim' ? 4 : 3;
    phase.current += dt * sp;
    const t = phase.current;
    const s = Math.sin(t);
    const L = legL.current, R = legR.current, AL = armL.current, AR = armR.current, H = hips.current, T = torso.current, HD = head.current;
    // pose base
    let hy = 0.68, tRx = 0, tRz = 0, hdRx = 0, hdRy = 0, hdRz = 0;
    let lx = 0, rx = 0, alx = 0, arx = 0, alz = 0.12, arz = -0.12, rootRx = 0, rootY = 0;
    switch (a) {
      case 'walk': lx = s * 0.6; rx = -s * 0.6; alx = -s * 0.5; arx = s * 0.5; hy += Math.abs(Math.cos(t)) * 0.03; break;
      case 'run': lx = s * 0.95; rx = -s * 0.95; alx = -s * 0.9; arx = s * 0.9; tRx = 0.15; hy += Math.abs(Math.cos(t)) * 0.06; break;
      case 'jump': lx = -0.5; rx = 0.3; alx = -2.6; arx = -2.6; alz = 0.4; arz = -0.4; break;
      case 'swim': rootRx = 1.2; rootY = -0.15; lx = s * 0.4; rx = -s * 0.4; alx = -2.8 + s * 1.2; arx = -2.8 - s * 1.2; hdRx = -0.9; break;
      case 'dance': hy += Math.abs(Math.sin(t * 1.3)) * 0.08; tRz = Math.sin(t * 1.3) * 0.2; alx = -2.6 + Math.sin(t * 2.6) * 0.4; arx = -2.6 - Math.sin(t * 2.6) * 0.4; alz = 0.5; arz = -0.5; hdRz = Math.sin(t * 1.3) * 0.2; lx = Math.max(0, s) * 0.4; rx = Math.max(0, -s) * 0.4; break;
      case 'cheer': hy += Math.abs(Math.sin(t * 2)) * 0.15; alx = -2.9; arx = -2.9; alz = 0.3 + Math.sin(t * 4) * 0.2; arz = -0.3 - Math.sin(t * 4) * 0.2; break;
      case 'wave': arx = -2.8; arz = -0.3 + Math.sin(t * 4) * 0.4; hdRz = 0.1; break;
      case 'hug': alx = -1.4; arx = -1.4; alz = -0.5; arz = 0.5; tRx = 0.1; break;
      case 'sit': case 'drive': hy = 0.42; lx = -1.5; rx = -1.5; alx = a === 'drive' ? -1.2 + Math.sin(t) * 0.05 : -0.3; arx = a === 'drive' ? -1.2 - Math.sin(t) * 0.05 : -0.3; break;
      case 'ride': hy = 0.55; lx = -1.2; rx = -1.2; alz = 0.9; arz = -0.9; alx = -0.6; arx = -0.6; break;
      case 'sleep': rootRx = -Math.PI / 2; rootY = 0.25; hdRy = 0.3; break;
      case 'play': hy += Math.abs(Math.sin(t * 1.5)) * 0.25; lx = s * 0.8; rx = -s * 0.8; alx = -1.5 + s; arx = -1.5 - s; break;
      case 'work': arx = -1.1 + Math.sin(t * 3) * 0.25; alx = -0.9 - Math.sin(t * 3) * 0.2; hdRx = 0.25; break;
      case 'exercise': hy += Math.abs(Math.sin(t * 2)) * 0.12; lx = Math.sin(t * 2) * 0.9; rx = -Math.sin(t * 2) * 0.9; alx = -Math.sin(t * 2) * 1; arx = Math.sin(t * 2) * 1; break;
      case 'sing': arx = -1.6; arz = 0.35; alx = -0.6 + Math.sin(t) * 0.3; alz = 0.6; hdRx = -0.15; tRz = Math.sin(t * 0.8) * 0.08; break;
      case 'paint': arx = -1.4 + Math.sin(t * 3) * 0.4; arz = Math.cos(t * 3) * 0.3; break;
      case 'photo': alx = -1.5; arx = -1.5; alz = -0.3; arz = 0.3; break;
      default: hy += Math.sin(t * 0.7) * 0.01; alz = 0.12 + Math.sin(t * 0.7) * 0.03; arz = -alz; hdRy = Math.sin(t * 0.23) * 0.15;
    }
    const k = Math.min(1, dt * 14);
    const lerp = THREE.MathUtils.lerp;
    H.position.y = lerp(H.position.y, hy, k);
    L.rotation.x = lerp(L.rotation.x, lx, k); R.rotation.x = lerp(R.rotation.x, rx, k);
    AL.rotation.x = lerp(AL.rotation.x, alx, k); AR.rotation.x = lerp(AR.rotation.x, arx, k);
    AL.rotation.z = lerp(AL.rotation.z, alz, k); AR.rotation.z = lerp(AR.rotation.z, arz, k);
    T.rotation.x = lerp(T.rotation.x, tRx, k); T.rotation.z = lerp(T.rotation.z, tRz, k);
    HD.rotation.x = lerp(HD.rotation.x, hdRx, k); HD.rotation.y = lerp(HD.rotation.y, hdRy, k); HD.rotation.z = lerp(HD.rotation.z, hdRz, k);
    root.current.rotation.x = lerp(root.current.rotation.x, rootRx, k);
    root.current.position.y = lerp(root.current.position.y, rootY, k);
    // piscar
    const bl = (t * 0.37 + seed) % 4 < 0.08;
    if (blink.current) blink.current.scale.y = bl || a === 'sleep' ? 0.1 : 1;
    if (wings.current) wings.current.rotation.y = Math.sin(t * 2.5) * 0.25;
  });

  const headAcc = look.accessories.filter((x) => !['colar', 'estetoscopio', 'asas-fada', 'asas-arcoiris', 'capa', 'mochila', 'mochila-unicornio', 'bolsa-coracao', 'bolsa-estrela', 'pochete'].includes(x));
  const bodyAcc = look.accessories.filter((x) => !headAcc.includes(x));
  const shoeC = look.shoesColor;
  const robot = !!look.robot;

  const leg = (sd: number, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[sd * 0.12, 0, 0]}>
      <Cap c={legFull ? legC : skin} p={[0, -0.33, 0]} s={[0.15, 0.32, 0.15]} />
      {(look.bottom === 'shorts' || legKnee) && !dress && <Cy c={look.bottomColor} p={[0, legKnee ? -0.18 : -0.1, 0]} s={[0.19, legKnee ? 0.34 : 0.2, 0.19]} />}
      {/* sapato */}
      <group position={[0, -0.6, 0.04]}>
        {look.shoes === 'botas' || look.shoes === 'galocha' ? (
          <><Cy c={shoeC} p={[0, 0.1, -0.03]} s={[0.17, 0.26, 0.17]} /><Bx c={shoeC} p={[0, -0.02, 0.03]} s={[0.16, 0.08, 0.25]} /></>
        ) : look.shoes === 'patins' ? (
          <><Bx c={shoeC} p={[0, 0.02, 0]} s={[0.16, 0.12, 0.26]} />{[-0.08, 0.08].map((z) => <Cy key={z} c="#ff5fa2" p={[0, -0.08, z]} s={[0.08, 0.05, 0.08]} r={[0, 0, Math.PI / 2]} />)}</>
        ) : (
          <><Bx c={shoeC} p={[0, -0.01, 0.02]} s={[0.16, 0.1, 0.26]} />{look.shoes === 'tenis-luz' && <Bx c="#5ad1ff" e={1.5} p={[0, -0.05, 0.02]} s={[0.17, 0.02, 0.27]} />}{look.shoes === 'tenis' && <Bx c="#ffffff" p={[0, -0.055, 0.02]} s={[0.17, 0.02, 0.27]} />}</>
        )}
      </group>
    </group>
  );

  const arm = (sd: number, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[sd * 0.27, 0.48, 0]}>
      <Cap c={sleeve === 'long' ? topC : skin} p={[sd * 0.02, -0.22, 0]} s={[0.11, 0.24, 0.11]} />
      {sleeve === 'short' && <Sp m={topM} c="" p={[sd * 0.01, -0.04, 0]} s={[0.17, 0.18, 0.17]} />}
      <Sp c={sleeve === 'long' ? skin : skin} p={[sd * 0.02, -0.43, 0]} s={[0.12, 0.12, 0.12]} />
      {sd === 1 && held && <group position={[0.02, -0.46, 0.04]}><HeldItem toy={held} /></group>}
    </group>
  );

  return (
    <group scale={look.height || 1}>
      <group ref={root}>
        <group ref={hips} position={[0, 0.68, 0]}>
          {leg(-1, legL)}
          {leg(1, legR)}
          {/* saia / vestido */}
          {look.bottom === 'saia' && !dress && <Co c={look.bottomColor} p={[0, -0.12, 0]} s={[0.56, 0.32, 0.5]} />}
          {look.bottom === 'saia-tutu' && !dress && <Cy c={look.bottomColor} o={0.9} p={[0, -0.06, 0]} s={[0.7, 0.14, 0.62]} />}
          {dress && look.top === 'vestido-princesa' && <Co m={topM} c="" p={[0, -0.3, 0]} s={[0.95, 0.75, 0.9]} />}
          {dress && look.top === 'vestido-fada' && <Co m={mat(topC, { opacity: 0.85 })} c="" p={[0, -0.18, 0]} s={[0.75, 0.48, 0.7]} />}
          {dress && ['vestido', 'vestido-floral', 'vestido-babados'].includes(look.top) && <Co m={topM} c="" p={[0, -0.16, 0]} s={[0.66, 0.42, 0.6]} />}
          {look.top === 'vestido-babados' && <Cy c="#ffffff" p={[0, -0.36, 0]} s={[0.67, 0.05, 0.61]} />}
          {look.top === 'jaleco' && <Cy c={topC} p={[0, -0.2, 0]} s={[0.46, 0.45, 0.36]} />}
          {look.top === 'macacao' && <Cy c={topC} p={[0, -0.08, 0]} s={[0.42, 0.2, 0.34]} />}
          <group ref={torso}>
            {/* tronco */}
            <Cy m={robot ? mat(skin, { metal: 0.6, rough: 0.3 }) : topM} c="" p={[0, 0.27, 0]} s={[0.46, 0.5, 0.34]} />
            {look.top === 'avental' && <Bx c="#ffffff" p={[0, 0.18, 0.17]} s={[0.32, 0.38, 0.02]} />}
            {look.top === 'jaqueta' && <Bx c="#ffffff" p={[0, 0.27, 0.17]} s={[0.04, 0.48, 0.02]} />}
            {look.top === 'regata' && <Cy c={skin} p={[0, 0.5, 0]} s={[0.3, 0.06, 0.2]} />}
            {look.top === 'uniforme' && <Bx c="#ffd23f" p={[0.1, 0.38, 0.17]} s={[0.07, 0.07, 0.02]} />}
            {/* pescoço */}
            <Cy c={skin} p={[0, 0.55, 0]} s={[0.14, 0.1, 0.14]} />
            {arm(-1, armL)}
            {arm(1, armR)}
            {bodyAcc.map((id) => <BodyAccessory key={id} id={id} color={look.accColor} wingRef={wings} />)}
            {/* cabeça */}
            <group ref={head} position={[0, 0.86, 0]}>
              {robot ? (
                <Bx m={mat(skin, { metal: 0.6, rough: 0.3 })} c="" s={[0.62, 0.56, 0.6]} />
              ) : (
                <Sp c={skin} s={[0.68, 0.66, 0.64]} />
              )}
              {!robot && [-1, 1].map((sd) => <Sp key={sd} c={skin} p={[sd * 0.33, -0.02, 0]} s={[0.08, 0.12, 0.08]} />)}
              <Face look={look} blink={blink} />
              {!robot && <Hair style={look.hairStyle} color={look.hairColor} />}
              {headAcc.map((id) => <Accessory key={id} id={id} color={look.accColor} wingRef={wings} />)}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export const Avatar = memo(AvatarImpl);
