import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { TOUR } from '../data/tour';
import { MANSION, lotPoint, inside } from '../data/npcs';
import { BUILDINGS } from '../data/world';
import { rt, teleportPlayer, spawnEffect } from '../systems/runtime';
import { registerInteractable } from '../systems/interactions';
import { emojiTexture } from '../systems/textures';
import { houseDims } from '../world/House';
import { makeCafeTask } from './Tasks';
import { petFx } from './Pets';
import { takePhoto } from '../ui/photo';
import { sfx } from '../systems/audio';

const FOUNTAIN = new THREE.Vector3(65, 0, -5);
const cafe = BUILDINGS.find((b) => b.id === 'cafeteria')!;

function mansionLocal(lx: number, lz: number) {
  const [x, z] = lotPoint(lx, lz);
  return new THREE.Vector3(x, 0, z);
}
function mansionDoor() {
  const s = useGame.getState();
  const cfg = s.properties[MANSION.id]?.house ?? MANSION.preset!;
  const { D } = houseDims(cfg);
  return { D, out: mansionLocal(0, -2 + D / 2 + 2.5) };
}

/** Começa o passeio guiado (garante a Mansão das Estrelas e o Purpurina sem apagar nada salvo). */
export function startTour() {
  const s = useGame.getState();
  if (!s.properties[MANSION.id]?.owned) {
    s.set({ properties: { ...s.properties, [MANSION.id]: { owned: true, house: { ...MANSION.preset! } } } });
  }
  s.set({ homeId: MANSION.id });
  let uni = useGame.getState().pets.find((p) => p.species === 'unicornio');
  if (!uni) {
    uni = useGame.getState().adoptPet('unicornio', '#ffffff');
    useGame.getState().updatePet(uni.id, { name: 'Purpurina', accessory: 'laco', accColor: '#ff5fa2' });
  }
  rt.player.mounted = null;
  rt.player.seat = null;
  rt.hour = 8.5;
  const p = mansionLocal(0, 1.4);
  teleportPlayer(p.x, 0.1, p.z);
  rt.player.yaw = MANSION.rot;
  rt.cam.yaw = MANSION.rot + Math.PI;
  useGame.getState().set({ activePet: uni.id, tour: { step: 0, home: MANSION.id, done: false }, task: null, dialog: null, minigame: null, overlay: null });
  petFx.callAt = rt.time;
  useGame.getState().openPanel('character', 'roupas');
  useGame.getState().toast('Um passeio com Purpurina! Primeiro, escolha sua roupa 👗', '🦄');
}

export function tourTarget(step: string): THREE.Vector3 | null {
  switch (step) {
    case 'sair': return mansionDoor().out;
    case 'vizinho': { const [x, z] = lotPoint(6, 17.5); return new THREE.Vector3(x, 0, z); }
    case 'carinho': case 'montar': return rt.petPos.y > -50 ? rt.petPos.clone() : null;
    case 'cafe': { const [x, z] = inside('cafeteria', 0, cafe.size[2] / 2 + 3); return new THREE.Vector3(x, 0, z); }
    case 'bebida': { const t = useGame.getState().task; if (t?.kind === 'cafe' && useGame.getState().held?.startsWith('bebida:')) return new THREE.Vector3(...t.targets[0].pos); const [x, z] = inside('cafeteria', 0, -2); return new THREE.Vector3(x, 0, z); }
    case 'praca': case 'foto': return FOUNTAIN.clone();
  }
  return null;
}

export function Tour() {
  const tour = useGame((s) => s.tour);
  const marker = useRef<THREE.Sprite>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const tex = useMemo(() => emojiTexture('⬇️'), []);
  const acc = useRef(0);
  const step = tour && !tour.done ? TOUR[tour.step] : null;

  // foto junto à fonte
  useEffect(() => {
    if (step?.id !== 'foto') return;
    const p = FOUNTAIN.clone().add(new THREE.Vector3(0, 0, 6));
    return registerInteractable({
      id: 'tour-foto', label: 'Foto com Purpurina na fonte', icon: '📸', radius: 7, priority: 3, pos: () => p,
      action: () => {
        rt.player.mounted = null;
        teleportPlayer(65.8, 0, 2.2);
        rt.player.yaw = 0;
        rt.cam.yaw = 0;
        rt.cam.dist = 6;
        petFx.callAt = rt.time;
        rt.player.emote = { anim: 'cheer', until: rt.time + 2 };
        sfx('camera');
        setTimeout(() => {
          (window as unknown as { __zone?: string }).__zone = 'Fonte da Praça com Purpurina';
          takePhoto();
          useGame.getState().tourEvent('foto-fonte');
          spawnEffect('confetti', rt.player.pos);
        }, 900);
      },
    });
  }, [step?.id]);

  useFrame((_, dt) => {
    const s = useGame.getState();
    const st = s.tour && !s.tour.done ? TOUR[s.tour.step] : null;
    const tgt = st ? tourTarget(st.id) : null;
    const far = tgt ? Math.hypot(tgt.x - rt.player.pos.x, tgt.z - rt.player.pos.z) > 5 : false;
    marker.current.visible = !!tgt && far;
    ring.current.visible = !!tgt;
    if (tgt) {
      marker.current.position.set(tgt.x, tgt.y + 4.2 + Math.sin(rt.time * 3) * 0.4, tgt.z);
      ring.current.position.set(tgt.x, tgt.y + 0.06, tgt.z);
      ring.current.rotation.z += dt;
    }
    acc.current += dt;
    if (!st || acc.current < 0.3) return;
    acc.current = 0;
    const P = rt.player.pos;
    if (st.id === 'sair') {
      const { D } = mansionDoor();
      const c = Math.cos(-MANSION.rot), sn = Math.sin(-MANSION.rot);
      const dx = P.x - MANSION.pos[0], dz = P.z - MANSION.pos[1];
      const lz = -dx * sn + dz * c;
      const lx = dx * c + dz * sn;
      if (lz > -2 + D / 2 + 1.2 && Math.abs(lx) < MANSION.lot[0] / 2 + 3) s.tourEvent('saiu');
    }
    if (st.id === 'cafe' && tgt && Math.hypot(P.x - tgt.x, P.z - tgt.z) < 8) {
      s.tourEvent('cafe-chegou');
      const t = makeCafeTask(1);
      s.setTask(t);
      rt.player.mounted = null;
      s.toast(`Um cliente pediu ${t.targets[0].icon}! Prepare no balcão e leve até a mesa ☕`, '☕');
    }
    if (st.id === 'bebida' && s.task?.kind !== 'cafe') {
      // garante um cliente esperando
      s.setTask(makeCafeTask(1));
    }
    if (st.id === 'praca' && Math.hypot(P.x - FOUNTAIN.x, P.z - FOUNTAIN.z) < 11) s.tourEvent('fonte');
  });

  return (
    <>
      <sprite ref={marker} scale={[1.2, 1.2, 1.2]} visible={false}><spriteMaterial map={tex} transparent depthTest={false} /></sprite>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}><ringGeometry args={[1.1, 1.5, 6]} /><meshBasicMaterial color="#ff5fa2" transparent opacity={0.7} depthWrite={false} /></mesh>
    </>
  );
}
