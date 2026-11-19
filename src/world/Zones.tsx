import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Fixture } from '../types';
import { FixtureMeshes, useFixtureLogic } from './Fixtures';
import { useNear } from '../game/hooks';
import { Bx, Cy, Sp, Co } from '../game/prims';
import { setGroup, boxAt, localBox, type Box } from '../systems/colliders';
import { setPools } from '../systems/terrain';
import { registerInteractable } from '../systems/interactions';
import { rt, spawnEffect, teleportPlayer } from '../systems/runtime';
import { useGame } from '../store/gameStore';
import { mat } from '../systems/materials';
import { VehicleModel } from '../game/VehicleModel';
import { ISLANDS } from '../data/world';
import { sfx } from '../systems/audio';
import { signTexture } from '../systems/textures';

const F = (model: string, x: number, z: number, rot = 0, extra: Partial<Fixture> = {}): Fixture => ({ model, x, z, rot, ...extra });

/** Conjunto de objetos no mundo (com colisão e interação), desenhados só quando a jogadora está perto. */
export function WorldSet({ id, x, z, fixtures, r = 70, children }: { id: string; x: number; z: number; fixtures: Fixture[]; r?: number; children?: React.ReactNode }) {
  useFixtureLogic(`ws-${id}`, fixtures, x, 0, z, 0);
  const near = useNear(x, z, r);
  if (!near) return null;
  return <group position={[x, 0, z]}><FixtureMeshes fixtures={fixtures} />{children}</group>;
}

function useBoxes(key: string, boxes: Box[]) {
  useEffect(() => setGroup(key, boxes), [key, boxes]);
}

function Label({ text, icon, p, w = 8 }: { text: string; icon?: string; p: [number, number, number]; w?: number }) {
  const t = useMemo(() => signTexture(text, '#ffffff', '#e83e8c', icon), [text, icon]);
  return <mesh position={p}><planeGeometry args={[w, w / 4]} /><meshBasicMaterial map={t} transparent side={THREE.DoubleSide} /></mesh>;
}

// ---------------- Praça central ----------------
export function Plaza() {
  const fx = useMemo(() => [
    F('fonte', 0, 0, 0, { scale: [2, 1.4, 2] }),
    ...[[-14, -8], [14, -8], [-14, 8], [14, 8]].map(([x, z]) => F('canteiro', x, z, 0, { color: '#ff8fc7' })),
    ...[[-8, -14], [8, -14], [-8, 14], [8, 14]].map(([x, z], i) => F('banco', x, z, i < 2 ? 0 : Math.PI)),
    ...[[-20, -18], [20, -18], [-20, 18], [20, 18], [-30, 0], [30, 0]].map(([x, z]) => F('arvore-flor', x, z)),
    ...[[-24, -24], [24, -24], [-24, 24], [24, 24]].map(([x, z]) => F('poste', x, z)),
    // parquinho
    F('balanco', -30, 22, 0, { color: '#ff5fa2' }), F('escorregador', -38, 18, Math.PI / 2, { color: '#5ab0ff' }), F('gangorra', -30, 30, 0),
    F('caixa-areia', -38, 30), F('cama-elastica', -22, 32, 0, { color: '#9d4edd' }), F('castelo-inflavel', 34, 28),
    // coreto
    F('plataforma', 36, -24, 0, { color: '#ffffff', scale: [1.3, 1, 1.3] }),
    ...[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([x, z]) => F('coluna', 36 + x, -24 + z, 0, { y: 0.4, color: '#ffc2d9' })),
    F('microfone', 36, -24, 0, { y: 0.4, color: '#ffc2d9', action: { type: 'dance' }, label: 'Dançar no coreto' }),
    F('mesa-piquenique', -32, -24), F('mesa-piquenique', -24, -30), F('carrinho-pipoca', 10, 24, Math.PI), F('carrinho-sorvete', -10, 24, Math.PI),
    F('baloes', 6, 26), F('estatua-unicornio', 0, -26, 0, { color: '#ffffff' }),
    F('flores', -18, 0, 0, { color: '#ffe066' }), F('flores', 18, 0, 0, { color: '#d4b8ff' }),
  ], []);
  return (
    <WorldSet id="praca" x={65} z={-5} fixtures={fx} r={110}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={mat('#f3e6d6', { tex: 'azulejo', repeat: 14 })}><circleGeometry args={[24, 40]} /></mesh>
      <mesh position={[36, 4.2, -24]} material={mat('#ff8fc7')}><coneGeometry args={[6, 2.4, 8]} /></mesh>
      <Label text="Praça Central" icon="⛲" p={[0, 6.5, -26]} />
    </WorldSet>
  );
}

// ---------------- Praia ----------------
export function Beach() {
  const fx = useMemo(() => {
    const out: Fixture[] = [];
    for (let i = 0; i < 14; i++) {
      const x = -260 + i * 36;
      out.push(F('guarda-sol', x, 198, 0, { color: ['#ff7b54', '#ff5fa2', '#5ab0ff', '#ffd23f'][i % 4] }));
      out.push(F('tapete', x + 1.5, 200, 0.3, { color: ['#ffe066', '#5ad1ff', '#ff8fc7'][i % 3], texture: 'listras', scale: [0.7, 1, 1] }));
    }
    out.push(F('carrinho-sorvete', -30, 186, 0), F('carrinho-pipoca', 50, 186, 0), F('mesa-piquenique', 20, 190), F('mesa-piquenique', -60, 190));
    out.push(F('castelinho', 10, 214, 0, { color: '#ffe7a6', scale: [0.6, 0.6, 0.6] }));
    out.push(F('cerca', -100, 205, 0, { color: '#ffffff', scale: [2, 2.2, 1] }));
    return out;
  }, []);
  const tower = useMemo(() => [boxAt(-20, 0, 210, 3, 3.2, 3)], []);
  useBoxes('beach-tower', tower);
  return (
    <WorldSet id="praia" x={0} z={200} fixtures={fx} r={320}>
      <group position={[-20, 0, 10]}>
        {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([x, z]) => <Bx key={`${x}${z}`} c="#ffffff" p={[x, 1.5, z]} s={[0.2, 3, 0.2]} />)}
        <Bx c="#e63946" p={[0, 3.2, 0]} s={[3, 0.3, 3]} /><Bx c="#ffffff" p={[0, 4, 0]} s={[2.6, 1.4, 2.6]} /><Co c="#e63946" p={[0, 5.2, 0]} s={[3.6, 1, 3.6]} />
      </group>
      <Label text="Praia do Sol" icon="🏖️" p={[0, 4, -18]} />
    </WorldSet>
  );
}

// ---------------- Porto ----------------
export function Port() {
  const piers: [number, number, number, number][] = [[300, 245, 8, 34], [340, 255, 8, 46], [375, 250, 6, 36], [330, 232, 90, 6]];
  const boxes = useMemo(() => piers.map(([x, z, w, d]) => boxAt(x, -1.5, z, w, 1.9, d)), []);
  useBoxes('piers', boxes);
  const fx = useMemo(() => [F('bloco', 312, 214, 0.3, { color: '#c8a27a', scale: [1.4, 1.4, 1.4] }), F('bloco', 314, 216, 0, { color: '#c8a27a' }), F('poste', 320, 228), F('poste', 360, 228)], []);
  const beam = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { if (beam.current) beam.current.rotation.y += dt * 0.8; });
  const near = useNear(330, 240, 160);
  useBoxes('lighthouse', useMemo(() => [boxAt(385, -2, 285, 6, 22, 6)], []));
  return (
    <>
      <WorldSet id="porto" x={0} z={0} fixtures={fx} r={9999} />
      {near && (
        <group>
          {piers.map(([x, z, w, d], i) => (
            <group key={i}>
              <Bx c="#b0875c" tex="madeira" rep={4} p={[x, 0.3, z]} s={[w, 0.2, d]} />
              {Array.from({ length: Math.floor(d / 6) }).map((_, k) => <Cy key={k} c="#8d5b3a" p={[x - w / 2 + 0.3, -1, z - d / 2 + k * 6 + 2]} s={[0.4, 2.6, 0.4]} low />)}
            </group>
          ))}
          <group position={[385, 0, 285]}>
            <Cy c="#a8a8a8" p={[0, -1, 0]} s={[10, 3, 10]} />
            <Cy c="#ffffff" p={[0, 8, 0]} s={[4, 16, 4]} />
            {[2, 6, 10, 14].map((y) => <Cy key={y} c="#e63946" p={[0, y, 0]} s={[4.05, 1.5, 4.05]} />)}
            <Cy c="#fff3a6" e={1} p={[0, 17, 0]} s={[3, 2, 3]} />
            <Co c="#e63946" p={[0, 19, 0]} s={[4, 2, 4]} />
            <group ref={beam} position={[0, 17, 0]}><Bx c="#fff3a6" e={1} o={0.35} p={[8, 0, 0]} s={[16, 1, 1]} /></group>
          </group>
          {[[350, 275, 0.2, '#ffffff', 'barco'], [300, 275, 1.4, '#ff7b54', 'lancha'], [365, 300, 2.8, '#5ab0ff', 'barco']].map(([x, z, r, c, t], i) => (
            <Bobber key={i} p={[x as number, -0.4, z as number]} r={r as number}><VehicleModel vtype={t as 'barco'} color={c as string} color2="#ffd23f" /></Bobber>
          ))}
          <Label text="Porto das Gaivotas" icon="⚓" p={[300, 5, 222]} />
        </group>
      )}
    </>
  );
}

function Bobber({ p, r, children }: { p: [number, number, number]; r: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  const off = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    g.current.position.y = p[1] + Math.sin(clock.elapsedTime * 1.3 + off) * 0.12;
    g.current.rotation.z = Math.sin(clock.elapsedTime + off) * 0.04;
  });
  return <group ref={g} position={p} rotation={[0, r, 0]}>{children}</group>;
}

// ---------------- Condomínio ----------------
export function Condo() {
  const x0 = -195, z0 = 105, w = 118, d = 98;
  const boxes = useMemo(() => [
    boxAt(x0, 0, z0 - d / 2, w, 2.2, 0.5), boxAt(x0 - w / 2, 0, z0, 0.5, 2.2, d), boxAt(x0 + w / 2, 0, z0 - 20, 0.5, 2.2, d - 40),
    boxAt(x0 + w / 2, 0, z0 + 40, 0.5, 2.2, 18), boxAt(x0, 0, z0 + d / 2, w, 2.2, 0.5),
  ], []);
  useBoxes('condo-wall', boxes);
  useEffect(() => { setPools('condo', [{ minX: -186, maxX: -160, minZ: 118, maxZ: 130, level: 0.06 }]); }, []);
  const fx = useMemo(() => [
    F('piscina', -173, 124, 0, { scale: [26 / 6, 1, 12 / 4] }),
    ...[-182, -176, -170, -164].map((x) => F('cama', x, 135, Math.PI, { color: '#ffffff', scale: [0.6, 0.5, 0.9], action: { type: 'sit' } })),
    F('guarda-sol', -158, 118, 0, { color: '#ff8fc7' }), F('guarda-sol', -188, 118, 0, { color: '#5ab0ff' }),
    F('balanco', -150, 95), F('escorregador', -150, 85, Math.PI / 2), F('arvore-flor', -150, 70), F('arvore', -248, 145), F('arvore-flor', -150, 145),
  ], []);
  const near = useNear(x0, z0, 140);
  return (
    <>
      <WorldSet id="condo" x={0} z={0} fixtures={fx} r={9999} />
      {near && (
        <group>
          <Bx c="#fdf6ec" tex="tijolo" rep={20} p={[x0, 1.1, z0 - d / 2]} s={[w, 2.2, 0.5]} />
          <Bx c="#fdf6ec" tex="tijolo" rep={16} p={[x0 - w / 2, 1.1, z0]} s={[0.5, 2.2, d]} />
          <Bx c="#fdf6ec" tex="tijolo" rep={10} p={[x0 + w / 2, 1.1, z0 - 20]} s={[0.5, 2.2, d - 40]} />
          <Bx c="#fdf6ec" tex="tijolo" rep={4} p={[x0 + w / 2, 1.1, z0 + 40]} s={[0.5, 2.2, 18]} />
          <Bx c="#fdf6ec" tex="tijolo" rep={20} p={[x0, 1.1, z0 + d / 2]} s={[w, 2.2, 0.5]} />
          <Bx c="#9d4edd" p={[x0 + w / 2, 4, z0 + 20]} s={[1, 0.6, 12]} />
          <Label text="Condomínio Jardim Encantado" icon="🏘️" p={[x0 + w / 2 + 0.6, 5.5, z0 + 20]} w={12} />
          <Bx c="#bdf5e0" tex="azulejo" rep={10} p={[-173, 0.03, 124]} s={[34, 0.04, 22]} />
        </group>
      )}
    </>
  );
}

// ---------------- Castelo & Floresta ----------------
export function Castle() {
  const cx = -260, cz = -285;
  const W = 60, D = 50, H = 9;
  const boxes = useMemo(() => {
    const b: Box[] = [];
    const lb = (lx: number, lz: number, w: number, h: number, d: number, y = 0) => localBox(cx, y, cz, 0, lx, 0, lz, w, h, d);
    b.push(lb(0, -D / 2, W, H, 2), lb(-W / 2, 0, 2, H, D), lb(W / 2, 0, 2, H, D));
    b.push(lb(-W / 4 - 3, D / 2, W / 2 - 6, H, 2), lb(W / 4 + 3, D / 2, W / 2 - 6, H, 2));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.push(lb(x * W / 2, z * D / 2, 8, 16, 8));
    // torre central (salão do trono)
    b.push(lb(0, -12, 24, 12, 1.5), lb(-12, -5, 1.5, 12, 14), lb(12, -5, 1.5, 12, 14), lb(-7.5, 2, 9, 12, 1.5), lb(7.5, 2, 9, 12, 1.5));
    return b;
  }, []);
  useBoxes('castle', boxes);
  const fx = useMemo(() => [
    F('tapete', 0, -5, 0, { color: '#e63946', scale: [1.2, 1, 6] }),
    F('trono', 0, -10, 0, { color: '#ffd23f' }), F('trono', -3, -10, 0, { color: '#ffc2d9', scale: [0.8, 0.8, 0.8] }),
    F('bau', 9, -10, -Math.PI / 2, { color: '#ffd23f', action: { type: 'treasure', id: 'castelo' }, label: 'Baú real' }),
    F('luzinhas', 0, -11.5), F('mesa', -7, -3, Math.PI / 2, { color: '#8d5b3a', scale: [2, 1, 1] }), F('piano', 8, -2, -Math.PI / 2, { color: '#ffffff' }),
    F('fonte', 0, 14, 0, { color: '#d4b8ff' }), F('arvore-flor', -18, 12), F('arvore-flor', 18, 12), F('canteiro', -10, 18, 0, { color: '#9d4edd' }), F('canteiro', 10, 18, 0, { color: '#ff5fa2' }),
  ], []);
  const forestFx = useMemo(() => [
    F('cogumelo', -340, -320, 0, { color: '#e63946' }), F('cogumelo', -345, -326, 0, { color: '#9d4edd', scale: [0.6, 0.6, 0.6] }), F('cogumelo', -334, -328, 0, { color: '#5ab0ff', scale: [0.8, 0.8, 0.8] }),
    F('bau', -372, -372, 0.4, { color: '#ffd23f', action: { type: 'treasure', id: 'floresta' }, label: 'Baú escondido' }),
    F('luzinhas', -330, -318), F('banco', -320, -340), F('pedra', -318, -335), F('pedra', -326, -344),
  ], []);
  useEffect(() => { setPools('lago', [{ minX: -310, maxX: -290, minZ: -352, maxZ: -336, level: 0.06 }]); }, []);
  const near = useNear(cx, cz, 160);
  const fire = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => { if (fire.current) fire.current.scale.y = 1 + Math.sin(clock.elapsedTime * 10) * 0.15; });
  return (
    <>
      <WorldSet id="castle" x={cx} z={cz} fixtures={fx} r={90} />
      <WorldSet id="forest" x={0} z={0} fixtures={forestFx} r={9999} />
      {near && (
        <group position={[cx, 0, cz]}>
          {/* muralhas */}
          <Bx c="#d9d4e8" tex="tijolo" rep={12} p={[0, H / 2, -D / 2]} s={[W, H, 2]} />
          <Bx c="#d9d4e8" tex="tijolo" rep={10} p={[-W / 2, H / 2, 0]} s={[2, H, D]} />
          <Bx c="#d9d4e8" tex="tijolo" rep={10} p={[W / 2, H / 2, 0]} s={[2, H, D]} />
          <Bx c="#d9d4e8" tex="tijolo" rep={6} p={[-W / 4 - 3, H / 2, D / 2]} s={[W / 2 - 6, H, 2]} />
          <Bx c="#d9d4e8" tex="tijolo" rep={6} p={[W / 4 + 3, H / 2, D / 2]} s={[W / 2 - 6, H, 2]} />
          <Bx c="#d9d4e8" p={[0, H - 1, D / 2]} s={[12, 2, 2]} />
          {Array.from({ length: 14 }).map((_, i) => <Bx key={i} c="#d9d4e8" p={[-W / 2 + 2 + i * 4.3, H + 0.6, D / 2]} s={[2, 1.2, 2]} />)}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
            <group key={`${x}${z}`} position={[x * W / 2, 0, z * D / 2]}>
              <Cy c="#e8e4f5" tex="tijolo" rep={4} p={[0, 8, 0]} s={[8, 16, 8]} />
              <Co c="#9d4edd" p={[0, 19, 0]} s={[10, 6, 10]} />
              <Cy c="#8d5b3a" p={[0, 23, 0]} s={[0.15, 3, 0.15]} />
              <Bx c="#ff5fa2" p={[0.9, 24, 0]} s={[1.6, 1, 0.05]} />
            </group>
          ))}
          {/* salão do trono */}
          <group position={[0, 0, -5]}>
            <Bx c="#f3e6d6" tex="marmore" rep={4} p={[0, 0.05, 0]} s={[24, 0.1, 14]} />
            <Bx c="#ffffff" p={[0, 6, -7]} s={[24, 12, 1.5]} />
            <Bx c="#ffffff" p={[-12, 6, 0]} s={[1.5, 12, 14]} />
            <Bx c="#ffffff" p={[12, 6, 0]} s={[1.5, 12, 14]} />
            <Bx c="#ffffff" p={[-7.5, 6, 7]} s={[9, 12, 1.5]} />
            <Bx c="#ffffff" p={[7.5, 6, 7]} s={[9, 12, 1.5]} />
            <Bx c="#ffffff" p={[0, 9.5, 7]} s={[6, 5, 1.5]} />
            <Cy c="#ffc2d9" p={[0, 14, 0]} s={[10, 4, 10]} />
            <Co c="#ff5fa2" p={[0, 19, 0]} s={[12, 6, 12]} />
            <pointLight position={[0, 8, 0]} intensity={20} distance={22} color="#fff0d0" />
          </group>
          <Label text="Castelo do Reino Encantado" icon="🏰" p={[0, 11.5, D / 2 + 1.2]} w={14} />
        </group>
      )}
      {/* fogueira e lago na floresta */}
      <group position={[-330, 0, -335]}>
        {[0, 1, 2, 3, 4, 5].map((i) => <Bx key={i} c="#8d5b3a" p={[Math.cos(i) * 0.6, 0.15, Math.sin(i) * 0.6]} s={[1.2, 0.2, 0.2]} r={[0, i, 0]} />)}
        <mesh ref={fire} position={[0, 0.7, 0]} material={mat('#ff9f43', { emissive: 1.5 })}><coneGeometry args={[0.5, 1.2, 8]} /></mesh>
        <pointLight position={[0, 1.5, 0]} intensity={8} distance={14} color="#ffb066" />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-300, 0.06, -344]} material={mat('#4fc3f7', { opacity: 0.85 })}><planeGeometry args={[20, 16]} /></mesh>
    </>
  );
}

// ---------------- Cidade do Futuro ----------------
export function FutureCity() {
  const towers = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; c: string }[] = [];
    const cols = ['#5ad1ff', '#ff5fa2', '#9d4edd', '#3ccf91', '#ffd23f'];
    let i = 0;
    for (const x of [-95, -65, 65, 95]) for (const z of [-340, -305]) out.push({ x, z, w: 14, h: 24 + ((i * 13) % 30), c: cols[i++ % 5] });
    out.push({ x: -95, z: -215, w: 12, h: 30, c: '#5ad1ff' }, { x: 95, z: -215, w: 12, h: 36, c: '#ff5fa2' });
    return out;
  }, []);
  const boxes = useMemo(() => towers.map((t) => boxAt(t.x, 0, t.z, t.w, t.h, t.w)), [towers]);
  useBoxes('future', boxes);
  // teletransportes
  useEffect(() => {
    const offs = towers.slice(0, 4).map((t, i) => {
      const p = new THREE.Vector3(t.x + t.w / 2 + 2, 0, t.z);
      const top = new THREE.Vector3(t.x, t.h + 0.2, t.z);
      const offA = registerInteractable({ id: `tp-${i}`, label: 'Teletransporte para o topo!', icon: '🌀', radius: 2, pos: () => p, action: () => { teleportPlayer(top.x, top.y, top.z); sfx('whoosh'); spawnEffect('sparkles', top); } });
      const offB = registerInteractable({ id: `tpb-${i}`, label: 'Voltar para o chão', icon: '🌀', radius: 2.5, pos: () => top, action: () => { teleportPlayer(p.x + 1, 0, p.z); sfx('whoosh'); } });
      return () => { offA(); offB(); };
    });
    return () => offs.forEach((o) => o());
  }, [towers]);
  const near = useNear(0, -275, 170);
  const plats = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!plats.current) return;
    plats.current.children.forEach((c, i) => { c.position.y = 6 + i * 3 + Math.sin(clock.elapsedTime + i) * 1.2; c.rotation.y += 0.004; });
  });
  const fx = useMemo(() => [F('foguete', 0, -330, 0, { scale: [2, 2, 2] }), F('portal', 0, -240, 0, { action: { type: 'teleport', to: [65, 0, 20], label: 'Portal para a Praça' } }), F('neon', -20, -200), F('neon', 20, -200, 0, { color: '#5ad1ff' })], []);
  return (
    <>
      <WorldSet id="futuro" x={0} z={0} fixtures={fx} r={9999} />
      {near && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -275]} material={mat('#2b2d42')}><planeGeometry args={[60, 180]} /></mesh>
          {[-28, 28].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, -275]} material={mat('#5ad1ff', { emissive: 1 })}><planeGeometry args={[0.6, 180]} /></mesh>)}
          {towers.map((t, i) => (
            <group key={i} position={[t.x, 0, t.z]}>
              <Bx c="#e0f4ff" p={[0, t.h / 2, 0]} s={[t.w, t.h, t.w]} />
              {Array.from({ length: Math.floor(t.h / 4) }).map((_, k) => <Bx key={k} c={t.c} e={0.9} p={[0, 2 + k * 4, 0]} s={[t.w + 0.1, 0.4, t.w + 0.1]} />)}
              <Cy c={t.c} e={0.7} p={[0, t.h + 1, 0]} s={[2, 2, 2]} />
              {i < 4 && <Cy c="#d4b8ff" e={1} p={[t.w / 2 + 2, 0.05, 0]} s={[2.2, 0.1, 2.2]} />}
            </group>
          ))}
          <group ref={plats}>
            {[[-30, -260], [30, -290], [0, -310]].map(([x, z], i) => (
              <group key={i} position={[x, 6, z]}>
                <Cy c="#c9d6ff" s={[8, 0.5, 8]} /><Cy c="#5ad1ff" e={1} p={[0, -0.4, 0]} s={[6, 0.2, 6]} />
                <Sp c="#ff5fa2" e={0.6} p={[0, 1.2, 0]} s={[1.5, 1.5, 1.5]} />
              </group>
            ))}
          </group>
          <Label text="Cidade do Futuro" icon="🚀" p={[0, 8, -200]} w={10} />
        </group>
      )}
    </>
  );
}

// ---------------- Aeroporto ----------------
export function Airport() {
  const near = useNear(260, -290, 190);
  useBoxes('airport', useMemo(() => [boxAt(360, 0, -215, 6, 24, 6)], []));
  if (!near) return null;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[260, 0.025, -300]} material={mat('#4a4e57')}><planeGeometry args={[250, 34]} /></mesh>
      {Array.from({ length: 20 }).map((_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[150 + i * 12, 0.04, -300]} material={mat('#ffffff')}><planeGeometry args={[6, 0.8]} /></mesh>)}
      {Array.from({ length: 26 }).map((_, i) => <Sp key={i} c={i % 2 ? '#5ad1ff' : '#ffd23f'} e={1} p={[140 + i * 9.5, 0.2, -318]} s={[0.4, 0.4, 0.4]} />)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[200, 0.025, -250]} material={mat('#6a707c')}><planeGeometry args={[20, 70]} /></mesh>
      <group position={[360, 0, -215]}>
        <Cy c="#ffffff" p={[0, 10, 0]} s={[4, 20, 4]} />
        <Cy c="#5ad1ff" o={0.7} p={[0, 21.5, 0]} s={[7, 3, 7]} />
        <Co c="#2f6fdf" p={[0, 24, 0]} s={[7.5, 2, 7.5]} />
      </group>
      <group position={[300, 0, -260]} rotation={[0, -0.5, 0]}><VehicleModel vtype="aviao" color="#ffffff" color2="#ff5fa2" /></group>
      <group position={[330, 0, -262]} rotation={[0, -0.8, 0]}><VehicleModel vtype="jatinho" color="#c7e5ff" color2="#2f6fdf" /></group>
      <group position={[270, 0, -255]}><VehicleModel vtype="helicoptero" color="#ffd23f" color2="#222831" /></group>
      <Label text="Aeroporto Nuvem Azul" icon="✈️" p={[200, 12, -208]} w={12} />
    </group>
  );
}

// ---------------- Ilhas secretas ----------------
export function Islands() {
  const fx = useMemo(() => {
    const out: Fixture[] = [];
    for (const i of ISLANDS) {
      out.push(F('bau', i.x, i.z - 2, 0, { color: '#ffd23f', action: { type: 'treasure', id: i.id }, label: `Tesouro da ${i.name}` }));
      out.push(F('palmeira', i.x - i.r / 2, i.z + 3), F('palmeira', i.x + i.r / 2.5, i.z - i.r / 3));
      if (i.id === 'unicornios') out.push(F('estatua-unicornio', i.x + 6, i.z + 6), F('arco-iris', i.x, i.z + 10), F('arvore-flor', i.x - 10, i.z - 8), F('flores', i.x + 3, i.z - 8, 0, { color: '#ff8fc7' }), F('nuvem', i.x - 8, i.z + 12, 0, { y: 5 }));
      if (i.id === 'tesouro') out.push(F('pedra', i.x + 5, i.z + 5), F('pedra', i.x - 6, i.z + 4, 1), F('bau', i.x + 8, i.z - 6, 1, { color: '#8d5b3a' }));
      if (i.id === 'nuvem') out.push(F('estrela', i.x, i.z + 4, 0, { color: '#ffd23f' }), F('luzinhas', i.x, i.z - 6));
      if (i.id === 'chocolate') out.push(F('bolo', i.x + 10, i.z + 10, 0, { color: '#8d5b3a' }), F('cogumelo', i.x - 12, i.z + 6, 0, { color: '#ff8fc7' }));
    }
    return out;
  }, []);
  const volcano = ISLANDS.find((i) => i.id === 'chocolate')!;
  useBoxes('volcano', useMemo(() => [boxAt(volcano.x, 0, volcano.z + 2, 12, 9, 12)], [volcano]));
  const lava = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => { if (lava.current) lava.current.position.y = 11 + Math.sin(clock.elapsedTime * 2) * 0.3; });
  return (
    <WorldSet id="ilhas" x={0} z={0} fixtures={fx} r={9999}>
      <group position={[volcano.x, 0, volcano.z + 2]}>
        <mesh position={[0, 5.5, 0]} material={mat('#6b3d24')}><coneGeometry args={[11, 11, 16, 1, true]} /></mesh>
        <mesh ref={lava} position={[0, 11, 0]} material={mat('#ff8fc7', { emissive: 0.3 })}><sphereGeometry args={[2.4, 12, 10]} /></mesh>
        {[0, 1, 2, 3].map((k) => <Sp key={k} c={['#ff5f5f', '#ffe066', '#5ab0ff', '#3ccf91'][k]} p={[Math.cos(k * 1.6) * 6, 6 - k, Math.sin(k * 1.6) * 6]} s={[0.6, 0.6, 0.6]} />)}
      </group>
      <Label text="Ilha dos Unicórnios" icon="🦄" p={[-220, 6, 300]} />
      <Label text="Vulcão de Chocolate" icon="🍫" p={[240, 15, 328]} />
    </WorldSet>
  );
}
