import type { Quest } from '../types';

const T: Omit<Quest, 'progress' | 'claimed'>[] = [
  { id: 'talk', text: 'Converse com 3 amigos da cidade', icon: '💬', event: 'talk', target: 3, reward: 60 },
  { id: 'hug', text: 'Dê 2 abraços', icon: '🤗', event: 'hug', target: 2, reward: 40 },
  { id: 'dance', text: 'Dance com alguém', icon: '💃', event: 'dance', target: 1, reward: 40 },
  { id: 'pet', text: 'Cuide do seu pet 3 vezes', icon: '🐾', event: 'pet', target: 3, reward: 60 },
  { id: 'build', text: 'Coloque 5 objetos construindo', icon: '🧱', event: 'build', target: 5, reward: 70 },
  { id: 'drive', text: 'Dirija um veículo', icon: '🚗', event: 'drive', target: 1, reward: 40 },
  { id: 'job', text: 'Trabalhe em 2 profissões', icon: '👩‍⚕️', event: 'job', target: 2, reward: 100 },
  { id: 'photo', text: 'Tire 2 fotos', icon: '📸', event: 'photo', target: 2, reward: 40 },
  { id: 'swim', text: 'Nade no mar ou na piscina', icon: '🏊', event: 'swim', target: 1, reward: 40 },
  { id: 'shop', text: 'Compre algo na loja', icon: '🛍️', event: 'shop', target: 1, reward: 30 },
  { id: 'ride', text: 'Brinque no parque de diversões', icon: '🎡', event: 'ride', target: 1, reward: 50 },
  { id: 'harvest', text: 'Colha 3 plantas na fazenda', icon: '🥕', event: 'harvest', target: 3, reward: 70 },
  { id: 'visit', text: 'Descubra um lugar novo', icon: '🗺️', event: 'visit', target: 1, reward: 50 },
  { id: 'snack', text: 'Coma um lanche gostoso', icon: '🍦', event: 'snack', target: 1, reward: 20 },
  { id: 'style', text: 'Mude seu visual', icon: '👗', event: 'style', target: 1, reward: 30 },
  { id: 'picnic', text: 'Faça um piquenique', icon: '🧺', event: 'picnic', target: 1, reward: 50 },
];

function seedRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function questsFor(date: string): Quest[] {
  const seed = date.split('-').reduce((a, b) => a * 31 + Number(b), 7);
  const r = seedRand(seed);
  const pool = [...T];
  const out: Quest[] = [];
  while (out.length < 4) {
    const i = Math.floor(r() * pool.length);
    out.push({ ...pool.splice(i, 1)[0], progress: 0, claimed: false });
  }
  return out;
}

export const STICKERS = ['🦄', '🌈', '⭐', '🐶', '🐱', '🍦', '🎀', '🌸', '🚗', '🏰', '🐬', '🍓', '🎈', '🧁', '🦋', '🐼', '🌻', '🎠', '🪐', '🐢', '🍩', '🎨', '🎤', '💎'];
export const DAILY_GIFTS = [
  { text: 'Um adesivo novo para seu álbum!', icon: '🎁', money: 50 },
  { text: 'Moedinhas brilhantes!', icon: '🪙', money: 150 },
  { text: 'Um presente surpresa!', icon: '🎀', money: 100 },
];
