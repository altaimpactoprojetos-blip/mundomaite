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
const LW = 0.55;
/** retângulo arredondado com contorno fino */
function RR(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, c: string, ol = true) {
  g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  g.fillStyle = c; g.fill();
  if (ol) { g.strokeStyle = shade(c, 0.5); g.lineWidth = LW; g.stroke(); }
}
function EL(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, c: string, ol = true, rot = 0) {
  g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  g.fillStyle = c; g.fill();
  if (ol) { g.strokeStyle = shade(c, 0.5); g.lineWidth = LW; g.stroke(); }
}
/** forma livre: lista de pontos; curvas suaves pelos pontos médios */
function SH(g: CanvasRenderingContext2D, pts: number[], c: string, ol = true) {
  g.beginPath();
  const n = pts.length / 2;
  g.moveTo((pts[0] + pts[2]) / 2, (pts[1] + pts[3]) / 2);
  for (let i = 1; i <= n; i++) {
    const x1 = pts[(i % n) * 2], y1 = pts[(i % n) * 2 + 1], x2 = pts[((i + 1) % n) * 2], y2 = pts[((i + 1) % n) * 2 + 1];
    g.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
  }
  g.closePath();
  g.fillStyle = c; g.fill();
  if (ol) { g.strokeStyle = shade(c, 0.5); g.lineWidth = LW; g.stroke(); }
}
function LN(g: CanvasRenderingContext2D, pts: number[], c: string, w = LW) {
  g.beginPath(); g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.stroke();
}

const DRESSES = ['vestido', 'vestido-princesa', 'vestido-babados', 'vestido-floral', 'vestido-fada', 'macacao', 'jaleco'];
const LONG = ['moletom', 'jaqueta', 'sueter', 'jaleco', 'uniforme'];

/**
 * Desenha a personagem (detalhada, desenhada por código).
 * dir: 0 = frente-direita, 1 = frente-esquerda, 2 = costas-esquerda, 3 = costas-direita
 */
export function drawAvatar(g: CanvasRenderingContext2D, x: number, y: number, look: Appearance, dir: number, anim: HAnim, t: number, held?: string | null) {
  const front = dir === 0 || dir === 1;
  const mirror = dir === 1 || dir === 2;
  const sc = 1.18 * (look.height ? 0.9 + (look.height - 1) * 0.8 : 1);
  g.save();
  g.translate(x, y);
  if (anim !== 'swim' && anim !== 'ride') { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(0, 0, 10, 4.2, 0, 0, Math.PI * 2); g.fill(); }
  if (mirror) g.scale(-1, 1);
  g.scale(sc, sc);
  if (anim === 'lay') { g.translate(12, -6); g.rotate(-Math.PI / 2); }
  const walkP = anim === 'walk' ? Math.sin(t * 11) : 0;
  const bob = anim === 'walk' ? Math.abs(Math.cos(t * 11)) * 0.9 : anim === 'dance' ? Math.abs(Math.sin(t * 7)) * 2 : Math.sin(t * 2) * 0.25;
  const sit = anim === 'sit' || anim === 'ride';
  g.translate(0, (sit ? 6.5 : 0) - bob);

  const skin = look.skin;
  const skinD = shade(skin, 0.86);
  const dress = DRESSES.includes(look.top);
  const pants = ['calca', 'legging'].includes(look.bottom) && !(dress && look.bottom !== 'legging');
  const legC = pants ? look.bottomColor : skin;
  const topC = look.topColor;
  const swim = anim === 'swim';
  const hairC = look.hairColor;

  // ---------- cabelo de trás (estilos compridos) ----------
  const sway = anim === 'walk' ? Math.sin(t * 11) * 0.9 : anim === 'dance' ? Math.sin(t * 7) * 1.6 : Math.sin(t * 1.6) * 0.25;
  if (look.hairStyle === 'longo') SH(g, [-9, -40, -10.5, -30, -9.5 + sway * 0.5, -19, -4, -18, 0, -20, 4, -18, 9.5 + sway * 0.5, -19, 10.5, -30, 9, -40, 0, -46], hairC);
  if (look.hairStyle === 'black') EL(g, 0, -40.5, 13, 12, hairC);
  if (look.hairStyle === 'franja') SH(g, [-9.5, -41, -10, -32, -8, -28.5, 0, -28, 8, -28.5, 10, -32, 9.5, -41, 0, -47], hairC);

  if (!swim) {
    // ---------- pernas, meias e sapatos ----------
    const leg = (hx: number, ang: number, far: boolean) => {
      g.save();
      g.translate(hx, -15.5);
      g.rotate(ang);
      const c = far ? shade(legC, 0.9) : legC;
      RR(g, -2.1, 0, 4.2, 12.6, 1.8, c);
      if (look.bottom === 'shorts' && !dress) RR(g, -2.4, -0.3, 4.8, 5, 1.2, far ? shade(look.bottomColor, 0.9) : look.bottomColor);
      if (look.bottom === 'bermuda' && !dress) RR(g, -2.4, -0.3, 4.8, 7.5, 1.2, far ? shade(look.bottomColor, 0.9) : look.bottomColor);
      if (!pants) RR(g, -2.2, 9.2, 4.4, 2.6, 0.8, '#ffffff'); // meia
      // sapato
      const sh = look.shoesColor;
      SH(g, [-2.6, 11.4, -2.8, 15.2, 0, 15.6, 4.2, 15.5, 4.6, 13.6, 2.4, 11.8, 0, 11.2], far ? shade(sh, 0.88) : sh);
      LN(g, [-2.4, 15.2, 4.2, 15.2], '#ffffff', 0.7);
      if (look.shoes === 'tenis' || look.shoes === 'tenis-luz') LN(g, [0.6, 12.6, 2.2, 13.2], look.shoes === 'tenis-luz' ? '#5ad1ff' : '#ffffff', 0.6);
      g.restore();
    };
    if (sit) {
      RR(g, -4.6, -16, 9.4, 4.4, 2, legC); RR(g, 3.6, -15.6, 4, 8.6, 1.8, legC);
      SH(g, [3.2, -8, 3, -4.6, 6, -4.2, 9.6, -4.4, 9.8, -6.2, 8, -8, 5.6, -8.4], look.shoesColor);
    } else {
      leg(-2.6, -walkP * 0.42, true);
      leg(2.4, walkP * 0.42, false);
    }
  }

  // ---------- braço de trás ----------
  const armC = LONG.includes(look.top) ? topC : skin;
  const arm = (sx: number, ang: number, far: boolean, withHeld = false) => {
    g.save();
    g.translate(sx, -27.2);
    g.rotate(ang);
    RR(g, -1.7, -0.4, 3.4, 10.6, 1.7, far ? shade(armC, 0.88) : armC);
    if (LONG.includes(look.top)) RR(g, -1.9, 8.6, 3.8, 1.8, 0.6, '#ffffff', false);
    EL(g, 0, 11.4, 2, 2.1, far ? skinD : skin); // mão
    if (withHeld && held) {
      // copo / sorvete na mão
      if (held === 'sorvete') { SH(g, [-1.6, 11, 0, 17, 1.6, 11], '#e0b070'); EL(g, 0, 10, 2.6, 2.6, '#ff8fc7'); }
      else { RR(g, -2, 8.2, 4.2, 5.4, 0.8, '#ffffff'); RR(g, -2, 8.2, 4.2, 2, 0.6, '#8d5b3a', false); }
    }
    g.restore();
    // manguinha bufante
    if (!LONG.includes(look.top) && look.top !== 'regata') EL(g, sx + Math.sin(-ang) * 1.6, -26.2 + Math.abs(Math.sin(ang)) * 0.6, 2.7, 2.5, far ? shade(topC, 0.88) : topC);
  };
  const dz = anim === 'dance' ? Math.sin(t * 7) : 0;
  let aBack = walkP * 0.5, aFront = -walkP * 0.5;
  if (anim === 'dance') { aBack = dz > 0 ? 2.6 : 0.3; aFront = dz <= 0 ? -2.6 : -0.3; }
  if (anim === 'wave') { aFront = -2.5 + Math.sin(t * 13) * 0.35; aBack = 0.1; }
  if (anim === 'hug') { aBack = -1.2; aFront = -1.2; }
  if (sit) { aBack = -0.5; aFront = -0.5; }
  if (swim) { aBack = 1.4 + Math.sin(t * 5) * 0.4; aFront = -1.4 - Math.sin(t * 5) * 0.4; }
  arm(-6.3, aBack, true);

  // ---------- corpo / roupa ----------
  const hem = sit ? -11.5 : -10.5;
  if (dress) {
    const wide = look.top === 'vestido-princesa' ? 4.5 : look.top === 'vestido-babados' ? 3 : 2.2;
    const sw2 = sway * 0.5;
    // saia em sino com barra ondulada
    SH(g, [-5, -22, -6.5, -17, -8 - wide + sw2, hem, -4 + sw2, hem + 1.3, 0 + sw2, hem + 0.4, 4 + sw2, hem + 1.3, 8 + wide + sw2, hem, 6.5, -17, 5, -22, 0, -22.5], topC);
    // pregas
    for (const px of [-3.4, 0, 3.4]) LN(g, [px * 0.5, -20.5, px * (1.3 + wide * 0.18) + sw2, hem + 0.2], shade(topC, 0.82), 0.5);
    // barra
    if (look.top === 'vestido-babados' || look.top === 'vestido-princesa') { for (let i = -3; i <= 3; i++) EL(g, i * (2.2 + wide * 0.32) + sw2, hem + 0.6, 1.5, 1.2, '#ffffff', false); }
    else LN(g, [-7.2 - wide + sw2, hem - 0.6, 7.2 + wide + sw2, hem - 0.6], shade(topC, 1.35), 0.9);
    if (look.top === 'vestido-floral') for (const [fx, fy] of [[-3, -16], [2, -14], [5, -17], [-5, -13], [0, -18]]) EL(g, fx, fy, 0.9, 0.9, '#ffffff', false);
    if (look.top === 'vestido-fada') { g.globalAlpha = 0.5; EL(g, 0, hem - 1, 9, 2.4, '#ffffff', false); g.globalAlpha = 1; }
    // corpete
    SH(g, [-6, -29, -6.2, -24, -5, -21, 0, -20.6, 5, -21, 6.2, -24, 6, -29, 0, -30], topC);
    // cinto de laço e gola
    LN(g, [-5, -21.6, 5, -21.6], shade(topC, 1.4), 1.3);
    if (front) { EL(g, 3.4, -21.6, 1.3, 1, shade(topC, 1.4), false); SH(g, [-2.6, -29.6, 0, -27.4, 2.6, -29.6, 0, -30.4], '#ffffff', false); }
  } else {
    // parte de baixo
    if (look.bottom === 'saia' || look.bottom === 'saia-tutu') {
      SH(g, [-5.2, -19, -8 + sway * 0.4, -12, 0, -11.2, 8 + sway * 0.4, -12, 5.2, -19, 0, -19.6], look.bottomColor);
      for (const px of [-3, 0, 3]) LN(g, [px * 0.6, -18.4, px * 1.5, -12], shade(look.bottomColor, 0.82), 0.5);
    } else RR(g, -5.6, -19.4, 11.2, 5.6, 1.8, look.bottomColor);
    // camiseta
    SH(g, [-6.2, -29, -6.4, -22, -5.6, -17.6, 0, -17.2, 5.6, -17.6, 6.4, -22, 6.2, -29, 0, -30], topC);
    if (look.top === 'listrada') for (let i = 0; i < 4; i++) LN(g, [-5.6, -27 + i * 2.6, 5.6, -27 + i * 2.6], '#ffffff', 0.9);
    if (front) {
      if (look.top === 'estrela') { g.fillStyle = '#ffe066'; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.1 : 2.6, a2 = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(1.5 + Math.cos(a2) * r, -23.5 + Math.sin(a2) * r); } g.fill(); }
      if (look.top === 'coracao') { g.fillStyle = '#ff5fa2'; g.beginPath(); g.arc(0.5, -24.4, 1.3, 0, 7); g.arc(2.7, -24.4, 1.3, 0, 7); g.moveTo(-0.8, -23.8); g.lineTo(1.6, -20.8); g.lineTo(4, -23.8); g.fill(); }
      if (look.top === 'moletom') { RR(g, -3, -22, 6, 3, 1, shade(topC, 0.88), false); LN(g, [-1, -29, -1.2, -25.6], '#ffffff', 0.5); LN(g, [1.6, -29, 1.8, -25.6], '#ffffff', 0.5); }
      if (look.top === 'jaqueta' || look.top === 'jaleco') LN(g, [0.6, -29.4, 0.6, -18], '#ffffff', 0.8);
      if (look.top === 'avental') RR(g, -3.6, -26, 7.6, 9, 1, '#ffffff');
      if (look.top === 'uniforme') EL(g, 3, -25.4, 1, 1, '#ffd23f', false);
    }
    LN(g, [-5.4, -18.2, 5.4, -18.2], shade(topC, 0.8), 0.5);
  }
  // sombreado lateral (volume)
  g.fillStyle = 'rgba(0,0,0,0.10)'; g.beginPath(); g.ellipse(4.6, -23.5, 2, 5.5, 0, 0, 7); g.fill();

  // ---------- pescoço e cabeça ----------
  RR(g, -1.9, -31.6, 3.8, 3.6, 1, skinD, false);
  SH(g, [-8.4, -40, -8.2, -34, -4.5, -30.8, 0.6, -30.2, 5.6, -30.8, 8.8, -34.4, 9, -40, 6, -46.6, 0, -47.4, -6, -46.6], skin);
  if (front) {
    // orelha
    EL(g, -8.1, -37.6, 1.5, 2, skin); LN(g, [-8.3, -38.2, -7.7, -37], skinD, 0.5);
    // bochechas
    if (look.makeup?.blush !== false) { g.fillStyle = 'rgba(255,110,150,0.42)'; g.beginPath(); g.ellipse(-2.6, -34.6, 2, 1.2, 0, 0, 7); g.ellipse(7, -34.8, 1.6, 1.1, 0, 0, 7); g.fill(); }
    // olhos
    const blink = (t * 0.7 + look.name.length) % 4.2 < 0.13;
    const eye = (ex: number, w: number) => {
      if (blink) { LN(g, [ex - w, -37.6, ex + w, -37.6], '#2b1a3a', 0.9); return; }
      g.beginPath(); g.ellipse(ex, -38, w, 2.7, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill();
      g.beginPath(); g.ellipse(ex + 0.3, -37.8, w * 0.78, 2.3, 0, 0, 7); g.fillStyle = look.eyeColor; g.fill();
      g.beginPath(); g.ellipse(ex + 0.4, -37.6, w * 0.42, 1.4, 0, 0, 7); g.fillStyle = '#1a1022'; g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + 0.9, -38.9, 0.75, 0, 7); g.fill(); g.beginPath(); g.arc(ex - 0.4, -36.8, 0.35, 0, 7); g.fill();
      // cílios
      g.beginPath(); g.ellipse(ex, -38.2, w + 0.2, 2.8, 0, Math.PI * 1.08, Math.PI * 1.92); g.strokeStyle = '#2b1a3a'; g.lineWidth = 0.9; g.stroke();
      if (look.eyeStyle === 'cilios') { LN(g, [ex + w, -39.4, ex + w + 1, -40.4], '#2b1a3a', 0.6); LN(g, [ex + w * 0.4, -40.6, ex + w * 0.7, -41.6], '#2b1a3a', 0.6); }
    };
    eye(1.2, 1.9); eye(6.1, 1.6);
    // sobrancelhas
    LN(g, [-0.6, -42, 2.6, -42.5], shade(hairC, 0.8), 0.7); LN(g, [5, -42.5, 7.4, -42], shade(hairC, 0.8), 0.7);
    // nariz
    EL(g, 4.3, -35.5, 0.55, 0.45, skinD, false);
    // boca
    const mc = look.makeup?.lips ? '#e83e6c' : '#c2185b';
    if (look.expression === 'surpresa') EL(g, 3.6, -33, 1, 1.2, '#8b1e3f', false);
    else if (look.expression === 'sorriso' || look.expression === 'lingua' || anim === 'dance') { g.beginPath(); g.moveTo(1.6, -33.9); g.quadraticCurveTo(3.8, -30.6, 6, -33.9); g.closePath(); g.fillStyle = '#8b1e3f'; g.fill(); g.fillStyle = '#ffffff'; g.fillRect(2.6, -33.9, 2.4, 0.7); if (look.expression === 'lingua') EL(g, 3.8, -32.4, 1, 0.8, '#ff7aa2', false); }
    else { g.beginPath(); g.moveTo(1.8, -33.8); g.quadraticCurveTo(3.8, -31.9, 5.8, -33.8); g.strokeStyle = mc; g.lineWidth = 0.9; g.lineCap = 'round'; g.stroke(); }
    if (look.makeup?.glitter) { g.fillStyle = '#ffe066'; g.fillRect(-3, -36.8, 0.8, 0.8); g.fillRect(7.6, -36.6, 0.8, 0.8); }
  }
  drawHair(g, look, front, sway);
  drawAcc(g, look, front, t);
  // ---------- braço da frente (por cima) ----------
  arm(6.3, aFront, false, true);

  if (swim) {
    g.fillStyle = 'rgba(90,200,240,0.88)';
    g.fillRect(-13, -23, 26, 28);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(-11 + Math.sin(t * 4) * 2, -23.6, 8, 1); g.fillRect(3, -23.6, 7, 1);
  }
  g.restore();
}

function drawHair(g: CanvasRenderingContext2D, look: Appearance, front: boolean, sway: number) {
  const c = look.hairColor;
  const hl = shade(c, 1.4);
  const dk = shade(c, 0.75);
  const st = look.hairStyle;
  if (st === 'careca') return;
  const tie = look.accColor || '#ff5fa2';
  if (!front) {
    // de costas: o cabelo cobre a cabeça toda
    SH(g, [-9, -40, -8.8, -33, -4.5, -30.2, 0.6, -29.8, 5.6, -30.2, 9.2, -33.6, 9.4, -40, 6.2, -47.4, 0, -48.2, -6.2, -47.4], c);
    LN(g, [-3, -45.6, 1.5, -46.6], hl, 0.8); LN(g, [-5, -40, -4, -34], dk, 0.5); LN(g, [1, -42, 1.6, -33], dk, 0.5); LN(g, [5.6, -41, 5.4, -34.4], dk, 0.5);
  } else {
    // franja com mechas
    SH(g, [-9, -39.5, -8.6, -35.2, -6.6, -36.4, -5.6, -41, -2, -42.6, 2.8, -42, 6.6, -43, 8.6, -41, 9.4, -37.6, 9.6, -41, 6.4, -47.6, 0, -48.6, -6.4, -47.6], c);
    LN(g, [-4.6, -46, 0.6, -47.2], hl, 0.9); LN(g, [2.4, -46.6, 5.4, -45.4], hl, 0.6);
    LN(g, [-3.4, -45, -4.6, -41.6], dk, 0.5); LN(g, [1, -45.4, 1.6, -42.4], dk, 0.5); LN(g, [5.4, -45, 6.6, -43], dk, 0.5);
  }
  const tail = (tx: number, ty: number, len: number, w: number, sw: number) => {
    SH(g, [tx - w, ty, tx - w * 1.15 + sw * 0.5, ty + len * 0.6, tx + sw, ty + len, tx + w * 1.15 + sw * 0.5, ty + len * 0.6, tx + w, ty], c);
    LN(g, [tx - w * 0.2, ty + 1.5, tx + sw * 0.6, ty + len - 1.6], hl, 0.6);
  };
  switch (st) {
    case 'chiquinhas':
      tail(-10.6, -38.4, 12, 2.2, -sway); tail(10.8, -38.4, 12, 2.2, sway);
      EL(g, -10.2, -39.6, 2.6, 2.6, c); EL(g, 10.4, -39.6, 2.6, 2.6, c);
      EL(g, -9.6, -38, 1.2, 1.2, tie); EL(g, 9.8, -38, 1.2, 1.2, tie);
      break;
    case 'rabo':
      tail(-10.6, -42, 15, 2.6, -sway * 1.2); EL(g, -9.6, -42.4, 2.4, 2.4, c); EL(g, -9.2, -41.4, 1.2, 1.2, tie);
      break;
    case 'coque':
      EL(g, 0, -49.6, 4.4, 4, c); LN(g, [-2, -51, 1.4, -51.6], hl, 0.7); LN(g, [-3.6, -47.4, 3.6, -47.4], tie, 1.1);
      break;
    case 'cacheado':
      for (let i = 0; i < 9; i++) { const a2 = Math.PI * (0.95 + i * 0.14); const rx = Math.cos(a2) * 10.2, ry = -40 + Math.sin(a2) * 8.6; EL(g, rx, ry + (i % 2 ? sway * 0.3 : 0), 3, 3, i % 3 ? c : hl); }
      EL(g, -9.6, -33.6 + sway * 0.3, 2.8, 2.8, c); EL(g, 10, -33.6 - sway * 0.3, 2.8, 2.8, c); EL(g, -8.6, -29.8, 2.3, 2.3, c); EL(g, 9, -29.8, 2.3, 2.3, c);
      break;
    case 'trancas':
      for (let k = 0; k < 4; k++) { EL(g, -9.6 - sway * 0.15 * k, -35.6 + k * 3.3, 2, 2.1, k % 2 ? hl : c); EL(g, 9.9 + sway * 0.15 * k, -35.6 + k * 3.3, 2, 2.1, k % 2 ? hl : c); }
      EL(g, -9.9, -22.6, 1.3, 1.3, tie); EL(g, 10.2, -22.6, 1.3, 1.3, tie);
      break;
    case 'franja':
      if (front) { SH(g, [-8.6, -44, -8.4, -39, -4, -39.6, 1, -39.2, 6, -39.8, 9.2, -39.6, 9, -44.6, 0, -47.6], c); for (const fx of [-5, -1.6, 2, 5.6]) LN(g, [fx, -44.4, fx + 0.3, -40], dk, 0.5); }
      break;
    case 'longo':
      if (front) { tail(-8.8, -37, 13, 1.7, -sway * 0.4); tail(9.4, -37, 13, 1.5, sway * 0.4); }
      break;
    case 'black':
      if (front) { for (let i = 0; i < 7; i++) EL(g, -9 + i * 3, -46.6 - Math.sin((i / 6) * Math.PI) * 3.6, 2.6, 2.6, i % 2 ? c : hl, false); }
      break;
  }
}

function drawAcc(g: CanvasRenderingContext2D, look: Appearance, front: boolean, t: number) {
  const a = look.accessories ?? [];
  const ac = look.accColor || '#ff5fa2';
  if (a.includes('asas-fada') || a.includes('asas-arcoiris')) { g.globalAlpha = 0.55; const f = Math.sin(t * 8) * 1.6; const wc = a.includes('asas-arcoiris') ? '#c77dff' : ac; EL(g, -10.5, -27, 5.6, 9 + f, wc, true, -0.45); EL(g, 10.5, -27, 5.6, 9 + f, wc, true, 0.45); g.globalAlpha = 1; }
  if (a.includes('mochila') && !front) { RR(g, -5, -28, 10, 10, 2, ac); RR(g, -3, -24, 6, 4, 1, shade(ac, 0.85)); }
  if (a.includes('tiara')) { g.beginPath(); g.ellipse(0, -43, 8.6, 5.4, 0, Math.PI * 1.08, Math.PI * 1.92); g.strokeStyle = ac; g.lineWidth = 1.5; g.stroke(); }
  if (a.includes('laco')) {
    // laço com nó e dobrinhas
    SH(g, [6.4, -47.4, 3, -50.4, 2.6, -45.2], ac); SH(g, [6.4, -47.4, 10, -50.6, 10.4, -45], ac);
    EL(g, 6.4, -47.4, 1.3, 1.5, shade(ac, 0.85));
    LN(g, [4, -48.6, 5.4, -47.6], shade(ac, 0.7), 0.5); LN(g, [8.8, -48.6, 7.4, -47.6], shade(ac, 0.7), 0.5);
  }
  if (a.includes('flor-cabelo')) { for (let i = 0; i < 5; i++) EL(g, -6.4 + Math.cos(i * 1.256) * 1.7, -45.4 + Math.sin(i * 1.256) * 1.7, 1.2, 1.2, ac, false); EL(g, -6.4, -45.4, 0.9, 0.9, '#ffd23f', false); }
  if (a.includes('coroa') || a.includes('coroa-arcoiris')) {
    SH(g, [-5.4, -47.4, -6, -53, -3.4, -50.4, -1.4, -54.6, 0.4, -50.6, 2.6, -54.6, 4.2, -50.4, 6.8, -53, 6.2, -47.4, 0.4, -48.2], '#ffd23f');
    EL(g, 0.4, -49.2, 0.9, 0.9, '#ff5fa2', false); EL(g, -3.2, -49, 0.6, 0.6, '#5ad1ff', false); EL(g, 4, -49, 0.6, 0.6, '#5ad1ff', false);
  }
  if (a.includes('oculos-coracao') && front) { EL(g, 1.2, -37.8, 2.7, 2.7, 'rgba(255,255,255,0.25)'); g.strokeStyle = ac; g.lineWidth = 0.9; g.beginPath(); g.arc(1.2, -37.8, 2.7, 0, 7); g.stroke(); g.beginPath(); g.arc(6.2, -37.8, 2.3, 0, 7); g.stroke(); LN(g, [3.9, -37.8, 4, -37.8], ac, 0.9); }
  if (a.includes('chapeu-sol')) { EL(g, 0.4, -45.6, 13.5, 3.4, ac); SH(g, [-6.6, -46, -6, -52.4, 0.4, -54, 6.8, -52.4, 7.4, -46, 0.4, -45], ac); LN(g, [-6.6, -47, 7.4, -47], '#ff5fa2', 1.2); }
  if (a.includes('bone')) { SH(g, [-8.6, -44.4, -7.6, -50.6, 0.4, -52.6, 8.4, -50.6, 9.4, -44.4, 0.4, -43.4], ac); if (front) SH(g, [3, -45.6, 13.6, -44.6, 13, -42.6, 4, -43.4], shade(ac, 0.85)); }
  if (a.includes('orelhas-coelho')) { RR(g, -5, -58, 3.2, 11, 1.6, ac); RR(g, 2.6, -58, 3.2, 11, 1.6, ac); RR(g, -4.2, -56.6, 1.5, 7, 0.8, '#ffc2d9', false); RR(g, 3.4, -56.6, 1.5, 7, 0.8, '#ffc2d9', false); }
  if (a.includes('colar') && front) { g.beginPath(); g.ellipse(0.4, -29.6, 3.4, 1.8, 0, 0.1, Math.PI - 0.1); g.strokeStyle = '#ffffff'; g.lineWidth = 0.9; g.stroke(); }
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
