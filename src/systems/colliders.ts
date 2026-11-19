// Colisão simples com caixas alinhadas (AABB) + grade espacial.
export interface Box {
  minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number;
}

const CELL = 12;
const groups = new Map<string, Box[]>();
const grid = new Map<string, Set<Box>>();
const boxCells = new Map<Box, string[]>();
export let colliderVersion = 0;

const cellKey = (cx: number, cz: number) => cx + ',' + cz;

function insert(b: Box) {
  const keys: string[] = [];
  for (let cx = Math.floor(b.minX / CELL); cx <= Math.floor(b.maxX / CELL); cx++)
    for (let cz = Math.floor(b.minZ / CELL); cz <= Math.floor(b.maxZ / CELL); cz++) {
      const k = cellKey(cx, cz);
      let s = grid.get(k);
      if (!s) grid.set(k, (s = new Set()));
      s.add(b);
      keys.push(k);
    }
  boxCells.set(b, keys);
}

export function setGroup(name: string, boxes: Box[]) {
  removeGroup(name);
  groups.set(name, boxes);
  for (const b of boxes) insert(b);
  colliderVersion++;
}

export function removeGroup(name: string) {
  const old = groups.get(name);
  if (!old) return;
  for (const b of old) {
    for (const k of boxCells.get(b) ?? []) grid.get(k)?.delete(b);
    boxCells.delete(b);
  }
  groups.delete(name);
  colliderVersion++;
}

const out: Box[] = [];
const seen = new Set<Box>();
export function query(minX: number, maxX: number, minZ: number, maxZ: number): Box[] {
  out.length = 0;
  seen.clear();
  for (let cx = Math.floor(minX / CELL); cx <= Math.floor(maxX / CELL); cx++)
    for (let cz = Math.floor(minZ / CELL); cz <= Math.floor(maxZ / CELL); cz++) {
      const s = grid.get(cellKey(cx, cz));
      if (!s) continue;
      for (const b of s) {
        if (seen.has(b)) continue;
        seen.add(b);
        if (b.maxX > minX && b.minX < maxX && b.maxZ > minZ && b.minZ < maxZ) out.push(b);
      }
    }
  return out;
}

/** Caixa a partir do centro da base, com rotação em Y (AABB envolvente). */
export function boxAt(x: number, y: number, z: number, w: number, h: number, d: number, rot = 0): Box {
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const hw = (w * c + d * s) / 2;
  const hd = (w * s + d * c) / 2;
  return { minX: x - hw, maxX: x + hw, minY: y, maxY: y + h, minZ: z - hd, maxZ: z + hd };
}

/** Converte uma caixa local (de um objeto com posição/rotação) em caixa do mundo. */
export function localBox(
  ox: number, oy: number, oz: number, rot: number,
  lx: number, ly: number, lz: number, w: number, h: number, d: number,
): Box {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const wx = ox + lx * c + lz * s;
  const wz = oz - lx * s + lz * c;
  return boxAt(wx, oy + ly, wz, w, h, d, rot);
}

/** Verifica se um ponto está dentro de algum colisor (para a câmera). */
export function pointBlocked(x: number, y: number, z: number): boolean {
  const list = query(x - 0.1, x + 0.1, z - 0.1, z + 0.1);
  for (const b of list) if (y > b.minY && y < b.maxY && x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true;
  return false;
}
