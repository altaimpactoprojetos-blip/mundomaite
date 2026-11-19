import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rt } from '../systems/runtime';
import { emojiTexture } from '../systems/textures';

const EMOJI: Record<string, string[]> = {
  hearts: ['💗', '💖', '💕'],
  sparkles: ['✨', '⭐', '💫'],
  bubbles: ['🫧'],
  notes: ['🎵', '🎶'],
  splash: ['💦'],
  stars: ['⭐', '✨'],
  confetti: ['🎉', '🎊', '✨', '💖'],
  water: ['💧'],
};
const N = 120;
const PER = 7;
const LIFE = 1.6;

/** Partículas de emoji (corações, brilhos, bolhas...) */
export function Effects() {
  const sprites = useRef<THREE.Sprite[]>([]);
  const mats = useMemo(() => Array.from({ length: N }, () => new THREE.SpriteMaterial({ transparent: true, depthWrite: false })), []);
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random() - 0.5, Math.random(), Math.random() - 0.5, Math.random()]), []);
  useFrame(() => {
    let k = 0;
    const now = rt.time;
    rt.effects = rt.effects.filter((e) => now - e.t0 < LIFE);
    for (const e of rt.effects) {
      const t = (now - e.t0) / LIFE;
      const list = EMOJI[e.kind];
      for (let i = 0; i < PER && k < N; i++, k++) {
        const s = sprites.current[k];
        if (!s) continue;
        const sd = seeds[k];
        const tex = emojiTexture(list[(i + e.id) % list.length]);
        if (mats[k].map !== tex) { mats[k].map = tex; mats[k].needsUpdate = true; }
        const spread = e.kind === 'confetti' ? 4 : e.kind === 'splash' ? 2 : 1.4;
        const up = e.kind === 'splash' ? Math.sin(t * Math.PI) * 1.5 : e.kind === 'bubbles' || e.kind === 'notes' || e.kind === 'hearts' ? t * 2.5 : t * 2;
        s.position.set(e.pos.x + sd[0] * spread * t * 2, e.pos.y + 1 + up + sd[1] * 0.5, e.pos.z + sd[2] * spread * t * 2);
        const sc = (0.35 + sd[3] * 0.25) * (1 - t * 0.4);
        s.scale.set(sc, sc, sc);
        mats[k].opacity = 1 - t;
        s.visible = true;
      }
    }
    for (; k < N; k++) if (sprites.current[k]) sprites.current[k].visible = false;
  });
  return (
    <group>
      {mats.map((m, i) => (
        <sprite key={i} ref={(s) => { if (s) sprites.current[i] = s; }} material={m} visible={false} />
      ))}
    </group>
  );
}
