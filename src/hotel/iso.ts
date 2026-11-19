// Motor isométrico em pixel art (desenho 2D em resolução baixa, ampliado sem borrar)
export const TW = 32; // largura do ladrilho
export const TH = 16; // altura do ladrilho
export const WALL_H = 76;

export interface Cam { ox: number; oy: number }

export function iso(cam: Cam, x: number, y: number, z = 0) {
  return { x: Math.round((cam.ox + (x - y) * (TW / 2)) * 2) / 2, y: Math.round((cam.oy + (x + y) * (TH / 2) - z) * 2) / 2 };
}
export function tileAt(cam: Cam, sx: number, sy: number) {
  const a = (sx - cam.ox) / (TW / 2);
  const b = (sy - cam.oy) / (TH / 2);
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

const shadeCache = new Map<string, string>();
/** Escurece (f<1) ou clareia (f>1) uma cor */
export function shade(hex: string, f: number): string {
  const k = hex + f;
  const c = shadeCache.get(k);
  if (c) return c;
  let r: number, g: number, b: number;
  if (hex.startsWith('rgb')) {
    [r, g, b] = hex.replace(/[^\d,]/g, '').split(',').map(Number);
  } else {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h, 16);
    r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255;
  }
  if (f < 1) { r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  const out = `rgb(${r | 0},${g | 0},${b | 0})`;
  shadeCache.set(k, out);
  return out;
}

export function poly(g: CanvasRenderingContext2D, pts: { x: number; y: number }[], fill: string | CanvasGradient, stroke?: string) {
  g.beginPath();
  g.moveTo(pts[0].x + 0.5, pts[0].y + 0.5);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x + 0.5, pts[i].y + 0.5);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
}

/** Caixa isométrica (posição em ladrilhos, altura em pixels) com contorno */
export function box(g: CanvasRenderingContext2D, cam: Cam, x: number, y: number, z: number, w: number, d: number, h: number, color: string, outline = true) {
  const p = (a: number, b: number, c: number) => iso(cam, a, b, c);
  const top = [p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)];
  const left = [p(x, y + d, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x, y + d, z)];
  const right = [p(x + w, y, z + h), p(x + w, y + d, z + h), p(x + w, y + d, z), p(x + w, y, z)];
  const st = outline ? shade(color, 0.45) : undefined;
  if (h > 0) {
    if (h >= 6) {
      // faces com degradê (mais escuro embaixo) para dar volume
      const gl = g.createLinearGradient(0, left[0].y, 0, left[3].y + 1);
      gl.addColorStop(0, shade(color, 0.88)); gl.addColorStop(1, shade(color, 0.7));
      const gr = g.createLinearGradient(0, right[0].y, 0, right[3].y + 1);
      gr.addColorStop(0, shade(color, 0.72)); gr.addColorStop(1, shade(color, 0.54));
      poly(g, left, gl as unknown as string, st);
      poly(g, right, gr as unknown as string, st);
    } else {
      poly(g, left, shade(color, 0.82), st);
      poly(g, right, shade(color, 0.66), st);
    }
  }
  poly(g, top, color, st);
  if (outline && w >= 0.6 && d >= 0.5 && h >= 2) {
    // textura suave no tampo (veios / trama do tecido)
    g.strokeStyle = shade(color, 0.9);
    g.lineWidth = 0.5;
    const n = Math.max(1, Math.round(d * 3));
    for (let i = 1; i < n; i++) {
      const a = p(x + 0.06, y + (d * i) / n, z + h), b = p(x + w - 0.06, y + (d * i) / n, z + h);
      g.beginPath(); g.moveTo(a.x + 0.5, a.y + 0.5); g.lineTo(b.x + 0.5, b.y + 0.5); g.stroke();
    }
    g.lineWidth = 1;
  }
  if (outline && h >= 4) {
    // brilho nas bordas da frente do topo
    g.strokeStyle = shade(color, 1.35);
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(top[3].x + 0.5, top[3].y + 1); g.lineTo(top[2].x + 0.5, top[2].y + 1); g.lineTo(top[1].x + 0.5, top[1].y + 1);
    g.stroke();
    g.lineWidth = 1;
  }
}

/** Cilindro/disco isométrico (centro em ladrilhos, raio em ladrilhos) */
export function cyl(g: CanvasRenderingContext2D, cam: Cam, cx: number, cy: number, z: number, r: number, h: number, color: string, outline = true) {
  const c = iso(cam, cx, cy, z);
  const rx = r * TW * 0.7, ry = r * TH * 0.7;
  const st = outline ? shade(color, 0.45) : undefined;
  if (h > 0) {
    g.beginPath();
    g.ellipse(c.x + 0.5, c.y + 0.5, rx, ry, 0, 0, Math.PI);
    g.lineTo(c.x - rx + 0.5, c.y - h + 0.5);
    g.ellipse(c.x + 0.5, c.y - h + 0.5, rx, ry, 0, Math.PI, 0, true);
    g.closePath();
    const cg = g.createLinearGradient(c.x - rx, 0, c.x + rx, 0);
    cg.addColorStop(0, shade(color, 0.92)); cg.addColorStop(0.45, shade(color, 0.8)); cg.addColorStop(1, shade(color, 0.56));
    g.fillStyle = cg;
    g.fill();
    if (st) { g.strokeStyle = st; g.stroke(); }
  }
  g.beginPath();
  g.ellipse(c.x + 0.5, c.y - h + 0.5, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
  if (st) { g.strokeStyle = st; g.stroke(); }
}

/** Bola (folhagens, abajur...) */
export function ball(g: CanvasRenderingContext2D, cam: Cam, cx: number, cy: number, z: number, r: number, color: string) {
  const c = iso(cam, cx, cy, z);
  const R = r * TW * 0.55;
  const gr = g.createRadialGradient(c.x - R * 0.35, c.y - R * 0.4, R * 0.1, c.x, c.y, R);
  gr.addColorStop(0, shade(color, 1.4)); gr.addColorStop(0.5, color); gr.addColorStop(1, shade(color, 0.68));
  g.beginPath();
  g.arc(c.x + 0.5, c.y + 0.5, R, 0, Math.PI * 2);
  g.fillStyle = gr;
  g.fill();
  g.strokeStyle = shade(color, 0.5);
  g.stroke();
}

/** Losango de ladrilho */
export function tile(g: CanvasRenderingContext2D, cam: Cam, x: number, y: number, color: string, stroke?: string, z = 0) {
  poly(g, [iso(cam, x, y, z), iso(cam, x + 1, y, z), iso(cam, x + 1, y + 1, z), iso(cam, x, y + 1, z)], color, stroke);
}
