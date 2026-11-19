import type { PetSpecies } from '../types';

export interface PetDef {
  species: PetSpecies;
  name: string;
  icon: string;
  colors: string[];
  scale: number;
  speed: number;
  flies?: boolean;
  rideable?: boolean;
  sound: string;
  exotic?: boolean;
  price: number;
}

export const PETS: Record<PetSpecies, PetDef> = {
  cachorro: { species: 'cachorro', name: 'Cachorrinho', icon: '🐶', colors: ['#c8a27a', '#ffffff', '#5a3a26', '#f2d27a', '#222831'], scale: 1, speed: 1, sound: 'Au au! 🐾', price: 120 },
  gato: { species: 'gato', name: 'Gatinho', icon: '🐱', colors: ['#ffb066', '#ffffff', '#555a66', '#222831', '#c9c9c9'], scale: 0.85, speed: 1, sound: 'Miau! 💕', price: 120 },
  coelho: { species: 'coelho', name: 'Coelhinho', icon: '🐰', colors: ['#ffffff', '#c8a27a', '#ffd6e8', '#9aa0a6'], scale: 0.7, speed: 1, sound: 'Hop hop! 🥕', price: 90 },
  cavalo: { species: 'cavalo', name: 'Cavalo', icon: '🐴', colors: ['#8d5b3a', '#ffffff', '#222831', '#c8a27a'], scale: 1.8, speed: 1.2, rideable: true, sound: 'Hiiirrin! 🐎', price: 300 },
  passaro: { species: 'passaro', name: 'Passarinho', icon: '🐦', colors: ['#5ab0ff', '#ffd23f', '#3ccf91', '#ff7b54'], scale: 0.5, speed: 1.2, flies: true, sound: 'Piu piu! 🎶', price: 70 },
  hamster: { species: 'hamster', name: 'Hamster', icon: '🐹', colors: ['#ffb066', '#fdf6ec', '#c8a27a'], scale: 0.45, speed: 0.9, sound: 'Squik! 🌻', price: 60 },
  tartaruga: { species: 'tartaruga', name: 'Tartaruga', icon: '🐢', colors: ['#3ccf91', '#1f9e63', '#b8f27c'], scale: 0.7, speed: 0.7, sound: '...devagarinho! 🐢', price: 80 },
  pinguim: { species: 'pinguim', name: 'Pinguim', icon: '🐧', colors: ['#222831', '#2f6fdf'], scale: 0.8, speed: 0.9, sound: 'Quá quá! ❄️', price: 150 },
  unicornio: { species: 'unicornio', name: 'Unicórnio Arco-íris', icon: '🦄', colors: ['#ffffff', '#ffd6e8', '#d4b8ff', '#c7e5ff'], scale: 1.8, speed: 1.4, rideable: true, exotic: true, sound: 'Brilhinhos! ✨🌈', price: 500 },
  dragao: { species: 'dragao', name: 'Dragãozinho Fofo', icon: '🐲', colors: ['#3ccf91', '#9d4edd', '#ff5fa2', '#5ab0ff'], scale: 0.9, speed: 1.2, flies: true, exotic: true, sound: 'Rawr fofinho! 🔥', price: 450 },
  raposa: { species: 'raposa', name: 'Raposa de Cristal', icon: '🦊', colors: ['#c7e5ff', '#d4b8ff', '#bdf5e0'], scale: 0.9, speed: 1.3, exotic: true, sound: 'Tlin tlin! 💎', price: 400 },
  panda: { species: 'panda', name: 'Panda-Nuvem', icon: '🐼', colors: ['#ffffff', '#ffd6e8', '#e0f4ff'], scale: 1, speed: 0.9, flies: true, exotic: true, sound: 'Fofura nas nuvens! ☁️', price: 400 },
};

export const PET_ACCESSORIES = [
  { id: 'nenhum', name: 'Nenhum', icon: '🚫' },
  { id: 'laco', name: 'Laço', icon: '🎀' },
  { id: 'coleira', name: 'Coleira', icon: '⭕' },
  { id: 'chapeu', name: 'Chapéu', icon: '🎩' },
  { id: 'coroa', name: 'Coroa', icon: '👑' },
  { id: 'bandana', name: 'Bandana', icon: '🧣' },
  { id: 'oculos', name: 'Óculos', icon: '🕶️' },
];
