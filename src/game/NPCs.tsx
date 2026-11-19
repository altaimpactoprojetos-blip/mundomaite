import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AnimName, Appearance, NPCDef, NPCRoutineStep } from '../types';
import { NPCS } from '../data/npcs';
import { Avatar } from './Avatar';
import { DEFAULT_APPEARANCE } from '../store/defaults';
import { SKIN_TONES, HAIR_COLORS, CLOTH_COLORS, EYE_COLORS } from '../data/palette';
import { rt } from '../systems/runtime';
import { registerInteractable } from '../systems/interactions';
import { useGame } from '../store/gameStore';
import { slide } from './physics';
import { emojiTexture } from '../systems/textures';
import { BlobShadow } from './Player';

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, a: readonly T[]) => a[Math.floor(r() * a.length)];

export function npcLook(n: NPCDef): Appearance {
  const r = hash(n.id);
  const styles = ['curto', 'longo', 'rabo', 'chiquinhas', 'coque', 'cacheado', 'trancas', 'franja', 'black'] as const;
  const tops = ['camiseta', 'listrada', 'estrela', 'moletom', 'vestido', 'blusa-babado', 'regata', 'coracao'];
  const bottoms = ['shorts', 'saia', 'calca', 'legging'];
  return {
    ...DEFAULT_APPEARANCE,
    name: n.name,
    skin: pick(r, SKIN_TONES),
    hairStyle: pick(r, styles),
    hairColor: pick(r, HAIR_COLORS.slice(0, 8)),
    eyeColor: pick(r, EYE_COLORS),
    eyeStyle: r() > 0.5 ? 'brilhante' : 'redondo',
    top: pick(r, tops),
    topColor: pick(r, CLOTH_COLORS),
    bottom: pick(r, bottoms),
    bottomColor: pick(r, CLOTH_COLORS),
    shoes: pick(r, ['tenis', 'sandalia', 'botas', 'sapatilha']),
    shoesColor: pick(r, CLOTH_COLORS),
    accessories: r() > 0.6 ? [pick(r, ['laco', 'bone', 'flor-cabelo', 'tiara'])] : [],
    accColor: pick(r, CLOTH_COLORS),
    makeup: { blush: r() > 0.5, glitter: false, lips: false },
    expression: pick(r, ['feliz', 'sorriso', 'calma'] as const),
    personality: n.personality,
    height: 1,
    ...n.look,
  };
}

export function currentStep(n: NPCDef, hour: number): NPCRoutineStep {
  for (const s of n.routine) {
    const inRange = s.from <= s.to ? hour >= s.from && hour < s.to : hour >= s.from || hour < s.to;
    if (inRange) return s;
  }
  return n.routine[0];
}

const ACT_ANIM: Record<string, AnimName> = { work: 'work', sit: 'sit', dance: 'dance', exercise: 'exercise', sleep: 'sleep', play: 'play' };

const NPCActor = memo(function NPCActor({ n }: { n: NPCDef }) {
  const look = useMemo(() => npcLook(n), [n]);
  const group = useRef<THREE.Group>(null!);
  const bubble = useRef<THREE.Sprite>(null!);
  const st = useRef({
    pos: new THREE.Vector3(),
    yaw: Math.random() * 6,
    anim: 'idle' as AnimName,
    goal: null as THREE.Vector3 | null,
    wait: 0,
    stuck: 0,
    pathIdx: 0,
    stepKey: '',
    hidden: false,
    init: false,
  });
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);
  const tick = useRef(Math.random());
  const bubbleTex = useMemo(() => emojiTexture(n.icon), [n.icon]);

  useEffect(() => {
    rt.npcPos.set(n.id, st.current.pos);
    return registerInteractable({
      id: `npc-${n.id}`, label: `Conversar com ${n.name}`, icon: '💬', radius: 2.6, priority: 1.2,
      pos: () => (st.current.hidden || !nearRef.current ? null : st.current.pos),
      action: () => {
        const s = useGame.getState();
        s.set({ dialog: { npcId: n.id, text: '' } });
      },
    });
  }, [n]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const S = st.current;
    const P = rt.player.pos;
    const step = currentStep(n, rt.hour);
    const key = `${step.from}-${step.to}`;
    const dist = Math.hypot(P.x - S.pos.x, P.z - S.pos.z);
    tick.current += dt;
    const isNear = dist < (useGame.getState().settings.quality === 'baixa' ? 50 : 75);
    if (isNear !== nearRef.current) { nearRef.current = isNear; setNear(isNear); }

    if (!S.init || (key !== S.stepKey && !isNear)) {
      // longe da jogadora: teleporta direto para a atividade
      S.init = true;
      S.stepKey = key;
      const p0 = step.path ? step.path[0] : step.at;
      S.pos.set(p0[0] + (Math.random() - 0.5) * (step.radius ?? 0), 0, p0[1] + (Math.random() - 0.5) * (step.radius ?? 0));
      S.goal = null;
    }
    S.stepKey = key;
    S.hidden = step.activity === 'sleep';
    if (!isNear && tick.current < 1) return;
    tick.current = 0;
    if (!isNear) return;

    const extra = rt.npcAnim.get(n.id);
    const following = extra && extra.follow > rt.time;
    const emoting = extra && extra.until > rt.time;

    let goal: THREE.Vector3 | null = null;
    let anim: AnimName = 'idle';
    if (dialogOpenFor(n.id)) {
      S.yaw = Math.atan2(P.x - S.pos.x, P.z - S.pos.z);
      anim = emoting ? extra!.anim : 'wave';
      if (!emoting) anim = 'idle';
    } else if (emoting && !following) {
      anim = extra!.anim;
      S.yaw = Math.atan2(P.x - S.pos.x, P.z - S.pos.z);
    } else if (following) {
      const d = dist;
      if (d > 2.5) goal = P.clone();
      else S.yaw = Math.atan2(P.x - S.pos.x, P.z - S.pos.z);
      if (emoting) anim = extra!.anim;
    } else if (step.activity === 'patrol' && step.path) {
      const t = step.path[S.pathIdx % step.path.length];
      goal = new THREE.Vector3(t[0], 0, t[1]);
      if (Math.hypot(t[0] - S.pos.x, t[1] - S.pos.z) < 1.5) S.pathIdx++;
    } else {
      const center = new THREE.Vector3(step.at[0], 0, step.at[1]);
      const r = step.radius ?? 1;
      const fixed = ['work', 'sit', 'dance', 'exercise', 'sleep'].includes(step.activity);
      if (fixed) {
        if (S.pos.distanceTo(center) > Math.max(1.2, r)) goal = center;
        else {
          anim = ACT_ANIM[step.activity] ?? 'idle';
          if (dist < 5) { S.yaw = Math.atan2(P.x - S.pos.x, P.z - S.pos.z); if (step.activity === 'work') anim = 'idle'; }
        }
      } else {
        if (!S.goal || S.pos.distanceTo(S.goal) < 0.8) {
          S.wait -= dt;
          if (S.wait <= 0) {
            const a = Math.random() * Math.PI * 2;
            const rr = Math.random() * r;
            S.goal = center.clone().add(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr));
            S.wait = 1 + Math.random() * 3;
          }
          anim = step.activity === 'play' ? 'play' : 'idle';
          if (step.activity === 'play' && Math.random() < 0.003) rt.npcAnim.set(n.id, { anim: 'cheer', until: rt.time + 1.5, follow: 0 });
        }
        goal = S.goal && S.pos.distanceTo(S.goal) >= 0.8 ? S.goal : null;
      }
    }

    if (goal) {
      const dx = goal.x - S.pos.x, dz = goal.z - S.pos.z;
      const l = Math.hypot(dx, dz);
      const run = following ? dist > 6 : step.activity === 'play';
      const sp = (run ? 6 : 2.6) * dt;
      const [nx, nz, hit] = slide(S.pos.x, S.pos.z, (dx / l) * sp, (dz / l) * sp, 0.3, 0.55, 1.7);
      S.pos.x = nx; S.pos.z = nz;
      if (hit) { S.stuck += dt; if (S.stuck > 1.5) { S.goal = null; S.stuck = 0; if (S.pos.distanceTo(new THREE.Vector3(step.at[0], 0, step.at[1])) > 30 && dist > 25) S.pos.set(step.at[0], 0, step.at[1]); } }
      else S.stuck = 0;
      const ty = Math.atan2(dx, dz);
      let diff = ty - S.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      S.yaw += diff * Math.min(1, dt * 8);
      anim = run ? 'run' : 'walk';
    }
    S.anim = anim;
    if (!group.current) return;
    group.current.position.copy(S.pos);
    group.current.rotation.y = S.yaw;
    group.current.visible = !S.hidden;
    if (bubble.current) bubble.current.visible = dist < 14 && !S.hidden;
  });

  if (!near) return null;
  return (
    <group ref={group}>
      <Avatar look={look} getAnim={() => st.current.anim} seed={n.id.length} />
      <BlobShadow size={look.height || 1} />
      <sprite ref={bubble} position={[0, 2.5 * (look.height || 1), 0]} scale={[0.6, 0.6, 0.6]}>
        <spriteMaterial map={bubbleTex} transparent depthWrite={false} />
      </sprite>
    </group>
  );
});

function dialogOpenFor(id: string) {
  return useGame.getState().dialog?.npcId === id;
}

export function NPCs() {
  const list = useMemo(() => NPCS.filter((n) => n.id !== 'seu-ze'), []);
  return (
    <>
      {list.map((n) => <NPCActor key={n.id} n={n} />)}
    </>
  );
}
