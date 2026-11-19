import type { Vec3 } from '../types';

export interface Profession {
  id: string;
  name: string;
  icon: string;
  place: string;
  where: Vec3;
  desc: string;
  game: 'order' | 'quiz' | 'rhythm' | 'paint' | 'task' | 'mall';
  outfit?: { top?: string; topColor?: string; acc?: string };
}

export const PROFESSIONS: Profession[] = [
  { id: 'professora', name: 'Professora', icon: '👩‍🏫', place: 'Escola Estrelinha', where: [-95, 0, -90], desc: 'Ensine os alunos respondendo perguntas divertidas!', game: 'quiz' },
  { id: 'medica', name: 'Médica', icon: '👩‍⚕️', place: 'Hospital Coração', where: [-35, 0, -90], desc: 'Cuide dos pacientes escolhendo o tratamento certo.', game: 'order', outfit: { top: 'jaleco', topColor: '#ffffff', acc: 'estetoscopio' } },
  { id: 'veterinaria', name: 'Veterinária', icon: '🩺', place: 'Pet Shop Patinhas', where: [-35, 0, 64], desc: 'Ajude os bichinhos a ficarem saudáveis e felizes.', game: 'order', outfit: { top: 'jaleco', topColor: '#bdf5e0', acc: 'estetoscopio' } },
  { id: 'lojista', name: 'Dona da Loja', icon: '🏪', place: 'Shopping Brilho', where: [-65, 0, 22], desc: 'Atenda os clientes entregando o que eles pedem.', game: 'order', outfit: { top: 'uniforme', topColor: '#ff8fc7' } },
  { id: 'cafe', name: 'Atendente da Cafeteria', icon: '☕', place: 'Cafeteria Nuvem de Leite', where: [95, 0, 66], desc: 'Prepare bebidas e docinhos para os clientes.', game: 'order', outfit: { top: 'avental', topColor: '#c8a27a' } },
  { id: 'chef', name: 'Chef de Cozinha', icon: '👩‍🍳', place: 'Restaurante Panelinha', where: [35, 0, 66], desc: 'Siga a receita e prepare pratos deliciosos.', game: 'order', outfit: { top: 'avental', topColor: '#ffffff', acc: 'chapeu-chef' } },
  { id: 'bombeira', name: 'Bombeira', icon: '👩‍🚒', place: 'Corpo de Bombeiros', where: [35, 0, 148], desc: 'Apague os focos de fogo pela cidade!', game: 'task', outfit: { top: 'uniforme', topColor: '#e63946', acc: 'capacete' } },
  { id: 'policial', name: 'Policial', icon: '👮‍♀️', place: 'Delegacia Amiga', where: [-35, 0, 148], desc: 'Encontre os objetos e bichinhos perdidos da cidade.', game: 'task', outfit: { top: 'uniforme', topColor: '#2f6fdf', acc: 'quepe' } },
  { id: 'cantora', name: 'Cantora', icon: '🎤', place: 'Estúdio de Música', where: [240, 0, -92], desc: 'Acerte as notinhas no ritmo da música!', game: 'rhythm' },
  { id: 'artista', name: 'Artista', icon: '🎨', place: 'Estúdio de Arte', where: [240, 0, -92], desc: 'Pinte quadros lindos e guarde na sua galeria.', game: 'paint' },
  { id: 'cuidadora', name: 'Cuidadora de Animais', icon: '🐄', place: 'Fazendinha Feliz', where: [210, 0, 60], desc: 'Dê comida para os animais da fazenda.', game: 'task' },
  { id: 'shopping', name: 'Administradora do Shopping', icon: '🛍️', place: 'Shopping Brilho', where: [-65, 0, 22], desc: 'Escolha as lojas do shopping e receba os lucros.', game: 'mall' },
];

export const PROF_MAP = Object.fromEntries(PROFESSIONS.map((p) => [p.id, p]));
