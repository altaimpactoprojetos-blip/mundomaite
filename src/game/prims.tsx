import type { ReactNode } from 'react';
import type * as THREE from 'three';
import { GEO, mat } from '../systems/materials';
import type { TextureKind } from '../types';

type V3 = [number, number, number];
interface P {
  p?: V3;
  s?: V3;
  r?: V3;
  c: string;
  tex?: TextureKind;
  e?: number;
  o?: number;
  m?: THREE.Material;
  low?: boolean;
  rep?: number;
  shadow?: boolean;
  children?: ReactNode;
  name?: string;
}

const material = (pr: P) => pr.m ?? mat(pr.c, { tex: pr.tex, emissive: pr.e, opacity: pr.o, repeat: pr.rep });

/** Caixa (tamanho via s) */
export const Bx = (pr: P) => (
  <mesh geometry={GEO.box} material={material(pr)} position={pr.p} scale={pr.s} rotation={pr.r} castShadow={pr.shadow} receiveShadow={pr.shadow} name={pr.name}>
    {pr.children}
  </mesh>
);
/** Cilindro (s = [diâmetro, altura, diâmetro]) */
export const Cy = (pr: P) => (
  <mesh geometry={pr.low ? GEO.cylLow : GEO.cyl} material={material(pr)} position={pr.p} scale={pr.s} rotation={pr.r} castShadow={pr.shadow} />
);
/** Esfera (s = diâmetros) */
export const Sp = (pr: P) => (
  <mesh geometry={pr.low ? GEO.sphereLow : GEO.sphere} material={material(pr)} position={pr.p} scale={pr.s} rotation={pr.r} castShadow={pr.shadow} />
);
/** Cone */
export const Co = (pr: P) => (
  <mesh geometry={pr.low ? GEO.coneLow : GEO.cone} material={material(pr)} position={pr.p} scale={pr.s} rotation={pr.r} castShadow={pr.shadow} />
);
export const To = (pr: P) => <mesh geometry={GEO.torus} material={material(pr)} position={pr.p} scale={pr.s} rotation={pr.r} />;
export const Pl = (pr: P) => <mesh geometry={GEO.plane} material={material(pr)} position={pr.p} scale={pr.s} rotation={pr.r} receiveShadow={pr.shadow} />;
export const Cap = (pr: P) => <mesh geometry={GEO.capsule} material={material(pr)} position={pr.p} scale={pr.s} rotation={pr.r} castShadow={pr.shadow} />;
