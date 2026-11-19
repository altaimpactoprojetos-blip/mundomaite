import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AnimName, Appearance, NPCDef, Personality } from '../types';
import { BUILDINGS, PROPERTIES, ROADS } from '../data/world';
import { NPC_MAP } from '../data/npcs';
import { LodAvatar } from './Avatar';
import { npcLook, npcLookAtPlayer } from './NPCs';
import { BlobShadow } from './Player';
import { PetModel } from './PetModel';
import { rt } from '../systems/runtime';
import { registerInteractable } from '../systems/interactions';
import { useGame } from '../store/gameStore';
import { signTexture } from '../systems/textures';
import { houseDims } from '../world/House';

// ---------------- rede de calçadas (cantos dos cruzamentos) ----------------
const XS = [-260, -130, 0, 130];
const ZS = [-170, -60, 50, 160];
const roadW = (axis: 'x' | 'z', v: number) => ROADS.find((r) => (axis === 'x' ? r.x1 === r.x2 && r.x1 === v : r.z1 === r.z2 && r.z1 === v))?.w ?? 10;

interface Node { id: number; x: number; z: number; links: number[]; cross: number[] }
export const NODES: Node[] = [];
const key = (i: number, j: number, sx: number, sz: number) => ((i * 4 + j) * 4) + (sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0);
XS.forEach((X, i) => ZS.forEach((Z, j) => {
  const ox = roadW('x', X) / 2 + 1.25, oz = roadW('z', Z) / 2 + 1.25;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) NODES[key(i, j, sx, sz)] = { id: key(i, j, sx, sz), x: X + sx * ox, z: Z + sz * oz, links: [], cross: [] };
}));
XS.forEach((_, i) => ZS.forEach((__, j) => {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const n = NODES[key(i, j, sx, sz)];
    if (sx > 0 && i < XS.length - 1) { n.links.push(key(i + 1, j, -1, sz)); NODES[key(i + 1, j, -1, sz)].links.push(n.id); }
    if (sz > 0 && j < ZS.length - 1) { n.links.push(key(i, j + 1, sx, -1)); NODES[key(i, j + 1, sx, -1)].links.push(n.id); }
    // faixas de pedestre
    n.cross.push(key(i, j, -sx, sz), key(i, j, sx, -sz));
  }
}));

interface Door { out: THREE.Vector3; inn: THREE.Vector3 | null; kind: string; id: string }
function buildDoors(): Door[] {
  const out: Door[] = [];
  for (const b of BUILDINGS) {
    const c = Math.cos(b.rot), s = Math.sin(b.rot);
    const w = (lx: number, lz: number) => new THREE.Vector3(b.pos[0] + lx * c + lz * s, 0, b.pos[1] - lx * s + lz * c);
    out.push({ out: w(0, b.size[2] / 2 + 2.5), inn: w((Math.random() - 0.5) * (b.size[0] - 8), b.size[2] / 2 - 5 - Math.random() * 6), kind: b.type, id: b.id });
  }
  for (const p of PROPERTIES) {
    if (!p.preset) continue;
    const { D } = houseDims(p.preset);
    const c = Math.cos(p.rot), s = Math.sin(p.rot);
    const lz = -2 + D / 2 + 2;
    out.push({ out: new THREE.Vector3(p.pos[0] + lz * s, 0, p.pos[1] + lz * c), inn: null, kind: 'casa', id: p.id });
  }
  return out;
}

const NAMES_F = ['Ana', 'Bela', 'Carla', 'Dani', 'Eva', 'Fê', 'Gabi', 'Helô', 'Isa', 'Júlia', 'Kika', 'Laura', 'Mari', 'Nanda', 'Olívia', 'Paty', 'Rita', 'Sara', 'Tina', 'Vivi'];
const NAMES_M = ['André', 'Beto', 'Cadu', 'Dudu', 'Enzo', 'Fábio', 'Guto', 'Hugo', 'Igor', 'João', 'Lucas', 'Miguel', 'Nico', 'Otto', 'Paulo', 'Rui', 'Tito', 'Vini'];
const PERS: Personality[] = ['aventureira', 'criativa', 'carinhosa', 'engracada', 'tranquila', 'curiosa'];

type Kind = 'adulto' | 'estudante' | 'cachorro' | 'idoso';
interface Sim {
  id: string; name: string; kind: Kind; look: Appearance; pos: THREE.Vector3; yaw: number; anim: AnimName;
  path: THREE.Vector3[]; node: number; prev: number; wait: number; hidden: boolean; speed: number;
  dogPos: THREE.Vector3; greetAt: number; bubble: string; bubbleUntil: number; door: Door | null; stage: number; resid: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

function makeSim(i: number, doors: Door[]): Sim {
  const hour = rt.hour;
  const morning = hour >= 6.5 && hour < 9.5;
  const afternoon = hour >= 13 && hour < 18.5;
  let kind: Kind = 'adulto';
  const r = Math.random();
  if (morning && r < 0.35) kind = 'estudante';
  else if (afternoon && r < 0.25) kind = 'cachorro';
  else if (r > 0.88) kind = 'idoso';
  // centro mais movimentado
  const center = i >= 4 && Math.random() < 0.7;
  // os primeiros moradores ficam perto de casa, para a Maitê encontrar alguém logo ao sair
  const homeId = useGame.getState().homeId;
  const home = PROPERTIES.find((p) => p.id === homeId);
  const pool = i < 4 && home ? [...NODES].sort((a, b) => Math.hypot(a.x - home.pos[0], a.z - home.pos[1]) - Math.hypot(b.x - home.pos[0], b.z - home.pos[1])).slice(0, 6)
    : NODES.filter((n) => (center ? n.x > -135 && n.x < 140 : n.x < -125));
  const node = pick(pool);
  const fem = Math.random() < 0.55;
  const name = pick(fem ? NAMES_F : NAMES_M);
  const id = `ped-${i}-${Math.floor(Math.random() * 1e6)}`;
  const def: NPCDef = {
    id, name, role: kind === 'estudante' ? 'Estudante' : kind === 'cachorro' ? 'Vizinho(a) passeando com o cachorro' : kind === 'idoso' ? 'Vovô / Vovó do bairro' : 'Morador(a) da cidade',
    icon: kind === 'estudante' ? '🎒' : kind === 'cachorro' ? '🐕' : kind === 'idoso' ? '👵' : fem ? '👩' : '👨', personality: pick(PERS),
    look: {
      height: kind === 'estudante' ? rand(0.78, 0.88) : kind === 'idoso' ? rand(0.95, 1.02) : rand(1.05, 1.18),
      hairStyle: kind === 'idoso' ? 'coque' : fem ? pick(['longo', 'rabo', 'coque', 'cacheado', 'trancas', 'franja', 'black'] as const) : pick(['curto', 'black', 'careca', 'franja'] as const),
      hairColor: kind === 'idoso' ? '#e8e8e8' : undefined,
      accessories: kind === 'estudante' ? ['mochila'] : kind === 'idoso' ? ['oculos-coracao'] : Math.random() < 0.3 ? [pick(['bone', 'chapeu-sol', 'bolsa-coracao', 'colar'])] : [],
      top: fem ? pick(['vestido', 'blusa-babado', 'camiseta', 'listrada', 'jaqueta', 'vestido-floral']) : pick(['camiseta', 'moletom', 'jaqueta', 'listrada', 'regata']),
      bottom: fem ? pick(['saia', 'calca', 'legging', 'shorts']) : pick(['calca', 'bermuda', 'shorts']),
    },
    routine: [], lines: kind === 'estudante'
      ? ['Hoje tem aula de desenho! 🎨', 'Estou indo para a escola, não posso me atrasar! 🎒', 'Você também estuda na Escola Estrelinha?']
      : kind === 'cachorro' ? ['Esse é o Biscoito, ele adora passear! 🐕', 'Quer fazer carinho nele? Ele é bonzinho!', 'Nosso passeio favorito é até a praça!']
        : ['Que dia lindo para passear! ☀️', 'Já experimentou o bolo da cafeteria?', 'Estou indo às compras no shopping! 🛍️', 'Moro aqui pertinho, no Bairro das Flores 🌷', 'Você viu o parque de diversões? É incrível!'],
  };
  NPC_MAP[id] = def;
  const look = npcLook(def);
  const sim: Sim = {
    id, name, kind, look, pos: new THREE.Vector3(node.x + rand(-0.6, 0.6), 0, node.z + rand(-0.6, 0.6)), yaw: 0, anim: 'walk', path: [], node: node.id, prev: -1,
    wait: 0, hidden: false, speed: kind === 'idoso' ? rand(0.9, 1.1) : kind === 'cachorro' ? rand(1.0, 1.3) : kind === 'estudante' ? rand(1.6, 2.0) : rand(1.25, 1.6),
    dogPos: new THREE.Vector3(), greetAt: -99, bubble: '', bubbleUntil: 0, door: null, stage: 0, resid: !center,
  };
  if (kind === 'estudante') { const school = doors.find((d) => d.id === 'escola'); if (school) sim.door = school; }
  sim.dogPos.copy(sim.pos);
  return sim;
}

function nearestNode(p: THREE.Vector3) {
  let best = NODES[0];
  let bd = Infinity;
  for (const n of NODES) { const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < bd) { bd = d; best = n; } }
  return best;
}

function planNext(s: Sim, doors: Door[]) {
  let n = NODES[s.node];
  if (!n) { n = nearestNode(s.pos); s.node = n.id; }
  // visita uma porta próxima (loja, casa, escola...)
  if (s.door && s.stage === 0) {
    const goal = nearestNode(s.door.out);
    if (goal.id === n.id) {
      s.path = [s.door.out.clone()];
      if (s.door.inn) s.path.push(s.door.inn.clone());
      s.stage = 1;
      return;
    }
    // vai de esquina em esquina na direção da porta
    const all = [...n.links, ...n.cross];
    const best = all.reduce((a, b) => (Math.hypot(NODES[b].x - goal.x, NODES[b].z - goal.z) < Math.hypot(NODES[a].x - goal.x, NODES[a].z - goal.z) ? b : a));
    s.prev = s.node;
    s.node = best;
    s.path = [new THREE.Vector3(NODES[best].x + rand(-0.4, 0.4), 0, NODES[best].z + rand(-0.4, 0.4))];
    return;
  }
  if (!s.door && Math.random() < (s.resid ? 0.18 : 0.12)) {
    const hour = rt.hour;
    const cands = doors.filter((d) => Math.hypot(d.out.x - n.x, d.out.z - n.z) < 45 && (d.kind === 'casa' ? s.resid : !s.resid) && (d.kind !== 'cafeteria' || (hour > 12 && hour < 19) || Math.random() < 0.4));
    if (cands.length) { s.door = pick(cands); s.stage = 1; s.path = [s.door.out.clone()]; if (s.door.inn) s.path.push(s.door.inn.clone()); return; }
  }
  // dobra a esquina ou atravessa na faixa
  const opts = [...n.links.filter((l) => l !== s.prev)];
  if (Math.random() < 0.35) opts.push(...n.cross);
  if (!opts.length) opts.push(...n.links, ...n.cross);
  const next = pick(opts);
  s.prev = s.node;
  s.node = next;
  const nn = NODES[next];
  s.path = [new THREE.Vector3(nn.x + rand(-0.5, 0.5), 0, nn.z + rand(-0.5, 0.5))];
}

const GREET_M = ['Bom dia, Maitê! ☀️', 'Oi, Maitê! 👋', 'Bom dia! Indo passear?'];
const GREET_T = ['Boa tarde, Maitê! 🌤️', 'Oi, Maitê! 👋', 'Que tarde gostosa!'];
const GREET_N = ['Boa noite, Maitê! 🌙', 'Oi! Já está tarde, hein? 🌙'];

const PedView = memo(function PedView({ s }: { s: Sim }) {
  const g = useRef<THREE.Group>(null!);
  const dog = useRef<THREE.Group>(null!);
  const bub = useRef<THREE.Sprite>(null!);
  const bubMat = useRef<THREE.SpriteMaterial>(null!);
  const lastBubble = useRef('');
  const dogAnim = useRef<'walk' | 'idle'>('walk');
  useEffect(() => registerInteractable({
    id: `npc-${s.id}`, label: `Conversar com ${s.name}`, icon: '💬', radius: 2.4, priority: 1.1,
    pos: () => (s.hidden ? null : s.pos), action: () => useGame.getState().set({ dialog: { npcId: s.id, text: '' } }),
  }), [s]);
  useFrame(() => {
    g.current.visible = !s.hidden;
    g.current.position.copy(s.pos);
    g.current.rotation.y = s.yaw;
    if (dog.current) {
      dog.current.position.copy(s.dogPos);
      dog.current.rotation.y = Math.atan2(s.pos.x - s.dogPos.x, s.pos.z - s.dogPos.z);
      dog.current.visible = !s.hidden;
      dogAnim.current = s.anim === 'walk' ? 'walk' : 'idle';
    }
    const showB = rt.time < s.bubbleUntil && !s.hidden;
    bub.current.visible = showB;
    if (showB && lastBubble.current !== s.bubble) {
      lastBubble.current = s.bubble;
      bubMat.current.map = signTexture(s.bubble, '#ffffff', '#7a3a9a');
      bubMat.current.needsUpdate = true;
    }
  });
  const h = s.look.height || 1;
  const dogColor = useMemo(() => pick(['#c8a27a', '#ffffff', '#5a3a26', '#f2d27a']), []);
  return (
    <>
      <group ref={g}>
        <LodAvatar look={s.look} getAnim={() => s.anim} seed={s.name.length} getLook={npcLookAtPlayer(s.pos)} near={13} />
        <BlobShadow size={h} />
        <sprite ref={bub} position={[0, 2.45 * h, 0]} scale={[2.6, 0.65, 1]} visible={false}>
          <spriteMaterial ref={bubMat} transparent depthTest={false} />
        </sprite>
      </group>
      {s.kind === 'cachorro' && (
        <group ref={dog}>
          <PetModel species="cachorro" color={dogColor} accessory="coleira" accColor="#e63946" getAnim={() => dogAnim.current} />
          <BlobShadow size={0.8} />
        </group>
      )}
    </>
  );
});

/** Moradores aleatórios andando pela cidade */
export function Pedestrians() {
  const quality = useGame((s) => s.settings.quality);
  const screen = useGame((s) => s.screen);
  const count = quality === 'baixa' ? 26 : quality === 'media' ? 38 : 48;
  const renderR = quality === 'baixa' ? 38 : 60;
  const doors = useMemo(() => buildDoors(), []);
  const sims = useMemo(() => Array.from({ length: count }, (_, i) => makeSim(i, doors)), [count, doors, screen === 'game']); // novo sorteio a cada visita
  const [visible, setVisible] = useState<number[]>([]);
  const acc = useRef(0);
  useEffect(() => {
    sims.forEach((s) => rt.npcPos.set(s.id, s.pos));
    return () => sims.forEach((s) => { rt.npcPos.delete(s.id); delete NPC_MAP[s.id]; });
  }, [sims]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const P = rt.vehicle.id ? rt.vehicle.pos : rt.player.pos;
    const hour = rt.hour;
    const night = hour < 6 || hour > 21.5;
    const dialogId = useGame.getState().dialog?.npcId;
    acc.current += dt;
    for (let i = 0; i < sims.length; i++) {
      const s = sims[i];
      const d = Math.hypot(P.x - s.pos.x, P.z - s.pos.z);
      const near = d < renderR;
      // longe: atualiza menos vezes (economiza bateria do celular)
      const step = near ? dt : (i + Math.floor(acc.current * 4)) % 4 === 0 ? dt * 4 : 0;
      if (step === 0) continue;
      if (dialogId === s.id) { s.anim = 'idle'; s.yaw = Math.atan2(P.x - s.pos.x, P.z - s.pos.z); continue; }
      const extra = rt.npcAnim.get(s.id);
      if (extra && extra.until > rt.time) { s.anim = extra.anim; continue; }
      if (extra && extra.follow > rt.time) {
        const dd = d;
        if (dd > 2.2) { const ux = (P.x - s.pos.x) / dd, uz = (P.z - s.pos.z) / dd; s.pos.x += ux * step * (dd > 6 ? 4 : 2); s.pos.z += uz * step * (dd > 6 ? 4 : 2); s.yaw = Math.atan2(ux, uz); s.anim = dd > 6 ? 'run' : 'walk'; }
        else s.anim = 'idle';
        continue;
      }
      if (s.wait > 0) {
        s.wait -= step;
        s.anim = 'idle';
        if (s.wait <= 0 && s.door) {
          // sai da loja/casa e volta para a calçada
          s.hidden = false;
          const nn = nearestNode(s.door.out);
          s.path = [s.door.out.clone(), new THREE.Vector3(nn.x, 0, nn.z)];
          s.node = nn.id;
          s.door = null;
          s.stage = 0;
        }
        continue;
      }
      if (night && !s.hidden && Math.random() < step * 0.02) { s.hidden = true; s.wait = 9999; continue; }
      if (!s.path.length) {
        if (s.door && s.stage === 1) {
          // chegou: entra
          s.stage = 2;
          if (s.door.kind === 'casa' || s.kind === 'estudante') s.hidden = true;
          s.wait = s.kind === 'estudante' && hour < 15 ? rand(40, 90) : rand(6, 16);
          continue;
        }
        planNext(s, doors);
      }
      const tgt = s.path[0];
      if (!tgt) { planNext(s, doors); continue; }
      let dx = tgt.x - s.pos.x, dz = tgt.z - s.pos.z;
      const l = Math.hypot(dx, dz);
      if (l < 0.35) { s.path.shift(); continue; }
      dx /= l; dz /= l;
      // desviar dos outros e da Maitê
      let ax = 0, az = 0;
      for (let k = 0; k < sims.length; k++) {
        if (k === i) continue;
        const o = sims[k];
        if (o.hidden) continue;
        const ox = s.pos.x - o.pos.x, oz = s.pos.z - o.pos.z;
        const od = ox * ox + oz * oz;
        if (od < 1.1 && od > 0.0001) { ax += ox / od * 0.4; az += oz / od * 0.4; }
      }
      const px = s.pos.x - rt.player.pos.x, pz = s.pos.z - rt.player.pos.z;
      const pd = px * px + pz * pz;
      if (pd < 1.6 && pd > 0.0001) { ax += px / pd * 0.8; az += pz / pd * 0.8; }
      const mx = dx + ax, mz = dz + az;
      const ml = Math.hypot(mx, mz) || 1;
      s.pos.x += (mx / ml) * s.speed * step;
      s.pos.z += (mz / ml) * s.speed * step;
      let dy = Math.atan2(mx, mz) - s.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      s.yaw += dy * Math.min(1, step * 6);
      s.anim = s.kind === 'estudante' && s.door ? 'run' : 'walk';
      if (s.kind === 'cachorro') {
        const bx = s.pos.x - Math.sin(s.yaw) * -1.3 + Math.cos(s.yaw) * 0.6, bz = s.pos.z - Math.cos(s.yaw) * -1.3 - Math.sin(s.yaw) * 0.6;
        s.dogPos.x += (bx - s.dogPos.x) * Math.min(1, step * 3);
        s.dogPos.z += (bz - s.dogPos.z) * Math.min(1, step * 3);
      }
      // cumprimenta a Maitê
      if (near && d < 4 && rt.time - s.greetAt > 25 && !s.hidden) {
        s.greetAt = rt.time;
        const st = useGame.getState();
        const pet = st.pets.find((p) => p.id === st.activePet);
        const r = Math.random();
        s.bubble = pet && r < 0.3 ? (pet.species === 'unicornio' ? `Posso fazer carinho no ${pet.name}? 🥺` : `Que fofura o ${pet.name}! 💕`)
          : r < 0.45 ? 'Vamos brincar na praça? 🎈' : pick(hour < 12 ? GREET_M : hour < 18.5 ? GREET_T : GREET_N);
        s.bubbleUntil = rt.time + 3.2;
        rt.npcAnim.set(s.id, { anim: 'wave', until: rt.time + 1.4, follow: 0 });
      }
    }
    if (acc.current > 0.5) {
      acc.current = 0;
      const vis: number[] = [];
      sims.forEach((s, i) => { if (!s.hidden && Math.hypot(P.x - s.pos.x, P.z - s.pos.z) < renderR) vis.push(i); });
      // no celular, desenha só os mais próximos
      const max = quality === 'baixa' ? 9 : 16;
      if (vis.length > max) vis.sort((a, b) => sims[a].pos.distanceTo(P) - sims[b].pos.distanceTo(P)).splice(max);
      if (vis.join() !== visible.join()) setVisible(vis.sort((a, b) => a - b));
    }
  });
  return <>{visible.map((i) => <PedView key={sims[i].id} s={sims[i]} />)}</>;
}
