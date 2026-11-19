import type { Appearance } from '../types';
import { shade } from './iso';

export type HAnim = 'idle' | 'walk' | 'sit' | 'lay' | 'dance' | 'wave' | 'swim' | 'hug' | 'ride';

function R(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string, outline = true) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
  if (outline) { g.strokeStyle = shade(c, 0.5); g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
}
function E(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, c: string, outline = true) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
  if (outline) { g.strokeStyle = shade(c, 0.5); g.lineWidth = 1; g.stroke(); }
}

const DRESSES = ['vestido', 'vestido-princesa', 'vestido-babados', 'vestido-floral', 'vestido-fada', 'macacao', 'jaleco'];
const LONG = ['moletom', 'jaqueta', 'sueter', 'jaleco', 'uniforme'];

/**
 * Desenha a personagem em pixel art.
 * dir: 0 = frente-direita, 1 = frente-esquerda, 2 = costas-esquerda, 3 = costas-direita
 */
export function drawAvatar(g: CanvasRenderingContext2D, x: number, y: number, look: Appearance, dir: number, anim: HAnim, t: number, held?: string | null) {
  const front = dir === 0 || dir === 1;
  const mirror = dir === 1 || dir === 2;
  const sc = look.height ? 0.9 + (look.height - 1) * 0.8 : 1;
  g.save();
  g.translate(Math.round(x), Math.round(y));
  // sombra
  if (anim !== 'swim' && anim !== 'ride') { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); g.fill(); }
  if (mirror) g.scale(-1, 1);
  g.scale(sc, sc);
  if (anim === 'lay') { g.rotate(-Math.PI / 2 * (mirror ? -1 : 1) * 0 - Math.PI / 2); g.translate(14, -4); }
  const walkP = anim === 'walk' ? Math.sin(t * 12) : 0;
  const bob = anim === 'walk' ? Math.abs(Math.cos(t * 12)) : anim === 'dance' ? Math.abs(Math.sin(t * 7)) * 2 : 0;
  const sit = anim === 'sit' || anim === 'ride';
  const baseY = (sit ? 7 : 0) - Math.round(bob);
  g.translate(0, baseY);

  const skin = look.skin;
  const dress = DRESSES.includes(look.top);
  const legC = dress && look.bottom !== 'legging' ? skin : ['calca', 'legging'].includes(look.bottom) ? look.bottomColor : skin;
  const swim = anim === 'swim';

  if (!swim) {
    // pernas e sapatos
    if (sit) {
      R(g, -3, -14, 4, 4, legC); R(g, 1, -14, 6, 4, legC);
      R(g, 5, -12, 4, 3, look.shoesColor); R(g, -1, -11, 4, 3, look.shoesColor);
    } else {
      const l1 = Math.round(walkP * 2), l2 = -l1;
      R(g, -4 + l1, -14, 4, 12, legC); R(g, 1 + l2, -14, 4, 12, legC);
      if (look.bottom === 'shorts' && !dress) { R(g, -4 + l1, -14, 4, 5, look.bottomColor); R(g, 1 + l2, -14, 4, 5, look.bottomColor); }
      R(g, -5 + l1, -3, 5, 3, look.shoesColor); R(g, 1 + l2, -3, 5, 3, look.shoesColor);
    }
  }
  // corpo / roupa
  const topC = look.topColor;
  if (dress) {
    const wide = look.top === 'vestido-princesa' ? 4 : 2;
    g.beginPath(); g.moveTo(-6, -24); g.lineTo(6, -24); g.lineTo(7 + wide, sit ? -11 : -10); g.lineTo(-7 - wide, sit ? -11 : -10); g.closePath();
    g.fillStyle = topC; g.fill(); g.strokeStyle = shade(topC, 0.5); g.stroke();
    if (look.top === 'vestido-babados' || look.top === 'vestido-princesa') R(g, -7 - wide, sit ? -12 : -11, 14 + wide * 2, 2, '#ffffff', false);
    R(g, -6, -27, 12, 6, topC);
    R(g, -6, -22, 12, 1, shade(topC, 1.3), false);
  } else {
    if (look.bottom === 'saia' || look.bottom === 'saia-tutu') { g.beginPath(); g.moveTo(-6, -17); g.lineTo(6, -17); g.lineTo(8, -11); g.lineTo(-8, -11); g.closePath(); g.fillStyle = look.bottomColor; g.fill(); g.strokeStyle = shade(look.bottomColor, 0.5); g.stroke(); }
    else R(g, -6, -18, 12, 5, look.bottomColor);
    R(g, -6, -27, 12, 11, topC);
    if (look.top === 'listrada') for (let i = 0; i < 3; i++) R(g, -6, -25 + i * 3, 12, 1, '#ffffff', false);
    if (look.top === 'estrela' && front) { g.fillStyle = '#ffe066'; g.fillRect(1, -23, 3, 3); }
    if (look.top === 'coracao' && front) { g.fillStyle = '#ff5fa2'; g.fillRect(1, -23, 3, 2); }
  }
  // braços
  const armC = LONG.includes(look.top) ? topC : skin;
  const sleeve = !LONG.includes(look.top) && look.top !== 'regata' ? topC : null;
  const drawArm = (side: number, up: number, swing: number) => {
    const ax = side > 0 ? 5 : -8;
    if (up > 0) {
      R(g, ax, -36 - up, 3, 11, armC);
      if (sleeve) R(g, ax, -27, 3, 3, sleeve);
      R(g, ax, -38 - up, 3, 3, skin);
    } else {
      R(g, ax, -26 + swing, 3, 10, armC);
      if (sleeve) R(g, ax, -27 + swing, 3, 4, sleeve);
      R(g, ax, -17 + swing, 3, 3, skin);
    }
  };
  const dz = anim === 'dance' ? Math.sin(t * 7) : 0;
  const swing = Math.round(walkP * 2);
  if (anim === 'dance') { drawArm(-1, dz > 0 ? 4 : 0, 0); drawArm(1, dz <= 0 ? 4 : 0, 0); }
  else if (anim === 'wave') { drawArm(-1, 0, 0); drawArm(1, 3 + Math.round(Math.sin(t * 14) * 2), 0); }
  else if (anim === 'hug') { R(g, -8, -26, 16, 3, armC); }
  else { drawArm(-1, 0, swim ? 0 : -swing); drawArm(1, 0, swim ? 0 : swing); }
  if (held && front && anim !== 'dance') {
    // bebida / sorvete na mão
    R(g, 7, -21, 4, 5, '#ffffff'); R(g, 7, -21, 4, 2, held === 'sorvete' ? '#ff8fc7' : '#8d5b3a', false);
  }
  // sombreado lateral do corpo (volume)
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(3, -27, 3, dress ? 16 : 11);
  // cabeça
  R(g, -2, -29, 4, 3, skin, false);
  E(g, 0, -37, 8, 8, skin);
  g.fillStyle = 'rgba(0,0,0,0.08)'; g.beginPath(); g.ellipse(3, -35, 4.5, 6, 0, -1.2, 1.4); g.fill();
  // rosto (só de frente)
  if (front) {
    const blink = (t * 0.7) % 4 < 0.12;
    g.fillStyle = '#2b1a3a';
    if (blink) { g.fillRect(0, -36, 3, 1); g.fillRect(4, -36, 3, 1); }
    else {
      g.fillRect(0, -38, 2, 3); g.fillRect(4, -38, 2, 3);
      g.fillStyle = look.eyeColor; g.fillRect(0, -36, 2, 1); g.fillRect(4, -36, 2, 1);
      g.fillStyle = '#ffffff'; g.fillRect(1, -38, 1, 1); g.fillRect(5, -38, 1, 1);
    }
    if (look.makeup?.blush !== false) { g.fillStyle = 'rgba(255,120,150,0.6)'; g.fillRect(-2, -34, 2, 1); g.fillRect(6, -34, 2, 1); }
    g.fillStyle = look.makeup?.lips ? '#e83e6c' : '#c2185b';
    if (look.expression === 'surpresa') g.fillRect(2, -32, 2, 2); else { g.fillRect(1, -32, 1, 1); g.fillRect(2, -31, 2, 1); g.fillRect(4, -32, 1, 1); }
  }
  drawHair(g, look, front, anim, t);
  drawAcc(g, look, front, t);
  if (swim) {
    g.fillStyle = 'rgba(90,200,240,0.85)';
    g.fillRect(-12, -22, 24, 26);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.fillRect(-11 + Math.round(Math.sin(t * 4) * 2), -23, 8, 1); g.fillRect(3, -23, 7, 1);
  }
  g.restore();
}

function drawHair(g: CanvasRenderingContext2D, look: Appearance, front: boolean, anim: HAnim, t: number) {
  const c = look.hairColor;
  const hl = shade(c, 1.35);
  const st = look.hairStyle;
  if (st === 'careca') return;
  const sway = anim === 'walk' ? Math.round(Math.sin(t * 12)) : anim === 'dance' ? Math.round(Math.sin(t * 7) * 2) : 0;
  const cap = () => {
    g.beginPath(); g.ellipse(0, -40, 9, 6.5, 0, Math.PI, 0); g.lineTo(9, -39); g.lineTo(-9, -39); g.closePath();
    g.fillStyle = c; g.fill(); g.strokeStyle = shade(c, 0.5); g.stroke();
    if (front) { R(g, -9, -40, 5, 8, c, false); R(g, 7, -40, 2, 5, c, false); g.fillStyle = hl; g.fillRect(-4, -45, 4, 1); }
  };
  if (!front) {
    // de costas: cabelo cobre a cabeça
    E(g, 0, -37, 8.5, 8.5, c);
    g.fillStyle = hl; g.fillRect(-3, -43, 4, 1);
  }
  switch (st) {
    case 'black': E(g, 0, -39, 11, 10, c); g.fillStyle = hl; g.fillRect(-5, -46, 5, 2); break;
    case 'longo': if (front) R(g, -9, -38, 4, 16 , c); R(g, 5, -38, 4, 16 + sway, c); cap(); break;
    case 'rabo': cap(); R(g, -12 - sway, -40, 4, 11, c); E(g, -10, -41, 3, 3, c); break;
    case 'chiquinhas': cap(); E(g, -10, -38, 3, 3, c); E(g, 10, -38, 3, 3, c); R(g, -12, -37 + sway, 3, 9, c); R(g, 9, -37 - sway, 3, 9, c); break;
    case 'coque': cap(); E(g, 0, -46, 4, 4, c); break;
    case 'cacheado': cap(); for (let i = 0; i < 6; i++) E(g, -9 + (i % 2) * 18, -40 + Math.floor(i / 2) * 5 + (i % 2 ? sway : 0), 3, 3, i % 2 ? c : hl); break;
    case 'trancas': cap(); for (let k = 0; k < 3; k++) { E(g, -9, -34 + k * 4 + sway, 2, 2, c); E(g, 9, -34 + k * 4 - sway, 2, 2, c); } break;
    case 'franja': cap(); if (front) R(g, -7, -41, 14, 4, c); break;
    default: cap();
  }
}

function drawAcc(g: CanvasRenderingContext2D, look: Appearance, front: boolean, t: number) {
  const a = look.accessories ?? [];
  const ac = look.accColor || '#ff5fa2';
  if (a.includes('laco')) { g.fillStyle = ac; g.fillRect(4, -47, 3, 3); g.fillRect(9, -47, 3, 3); g.fillRect(7, -46, 2, 2); g.strokeStyle = shade(ac, 0.5); g.strokeRect(4.5, -46.5, 7, 2); }
  if (a.includes('coroa') || a.includes('coroa-arcoiris')) { g.fillStyle = '#ffd23f'; g.fillRect(-5, -48, 10, 3); g.fillRect(-5, -51, 2, 3); g.fillRect(-1, -52, 2, 4); g.fillRect(3, -51, 2, 3); g.fillStyle = '#ff5fa2'; g.fillRect(-1, -47, 2, 1); }
  if (a.includes('tiara')) { g.fillStyle = ac; g.fillRect(-7, -45, 14, 2); }
  if (a.includes('oculos-coracao') && front) { g.fillStyle = ac; g.fillRect(-1, -39, 4, 4); g.fillRect(4, -39, 4, 4); g.fillRect(3, -38, 1, 1); }
  if (a.includes('chapeu-sol')) { g.fillStyle = ac; g.fillRect(-12, -44, 24, 2); g.fillRect(-7, -50, 14, 6); g.fillStyle = '#ff5fa2'; g.fillRect(-7, -45, 14, 1); }
  if (a.includes('bone')) { g.fillStyle = ac; g.fillRect(-8, -47, 16, 5); g.fillRect(front ? 4 : -12, -43, 8, 2); }
  if (a.includes('orelhas-coelho')) { g.fillStyle = ac; g.fillRect(-5, -55, 3, 10); g.fillRect(2, -55, 3, 10); }
  if (a.includes('asas-fada') || a.includes('asas-arcoiris')) { g.globalAlpha = 0.6; g.fillStyle = a.includes('asas-arcoiris') ? '#c77dff' : ac; const f = Math.sin(t * 8) * 2; g.beginPath(); g.ellipse(-10, -26, 6, 9 + f, -0.4, 0, 7); g.ellipse(10, -26, 6, 9 + f, 0.4, 0, 7); g.fill(); g.globalAlpha = 1; }
  if (a.includes('mochila') && !front) R(g, -5, -27, 10, 9, ac);
}

/** Pets em pixel art */
export function drawPet(g: CanvasRenderingContext2D, x: number, y: number, species: string, color: string, dir: number, t: number, moving: boolean, happy = false) {
  const mirror = dir === 1 || dir === 2;
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(0, 0, species === 'unicornio' || species === 'cavalo' ? 13 : 8, 4, 0, 0, Math.PI * 2); g.fill();
  if (mirror) g.scale(-1, 1);
  const hop = happy ? Math.abs(Math.sin(t * 8)) * 4 : moving ? Math.abs(Math.sin(t * 10)) * 1.5 : 0;
  g.translate(0, -Math.round(hop));
  const leg = moving ? Math.round(Math.sin(t * 12) * 2) : 0;
  if (species === 'unicornio' || species === 'cavalo') {
    const uni = species === 'unicornio';
    const mane = uni ? ['#ff8fc7', '#ffd23f', '#7ee8c7', '#5ab0ff', '#c77dff'] : [shade(color, 0.6)];
    for (const [lx, o] of [[-9, leg], [-5, -leg], [5, leg], [9, -leg]] as const) { R(g, lx - 1, -12 + o * 0, 3, 12, color); R(g, lx - 1, -2, 3, 2, uni ? '#ffd23f' : '#4a3426', false); }
    E(g, 0, -15, 13, 6, color);
    // cauda
    mane.forEach((m, i) => R(g, -16 - i % 2, -18 + i * 3 + Math.round(Math.sin(t * 5 + i) * 1), 4, 4, m, false));
    // pescoço e cabeça
    g.beginPath(); g.moveTo(7, -18); g.lineTo(11, -30); g.lineTo(16, -28); g.lineTo(13, -15); g.closePath(); g.fillStyle = color; g.fill(); g.strokeStyle = shade(color, 0.5); g.stroke();
    E(g, 16, -30, 6, 4.5, color);
    E(g, 21, -29, 3, 3, uni ? '#ffe3f1' : shade(color, 0.9));
    g.fillStyle = '#2b1a3a'; g.fillRect(16, -32, 2, 2);
    R(g, 12, -36, 2, 4, color, false);
    if (uni) { g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(16, -34); g.lineTo(19, -44); g.lineTo(19, -34); g.closePath(); g.fill(); }
    mane.forEach((m, i) => R(g, 9 - i * 1.2, -35 + i * 4 + Math.round(Math.sin(t * 4 + i)), 3, 4, m, false));
    R(g, -4, -22, 9, 2, '#e63946', false);
  } else {
    if (species === 'vaca' || species === 'porco' || species === 'ovelha') {
      const body = species === 'vaca' ? '#ffffff' : species === 'porco' ? '#ffb3c6' : '#f4f1ec';
      for (const [lx, o] of [[-8, leg], [-4, -leg], [4, leg], [8, -leg]] as const) R(g, lx - 1, -8 + o * 0, 3, 8, species === 'ovelha' ? '#555a66' : body);
      if (species === 'ovelha') { for (let i = 0; i < 6; i++) E(g, -7 + (i % 3) * 6, -12 + Math.floor(i / 3) * 4, 5, 4, '#ffffff'); }
      else E(g, 0, -11, 12, 6, body);
      if (species === 'vaca') { g.fillStyle = '#2b2d42'; g.fillRect(-6, -14, 5, 4); g.fillRect(3, -10, 4, 3); }
      E(g, 11, -14, 5, 4.5, species === 'ovelha' ? '#555a66' : body);
      E(g, 15, -12, 3, 2.5, species === 'porco' ? '#ff8fb1' : '#ffc2d9');
      g.fillStyle = '#2b1a3a'; g.fillRect(11, -16, 1, 2);
      if (species === 'vaca') { g.fillStyle = '#ffe7a6'; g.fillRect(8, -21, 2, 3); g.fillRect(12, -21, 2, 3); }
      g.restore();
      return;
    }
    if (species === 'galinha') {
      R(g, -1, -4, 1, 4, '#ffa94d', false); R(g, 2, -4, 1, 4, '#ffa94d', false);
      E(g, 0, -8, 5, 4, '#ffffff'); E(g, 4, -13, 3, 3, '#ffffff');
      g.fillStyle = '#e63946'; g.fillRect(3, -17, 3, 2); g.fillStyle = '#ffa94d'; g.fillRect(7, -13, 2, 1); g.fillStyle = '#222'; g.fillRect(5, -14, 1, 1);
      g.restore();
      return;
    }
    if (species === 'coelho') {
      E(g, 0, -6, 6, 5, color); E(g, 5, -11, 4.5, 4.5, color);
      R(g, 3, -22, 2, 8, color); R(g, 6, -22, 2, 8, color);
      g.fillStyle = '#ffb3c6'; g.fillRect(3.5, -20, 1, 5); g.fillRect(6.5, -20, 1, 5);
      g.fillStyle = '#2b1a3a'; g.fillRect(6, -12, 1, 2);
      E(g, -6, -6, 2.5, 2.5, '#ffffff');
      g.restore();
      return;
    }
    const cat = species === 'gato';
    R(g, -5, -6, 2, 6 + 0, color); R(g, 3, -6, 2, 6, color);
    E(g, 0, -8, 7, 4, color);
    E(g, 7, -13, 5, 5, color);
    if (cat) { g.fillStyle = color; g.fillRect(4, -20, 2, 3); g.fillRect(9, -20, 2, 3); } else { g.fillStyle = shade(color, 0.7); g.fillRect(3, -16, 2, 5); g.fillRect(10, -16, 2, 5); }
    g.fillStyle = '#2b1a3a'; g.fillRect(8, -14, 1, 2); g.fillRect(11, -12, 1, 1);
    R(g, -9, -12 + Math.round(Math.sin(t * 8) * 1.5), 3, 5, color, false);
    void leg;
  }
  g.restore();
}
