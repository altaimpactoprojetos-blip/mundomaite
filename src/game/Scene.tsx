import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { World } from '../world/World';
import { Player } from './Player';
import { CameraRig } from './CameraRig';
import { NPCs } from './NPCs';
import { Pets } from './Pets';
import { Vehicles } from './Vehicles';
import { Effects } from './Effects';
import { PlacedObjects, BuildController } from './BuildSystem';
import { Tasks } from './Tasks';
import { useGame } from '../store/gameStore';
import { rt } from '../systems/runtime';

export function Scene() {
  const quality = useGame((s) => s.settings.quality);
  const pixel = useGame((s) => s.settings.pixel);
  const base: [number, number] = quality === 'baixa' ? [1, 1.25] : quality === 'media' ? [1, 1.5] : [1, 2];
  // modo pixel (estilo Habbo): desenha em resolução baixa e amplia com pixels nítidos
  const dpr: [number, number] = pixel ? [0.7, 0.7] : base;
  return (
    <Canvas
      shadows={quality === 'alta'}
      dpr={dpr}
      key={pixel ? 'px' : 'hd'}
      gl={{ antialias: !pixel && quality !== 'baixa', powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      camera={{ fov: 55, near: 0.2, far: 400, position: [80, 40, 60] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
        rt.canvas = gl.domElement;
        (window as unknown as { __gl: unknown }).__gl = gl;
      }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none', imageRendering: pixel ? 'pixelated' : 'auto' }}
    >
      <Suspense fallback={null}>
        <World />
        <Player />
        <NPCs />
        <Pets />
        <Vehicles />
        <PlacedObjects />
        <BuildController />
        <Tasks />
        <Effects />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
