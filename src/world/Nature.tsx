import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BUILDINGS, PROPERTIES, ROADS, SEA_Z, BEACH_Z } from '../data/world';
import { setGroup, boxAt } from '../systems/colliders';
import { mat, GEO } from '../systems/materials';
import { useGame } from '../store/gameStore';

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const BLOCKED: { x: number; z: number; r: number }[] = [
  { x: 65, z: -5, r: 48 }, // praça
  { x: -260, z: -285, r: 55 }, // castelo
  { x: 260, z: -5, r: 120 }, // parque
  { x: 0, z: -275, r: 110 }, // cidade futuro
  { x: 260, z: -290, r: 130 }, // aeroporto
  { x: -195, z: 105, r: 62 }, // condomínio
  { x: 260, z: 110, r: 110 }, // fazenda (árvores próprias)
];

export function isFree(x: number, z: number, m = 3) {
  for (const b of BUILDINGS) {
    const [bx, bz] = b.pos;
    const ext = Math.max(b.size[0], b.size[2]) / 2 + m + 4;
    if (Math.abs(x - bx) < ext && Math.abs(z - bz) < ext) return false;
  }
  for (const p of PROPERTIES) if (Math.abs(x - p.pos[0]) < p.lot[0] / 2 + m && Math.abs(z - p.pos[1]) < p.lot[1] / 2 + m) return false;
  for (const r of ROADS) {
    const minX = Math.min(r.x1, r.x2) - r.w / 2 - m - 2, maxX = Math.max(r.x1, r.x2) + r.w / 2 + m + 2;
    const minZ = Math.min(r.z1, r.z2) - r.w / 2 - m - 2, maxZ = Math.max(r.z1, r.z2) + r.w / 2 + m + 2;
    if (x > minX && x < maxX && z > minZ && z < maxZ) return false;
  }
  for (const b of BLOCKED) if (Math.hypot(x - b.x, z - b.z) < b.r) return false;
  return true;
}

interface Tree { x: number; z: number; s: number; kind: 0 | 1 | 2; c: number }

export function Nature() {
  const quality = useGame((s) => s.settings.quality);
  const trees = useMemo(() => {
    const r = rng(42);
    const out: Tree[] = [];
    const add = (n: number, x0: number, x1: number, z0: number, z1: number, kind: 0 | 1 | 2, m = 3) => {
      let tries = 0;
      while (n > 0 && tries++ < n * 30) {
        const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
        if (!isFree(x, z, m)) continue;
        out.push({ x, z, s: 0.8 + r() * 0.6, kind, c: Math.floor(r() * 4) });
        n--;
      }
    };
    const mult = quality === 'baixa' ? 0.55 : 1;
    add(Math.round(320 * mult), -390, -140, -390, -175, 1, 1); // floresta (pinheiros)
    add(Math.round(90 * mult), -390, -140, -390, -175, 0, 1);
    add(Math.round(60 * mult), -390, -140, -170, 160, 0); // bairro
    add(Math.round(40 * mult), -130, 130, -170, 160, 0, 4); // centro
    add(Math.round(40 * mult), 140, 390, 20, 160, 0, 4);
    add(Math.round(70 * mult), -390, 390, BEACH_Z + 4, SEA_Z - 8, 2, 4); // palmeiras
    add(Math.round(30 * mult), 140, 390, -390, -175, 0, 6);
    return out;
  }, [quality]);

  useEffect(() => {
    setGroup('trees', trees.map((t) => boxAt(t.x, 0, t.z, 0.7 * t.s, 4, 0.7 * t.s)));
  }, [trees]);

  const trunkRef = useRef<THREE.InstancedMesh>(null!);
  const crownRef = useRef<THREE.InstancedMesh>(null!);
  const crown2Ref = useRef<THREE.InstancedMesh>(null!);
  const pineRef = useRef<THREE.InstancedMesh>(null!);
  const palmRef = useRef<THREE.InstancedMesh>(null!);
  const round = trees.filter((t) => t.kind === 0);
  const pines = trees.filter((t) => t.kind === 1);
  const palms = trees.filter((t) => t.kind === 2);
  const CROWN = ['#5ccf6e', '#3fbf6a', '#7bd96a', '#ffb3d9'];

  useEffect(() => {
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    trees.forEach((t, i) => {
      o.position.set(t.x, (t.kind === 2 ? 2.8 : 1.2) * t.s, t.z);
      o.rotation.set(0, 0, t.kind === 2 ? 0.08 : 0);
      o.scale.set(0.45 * t.s, (t.kind === 2 ? 5.6 : 2.4) * t.s, 0.45 * t.s);
      o.updateMatrix();
      trunkRef.current.setMatrixAt(i, o.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    round.forEach((t, i) => {
      o.position.set(t.x, 3.2 * t.s, t.z);
      o.rotation.set(0, 0, 0);
      o.scale.set(3 * t.s, 2.6 * t.s, 3 * t.s);
      o.updateMatrix();
      crownRef.current.setMatrixAt(i, o.matrix);
      crownRef.current.setColorAt(i, col.set(CROWN[t.c]));
      o.position.set(t.x + 0.6 * t.s, 4 * t.s, t.z + 0.3 * t.s);
      o.scale.set(1.8 * t.s, 1.6 * t.s, 1.8 * t.s);
      o.updateMatrix();
      crown2Ref.current.setMatrixAt(i, o.matrix);
      crown2Ref.current.setColorAt(i, col.set(CROWN[t.c]).multiplyScalar(1.08));
    });
    crownRef.current.instanceMatrix.needsUpdate = true;
    crown2Ref.current.instanceMatrix.needsUpdate = true;
    if (crownRef.current.instanceColor) crownRef.current.instanceColor.needsUpdate = true;
    if (crown2Ref.current.instanceColor) crown2Ref.current.instanceColor.needsUpdate = true;
    pines.forEach((t, i) => {
      for (let k = 0; k < 3; k++) {
        o.position.set(t.x, (2.2 + k * 1.3) * t.s, t.z);
        o.scale.set((3 - k * 0.7) * t.s, 2.2 * t.s, (3 - k * 0.7) * t.s);
        o.updateMatrix();
        pineRef.current.setMatrixAt(i * 3 + k, o.matrix);
      }
    });
    pineRef.current.instanceMatrix.needsUpdate = true;
    palms.forEach((t, i) => {
      o.position.set(t.x + 0.45 * t.s, 5.6 * t.s, t.z);
      o.scale.set(4.2 * t.s, 0.9 * t.s, 4.2 * t.s);
      o.updateMatrix();
      palmRef.current.setMatrixAt(i, o.matrix);
    });
    palmRef.current.instanceMatrix.needsUpdate = true;
  }, [trees, round, pines, palms]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[GEO.cylLow, mat('#9a6a45'), trees.length]} frustumCulled={false} />
      <instancedMesh ref={crownRef} args={[GEO.sphereLow, mat('#ffffff'), round.length]} frustumCulled={false} />
      <instancedMesh ref={crown2Ref} args={[GEO.sphereLow, mat('#ffffff'), round.length]} frustumCulled={false} />
      <instancedMesh ref={pineRef} args={[GEO.coneLow, mat('#2f9e5a'), pines.length * 3]} frustumCulled={false} />
      <instancedMesh ref={palmRef} args={[new THREE.ConeGeometry(0.5, 1, 6), mat('#3ccf6e'), palms.length]} frustumCulled={false} />
    </group>
  );
}
