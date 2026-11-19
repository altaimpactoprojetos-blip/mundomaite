import { getModel } from '../data/models';
import { localBox, type Box } from './colliders';
import type { Vec3 } from '../types';
import type { WaterRect } from './terrain';

/** Calcula as caixas de colisão de um objeto (móvel/peça de construção). */
export function objectBoxes(model: string, pos: Vec3, rot: number, scale: Vec3 = [1, 1, 1]): Box[] {
  const def = getModel(model);
  if (def.solid === false) return [];
  const [sx, sy, sz] = scale;
  const W = def.size[0] * sx;
  const H = def.size[1] * sy;
  const D = def.size[2] * sz;
  const [x, y, z] = pos;
  const lb = (lx: number, ly: number, lz: number, w: number, h: number, d: number) => localBox(x, y, z, rot, lx, ly, lz, w, h, d);
  switch (def.parts) {
    case 'door': {
      if (model === 'castelinho') {
        return [lb(0, 0, -1.3 * sz, W, H * 0.6, 0.2), lb(-1.4 * sx, 0, 0, 0.2, H * 0.6, D), lb(1.4 * sx, 0, 0, 0.2, H * 0.6, D)];
      }
      const side = W * 0.325;
      return [lb(-W / 2 + side / 2, 0, 0, side, H, D), lb(W / 2 - side / 2, 0, 0, side, H, D), lb(0, H - 0.6 * sy, 0, W, 0.6 * sy, D)];
    }
    case 'arch':
      return [lb(-W / 2 + 0.3 * sx, 0, 0, 0.6 * sx, H, D), lb(W / 2 - 0.3 * sx, 0, 0, 0.6 * sx, H, D)];
    case 'stairs': {
      const n = 9;
      const out: Box[] = [];
      for (let i = 0; i < n; i++) {
        const h = ((i + 1) / n) * H;
        out.push(lb(0, 0, -D / 2 + (i + 0.5) * (D / n), W, h, D / n + 0.02));
      }
      return out;
    }
  }
  if (model === 'cama-elastica' || model === 'castelo-inflavel') return [lb(0, 0, 0, W, 0.75 * sy, D)];
  if (model === 'arvore' || model === 'arvore-flor' || model === 'palmeira' || model === 'pinheiro' || model === 'poste')
    return [lb(0, 0, 0, 0.6 * sx, H, 0.6 * sz)];
  if (model === 'sofa' || model === 'poltrona') return [lb(0, 0, 0, W, 0.55 * sy, D), lb(0, 0, -D / 2 + 0.12 * sz, W, H, 0.25 * sz)];
  if (model === 'cama' || model === 'cama-casal') return [lb(0, 0, 0, W, 0.66 * sy, D)];
  return [lb(0, 0, 0, W, H, D)];
}

export function objectWater(model: string, pos: Vec3, rot: number, scale: Vec3 = [1, 1, 1]): WaterRect | null {
  const def = getModel(model);
  if (!def.water) return null;
  const b = localBox(pos[0], pos[1], pos[2], rot, 0, 0, 0, def.size[0] * scale[0], 1, def.size[2] * scale[2]);
  return { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ, level: pos[1] + 0.06 };
}
