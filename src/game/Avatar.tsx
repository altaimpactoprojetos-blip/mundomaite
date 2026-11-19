import { memo, useMemo, useRef, useState } from 'react';
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

type Reg = (g: THREE.Group | null) => void;
function Hair({ style, color, reg }: { style: Appearance['hairStyle']; color: string; reg: Reg }) {
  const m = mat(color, { rough: 0.55 });
  const hl = mat(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.18).getStyle(), { rough: 0.5 });
  if (style === 'careca') return null;
  // calota com mechas na frente
  const cap = (
    <group>
      <Sp m={m} c="" p={[0, 0.12, -0.05]} s={[0.74, 0.62, 0.74]} />
      {[-0.2, -0.07, 0.07, 0.2].map((x, i) => <Cap key={i} m={i % 2 ? hl : m} c="" p={[x, 0.24, 0.24]} s={[0.1, 0.08, 0.08]} r={[1.1, 0, x * -1.2]} />)}
    </group>
  );
  switch (style) {
    case 'curto':
      return cap;
    case 'franja':
      return (
        <group>{cap}
          {[-0.22, -0.11, 0, 0.11, 0.22].map((x, i) => <Cap key={i} m={i % 2 ? hl : m} c="" p={[x, 0.17, 0.27]} s={[0.075, 0.09, 0.06]} r={[0.35, 0, 0]} />)}
          <group ref={reg} position={[0, 0.05, -0.2]}>{[-0.22, -0.07, 0.07, 0.22].map((x, i) => <Cap key={i} m={i % 2 ? hl : m} c="" p={[x, -0.2, -0.02]} s={[0.1, 0.18, 0.1]} />)}</group>
        </group>
      );
    case 'longo':
      return (
        <group>{cap}
          <group ref={reg} position={[0, 0.1, -0.18]}>
            {[-0.28, -0.18, -0.06, 0.06, 0.18, 0.28].map((x, i) => <Cap key={i} m={i % 2 ? hl : m} c="" p={[x, -0.38, -0.04 + Math.abs(x) * 0.25]} s={[0.1, 0.36, 0.1]} />)}
          </group>
        </group>
      );
    case 'rabo':
      return (
        <group>{cap}
          <Sp m={m} c="" p={[0, 0.16, -0.38]} s={[0.2, 0.2, 0.2]} />
          <group ref={reg} position={[0, 0.16, -0.44]}>
            <Cap m={m} c="" p={[0, -0.22, -0.06]} s={[0.15, 0.24, 0.15]} r={[0.25, 0, 0]} />
            <Cap m={hl} c="" p={[0.04, -0.3, -0.08]} s={[0.08, 0.2, 0.08]} r={[0.3, 0, 0.1]} />
          </group>
        </group>
      );
    case 'chiquinhas':
      return (
        <group>
          {cap}
          {[-1, 1].map((sd) => (
            <group key={sd} position={[sd * 0.36, 0.14, -0.08]}>
              <Sp m={m} c="" s={[0.17, 0.17, 0.17]} />
              <group ref={reg}>
                <Cap m={m} c="" p={[sd * 0.06, -0.24, 0]} s={[0.15, 0.22, 0.15]} r={[0, 0, sd * 0.25]} />
                <Cap m={hl} c="" p={[sd * 0.09, -0.32, 0.03]} s={[0.07, 0.16, 0.07]} r={[0, 0, sd * 0.3]} />
              </group>
            </group>
          ))}
        </group>
      );
    case 'coque':
      return <group>{cap}<Sp m={m} c="" p={[0, 0.42, -0.1]} s={[0.3, 0.28, 0.3]} /><To m={hl} c="" p={[0, 0.42, -0.1]} s={[0.36, 0.36, 0.5]} r={[Math.PI / 2, 0, 0]} /></group>;
    case 'cacheado':
      return (
        <group>
          {cap}
          <group ref={reg} position={[0, 0.1, 0]}>
            {Array.from({ length: 14 }).map((_, i) => {
              const a = -0.15 * Math.PI + (i / 13) * 1.3 * Math.PI;
              const low = i % 2 ? -0.28 : 0;
              return <Sp key={i} m={i % 3 ? m : hl} c="" low p={[Math.cos(a) * 0.36, low, -Math.sin(a) * 0.3 - 0.05]} s={[0.26, 0.26, 0.26]} />;
            })}
          </group>
          {[-0.18, 0, 0.18].map((x) => <Sp key={x} m={m} c="" low p={[x, 0.36, 0.05]} s={[0.24, 0.2, 0.24]} />)}
        </group>
      );
    case 'black':
      return <group><Sp m={m} c="" p={[0, 0.12, -0.08]} s={[1.05, 0.95, 1]} />{[0, 1, 2, 3, 4, 5].map((i) => <Sp key={i} m={hl} c="" low p={[Math.cos(i) * 0.42, 0.2 + (i % 2) * 0.15, Math.sin(i) * 0.38 - 0.1]} s={[0.2, 0.2, 0.2]} />)}</group>;
    case 'trancas':
      return (
        <group>
          {cap}
          {[-1, 1].map((sd) => (
            <group key={sd} ref={reg} position={[sd * 0.3, -0.05, -0.15]}>
              {[0, 1, 2, 3].map((k) => <Sp key={k} m={k % 2 ? hl : m} c="" low p={[0, -0.07 - k * 0.13, 0]} s={[0.13, 0.15, 0.13]} />)}
              <Sp c="#ff5fa2" p={[0, -0.6, 0]} s={[0.08, 0.06, 0.08]} />
            </group>
          ))}
        </group>
      );
  }
  return cap;
}

function Face({ look, blink }: { look: Appearance; blink: React.RefObject<THREE.Group> }) {
  const iris = mat(look.robot ? '#5ad1ff' : look.eyeColor, { emissive: look.robot ? 0.8 : 0.15, rough: 0.25 });
  const white = mat('#ffffff', { emissive: 0.35, rough: 0.3 });
  const pupil = mat('#1a1022', { rough: 0.2 });
  const shine = mat('#ffffff', { emissive: 1 });
  const mouthC = look.makeup.lips ? '#e83e6c' : '#c2185b';
  const wink = look.expression === 'piscadinha';
  const ex = look.expression;
  return (
    <group position={[0, -0.03, 0.31]}>
      <group ref={blink}>
        {[-1, 1].map((sd) =>
          wink && sd === 1 ? (
            <mesh key={sd} geometry={smileGeo} material={mat('#3b2314')} position={[0.12, 0.03, 0.03]} scale={[0.7, 0.5, 1]} />
          ) : (
            <group key={sd} position={[sd * 0.12, 0.03, 0]}>
              <Sp m={white} c="" s={ex === 'surpresa' ? [0.15, 0.17, 0.06] : [0.13, 0.15, 0.06]} />
              <Sp m={iris} c="" p={[0, -0.005, 0.02]} s={[0.095, 0.11, 0.04]} />
              <Sp m={pupil} c="" p={[0, -0.005, 0.034]} s={[0.05, 0.06, 0.02]} />
              <Sp m={shine} c="" p={[0.022, 0.03, 0.045]} s={[0.032, 0.032, 0.01]} />
              {look.eyeStyle !== 'redondo' && <Sp m={shine} c="" p={[-0.02, -0.03, 0.045]} s={[0.014, 0.014, 0.01]} />}
              {look.eyeStyle === 'cilios' && [-1, 0, 1].map((k) => <Bx key={k} c="#1a1022" p={[sd * (0.045 + k * 0.012), 0.075 - Math.abs(k) * 0.01, 0.02]} s={[0.012, 0.035, 0.01]} r={[0, 0, sd * (-0.5 - k * 0.3)]} />)}
            </group>
          ),
        )}
      </group>
      {/* sobrancelhas */}
      {!look.robot && [-1, 1].map((sd) => <Cap key={sd} c={look.hairColor} p={[sd * 0.12, ex === 'surpresa' ? 0.16 : 0.135, 0.01]} s={[0.022, 0.035, 0.012]} r={[0, 0, Math.PI / 2 + sd * (ex === 'calma' ? 0.1 : -0.15)]} />)}
      {/* nariz */}
      {!look.robot && <Sp c={look.skin} p={[0, -0.045, 0.03]} s={[0.045, 0.035, 0.035]} />}
      {/* boca */}
      {ex === 'surpresa' ? (
        <mesh geometry={ringGeo} material={mat(mouthC)} position={[0, -0.12, 0.01]} />
      ) : (
        <group position={[0, -0.1, 0.005]}>
          {(ex === 'sorriso' || ex === 'lingua') && <Sp c="#8b1e3f" p={[0, -0.012, -0.005]} s={[0.12, 0.05, 0.02]} />}
          <mesh geometry={ex === 'sorriso' || ex === 'lingua' ? bigSmileGeo : smileGeo} material={mat(mouthC)} rotation={[0, 0, Math.PI]} scale={ex === 'calma' ? [1, 0.4, 1] : 1} />
        </group>
      )}
      {ex === 'lingua' && <Sp c="#ff7aa2" p={[0, -0.15, 0.01]} s={[0.06, 0.05, 0.03]} />}
      {look.makeup.blush && [-1, 1].map((sd) => <Sp key={sd} c="#ff8fb1" o={0.5} p={[sd * 0.2, -0.065, -0.02]} s={[0.1, 0.055, 0.02]} />)}
      {look.makeup.glitter && [-1, 1].map((sd) => <Sp key={sd} c="#ffe066" e={1} p={[sd * 0.23, 0.06, -0.03]} s={[0.025, 0.025, 0.02]} />)}
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

const DRINK_C: Record<string, string> = { cafe: '#a0703f', chocolate: '#6b3d24', morango: '#ff6b8a', shake: '#ffb3d9' };
function HeldItem({ toy }: { toy: string }) {
  if (toy.startsWith('bebida:')) {
    const d = toy.split(':')[1];
    return (
      <group position={[0, 0.02, 0.06]}>
        <Cy c="#ffffff" o={0.85} s={[0.13, 0.2, 0.13]} />
        <Cy c={DRINK_C[d] ?? '#a0703f'} p={[0, 0.02, 0]} s={[0.115, 0.15, 0.115]} />
        <Sp c="#ffffff" p={[0, 0.11, 0]} s={[0.12, 0.06, 0.12]} />
        <Cy c="#ff5fa2" p={[0.03, 0.18, 0]} s={[0.015, 0.16, 0.015]} r={[0, 0, 0.2]} />
      </group>
    );
  }
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
    case 'sanduiche':
      return <group position={[0, -0.02, 0.06]}><Bx c="#e8b56a" s={[0.18, 0.04, 0.14]} /><Bx c="#ffe066" p={[0, 0.03, 0]} s={[0.19, 0.02, 0.15]} /><Bx c="#69db7c" p={[0, 0.045, 0]} s={[0.2, 0.015, 0.16]} /><Bx c="#e8b56a" p={[0, 0.07, 0]} s={[0.18, 0.04, 0.14]} /></group>;
    case 'camera':
      return <Bx c="#222831" p={[0, 0, 0.06]} s={[0.18, 0.12, 0.08]} />;
    case 'pincel':
      return <Cy c="#c8a27a" p={[0, 0.05, 0]} s={[0.03, 0.3, 0.03]} />;
    default:
      return null;
  }
}

const torsoGeo = new THREE.CylinderGeometry(0.2, 0.235, 0.5, 18);
const skirtGeo = new THREE.CylinderGeometry(0.2, 0.36, 0.42, 20, 1, true);
const princessGeo = new THREE.CylinderGeometry(0.2, 0.5, 0.72, 24, 1, true);
const ruffleGeo = new THREE.TorusGeometry(1, 0.05, 6, 28);
const _v = new THREE.Vector3();

interface Props2 extends Props {
  getLook?: () => THREE.Vector3 | null;
}

function AvatarImpl({ look, getAnim, anim = 'idle', held, seed = 0, getLook }: Props2) {
  const root = useRef<THREE.Group>(null!);
  const hips = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const elbowL = useRef<THREE.Group>(null!);
  const elbowR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const kneeL = useRef<THREE.Group>(null!);
  const kneeR = useRef<THREE.Group>(null!);
  const blink = useRef<THREE.Group>(null!);
  const wings = useRef<THREE.Group>(null!);
  const skirt = useRef<THREE.Group>(null!);
  const bow = useRef<THREE.Group>(null!);
  const tails = useRef<THREE.Group[]>([]);
  tails.current = [];
  const reg: Reg = (g) => { if (g && !tails.current.includes(g)) tails.current.push(g); };
  const phase = useRef(seed * 10);
  const sway = useRef({ v: 0, p: 0 });
  const nextBlink = useRef(2 + seed);

  const dress = isDress(look.top) || look.top === 'jaleco';
  const skin = look.skin;
  const skinM = useMemo(() => mat(skin, { rough: 0.55 }), [skin]);
  const faceM = useMemo(() => mat(skin, { emissive: 0.14, rough: 0.5 }), [skin]);
  const topC = look.topColor;
  const topTex = look.top === 'listrada' ? 'listras' : look.top === 'vestido-floral' ? 'bolinhas' : look.top === 'estrela' ? 'estrelas' : look.top === 'coracao' ? 'coracoes' : undefined;
  const topM = useMemo(() => mat(topC, { tex: topTex, repeat: 2, rough: 0.7 }), [topC, topTex]);
  const skirtM = useMemo(() => mat(topC, { tex: topTex, repeat: 2, rough: 0.7, ds: true }), [topC, topTex]);
  const legFull = ['calca', 'legging'].includes(look.bottom) && !(dress && look.bottom !== 'legging');
  const legKnee = look.bottom === 'bermuda';
  const legC = look.bottomColor;
  const sleeve = LONG_SLEEVE.includes(look.top) ? 'long' : SHORT_SLEEVE.includes(look.top) ? 'short' : 'none';
  const robot = !!look.robot;
  const bodyM = robot ? mat(skin, { metal: 0.6, rough: 0.3 }) : topM;

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const a = getAnim ? getAnim() : anim;
    const sp = a === 'run' ? 13 : a === 'walk' ? 8 : a === 'swim' ? 4 : 3;
    phase.current += dt * sp;
    const t = phase.current;
    const s = Math.sin(t);
    const L = legL.current, R = legR.current, AL = armL.current, AR = armR.current, H = hips.current, T = torso.current, HD = head.current;
    let hy = 0.7, tRx = 0, tRz = 0, hdRx = 0, hdRy = 0, hdRz = 0;
    let lx = 0, rx = 0, alx = 0, arx = 0, alz = 0.14, arz = -0.14, rootRx = 0, rootY = 0;
    let kl = 0, kr = 0, el = -0.15, er = -0.15;
    switch (a) {
      case 'walk': lx = s * 0.55; rx = -s * 0.55; kl = Math.max(0, -Math.cos(t)) * 0.7; kr = Math.max(0, Math.cos(t)) * 0.7; alx = -s * 0.45; arx = s * 0.45; el = -0.35; er = -0.35; hy += Math.abs(Math.cos(t)) * 0.025; break;
      case 'run': lx = s * 0.9; rx = -s * 0.9; kl = Math.max(0, -Math.cos(t)) * 1.3; kr = Math.max(0, Math.cos(t)) * 1.3; alx = -s * 0.9; arx = s * 0.9; el = -1.1; er = -1.1; tRx = 0.16; hy += Math.abs(Math.cos(t)) * 0.05; break;
      case 'jump': lx = -0.6; rx = 0.2; kl = 0.9; kr = 0.4; alx = -2.6; arx = -2.6; alz = 0.4; arz = -0.4; el = -0.2; er = -0.2; break;
      case 'swim': rootRx = 1.2; rootY = -0.15; lx = s * 0.4; rx = -s * 0.4; alx = -2.8 + s * 1.2; arx = -2.8 - s * 1.2; el = -0.2; er = -0.2; hdRx = -0.9; break;
      case 'dance': hy += Math.abs(Math.sin(t * 1.3)) * 0.07; tRz = Math.sin(t * 1.3) * 0.18; alx = -2.5 + Math.sin(t * 2.6) * 0.4; arx = -2.5 - Math.sin(t * 2.6) * 0.4; alz = 0.5; arz = -0.5; el = -0.5; er = -0.5; hdRz = Math.sin(t * 1.3) * 0.2; lx = Math.max(0, s) * 0.4; rx = Math.max(0, -s) * 0.4; kl = Math.max(0, s) * 0.6; kr = Math.max(0, -s) * 0.6; break;
      case 'cheer': hy += Math.abs(Math.sin(t * 2)) * 0.14; alx = -2.9; arx = -2.9; alz = 0.3 + Math.sin(t * 4) * 0.2; arz = -0.3 - Math.sin(t * 4) * 0.2; el = -0.1; er = -0.1; break;
      case 'wave': arx = -2.7; arz = -0.25; er = -0.6 + Math.sin(t * 5) * 0.45; hdRz = 0.1; break;
      case 'hug': alx = -1.35; arx = -1.35; alz = -0.35; arz = 0.35; el = -0.9; er = -0.9; tRx = 0.1; break;
      case 'sit': case 'drive': hy = 0.44; lx = -1.5; rx = -1.5; kl = 1.5; kr = 1.5; alx = a === 'drive' ? -1.0 : -0.3; arx = a === 'drive' ? -1.0 : -0.3; el = a === 'drive' ? -0.5 : -0.6; er = el; break;
      case 'ride': hy = 0.55; lx = -1.1; rx = -1.1; kl = 1.2; kr = 1.2; alz = 0.5; arz = -0.5; alx = -0.7; arx = -0.7; el = -0.8; er = -0.8; break;
      case 'sleep': rootRx = -Math.PI / 2; rootY = 0.25; hdRy = 0.3; break;
      case 'play': hy += Math.abs(Math.sin(t * 1.5)) * 0.22; lx = s * 0.8; rx = -s * 0.8; kl = 0.6; kr = 0.6; alx = -1.5 + s; arx = -1.5 - s; break;
      case 'work': arx = -1.0 + Math.sin(t * 3) * 0.2; alx = -0.8 - Math.sin(t * 3) * 0.2; el = -1.0; er = -1.1; hdRx = 0.25; break;
      case 'exercise': hy += Math.abs(Math.sin(t * 2)) * 0.1; lx = Math.sin(t * 2) * 0.9; rx = -Math.sin(t * 2) * 0.9; kl = 0.8; kr = 0.8; alx = -Math.sin(t * 2) * 1; arx = Math.sin(t * 2) * 1; el = -1.2; er = -1.2; break;
      case 'sing': arx = -1.3; arz = 0.2; er = -1.4; alx = -0.6 + Math.sin(t) * 0.3; alz = 0.6; hdRx = -0.15; tRz = Math.sin(t * 0.8) * 0.08; break;
      case 'paint': arx = -1.3 + Math.sin(t * 3) * 0.4; arz = Math.cos(t * 3) * 0.3; er = -0.6; break;
      case 'pet': arx = -1.25 + Math.sin(t * 3) * 0.12; arz = -0.05; er = -0.25; tRx = 0.12; hdRx = 0.3; break;
      case 'photo': alx = -1.4; arx = -1.4; alz = -0.25; arz = 0.25; el = -1.2; er = -1.2; break;
      default: hy += Math.sin(t * 0.7) * 0.008; alz = 0.14 + Math.sin(t * 0.7) * 0.03; arz = -alz; hdRy = Math.sin(t * 0.23) * 0.15;
    }
    // olhar para quem está perto / falando
    const target = getLook?.();
    if (target && HD && root.current && a !== 'sleep' && a !== 'swim') {
      _v.copy(target);
      root.current.worldToLocal(_v);
      const yaw = Math.atan2(_v.x, _v.z);
      if (Math.abs(yaw) < 1.6) { hdRy = THREE.MathUtils.clamp(yaw, -0.9, 0.9); hdRx = THREE.MathUtils.clamp(-Math.atan2(_v.y - 1.5, Math.hypot(_v.x, _v.z)) * 0.6, -0.35, 0.35); }
    }
    const k = Math.min(1, dt * 14);
    const lerp = THREE.MathUtils.lerp;
    H.position.y = lerp(H.position.y, hy, k);
    L.rotation.x = lerp(L.rotation.x, lx, k); R.rotation.x = lerp(R.rotation.x, rx, k);
    kneeL.current.rotation.x = lerp(kneeL.current.rotation.x, kl, k); kneeR.current.rotation.x = lerp(kneeR.current.rotation.x, kr, k);
    AL.rotation.x = lerp(AL.rotation.x, alx, k); AR.rotation.x = lerp(AR.rotation.x, arx, k);
    AL.rotation.z = lerp(AL.rotation.z, alz, k); AR.rotation.z = lerp(AR.rotation.z, arz, k);
    elbowL.current.rotation.x = lerp(elbowL.current.rotation.x, el, k); elbowR.current.rotation.x = lerp(elbowR.current.rotation.x, er, k);
    T.rotation.x = lerp(T.rotation.x, tRx, k); T.rotation.z = lerp(T.rotation.z, tRz, k);
    const hk = Math.min(1, dt * 6);
    HD.rotation.x = lerp(HD.rotation.x, hdRx, hk); HD.rotation.y = lerp(HD.rotation.y, hdRy, hk); HD.rotation.z = lerp(HD.rotation.z, hdRz, hk);
    root.current.rotation.x = lerp(root.current.rotation.x, rootRx, k);
    root.current.position.y = lerp(root.current.position.y, rootY, k);
    // cabelo, laço e saia balançam (movimento secundário)
    const speed = a === 'run' ? 1 : a === 'walk' ? 0.45 : a === 'jump' ? 0.8 : a === 'dance' ? 0.5 : 0;
    const sw = sway.current;
    const targetSw = speed * 0.55 + Math.sin(t * (a === 'run' ? 1 : 0.5)) * (0.08 + speed * 0.12);
    sw.v += (targetSw - sw.p) * dt * 40;
    sw.v *= Math.max(0, 1 - dt * 8);
    sw.p += sw.v * dt;
    for (const g of tails.current) { g.rotation.x = sw.p; g.rotation.z = Math.sin(t * 0.9) * 0.06 * (1 + speed); }
    if (bow.current) { bow.current.rotation.x = sw.p * 0.12; bow.current.rotation.z = Math.sin(t * 1.3) * 0.1 * speed; }
    if (skirt.current) {
      const fl = 1 + speed * 0.12 + (a === 'dance' ? Math.abs(Math.sin(t * 1.3)) * 0.15 : 0) + (a === 'jump' ? 0.18 : 0);
      skirt.current.scale.set(fl, 1 - (fl - 1) * 0.4, fl);
      skirt.current.rotation.y = Math.sin(t * 0.7) * 0.05;
    }
    // piscar de verdade (intervalos aleatórios)
    nextBlink.current -= dt;
    let bl = a === 'sleep' ? 0.1 : 1;
    if (nextBlink.current < 0) { bl = 0.1; if (nextBlink.current < -0.12) nextBlink.current = 1.8 + Math.random() * 3.2; }
    if (blink.current) blink.current.scale.y = lerp(blink.current.scale.y, bl, Math.min(1, dt * 30));
    if (wings.current) wings.current.rotation.y = Math.sin(t * 2.5) * 0.25;
  });

  const headAcc = look.accessories.filter((x) => !['colar', 'estetoscopio', 'asas-fada', 'asas-arcoiris', 'capa', 'mochila', 'mochila-unicornio', 'bolsa-coracao', 'bolsa-estrela', 'pochete'].includes(x));
  const bodyAcc = look.accessories.filter((x) => !headAcc.includes(x));
  const shoeC = look.shoesColor;
  const sole = mat('#ffffff', { rough: 0.6 });

  const leg = (sd: number, ref: React.RefObject<THREE.Group>, knee: React.RefObject<THREE.Group>) => {
    const thighC = legFull || (look.bottom === 'shorts' && !dress) || (legKnee && !dress) ? legC : skin;
    const shinC = legFull ? legC : skin;
    return (
      <group ref={ref} position={[sd * 0.11, 0, 0]}>
        <Cap m={thighC === skin ? skinM : undefined} c={thighC} p={[0, -0.16, 0]} s={[0.15, 0.16, 0.15]} />
        <group ref={knee} position={[0, -0.33, 0]}>
          <Sp m={shinC === skin ? skinM : undefined} c={shinC} s={[0.13, 0.13, 0.13]} />
          <Cap m={shinC === skin ? skinM : undefined} c={shinC} p={[0, -0.15, 0]} s={[0.12, 0.15, 0.12]} />
          {/* sapato arredondado */}
          <group position={[0, -0.32, 0.04]}>
            {look.shoes === 'botas' || look.shoes === 'galocha' ? (
              <><Cy c={shoeC} p={[0, 0.1, -0.03]} s={[0.15, 0.24, 0.15]} /><Sp c={shoeC} p={[0, 0, 0.05]} s={[0.16, 0.12, 0.26]} /></>
            ) : (
              <><Sp c={shoeC} p={[0, 0.01, 0.04]} s={[0.15, 0.12, 0.26]} /><Sp c={shoeC} p={[0, 0.03, -0.04]} s={[0.14, 0.12, 0.16]} /></>
            )}
            <Bx m={sole} c="" p={[0, -0.04, 0.02]} s={[0.15, 0.025, 0.27]} />
            {look.shoes === 'patins' && [-0.08, 0.08].map((z) => <Cy key={z} c="#ff5fa2" p={[0, -0.09, z]} s={[0.08, 0.05, 0.08]} r={[0, 0, Math.PI / 2]} />)}
            {look.shoes === 'tenis-luz' && <Bx c="#5ad1ff" e={1.5} p={[0, -0.02, 0.02]} s={[0.16, 0.02, 0.27]} />}
            {look.shoes === 'sapatilha' && <Sp c="#ff5fa2" p={[0, 0.06, 0.12]} s={[0.06, 0.04, 0.04]} />}
          </group>
        </group>
      </group>
    );
  };

  const arm = (sd: number, ref: React.RefObject<THREE.Group>, elbow: React.RefObject<THREE.Group>) => {
    const upper = sleeve === 'long' || sleeve === 'short' ? topC : skin;
    const lower = sleeve === 'long' ? topC : skin;
    return (
      <group ref={ref} position={[sd * 0.25, 0.46, 0]}>
        <Sp m={sleeve !== 'none' ? topM : skinM} c="" s={[0.15, 0.15, 0.15]} />
        <Cap m={upper === skin ? skinM : topM} c="" p={[sd * 0.01, -0.12, 0]} s={[0.1, 0.1, 0.1]} />
        {sleeve === 'short' && <Sp m={topM} c="" p={[sd * 0.01, -0.06, 0]} s={[0.16, 0.16, 0.16]} />}
        <group ref={elbow} position={[sd * 0.015, -0.24, 0]}>
          <Cap m={lower === skin ? skinM : topM} c="" p={[0, -0.1, 0]} s={[0.088, 0.1, 0.088]} />
          {sleeve === 'long' && <Cy c="#ffffff" p={[0, -0.19, 0]} s={[0.1, 0.03, 0.1]} />}
          {/* mão com polegar */}
          <group position={[0, -0.25, 0.01]}>
            <Sp m={skinM} c="" s={[0.1, 0.12, 0.08]} />
            <Cap m={skinM} c="" p={[-sd * 0.045, 0.01, 0.03]} s={[0.03, 0.035, 0.03]} r={[0.3, 0, sd * 0.6]} />
            {sd === 1 && held && <group position={[0, -0.03, 0.04]}><HeldItem toy={held} /></group>}
          </group>
        </group>
      </group>
    );
  };

  return (
    <group scale={look.height || 1}>
      <group ref={root}>
        <group ref={hips} position={[0, 0.7, 0]}>
          {leg(-1, legL, kneeL)}
          {leg(1, legR, kneeR)}
          {/* bumbum / quadril */}
          <Sp c={dress ? topC : look.bottomColor} m={dress ? topM : undefined} p={[0, 0.0, 0]} s={[0.4, 0.2, 0.3]} />
          <group ref={skirt}>
            {look.bottom === 'saia' && !dress && <mesh geometry={skirtGeo} material={mat(look.bottomColor, { ds: true })} position={[0, -0.08, 0]} scale={[0.95, 0.6, 0.85]} />}
            {look.bottom === 'saia-tutu' && !dress && <><Cy c={look.bottomColor} o={0.9} p={[0, -0.04, 0]} s={[0.7, 0.12, 0.62]} /><Cy c="#ffffff" o={0.7} p={[0, -0.07, 0]} s={[0.76, 0.05, 0.68]} /></>}
            {dress && look.top === 'vestido-princesa' && <><mesh geometry={princessGeo} material={skirtM} position={[0, -0.27, 0]} /><mesh geometry={ruffleGeo} material={mat('#ffffff')} position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.5, 0.5, 0.6]} /></>}
            {dress && look.top === 'vestido-fada' && <mesh geometry={skirtGeo} material={mat(topC, { opacity: 0.85, ds: true })} position={[0, -0.12, 0]} scale={[1.05, 1.1, 1]} />}
            {dress && ['vestido', 'vestido-floral', 'vestido-babados'].includes(look.top) && (
              <>
                <mesh geometry={skirtGeo} material={skirtM} position={[0, -0.12, 0]} />
                <mesh geometry={ruffleGeo} material={look.top === 'vestido-babados' ? mat('#ffffff') : topM} position={[0, -0.33, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.36, 0.36, 0.5]} />
              </>
            )}
            {look.top === 'jaleco' && <mesh geometry={skirtGeo} material={mat(topC, { ds: true })} position={[0, -0.18, 0]} scale={[0.8, 1.2, 0.75]} />}
          </group>
          <group ref={torso}>
            <mesh geometry={torsoGeo} material={bodyM} position={[0, 0.27, 0]} scale={[1, 1, 0.78]} />
            {look.top === 'avental' && <Bx c="#ffffff" p={[0, 0.2, 0.16]} s={[0.3, 0.36, 0.02]} />}
            {look.top === 'jaqueta' && <Bx c="#ffffff" p={[0, 0.27, 0.17]} s={[0.035, 0.48, 0.02]} />}
            {look.top === 'regata' && <Cy m={skinM} c="" p={[0, 0.5, 0]} s={[0.28, 0.05, 0.2]} />}
            {look.top === 'uniforme' && <Bx c="#ffd23f" p={[0.1, 0.38, 0.17]} s={[0.07, 0.07, 0.02]} />}
            {look.top === 'blusa-babado' && <mesh geometry={ruffleGeo} material={mat('#ffffff')} position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.2, 0.17, 0.5]} />}
            {dress && <Cy c={topC === '#ffffff' ? '#ff8fc7' : '#ffffff'} p={[0, 0.06, 0]} s={[0.47, 0.05, 0.37]} />}
            <Cy m={skinM} c="" p={[0, 0.56, 0]} s={[0.13, 0.1, 0.13]} />
            {arm(-1, armL, elbowL)}
            {arm(1, armR, elbowR)}
            {bodyAcc.map((id) => <BodyAccessory key={id} id={id} color={look.accColor} wingRef={wings} />)}
            {/* cabeça */}
            <group ref={head} position={[0, 0.86, 0]}>
              {robot ? <Bx m={mat(skin, { metal: 0.6, rough: 0.3 })} c="" s={[0.62, 0.56, 0.6]} /> : (
                <>
                  <Sp m={faceM} c="" s={[0.66, 0.64, 0.62]} />
                  <Sp m={faceM} c="" p={[0, -0.12, 0.05]} s={[0.52, 0.42, 0.5]} />
                </>
              )}
              {!robot && [-1, 1].map((sd) => <Sp key={sd} m={skinM} c="" p={[sd * 0.32, -0.02, 0]} s={[0.08, 0.12, 0.08]} />)}
              <Face look={look} blink={blink} />
              {!robot && <Hair style={look.hairStyle} color={look.hairColor} reg={reg} />}
              {headAcc.map((id) => (id === 'laco' ? <group key={id} ref={bow}><Accessory id={id} color={look.accColor} wingRef={wings} /></group> : <Accessory key={id} id={id} color={look.accColor} wingRef={wings} />))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export const Avatar = memo(AvatarImpl);

/** Versão leve (poucos objetos) para personagens distantes — mantém o celular fluido. */
function AvatarLowImpl({ look, getAnim, anim = 'idle' }: Props) {
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const hips = useRef<THREE.Group>(null!);
  const ph = useRef(Math.random() * 6);
  useFrame((_, dt) => {
    const a = getAnim ? getAnim() : anim;
    const mv = a === 'walk' || a === 'run' || a === 'play';
    ph.current += dt * (a === 'run' ? 12 : 8);
    const s = mv ? Math.sin(ph.current) * (a === 'run' ? 0.9 : 0.55) : 0;
    const sit = a === 'sit' || a === 'drive';
    legL.current.rotation.x = sit ? -1.5 : s;
    legR.current.rotation.x = sit ? -1.5 : -s;
    armL.current.rotation.x = a === 'wave' || a === 'dance' || a === 'cheer' ? -2.6 : -s;
    armR.current.rotation.x = a === 'wave' || a === 'dance' || a === 'cheer' ? -2.6 + Math.sin(ph.current * 2) * 0.3 : s;
    hips.current.position.y = sit ? 0.44 : 0.7;
  });
  const dress = isDress(look.top);
  const legC = ['calca', 'legging'].includes(look.bottom) && !dress ? look.bottomColor : look.skin;
  return (
    <group scale={look.height || 1}>
      <group ref={hips} position={[0, 0.7, 0]}>
        {[-1, 1].map((sd) => (
          <group key={sd} ref={sd < 0 ? legL : legR} position={[sd * 0.11, 0, 0]}>
            <Cap c={legC} p={[0, -0.32, 0]} s={[0.14, 0.3, 0.14]} />
            <Sp c={look.shoesColor} p={[0, -0.65, 0.05]} s={[0.15, 0.12, 0.26]} />
          </group>
        ))}
        {dress ? <Co c={look.topColor} p={[0, -0.15, 0]} s={[0.66, 0.42, 0.6]} /> : <Sp c={look.bottomColor} s={[0.4, 0.22, 0.3]} />}
        <Cy c={look.topColor} p={[0, 0.27, 0]} s={[0.44, 0.5, 0.34]} />
        {[-1, 1].map((sd) => (
          <group key={sd} ref={sd < 0 ? armL : armR} position={[sd * 0.26, 0.46, 0]}>
            <Cap c={look.skin} p={[0, -0.22, 0]} s={[0.1, 0.22, 0.1]} />
          </group>
        ))}
        <group position={[0, 0.86, 0]}>
          <Sp c={look.skin} s={[0.66, 0.64, 0.62]} />
          {look.hairStyle !== 'careca' && <Sp c={look.hairColor} p={[0, 0.12, -0.06]} s={[0.74, 0.64, 0.74]} />}
          {[-1, 1].map((sd) => <Sp key={sd} c="#1a1022" p={[sd * 0.12, 0, 0.31]} s={[0.09, 0.11, 0.04]} />)}
        </group>
      </group>
    </group>
  );
}
export const AvatarLow = memo(AvatarLowImpl);

export const lodQuality = { q: 'media' as string };
/** Escolhe a versão detalhada (perto) ou leve (longe) automaticamente */
export function LodAvatar(props: Props2 & { near?: number }) {
  const g = useRef<THREE.Group>(null!);
  const [hi, setHi] = useState(false);
  const acc = useRef(Math.random());
  const wp = useRef(new THREE.Vector3());
  useFrame(({ camera }, dt) => {
    acc.current += dt;
    if (acc.current < 0.4) return;
    acc.current = 0;
    g.current.getWorldPosition(wp.current);
    const d = wp.current.distanceTo(camera.position);
    const q = lodQuality.q;
    const lim = (props.near ?? 16) * (q === 'baixa' ? 0.6 : q === 'alta' ? 1.4 : 1);
    const want = hi ? d < lim * 1.15 : d < lim;
    if (want !== hi) setHi(want);
  });
  return <group ref={g}>{hi ? <Avatar {...props} /> : <AvatarLow {...props} />}</group>;
}
