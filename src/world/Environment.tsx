import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rt } from '../systems/runtime';
import { useGame } from '../store/gameStore';
import { ROADS, ZONES, SEA_Z, BEACH_Z, WATER_LEVEL, ISLANDS } from '../data/world';
import { mat } from '../systems/materials';

const DAY = new THREE.Color('#9ed9ff');
const DUSK = new THREE.Color('#ffb38a');
const NIGHT = new THREE.Color('#1d2357');
const tmp = new THREE.Color();

/** Céu, luzes e ciclo de dia/noite */
export function DayNight() {
  const { scene, camera } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const quality = useGame((s) => s.settings.quality);
  const stars = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    for (let i = 0; i < 600; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * 0.45 * Math.PI;
      pts.push(Math.cos(a) * Math.cos(b) * 400, Math.sin(b) * 400 + 30, Math.sin(a) * Math.cos(b) * 400);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const starMat = useMemo(() => new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0 }), []);
  const starsRef = useRef<THREE.Points>(null!);

  useEffect(() => {
    const far = quality === 'baixa' ? 190 : quality === 'media' ? 280 : 380;
    scene.fog = new THREE.Fog('#9ed9ff', far * 0.45, far);
  }, [quality, scene, camera]);

  useFrame((_, dt) => {
    const s = useGame.getState();
    if (s.settings.fixedDay) rt.hour = THREE.MathUtils.lerp(rt.hour, 11, 0.02);
    else if (s.screen === 'game' && !s.overlay) rt.hour = (rt.hour + (dt * s.settings.timeSpeed) / 60) % 24;
    const h = rt.hour;
    // 0 = noite, 1 = dia
    const day = THREE.MathUtils.clamp(Math.sin(((h - 6) / 12) * Math.PI) * 1.6, 0, 1);
    const dusk = Math.max(0, 1 - Math.abs(h - 18.3) / 1.6) + Math.max(0, 1 - Math.abs(h - 6) / 1.4);
    tmp.copy(NIGHT).lerp(DAY, day).lerp(DUSK, Math.min(0.6, dusk * 0.6));
    scene.background = tmp.clone();
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(tmp);
    const ang = ((h - 6) / 12) * Math.PI;
    const P = rt.player.pos;
    sun.current.position.set(P.x + Math.cos(ang) * 60, Math.max(8, Math.sin(ang) * 80), P.z + 30);
    sun.current.target.position.set(P.x, 0, P.z);
    sun.current.target.updateMatrixWorld();
    sun.current.intensity = 0.3 + day * 2.6;
    sun.current.color.set(dusk > 0.3 ? '#ffd2a8' : '#fff6e8');
    hemi.current.intensity = 0.45 + day * 0.55;
    starMat.opacity = 1 - day;
    starsRef.current.position.copy(camera.position);
  });

  const shadows = quality === 'alta';
  return (
    <>
      <hemisphereLight ref={hemi} args={['#cfe8ff', '#5f9e4a', 1]} />
      <directionalLight
        ref={sun}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-far={200}
        shadow-bias={-0.0005}
      />
      <ambientLight intensity={0.18} />
      <points ref={starsRef} geometry={stars} material={starMat} />
    </>
  );
}

/** Chão, zonas, ruas, praia e mar */
export function Ground() {
  return (
    <group>
      {/* grama geral */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -90]} receiveShadow material={mat('#6cc24a', { tex: 'grama', repeat: 120 })}>
        <planeGeometry args={[820, 650]} />
      </mesh>
      {/* zonas coloridas */}
      {ZONES.filter((z) => z.id !== 'praia' && z.id !== 'porto').map((z) => (
        <mesh key={z.id} rotation={[-Math.PI / 2, 0, 0]} position={[z.x, -0.01, z.z]} receiveShadow material={mat(z.ground)}>
          <planeGeometry args={[z.w - 4, z.d - 4]} />
        </mesh>
      ))}
      {/* areia */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, (BEACH_Z + SEA_Z) / 2]} receiveShadow material={mat('#f3d27a', { tex: 'grama', repeat: 40 })}>
        <planeGeometry args={[820, SEA_Z - BEACH_Z]} />
      </mesh>
      {/* fundo do mar */}
      <mesh rotation={[-Math.PI / 2 + 0.1194, 0, 0]} position={[0, -2.0, SEA_Z + 13.75]} material={mat('#f1d995')}>
        <planeGeometry args={[1400, 27.7]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.65, SEA_Z + 137]} material={mat('#e8cf8a')}>
        <planeGeometry args={[1400, 220]} />
      </mesh>
      <Sea />
      <Roads />
      {ISLANDS.map((i) => (
        <group key={i.id} position={[i.x, 0, i.z]}>
          <mesh position={[0, -1.5, 0]} material={mat(i.color)}><cylinderGeometry args={[i.r, i.r + 6, 3.6, 32]} /></mesh>
          <mesh position={[0, 0.25, 0]} material={mat('#6cc24a', { tex: 'grama', repeat: 6 })}><cylinderGeometry args={[i.r - 6, i.r - 4, 0.15, 32]} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Sea() {
  const geo = useMemo(() => new THREE.PlaneGeometry(1400, 260, 70, 26), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1fa3e0', transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0.2, flatShading: true }), []);
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.05) return;
    acc.current = 0;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const t = rt.time;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 0.05 + t * 1.2) * 0.15 + Math.cos(y * 0.08 + t) * 0.12);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return <mesh geometry={geo} material={m} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL, SEA_Z + 128]} />;
}

function Roads() {
  const road = mat('#3f434d');
  const side = mat('#d4cfc6', { tex: 'azulejo', repeat: 1 });
  const line = mat('#ffffff', { emissive: 0.2 });
  const dashes = useMemo(() => {
    const list: [number, number, number][] = [];
    for (const r of ROADS) {
      const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
      const n = Math.floor(len / 6);
      const rot = Math.atan2(r.x2 - r.x1, r.z2 - r.z1);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        list.push([r.x1 + (r.x2 - r.x1) * t, r.z1 + (r.z2 - r.z1) * t, rot]);
      }
    }
    return list;
  }, []);
  const inst = useRef<THREE.InstancedMesh>(null!);
  useEffect(() => {
    const o = new THREE.Object3D();
    dashes.forEach(([x, z, r], i) => {
      o.position.set(x, 0.03, z);
      o.rotation.set(-Math.PI / 2, 0, r);
      o.scale.set(0.25, 2.4, 1);
      o.updateMatrix();
      inst.current.setMatrixAt(i, o.matrix);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  }, [dashes]);
  return (
    <group>
      {ROADS.map((r, i) => {
        const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
        const rot = Math.atan2(r.x2 - r.x1, r.z2 - r.z1);
        return (
          <group key={i} position={[(r.x1 + r.x2) / 2, 0, (r.z1 + r.z2) / 2]} rotation={[0, rot, 0]}>
            <mesh material={side} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}><planeGeometry args={[r.w + 5, len + r.w]} /></mesh>
            <mesh material={road} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow><planeGeometry args={[r.w, len + r.w]} /></mesh>
          </group>
        );
      })}
      <instancedMesh ref={inst} args={[undefined, undefined, dashes.length]} material={line}>
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  );
}
