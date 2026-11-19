import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rt } from '../systems/runtime';
import { pointBlocked } from '../systems/colliders';
import { useGame } from '../store/gameStore';
import { VEHICLES } from '../data/vehicles';
import { key } from '../systems/input';
import { findAtPoint } from '../systems/interactions';
import { planPath } from './pathing';

const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitP = new THREE.Vector3();

let lastUserCam = -10;

/** Câmera em terceira pessoa: arrastar para girar, pinça/roda para zoom. */
const fogRef: { scene: THREE.Scene | null } = { scene: null };

export function CameraRig() {
  const { camera, gl, scene } = useThree();
  fogRef.scene = scene;
  const desired = useRef(new THREE.Vector3());
  const tgt = useRef(new THREE.Vector3());

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    let tap: { x: number; y: number; t: number; moved: number } | null = null;
    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      tap = pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 } : null;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (tap) tap.moved += Math.abs(dx) + Math.abs(dy);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        rt.cam.dist = THREE.MathUtils.clamp(rt.cam.dist * (pinch / Math.max(1, d)), 3, 40);
        pinch = d;
        return;
      }
      if (rt.dragging) return;
      const sens = useGame.getState().settings.camSens * (e.pointerType === 'touch' ? 0.007 : 0.005);
      rt.cam.yaw -= dx * sens;
      if (useGame.getState().settings.camMode !== 'habbo') rt.cam.pitch = THREE.MathUtils.clamp(rt.cam.pitch + dy * sens, -0.15, 1.35);
      if (Math.abs(dx) + Math.abs(dy) > 2) lastUserCam = rt.time;
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      const t = tap;
      tap = null;
      if (!t || t.moved > 10 || performance.now() - t.t > 450 || e.target !== el) return;
      const s = useGame.getState();
      if (s.settings.camMode !== 'habbo' || s.buildMode || s.screen !== 'game' || s.panel || s.dialog || s.minigame || rt.vehicle.id) return;
      // toque para andar (estilo Habbo)
      const r = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      plane.constant = -rt.player.pos.y;
      if (!ray.ray.intersectPlane(plane, hitP)) return;
      const it = findAtPoint(hitP, 2.4);
      rt.player.seat = null;
      rt.player.walkStuck = 0;
      if (it) {
        const ip = it.pos()!;
        if (Math.hypot(ip.x - rt.player.pos.x, ip.z - rt.player.pos.z) <= it.radius) { it.action(); return; }
        rt.player.walkPath = planPath(rt.player.pos, ip);
        rt.player.walkAction = () => it.action();
      } else {
        rt.player.walkPath = planPath(rt.player.pos, hitP);
        rt.player.walkAction = null;
      }
      rt.player.walkTo = rt.player.walkPath.shift() ?? null;
      rt.walkMarker.copy(hitP);
      rt.walkMarkerT = rt.time;
    };
    const wheel = (e: WheelEvent) => {
      rt.cam.dist = THREE.MathUtils.clamp(rt.cam.dist * (1 + Math.sign(e.deltaY) * 0.1), 3, 40);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useGame.getState();
    if (s.screen === 'title') {
      // passeio pela cidade na tela inicial
      const t = rt.time * 0.05;
      camera.position.set(65 + Math.cos(t) * 70, 45, -5 + Math.sin(t) * 70);
      camera.lookAt(40, 0, 0);
      rt.time += dt;
      return;
    }
    if (key('arrowleft') && rt.vehicle.id) void 0;
    const inV = rt.vehicle.id;
    let target: THREE.Vector3;
    let dist = rt.cam.dist;
    if (inV) {
      const v = s.vehicles.find((x) => x.id === inV);
      const def = v ? VEHICLES[v.vtype] : null;
      target = tgt.current.copy(rt.vehicle.pos).add(new THREE.Vector3(0, (def?.size[1] ?? 1.5) + 0.5, 0));
      dist = Math.max(dist, def ? Math.max(def.size[2], def.size[0]) * 1.6 + 4 : 9);
      // segue atrás do veículo
      if (rt.time - lastUserCam > 1.5 && Math.abs(rt.vehicle.speed) > 1) {
        let diff = rt.vehicle.yaw + Math.PI - rt.cam.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rt.cam.yaw += diff * Math.min(1, dt * 2.5);
      }
    } else {
      target = tgt.current.copy(rt.player.pos).add(new THREE.Vector3(0, rt.player.mounted ? 2.6 : 1.5, 0));
      if (s.buildMode) dist = Math.max(dist, 12);
      if (s.panel === 'character') {
        // vitrine: câmera de frente para a personagem
        let diff = rt.player.yaw - rt.cam.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (rt.time - lastUserCam > 1) rt.cam.yaw += diff * Math.min(1, dt * 4);
        dist = 3.4;
        target.y -= 0.45;
        const side = window.innerWidth > window.innerHeight ? 1 : 0;
        target.x += Math.cos(rt.cam.yaw) * 1.1 * side;
        target.z -= Math.sin(rt.cam.yaw) * 1.1 * side;
        if (side === 0) target.y -= 0.9;
      }
    }
    const habbo = s.settings.camMode === 'habbo';
    const cam = camera as THREE.PerspectiveCamera;
    const wantFov = habbo ? 13 : 55;
    if (Math.abs(cam.fov - wantFov) > 0.01) { cam.fov = THREE.MathUtils.lerp(cam.fov, wantFov, Math.min(1, dt * 6)); if (Math.abs(cam.fov - wantFov) < 0.2) cam.fov = wantFov; cam.updateProjectionMatrix(); }
    let pitch = rt.cam.pitch;
    if (habbo) {
      pitch = s.panel === 'character' ? 0.35 : 0.62;
      dist = dist * (55 / cam.fov) * (s.panel === 'character' ? 1 : 2);
    }
    const cp = Math.cos(pitch);
    desired.current.set(
      target.x + Math.sin(rt.cam.yaw) * cp * dist,
      target.y + Math.sin(pitch) * dist,
      target.z + Math.cos(rt.cam.yaw) * cp * dist,
    );
    // colisão da câmera (não atravessar paredes)
    if (!inV && !habbo) {
      const dir = desired.current.clone().sub(target);
      const len = dir.length();
      dir.normalize();
      let ok = len;
      for (let d = 0.6; d < len; d += 0.35) {
        const px = target.x + dir.x * d, py = target.y + dir.y * d, pz = target.z + dir.z * d;
        if (pointBlocked(px, py, pz)) { ok = Math.max(0.8, d - 0.4); break; }
      }
      desired.current.copy(target).addScaledVector(dir, ok);
    }
    if (desired.current.y < target.y - 1.2) desired.current.y = target.y - 1.2;
    camera.position.lerp(desired.current, Math.min(1, dt * 10));
    if (rt.cam.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * rt.cam.shake;
      camera.position.y += (Math.random() - 0.5) * rt.cam.shake;
      rt.cam.shake = Math.max(0, rt.cam.shake - dt);
    }
    camera.lookAt(target);
    // neblina acompanha a distância da câmera
    const q = s.settings.quality;
    const far = q === 'baixa' ? 190 : q === 'media' ? 280 : 380;
    const camD = camera.position.distanceTo(target);
    const fog = (camera.parent as THREE.Scene | null)?.fog as THREE.Fog | undefined;
    const sceneFog = fogRef.scene?.fog as THREE.Fog | undefined;
    const f = fog ?? sceneFog;
    if (f) { f.near = camD + far * 0.35; f.far = camD + far; }
    if (Math.abs(cam.far - (camD + far + 30)) > 5) { cam.far = camD + far + 30; cam.updateProjectionMatrix(); }
  });
  return null;
}
