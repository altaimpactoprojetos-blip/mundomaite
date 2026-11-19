import type { VehicleType } from '../types';

export interface VehicleDef {
  type: VehicleType;
  name: string;
  icon: string;
  medium: 'ground' | 'water' | 'air';
  maxSpeed: number;
  accel: number;
  turn: number;
  size: [number, number, number];
  seatY: number;
  open: boolean; // jogadora aparece sentada (moto, bici...)
  hover?: boolean; // helicóptero sobe/desce parado
}

export const VEHICLES: Record<VehicleType, VehicleDef> = {
  carro: { type: 'carro', name: 'Carrinho', icon: '🚗', medium: 'ground', maxSpeed: 22, accel: 12, turn: 2.2, size: [2, 1.5, 4], seatY: 0.45, open: true },
  esportivo: { type: 'esportivo', name: 'Esportivo', icon: '🏎️', medium: 'ground', maxSpeed: 32, accel: 18, turn: 2.4, size: [2, 1.2, 4.2], seatY: 0.35, open: true },
  suv: { type: 'suv', name: 'SUV', icon: '🚙', medium: 'ground', maxSpeed: 22, accel: 11, turn: 2, size: [2.2, 1.9, 4.4], seatY: 0.6, open: true },
  caminhonete: { type: 'caminhonete', name: 'Caminhonete', icon: '🛻', medium: 'ground', maxSpeed: 21, accel: 10, turn: 1.9, size: [2.2, 1.9, 5], seatY: 0.6, open: true },
  conversivel: { type: 'conversivel', name: 'Conversível', icon: '🚘', medium: 'ground', maxSpeed: 26, accel: 14, turn: 2.3, size: [2, 1.2, 4.2], seatY: 0.4, open: true },
  carrinho: { type: 'carrinho', name: 'Carrinho de golfe', icon: '🛺', medium: 'ground', maxSpeed: 12, accel: 8, turn: 2.6, size: [1.6, 1.8, 2.6], seatY: 0.45, open: true },
  moto: { type: 'moto', name: 'Moto', icon: '🏍️', medium: 'ground', maxSpeed: 26, accel: 16, turn: 2.8, size: [0.8, 1.2, 2.2], seatY: 0.7, open: true },
  bicicleta: { type: 'bicicleta', name: 'Bicicleta', icon: '🚲', medium: 'ground', maxSpeed: 12, accel: 8, turn: 3, size: [0.6, 1.1, 1.8], seatY: 0.75, open: true },
  patinete: { type: 'patinete', name: 'Patinete', icon: '🛴', medium: 'ground', maxSpeed: 10, accel: 8, turn: 3.2, size: [0.5, 1.1, 1.1], seatY: 0.15, open: true },
  barco: { type: 'barco', name: 'Barquinho', icon: '⛵', medium: 'water', maxSpeed: 14, accel: 6, turn: 1.4, size: [2.6, 2, 5.5], seatY: 0.5, open: true },
  lancha: { type: 'lancha', name: 'Lancha', icon: '🚤', medium: 'water', maxSpeed: 24, accel: 10, turn: 1.8, size: [2.4, 1.4, 5.5], seatY: 0.5, open: true },
  jetski: { type: 'jetski', name: 'Jet ski', icon: '🌊', medium: 'water', maxSpeed: 22, accel: 14, turn: 2.6, size: [1, 1, 2.6], seatY: 0.5, open: true },
  aviao: { type: 'aviao', name: 'Aviãozinho', icon: '✈️', medium: 'air', maxSpeed: 40, accel: 10, turn: 1.3, size: [8, 2.2, 7], seatY: 0.9, open: true },
  jatinho: { type: 'jatinho', name: 'Jatinho', icon: '🛩️', medium: 'air', maxSpeed: 55, accel: 14, turn: 1.2, size: [7, 2, 8], seatY: 0.9, open: true },
  helicoptero: { type: 'helicoptero', name: 'Helicóptero', icon: '🚁', medium: 'air', maxSpeed: 28, accel: 10, turn: 1.8, size: [2.4, 2.6, 6], seatY: 0.8, open: true, hover: true },
  onibus: { type: 'onibus', name: 'Ônibus', icon: '🚌', medium: 'ground', maxSpeed: 14, accel: 6, turn: 1.4, size: [2.8, 3.2, 9], seatY: 1, open: false },
  'caminhao-bombeiro': { type: 'caminhao-bombeiro', name: 'Caminhão de bombeiros', icon: '🚒', medium: 'ground', maxSpeed: 20, accel: 9, turn: 1.6, size: [2.6, 2.8, 7], seatY: 1, open: true },
  viatura: { type: 'viatura', name: 'Viatura', icon: '🚓', medium: 'ground', maxSpeed: 26, accel: 14, turn: 2.2, size: [2, 1.6, 4.2], seatY: 0.45, open: true },
  trator: { type: 'trator', name: 'Trator', icon: '🚜', medium: 'ground', maxSpeed: 10, accel: 6, turn: 2, size: [2, 2.4, 3.2], seatY: 1.1, open: true },
};
