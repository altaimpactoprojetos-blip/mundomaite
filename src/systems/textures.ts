import * as THREE from 'three';
import type { TextureKind } from '../types';

// Texturas desenhadas em canvas (funcionam offline, sem arquivos).
const cache = new Map<string, THREE.Texture>();

function make(kind: TextureKind): THREE.Texture | null {
  if (kind === 'liso') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  const dark = 'rgba(0,0,0,0.18)';
  const light = 'rgba(255,255,255,0.7)';
  switch (kind) {
    case 'madeira':
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.02)';
        g.fillRect(0, i * 16, 128, 16);
        g.strokeStyle = 'rgba(0,0,0,0.2)';
        g.beginPath(); g.moveTo(0, i * 16); g.lineTo(128, i * 16); g.stroke();
        g.beginPath(); g.moveTo(((i * 37) % 128), i * 16); g.lineTo(((i * 37) % 128), i * 16 + 16); g.stroke();
      }
      break;
    case 'tijolo':
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let r = 0; r < 8; r++) {
        g.fillRect(0, r * 16, 128, 2);
        for (let k = 0; k < 4; k++) g.fillRect(((k * 32 + (r % 2) * 16) % 128), r * 16, 2, 16);
      }
      break;
    case 'listras':
      g.fillStyle = dark;
      for (let i = 0; i < 8; i += 2) g.fillRect(0, i * 16, 128, 16);
      break;
    case 'bolinhas':
      g.fillStyle = light;
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = 'rgba(0,0,0,0.22)';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(16 + x * 32 + (y % 2) * 16, 16 + y * 32, 7, 0, 7); g.fill(); }
      break;
    case 'xadrez':
      g.fillStyle = dark;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(x * 32, y * 32, 32, 32);
      break;
    case 'estrelas':
    case 'coracoes': {
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.font = '26px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) g.fillText(kind === 'estrelas' ? '★' : '♥', 22 + x * 42 + (y % 2) * 20, 22 + y * 42);
      g.globalCompositeOperation = 'destination-over';
      g.fillStyle = '#d8d8d8';
      g.fillRect(0, 0, 128, 128);
      break;
    }
    case 'marmore':
      g.strokeStyle = 'rgba(0,0,0,0.12)';
      for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(Math.random() * 128, 0); g.bezierCurveTo(Math.random() * 128, 40, Math.random() * 128, 90, Math.random() * 128, 128); g.stroke(); }
      break;
    case 'grama':
      for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,${80 + Math.random() * 80},0,0.2)`; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 5); }
      break;
    case 'azulejo':
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 128); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(128, i * 32); g.stroke(); }
      break;
    case 'nuvens':
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 5; i++) { const x = (i * 47) % 128, y = (i * 71) % 128; [0, 12, 24].forEach((o) => { g.beginPath(); g.arc(x + o, y, 10, 0, 7); g.fill(); }); }
      g.globalCompositeOperation = 'destination-over';
      g.fillStyle = '#cfcfcf';
      g.fillRect(0, 0, 128, 128);
      break;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  return t;
}

export function getTexture(kind: TextureKind): THREE.Texture | null {
  if (!cache.has(kind)) {
    const t = make(kind);
    if (!t) return null;
    cache.set(kind, t);
  }
  return cache.get(kind)!;
}

const signCache = new Map<string, THREE.Texture>();
/** Placa com texto desenhada em canvas */
export function signTexture(text: string, bg = '#ffffff', fg = '#e83e8c', icon = ''): THREE.Texture {
  const key = text + bg + fg + icon;
  if (signCache.has(key)) return signCache.get(key)!;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(4, 4, 504, 120, 30);
  g.fill();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 54;
  const label = (icon ? icon + ' ' : '') + text;
  g.font = `bold ${size}px "Trebuchet MS", sans-serif`;
  while (g.measureText(label).width > 470 && size > 18) {
    size -= 2;
    g.font = `bold ${size}px "Trebuchet MS", sans-serif`;
  }
  g.fillText(label, 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  signCache.set(key, t);
  return t;
}

const emojiCache = new Map<string, THREE.Texture>();
export function emojiTexture(emoji: string): THREE.Texture {
  if (emojiCache.has(emoji)) return emojiCache.get(emoji)!;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.font = '100px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(emoji, 64, 72);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  emojiCache.set(emoji, t);
  return t;
}
