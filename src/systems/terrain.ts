import { ISLANDS, SEA_Z, WATER_LEVEL, WORLD_HALF } from '../data/world';

// Áreas de água dinâmicas (piscinas)
export interface WaterRect { minX: number; maxX: number; minZ: number; maxZ: number; level: number }
const pools = new Map<string, WaterRect[]>();
export function setPools(key: string, rects: WaterRect[]) {
  pools.set(key, rects);
}

export interface Ground { y: number; water: number | null }

/** Altura do chão do terreno e nível da água (se houver). */
export function groundAt(x: number, z: number): Ground {
  for (const g of pools.values())
    for (const p of g)
      if (x > p.minX && x < p.maxX && z > p.minZ && z < p.maxZ) return { y: p.level - 1.6, water: p.level };
  for (const i of ISLANDS) {
    const d = Math.hypot(x - i.x, z - i.z);
    if (d < i.r) return { y: d > i.r - 5 ? 0.3 * ((i.r - d) / 5) : 0.3, water: null };
  }
  if (z > SEA_Z) {
    const depth = Math.min(3.5, (z - SEA_Z) * 0.12 + 0.2);
    return { y: WATER_LEVEL - depth, water: WATER_LEVEL };
  }
  return { y: 0, water: null };
}

export const clampWorld = (v: number, max = WORLD_HALF) => Math.max(-max, Math.min(max, v));
export const SEA_LIMIT = 430;
