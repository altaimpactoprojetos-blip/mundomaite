import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Fixture } from '../types';
import { FurnitureModel } from '../game/Furniture';
import { registerInteractable } from '../systems/interactions';
import { actionLabel, runAction } from '../systems/actions';
import { setGroup, removeGroup } from '../systems/colliders';
import { objectBoxes } from '../systems/objectColliders';
import { toWorld } from '../game/hooks';
import { getModel } from '../data/models';

/** Lista de móveis/objetos num espaço local (prédio ou casa). Registra colisões e interações. */
export function useFixtureLogic(key: string, fixtures: Fixture[], ox: number, oy: number, oz: number, rot: number) {
  useEffect(() => {
    const boxes = fixtures.flatMap((f) => {
      const [wx, wz] = toWorld(ox, oz, rot, f.x, f.z);
      return objectBoxes(f.model, [wx, oy + (f.y ?? 0), wz], rot + (f.rot ?? 0), f.scale);
    });
    setGroup(key, boxes);
    const offs: (() => void)[] = [];
    fixtures.forEach((f, i) => {
      const action = f.action ?? getModel(f.model).action;
      if (!action) return;
      const [wx, wz] = toWorld(ox, oz, rot, f.x, f.z);
      const p = new THREE.Vector3(wx, oy + (f.y ?? 0), wz);
      const yaw = rot + (f.rot ?? 0);
      const { label, icon } = actionLabel(action, f.label);
      const def = getModel(f.model);
      const sz = Math.max(def.size[0] * (f.scale?.[0] ?? 1), def.size[2] * (f.scale?.[2] ?? 1));
      offs.push(registerInteractable({
        id: `${key}-${i}`, label: f.label && action.type !== 'shop' ? f.label : label, icon, radius: sz / 2 + 1.6, pos: () => p, priority: f.action ? 1.4 : 0.3,
        action: () => runAction(action, p, yaw, def.size[1] > 1.5 ? 0.45 : Math.min(def.size[1] * 0.55, 0.55)),
      }));
    });
    return () => {
      removeGroup(key);
      offs.forEach((o) => o());
    };
  }, [key, fixtures, ox, oy, oz, rot]);
}

export function FixtureMeshes({ fixtures }: { fixtures: Fixture[] }) {
  return (
    <>
      {fixtures.map((f, i) => (
        <group key={i} position={[f.x, f.y ?? 0, f.z]} rotation={[0, f.rot ?? 0, 0]} scale={f.scale ?? 1}>
          <FurnitureModel model={f.model} color={f.color} texture={f.texture} label={f.label} />
        </group>
      ))}
    </>
  );
}

export function useStable<T>(fn: () => T, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(fn, deps);
}
