import * as THREE from 'three';
import type { TextureKind } from '../types';
import { getTexture } from './textures';

// Cache de materiais para economizar memória e chamadas de desenho (bom para celular).
const cache = new Map<string, THREE.Material>();

export function mat(color: string, opts: { tex?: TextureKind; emissive?: number; opacity?: number; rough?: number; metal?: number; repeat?: number } = {}) {
  const key = `${color}|${opts.tex ?? ''}|${opts.emissive ?? 0}|${opts.opacity ?? 1}|${opts.rough ?? 0.8}|${opts.metal ?? 0}|${opts.repeat ?? 1}`;
  let m = cache.get(key);
  if (!m) {
    const tex = opts.tex ? getTexture(opts.tex) : null;
    let map: THREE.Texture | null = null;
    if (tex) {
      map = tex.clone();
      map.needsUpdate = true;
      map.repeat.set(opts.repeat ?? 1, opts.repeat ?? 1);
    }
    m = new THREE.MeshStandardMaterial({
      color,
      map,
      roughness: opts.rough ?? 0.8,
      metalness: opts.metal ?? 0,
      emissive: opts.emissive ? new THREE.Color(color) : new THREE.Color(0),
      emissiveIntensity: opts.emissive ?? 0,
      transparent: (opts.opacity ?? 1) < 1,
      opacity: opts.opacity ?? 1,
    });
    cache.set(key, m);
  }
  return m;
}

// Geometrias compartilhadas
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(0.5, 16, 12),
  sphereLow: new THREE.SphereGeometry(0.5, 10, 8),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  cylLow: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cone: new THREE.ConeGeometry(0.5, 1, 16),
  coneLow: new THREE.ConeGeometry(0.5, 1, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(0.5, 0.12, 8, 24),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 4, 10),
};
