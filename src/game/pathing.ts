import * as THREE from 'three';
import { BUILDINGS, PROPERTIES } from '../data/world';
import { useGame } from '../store/gameStore';
import { houseDims } from '../world/House';

interface Room { x: number; z: number; rot: number; w: number; d: number; cz: number }

function rooms(): Room[] {
  const out: Room[] = BUILDINGS.map((b) => ({ x: b.pos[0], z: b.pos[1], rot: b.rot, w: b.size[0], d: b.size[2], cz: 0 }));
  const props = useGame.getState().properties;
  for (const p of PROPERTIES) {
    const cfg = props[p.id]?.owned ? props[p.id].house : p.preset;
    if (!cfg) continue;
    const { W, D } = houseDims(cfg);
    out.push({ x: p.pos[0], z: p.pos[1], rot: p.rot, w: W, d: D, cz: -2 });
  }
  return out;
}

function toLocal(r: Room, x: number, z: number) {
  const c = Math.cos(-r.rot), s = Math.sin(-r.rot);
  const dx = x - r.x, dz = z - r.z;
  return [dx * c + dz * s, -dx * s + dz * c - r.cz];
}
function toWorld(r: Room, lx: number, lz: number) {
  const c = Math.cos(r.rot), s = Math.sin(r.rot);
  const z2 = lz + r.cz;
  return new THREE.Vector3(r.x + lx * c + z2 * s, 0, r.z - lx * s + z2 * c);
}
const inside = (r: Room, x: number, z: number) => {
  const [lx, lz] = toLocal(r, x, z);
  return Math.abs(lx) < r.w / 2 && Math.abs(lz) < r.d / 2;
};

/** Caminho simples: se origem/destino estão em prédios diferentes, passa pelas portas. */
export function planPath(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
  const path: THREE.Vector3[] = [];
  const list = rooms();
  const a = list.find((r) => inside(r, from.x, from.z));
  const b = list.find((r) => inside(r, to.x, to.z));
  if (a !== b) {
    if (a) path.push(toWorld(a, 0, a.d / 2 - 1.2), toWorld(a, 0, a.d / 2 + 1.8));
    if (b) path.push(toWorld(b, 0, b.d / 2 + 1.8), toWorld(b, 0, b.d / 2 - 1.2));
  }
  path.forEach((p) => (p.y = from.y));
  path.push(to.clone());
  return path;
}
