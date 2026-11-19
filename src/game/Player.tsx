import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Avatar } from './Avatar';
import { useGame } from '../store/gameStore';
import { rt, spawnEffect } from '../systems/runtime';
import { consume, moveVector, wantsRun, key, touchBtns } from '../systems/input';
import { floorAt, slide } from './physics';
import { findNearest } from '../systems/interactions';
import { clampWorld, SEA_LIMIT } from '../systems/terrain';
import { sfx } from '../systems/audio';
import { zoneAt, WORLD_HALF } from '../data/world';
import type { AnimName } from '../types';

const R = 0.35;
const HEIGHT = 1.7;
let lastInteractCheck = 0;
let lastZone = '';
let zoneTimer = 0;

export const ui = { prompt: null as null | { label: string; icon: string }, zone: '' };

export function Player() {
  const look = useGame((s) => s.appearance);
  const held = useGame((s) => s.held);
  const group = useRef<THREE.Group>(null!);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const P = rt.player;
    const s = useGame.getState();
    const blockedUI = s.panel !== null && s.panel !== 'build' || s.minigame !== null || s.dialog !== null || s.screen !== 'game';
    const inVehicle = !!rt.vehicle.id;

    // interações (a cada 0.1s)
    rt.time += dt;
    if (rt.time - lastInteractCheck > 0.1) {
      lastInteractCheck = rt.time;
      const it = inVehicle ? null : findNearest(P.pos);
      ui.prompt = it ? { label: it.label, icon: it.icon } : null;
      (window as unknown as { __nearest: unknown }).__nearest = it;
    }

    if (inVehicle) {
      group.current.visible = false;
      return;
    }
    group.current.visible = true;

    const mv = blockedUI ? { x: 0, y: 0 } : moveVector();
    const stick = Math.hypot(mv.x, mv.y) > 0.1;
    if (stick || blockedUI) { P.walkTo = null; P.walkAction = null; P.walkPath = []; }
    let auto: { x: number; z: number } | null = null;
    if (P.walkTo) {
      const ax = P.walkTo.x - P.pos.x, az = P.walkTo.z - P.pos.z;
      const ad = Math.hypot(ax, az);
      const last = P.walkPath.length === 0;
      const arrive = !last ? 0.6 : P.walkAction ? 1.4 : 0.3;
      if (!last && (ad < arrive || P.walkStuck > 1.2)) {
        P.walkTo = P.walkPath.shift() ?? null;
        P.walkStuck = 0;
      } else if (ad < arrive || P.walkStuck > 1.2) {
        const act = ad < arrive ? P.walkAction : null;
        P.walkTo = null;
        P.walkAction = null;
        if (act) act();
      }
      if (P.walkTo) {
        const bx = P.walkTo.x - P.pos.x, bz = P.walkTo.z - P.pos.z;
        const bd = Math.hypot(bx, bz) || 1;
        auto = { x: bx / bd, z: bz / bd };
      }
    }
    const moving = stick || !!auto;

    // sentado / dormindo / brinquedo
    if (P.seat) {
      if (moving || consume(' ') || consume('e') && false) {
        P.seat = null;
      } else {
        P.pos.copy(P.seat.pos);
        P.yaw = P.seat.yaw;
        P.anim = P.seat.anim;
        group.current.position.copy(P.pos);
        group.current.rotation.y = P.yaw;
        return;
      }
    }
    if (P.ride) {
      group.current.position.copy(P.pos);
      group.current.rotation.y = P.yaw;
      P.anim = 'sit';
      if (moving || consume(' ')) {
        P.ride = null;
        if (P.rideExit) P.pos.copy(P.rideExit);
        P.rideExit = null;
      }
      return;
    }

    if (!blockedUI && consume('e')) {
      const it = findNearest(P.pos);
      if (it) it.action();
    }

    // movimento relativo à câmera
    const camYaw = rt.cam.yaw;
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    const rx = -fz, rz = fx;
    let dx = auto ? auto.x : (-fx * mv.y - rx * mv.x);
    let dz = auto ? auto.z : (-fz * mv.y - rz * mv.x);
    const shoesFast = look.shoes === 'patins' ? 1.35 : 1;
    const mounted = !!P.mounted;
    const speed = (P.swimming ? 3.2 : wantsRun() ? 9 : 5.2) * shoesFast * (mounted ? 2 : 1);
    dx *= speed * dt;
    dz *= speed * dt;

    if (moving) {
      const targetYaw = Math.atan2(dx, dz);
      let diff = targetYaw - P.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      P.yaw += diff * Math.min(1, dt * 12);
    }

    // colisão horizontal
    const [nx, nz, hitWall] = slide(P.pos.x, P.pos.z, dx, dz, R, P.pos.y + (P.swimming ? 1.2 : 0.55), P.pos.y + HEIGHT);
    if (auto && hitWall && Math.hypot(nx - P.pos.x, nz - P.pos.z) < Math.hypot(dx, dz) * 0.3) P.walkStuck += dt; else P.walkStuck = 0;
    P.pos.x = clampWorld(nx, WORLD_HALF);
    P.pos.z = Math.max(-WORLD_HALF, Math.min(SEA_LIMIT, nz));

    // vertical
    const fl = floorAt(P.pos.x, P.pos.z, R, P.pos.y, P.swimming ? 1.3 : 0.6);
    const swimY = fl.water !== null ? fl.water - 1.05 : -999;
    const canSwim = fl.water !== null && fl.top < swimY;
    const jumpPressed = !blockedUI && (consume(' ') || (touchBtns.jump && P.onGround && rt.time - P.lastJump > 0.4));
    if (canSwim && P.pos.y <= swimY + 0.3) {
      if (!P.swimming) { sfx('splash'); spawnEffect('splash', P.pos); s.track('swim'); }
      P.swimming = true;
      P.velY = 0;
      P.pos.y = THREE.MathUtils.lerp(P.pos.y, swimY + Math.sin(rt.time * 2) * 0.05, Math.min(1, dt * 6));
      if (jumpPressed) { P.velY = 6; P.pos.y += 0.3; P.swimming = false; }
    } else {
      P.swimming = false;
      if (jumpPressed && P.onGround) {
        P.velY = mounted ? 9 : 7.5;
        P.onGround = false;
        P.lastJump = rt.time;
        sfx('jump');
      }
      P.velY -= 22 * dt;
      P.pos.y += P.velY * dt;
      if (P.pos.y <= fl.top) {
        if (!P.onGround && P.velY < -12) spawnEffect('stars', P.pos);
        P.pos.y = fl.top;
        P.velY = 0;
        P.onGround = true;
      } else if (P.pos.y > fl.top + 0.05) P.onGround = false;
      // cabeçada no teto
      if (P.velY > 0) {
        const head = floorAt(P.pos.x, P.pos.z, R, P.pos.y + HEIGHT + 0.2, 0);
        void head;
      }
    }
    if (P.pos.y < -20) P.pos.set(65, 1, 30);

    // animação
    let anim: AnimName = 'idle';
    if (P.swimming) anim = 'swim';
    else if (!P.onGround) anim = 'jump';
    else if (moving) anim = wantsRun() || mounted ? 'run' : 'walk';
    if (mounted) anim = 'ride';
    if (P.emote) {
      if (moving || rt.time > P.emote.until) P.emote = null;
      else anim = P.emote.anim;
    }
    if (key('q') && !blockedUI) anim = 'wave';
    P.anim = anim;

    group.current.position.copy(P.pos);
    if (mounted) group.current.position.y += 1.1;
    group.current.rotation.y = P.yaw;

    // zona atual / descobertas
    zoneTimer += dt;
    if (zoneTimer > 1) {
      zoneTimer = 0;
      const z = zoneAt(P.pos.x, P.pos.z);
      ui.zone = z;
      if (z !== lastZone) {
        lastZone = z;
        if (z !== 'Mar' && z !== 'Mundo da Maitê') s.discover(z);
      }
    }
  });

  return (
    <>
      <group ref={group}>
        <Avatar look={look} getAnim={() => rt.player.anim} held={held} />
        <BlobShadow />
      </group>
      <WalkMarker />
    </>
  );
}

function WalkMarker() {
  const m = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => {
    const t = rt.time - rt.walkMarkerT;
    const on = t < 1.2 && !!rt.player.walkTo;
    m.current.visible = on;
    if (!on) return;
    m.current.position.set(rt.walkMarker.x, rt.walkMarker.y + 0.06, rt.walkMarker.z);
    const sc = 0.6 + Math.sin(t * 8) * 0.1;
    m.current.scale.set(sc, sc, sc);
    mat.current.opacity = 1 - t / 1.2;
  });
  return (
    <mesh ref={m} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.5, 0.8, 4]} />
      <meshBasicMaterial ref={mat} color="#ff5fa2" transparent depthWrite={false} />
    </mesh>
  );
}

const blobMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false });
const blobGeo = new THREE.CircleGeometry(0.42, 16);
export function BlobShadow({ size = 1 }: { size?: number }) {
  return <mesh geometry={blobGeo} material={blobMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} scale={size} raycast={() => null} />;
}
