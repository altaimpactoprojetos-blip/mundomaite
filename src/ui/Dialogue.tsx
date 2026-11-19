import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { NPC_MAP } from '../data/npcs';
import { PROF_MAP } from '../data/professions';
import { rt, emote, spawnEffect, teleportPlayer } from '../systems/runtime';
import { sfx } from '../systems/audio';
import { takePhoto } from './photo';
import type { Personality } from '../types';
import { BUILDINGS } from '../data/world';

const GREET: Record<Personality, string[]> = {
  aventureira: ['Ei, {n}! Pronta para uma aventura?', 'Oi, {n}! Hoje eu explorei um lugar incrível!'],
  criativa: ['Oiê, {n}! Que visual lindo você está hoje! ✨', 'Olá, {n}! Tive uma ideia muito colorida!'],
  carinhosa: ['Que alegria te ver, {n}! 💕', 'Oi, querida {n}! Como você está?'],
  engracada: ['Olha só quem chegou! A famosa {n}! 😄', 'E aí, {n}! Quer ouvir uma piada?'],
  tranquila: ['Olá, {n}. Que dia bonito, não é? ☀️', 'Oi, {n}. Bom te ver por aqui.'],
  curiosa: ['Oi, {n}! Você sabia que as abelhas dançam para conversar? 🐝', 'Olá, {n}! O que você descobriu hoje?'],
};
const REACT: Record<string, string[]> = {
  dance: ['Uhuul! Você dança muito bem! 💃', 'Mais uma música! 🎶', 'Que passinho incrível!'],
  hug: ['Ownn, que abraço quentinho! 🤗', 'Abraço de amiga é o melhor!', 'Você é muito especial! 💖'],
  play: ['Tá com você! Hahaha! 🏃', 'Que brincadeira divertida!', 'De novo, de novo!'],
  picnic: ['Hmm, que sanduíche gostoso! 🥪', 'Piquenique é a melhor coisa do mundo!', 'Trouxe suco de morango! 🍓'],
  walk: ['Vamos passear! Eu vou com você! 🚶‍♀️', 'Me mostra os lugares legais!'],
  photo: ['Xiiis! 📸', 'Vou sair linda nessa foto!'],
  cinema: ['Oba, cinema! Eu levo a pipoca! 🍿'],
};
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

export function Dialogue() {
  const dialog = useGame((s) => s.dialog);
  const name = useGame((s) => s.appearance.name);
  const friendship = useGame((s) => (dialog ? s.friendship[dialog.npcId] ?? 0 : 0));
  const [text, setText] = useState('');
  const npc = dialog ? NPC_MAP[dialog.npcId] : null;

  useEffect(() => {
    if (!npc) return;
    setText(pick(GREET[npc.personality]).replace('{n}', name));
    sfx('pop');
  }, [npc, name]);
  if (!dialog || !npc) return null;
  const s = useGame.getState();
  const npcAnim = (anim: Parameters<typeof emote>[0], secs = 3, follow = 0) => rt.npcAnim.set(npc.id, { anim, until: rt.time + secs, follow: follow ? rt.time + follow : 0 });
  const close = () => s.set({ dialog: null });
  const reply = (kind: string, ev?: string) => {
    setText(pick(REACT[kind]));
    s.befriend(npc.id);
    if (ev) s.track(ev);
  };
  const npcPos = rt.npcPos.get(npc.id);

  const options: { icon: string; label: string; go: () => void }[] = [
    { icon: '💬', label: 'Conversar', go: () => { setText(pick(npc.lines)); s.befriend(npc.id); s.track('talk'); npcAnim('wave', 1.5); } },
    { icon: '💃', label: 'Dançar', go: () => { emote('dance', 4); npcAnim('dance', 4); if (npcPos) spawnEffect('notes', npcPos); reply('dance', 'dance'); sfx('note', 1.5); } },
    { icon: '🤗', label: 'Abraçar', go: () => {
      emote('hug', 2.5); npcAnim('hug', 2.5);
      if (npcPos) { spawnEffect('hearts', npcPos); const P = rt.player.pos; const dx = npcPos.x - P.x, dz = npcPos.z - P.z; rt.player.yaw = Math.atan2(dx, dz); }
      reply('hug', 'hug'); sfx('hug');
    } },
    { icon: '🎈', label: 'Brincar', go: () => { emote('play', 3); npcAnim('play', 4, 8); reply('play', 'talk'); } },
    { icon: '📸', label: 'Foto juntas', go: () => { npcAnim('cheer', 2); emote('cheer', 2); reply('photo'); setTimeout(() => takePhoto(), 400); } },
    { icon: '🧺', label: 'Piquenique', go: () => {
      emote('sit', 5); npcAnim('sit', 5); spawnEffect('hearts', rt.player.pos); s.hold('sorvete');
      reply('picnic', 'picnic'); s.toast('Que piquenique gostoso! 🧺🍓', '🧺');
    } },
    { icon: '🎬', label: 'Cinema', go: () => {
      const c = BUILDINGS.find((b) => b.id === 'cinema')!;
      teleportPlayer(c.pos[0], 0, c.pos[1] - 2);
      rt.player.seat = null;
      s.set({ dialog: null, overlay: { kind: 'cinema', data: npc.name } });
      s.befriend(npc.id, 2);
    } },
    { icon: '🚶‍♀️', label: 'Passear', go: () => { npcAnim('walk', 0, 90); reply('walk', 'talk'); setTimeout(close, 900); } },
  ];
  if (npc.job) options.push({ icon: PROF_MAP[npc.job]?.icon ?? '💼', label: 'Trabalhar', go: () => s.set({ dialog: null, minigame: npc.job! }) });
  if (npc.shop) options.push({ icon: '🛍️', label: 'Comprar', go: () => { s.set({ dialog: null }); s.openPanel('shop', npc.shop!); } });
  options.push({ icon: '👋', label: 'Tchau!', go: () => { npcAnim('wave', 2); close(); } });

  return (
    <div className="dialog" onPointerDown={(e) => e.stopPropagation()}>
      <div className="who">
        <div className="face">{npc.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 19 }}>{npc.name}</div>
          <div className="muted">{npc.role} · {'💖'.repeat(Math.ceil(friendship / 2)) || '🤍'} amizade</div>
        </div>
        <button className="close" onClick={close}>✖</button>
      </div>
      <div className="txt">{text}</div>
      <div className="opts">
        {options.map((o) => <button key={o.label} className="btn" onClick={() => { sfx('click'); o.go(); }}><span>{o.icon}</span>{o.label}</button>)}
      </div>
    </div>
  );
}
