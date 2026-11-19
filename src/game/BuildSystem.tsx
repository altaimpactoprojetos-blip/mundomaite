import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { FurnitureModel } from './Furniture';
import { getModel } from '../data/models';
import { setGroup } from '../systems/colliders';
import { objectBoxes, objectWater } from '../systems/objectColliders';
import { setPools } from '../systems/terrain';
import { registerInteractable } from '../systems/interactions';
import { actionLabel, runAction } from '../systems/actions';
import { rt, spawnEffect } from '../systems/runtime';
import type { PlacedObject } from '../types';
import { sfx } from '../systems/audio';
import { FLOOR_H } from '../world/House';

export const BUILD_FLOOR_H = FLOOR_H;

/** Tenta colocar o item escolhido na posição. */
export function placeItem(model: string, pos: [number, number, number]) {
  const s = useGame.getState();
  const def = getModel(model);
  const have = s.inventory[model] ?? 0;
  if (have > 0) s.set({ inventory: { ...s.inventory, [model]: have - 1 } });
  else if (!s.creative && !s.spend(def.price)) return;
  const id = s.addPlaced({
    model, pos, rotY: s.build.rot, scale: [1, 1, 1], color: s.build.color ?? def.color, texture: s.build.texture, label: model === 'letreiro' ? 'Minha Loja' : undefined,
  });
  spawnEffect('sparkles', new THREE.Vector3(...pos));
  return id;
}

function snapPos(p: THREE.Vector3, snap: boolean, model: string): [number, number, number] {
  const def = getModel(model);
  const grid = !snap ? 0.1 : def.cat === 'construcao' ? 1 : 0.5;
  return [Math.round(p.x / grid) * grid, Math.max(0, Math.round(p.y * 20) / 20), Math.round(p.z / grid) * grid];
}

function PlacedItem({ o, build, selected }: { o: PlacedObject; build: boolean; selected: boolean }) {
  const def = getModel(o.model);
  useEffect(() => {
    if (build || !def.action) return;
    const p = new THREE.Vector3(...o.pos);
    const { label, icon } = actionLabel(def.action, def.name);
    return registerInteractable({
      id: `placed-${o.id}`, label: def.action.type === 'message' ? def.name : label, icon, radius: Math.max(def.size[0] * o.scale[0], def.size[2] * o.scale[2]) / 2 + 1.6,
      pos: () => p, action: () => runAction(def.action!, p, o.rotY, Math.min(def.size[1] * o.scale[1] * 0.55, 0.55)),
    });
  }, [o, build, def]);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!build) return;
    const s = useGame.getState();
    if (s.build.item) return; // modo colocar: deixa o evento passar para empilhar
    e.stopPropagation();
    if (s.build.selected === o.id) { rt.dragging = true; }
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!build) return;
    const s = useGame.getState();
    if (s.build.item) return;
    if (e.delta > 10) return;
    e.stopPropagation();
    s.setBuild({ selected: o.id });
    sfx('click');
  };
  const [w, h, d] = def.size;
  return (
    <group position={o.pos} rotation={[0, o.rotY, 0]} onPointerDown={onDown} onClick={onClick}>
      <group scale={o.scale}>
        <FurnitureModel model={o.model} color={o.color} texture={o.texture} label={o.label} />
      </group>
      {selected && (
        <mesh position={[0, (h * o.scale[1]) / 2, 0]} raycast={() => null}>
          <boxGeometry args={[w * o.scale[0] + 0.2, h * o.scale[1] + 0.2, d * o.scale[2] + 0.2]} />
          <meshBasicMaterial color="#ff5fa2" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export function PlacedObjects() {
  const placed = useGame((s) => s.placed);
  const buildMode = useGame((s) => s.buildMode);
  const selected = useGame((s) => s.build.selected);
  useEffect(() => {
    const t = setTimeout(() => {
      setGroup('placed', placed.flatMap((o) => objectBoxes(o.model, o.pos, o.rotY, o.scale)));
      setPools('placed', placed.map((o) => objectWater(o.model, o.pos, o.rotY, o.scale)).filter((x): x is NonNullable<typeof x> => !!x));
    }, 50);
    return () => clearTimeout(t);
  }, [placed]);
  return (
    <>
      {placed.map((o) => <PlacedItem key={o.id} o={o} build={buildMode} selected={buildMode && selected === o.id} />)}
    </>
  );
}

/** Plano invisível que recebe toques para posicionar objetos + fantasma de pré-visualização */
export function BuildController() {
  const buildMode = useGame((s) => s.buildMode);
  const item = useGame((s) => s.build.item);
  const level = useGame((s) => s.build.level);
  const rot = useGame((s) => s.build.rot);
  const color = useGame((s) => s.build.color);
  const texture = useGame((s) => s.build.texture);
  const ghost = useRef<THREE.Group>(null!);
  const plane = useRef<THREE.Mesh>(null!);
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);
  const baseY = level * BUILD_FLOOR_H;

  useFrame(() => {
    if (!plane.current) return;
    plane.current.position.set(rt.player.pos.x, baseY + 0.01, rt.player.pos.z);
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const s = useGame.getState();
    const hit = e.intersections[0] ?? e;
    const p = (rt.dragging ? e.point : hit.point).clone();
    if (rt.dragging && s.build.selected) {
      const o = s.placed.find((x) => x.id === s.build.selected);
      if (o) s.updatePlaced(o.id, { pos: snapPos(new THREE.Vector3(p.x, o.pos[1], p.z), s.build.snap, o.model) });
      return;
    }
    if (!item) return;
    if (hit.object !== plane.current) p.y = Math.max(p.y, baseY);
    else p.y = baseY;
    setGhostPos(snapPos(p, s.build.snap, item));
  };
  const onUp = () => { if (rt.dragging) { rt.dragging = false; sfx('pop'); } };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const s = useGame.getState();
    if (e.delta > 10) return;
    if (!item) { s.setBuild({ selected: null }); return; }
    const hit = e.intersections[0] ?? e;
    const p = hit.point.clone();
    if (hit.object === plane.current) p.y = baseY; else p.y = Math.max(p.y, baseY);
    const pos = snapPos(p, s.build.snap, item);
    setGhostPos(pos);
    const id = placeItem(item, pos);
    if (id) s.setBuild({ selected: id });
  };

  useEffect(() => { if (!buildMode) { setGhostPos(null); rt.dragging = false; } }, [buildMode]);
  useEffect(() => {
    const up = () => { rt.dragging = false; };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  const def = item ? getModel(item) : null;
  const gridHelper = useMemo(() => {
    const g = new THREE.GridHelper(60, 60, '#ff5fa2', '#ffffff');
    (g.material as THREE.Material).transparent = true;
    (g.material as THREE.Material).opacity = 0.35;
    return g;
  }, []);
  if (!buildMode) return null;
  return (
    <group>
      <mesh ref={plane} rotation={[-Math.PI / 2, 0, 0]} onClick={onClick} onPointerMove={onMove} onPointerUp={onUp}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <GridFollow grid={gridHelper} y={baseY} />
      {item && def && ghostPos && (
        <group ref={ghost} position={ghostPos} rotation={[0, rot, 0]}>
          <FurnitureModel model={item} color={color ?? def.color} texture={texture} />
          <mesh position={[0, def.size[1] / 2, 0]} raycast={() => null}>
            <boxGeometry args={[def.size[0] + 0.1, def.size[1] + 0.1, def.size[2] + 0.1]} />
            <meshBasicMaterial color="#3ccf91" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function GridFollow({ grid, y }: { grid: THREE.GridHelper; y: number }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => { ref.current.position.set(Math.round(rt.player.pos.x), y + 0.03, Math.round(rt.player.pos.z)); });
  return <group ref={ref}><primitive object={grid} /></group>;
}
