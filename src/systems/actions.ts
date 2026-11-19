import * as THREE from 'three';
import type { ActionSpec } from '../types';
import { useGame } from '../store/gameStore';
import { rt, emote, spawnEffect, teleportPlayer } from './runtime';
import { sfx } from './audio';
import { PROF_MAP } from '../data/professions';

export function actionLabel(a: ActionSpec, fallback = 'Usar'): { label: string; icon: string } {
  switch (a.type) {
    case 'shop': return { label: a.title ? `Loja: ${a.title}` : 'Abrir loja', icon: '🛍️' };
    case 'job': return { label: `Trabalhar: ${PROF_MAP[a.job]?.name ?? a.job}`, icon: PROF_MAP[a.job]?.icon ?? '💼' };
    case 'sit': return { label: 'Sentar', icon: '🪑' };
    case 'sleep': return { label: 'Dormir', icon: '😴' };
    case 'editor': return { label: 'Mudar visual', icon: '🪞' };
    case 'cinema': return { label: 'Assistir filme', icon: '🎬' };
    case 'snack': return { label: `Pegar ${a.name}`, icon: '😋' };
    case 'tv': return { label: 'Ver TV', icon: '📺' };
    case 'piano': return { label: 'Tocar piano', icon: '🎹' };
    case 'exercise': return { label: 'Exercitar', icon: '🏃' };
    case 'bath': return { label: 'Tomar banho', icon: '🛁' };
    case 'trampoline': return { label: 'Pular!', icon: '🤸' };
    case 'adopt': return { label: 'Adotar pet', icon: '🐾' };
    case 'swing': return { label: 'Brincar', icon: '🎠' };
    case 'message': return { label: fallback, icon: a.icon ?? '💬' };
    case 'ride': return { label: 'Andar no brinquedo', icon: '🎡' };
    case 'treasure': return { label: 'Abrir baú', icon: '💎' };
    case 'teleport': return { label: a.label, icon: '🌀' };
    case 'farm': return { label: 'Cuidar da horta', icon: '🌱' };
    case 'dance': return { label: 'Dançar', icon: '💃' };
    case 'garage': return { label: 'Garagem', icon: '🚗' };
    case 'mailbox': return { label: 'Caixa de correio', icon: '📬' };
    case 'prepare': return { label: a.recipe === 'lanche' ? 'Preparar um lanche' : 'Preparar bebida', icon: a.recipe === 'lanche' ? '🥪' : '🥤' };
    case 'board': return { label: 'Escrever no quadro', icon: '✏️' };
  }
}

/** Executa uma ação de um objeto interativo. pos/yaw = posição do objeto */
export function runAction(a: ActionSpec, pos: THREE.Vector3, yaw: number, seatY = 0.5) {
  const g = useGame.getState();
  switch (a.type) {
    case 'shop': g.openPanel('shop', a.cat ?? null); break;
    case 'job': g.set({ minigame: a.job }); sfx('click'); break;
    case 'sit':
    case 'swing':
      rt.player.seat = { pos: new THREE.Vector3(pos.x, pos.y + seatY, pos.z), yaw, anim: 'sit', label: a.type === 'swing' ? 'Balançando! 🎠' : 'Sentada' };
      if (a.type === 'swing') g.track('ride');
      sfx('pop');
      break;
    case 'sleep':
      rt.player.seat = { pos: new THREE.Vector3(pos.x, pos.y + 0.75, pos.z), yaw, anim: 'sleep', label: 'Dormindo... 💤' };
      g.set({ overlay: { kind: 'sleep' } });
      break;
    case 'editor': g.openPanel('character', a.tab ?? null); break;
    case 'cinema':
      rt.player.seat = { pos: new THREE.Vector3(pos.x, pos.y + 0.5, pos.z), yaw, anim: 'sit', label: 'No cinema 🍿' };
      g.set({ overlay: { kind: 'cinema' } });
      break;
    case 'tv': g.set({ overlay: { kind: 'tv' } }); break;
    case 'piano': g.set({ overlay: { kind: 'piano' } }); break;
    case 'snack':
      g.hold(a.item);
      emote('cheer', 1.5);
      g.toast(`Hmm! Você pegou ${a.name}! 😋`, '😋');
      g.track('snack');
      sfx('pop');
      break;
    case 'exercise': emote('exercise', 4); g.toast('Exercício faz bem! 💪', '🏃'); spawnEffect('stars', rt.player.pos); break;
    case 'bath': {
      const pet = g.pets.find((p) => p.id === g.activePet);
      if (pet) { g.petCare(pet.id, 'bath'); g.toast(`${pet.name} tomou banho e está cheirosinho! 🫧`, '🛁'); }
      else g.toast('Que banho relaxante! 🫧', '🛁');
      spawnEffect('bubbles', pos.clone().add(new THREE.Vector3(0, 1, 0)));
      sfx('splash');
      break;
    }
    case 'trampoline': rt.player.velY = 15; rt.player.onGround = false; sfx('jump', 1.6); spawnEffect('stars', rt.player.pos); g.track('ride'); break;
    case 'adopt': g.openPanel('shop', 'pets'); break;
    case 'dance': emote('dance', 5); spawnEffect('notes', rt.player.pos); g.track('dance'); break;
    case 'message': g.toast(a.text, a.icon ?? '💬'); sfx('sparkle'); break;
    case 'teleport': teleportPlayer(a.to[0], a.to[1], a.to[2]); sfx('whoosh'); spawnEffect('sparkles', rt.player.pos); break;
    case 'farm': g.farmAction(a.plot); break;
    case 'garage': g.openPanel('vehicles'); break;
    case 'mailbox': g.openPanel('quests'); break;
    case 'treasure': {
      if (g.treasures.includes(a.id)) { g.toast('Você já abriu este baú! 💎', '💎'); break; }
      const rewards: Record<string, { item: string; text: string }> = {
        tesouro: { item: 'w-coroa-arcoiris', text: 'Coroa Arco-Íris' },
        unicornios: { item: 'w-asas-arcoiris', text: 'Asas Arco-Íris' },
        chocolate: { item: 'b-bolo', text: 'Bolo gigante de chocolate' },
        nuvem: { item: 'b-portal', text: 'Portal Mágico' },
        floresta: { item: 'b-cogumelo', text: 'Cogumelo mágico' },
        castelo: { item: 'b-trono', text: 'Trono real' },
      };
      const r = rewards[a.id] ?? { item: 'b-estrela', text: 'Estrela gigante' };
      const s = useGame.getState();
      const up: Partial<typeof s> = { treasures: [...s.treasures, a.id] };
      if (r.item.startsWith('w-')) up.wardrobe = [...s.wardrobe, r.item];
      else { const model = r.item.slice(2); up.inventory = { ...s.inventory, [model]: (s.inventory[model] ?? 0) + 3 }; }
      g.set(up);
      g.earn(300, 'tesouro');
      g.toast(`TESOURO! Você ganhou: ${r.text}! 🎉`, '💎');
      spawnEffect('confetti', pos.clone().add(new THREE.Vector3(0, 1, 0)));
      sfx('fanfare');
      break;
    }
    case 'ride': break;
    case 'prepare': g.set({ overlay: { kind: 'prepare', data: a.recipe } }); break;
    case 'board': g.set({ overlay: { kind: 'board' } }); break;
  }
}
