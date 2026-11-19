import * as THREE from 'three';

// Registro de coisas com as quais a jogadora pode interagir (tecla E / botão ✋).
export interface Interactable {
  id: string;
  label: string;
  icon: string;
  radius: number;
  pos: () => THREE.Vector3 | null;
  action: () => void;
  priority?: number;
}

const items = new Map<string, Interactable>();
export function registerInteractable(i: Interactable) {
  items.set(i.id, i);
  return () => {
    if (items.get(i.id) === i) items.delete(i.id);
  };
}
export function unregister(id: string) {
  items.delete(id);
}

export function findNearest(p: THREE.Vector3): Interactable | null {
  let best: Interactable | null = null;
  let bestScore = Infinity;
  for (const it of items.values()) {
    const ip = it.pos();
    if (!ip) continue;
    const dy = Math.abs(ip.y - p.y);
    if (dy > 2.6) continue;
    const d = Math.hypot(ip.x - p.x, ip.z - p.z);
    if (d > it.radius) continue;
    const score = d - (it.priority ?? 0);
    if (score < bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return best;
}

/** Interação mais próxima de um ponto tocado na tela (ignora o raio). */
export function findAtPoint(p: THREE.Vector3, max = 2.2): Interactable | null {
  let best: Interactable | null = null;
  let bd = max;
  for (const it of items.values()) {
    const ip = it.pos();
    if (!ip) continue;
    const d = Math.hypot(ip.x - p.x, ip.z - p.z);
    if (d < bd && Math.abs(ip.y - p.y) < 3) { bd = d; best = it; }
  }
  return best;
}
export function radiusOf(it: Interactable) { return it.radius; }
