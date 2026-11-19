import * as THREE from 'three';
import type { AnimName } from '../types';

// Estado de tempo real (muda a cada frame) — fica fora do React/Zustand para desempenho.
export const rt = {
  player: {
    pos: new THREE.Vector3(65, 0, 30),
    velY: 0,
    yaw: Math.PI,
    onGround: true,
    swimming: false,
    anim: 'idle' as AnimName,
    emote: null as null | { anim: AnimName; until: number },
    seat: null as null | { pos: THREE.Vector3; yaw: number; anim: AnimName; label: string },
    ride: null as null | string, // brinquedo do parque
    rideExit: null as null | THREE.Vector3,
    mounted: null as null | string, // pet montado
    speedBoost: 1,
    lastJump: 0,
    walkTo: null as null | THREE.Vector3,
    walkPath: [] as THREE.Vector3[],
    walkAction: null as null | (() => void),
    walkStuck: 0,
  },
  cam: { yaw: 0, pitch: 0.38, dist: 10, target: new THREE.Vector3(), shake: 0 },
  vehicle: {
    id: null as string | null,
    pos: new THREE.Vector3(),
    yaw: 0,
    speed: 0,
    alt: 0,
    pitch: 0,
    roll: 0,
  },
  time: 0,
  hour: 9,
  floorLevel: 0,
  canvas: null as HTMLCanvasElement | null,
  npcPos: new Map<string, THREE.Vector3>(),
  npcAnim: new Map<string, { anim: AnimName; until: number; follow: number }>(),
  effects: [] as { id: number; kind: 'hearts' | 'sparkles' | 'bubbles' | 'notes' | 'splash' | 'stars' | 'confetti' | 'water'; pos: THREE.Vector3; t0: number }[],
  effectId: 0,
  buildPointer: new THREE.Vector3(),
  buildHover: false,
  dragging: false,
  walkMarker: new THREE.Vector3(0, -100, 0),
  walkMarkerT: -10,
};

export function spawnEffect(kind: (typeof rt.effects)[number]['kind'], pos: THREE.Vector3 | [number, number, number]) {
  const p = Array.isArray(pos) ? new THREE.Vector3(...pos) : pos.clone();
  rt.effects.push({ id: ++rt.effectId, kind, pos: p, t0: rt.time });
  if (rt.effects.length > 40) rt.effects.shift();
}

export function emote(anim: AnimName, seconds = 2.5) {
  rt.player.emote = { anim, until: rt.time + seconds };
}

export function teleportPlayer(x: number, y: number, z: number) {
  rt.player.pos.set(x, y, z);
  rt.player.velY = 0;
  rt.player.seat = null;
  rt.player.ride = null;
}
