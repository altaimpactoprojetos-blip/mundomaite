import { query } from '../systems/colliders';
import { groundAt } from '../systems/terrain';

export const STEP = 0.6;

/** Verifica se um cilindro (como caixa) colide com algum obstáculo entre as alturas y0..y1 */
export function blocked(x: number, z: number, r: number, y0: number, y1: number) {
  const list = query(x - r, x + r, z - r, z + r);
  for (const b of list) {
    if (b.maxY > y0 && b.minY < y1 && x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) return true;
  }
  return false;
}

/** Altura do chão (terreno ou topo de objeto) abaixo de y + step */
export function floorAt(x: number, z: number, r: number, y: number, step = STEP) {
  const g = groundAt(x, z);
  let top = g.y;
  const list = query(x - r, x + r, z - r, z + r);
  for (const b of list) {
    if (b.maxY <= y + step && b.maxY > top && x + r * 0.7 > b.minX && x - r * 0.7 < b.maxX && z + r * 0.7 > b.minZ && z - r * 0.7 < b.maxZ) top = b.maxY;
  }
  return { top, water: g.water, terrainY: g.y };
}

/** Move com deslizamento nas paredes. Retorna nova posição. */
export function slide(x: number, z: number, dx: number, dz: number, r: number, y0: number, y1: number): [number, number, boolean] {
  let hit = false;
  let nx = x + dx;
  if (blocked(nx, z, r, y0, y1)) { nx = x; hit = true; }
  let nz = z + dz;
  if (blocked(nx, nz, r, y0, y1)) { nz = z; hit = true; }
  return [nx, nz, hit];
}
