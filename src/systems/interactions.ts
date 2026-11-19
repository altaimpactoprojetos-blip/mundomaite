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

export function findNearest(p: THREE.Vector3, yaw?: number): Interactable | null {
  let best: Interactable | null = null;
  let bestScore = Infinity;
  for (const it of items.values()) {
    const ip = it.pos();
    if (!ip) continue;
    const dy = Math.abs(ip.y - p.y);
    if (dy > 2.6) continue;
    const d = Math.hypot(ip.x - p.x, ip.z - p.z);
    if (d > it.radius) continue;
    let score = d - (it.priority ?? 0);
    if (yaw !== undefined && d > 0.3) {
      // prioriza o que está na frente da Maitê
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const dot = ((ip.x - p.x) * fx + (ip.z - p.z) * fz) / d;
      score += (1 - dot) * 3;
    }
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
