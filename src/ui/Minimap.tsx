import { useEffect, useRef } from 'react';
import { ROADS, ZONES, BUILDINGS, ISLANDS, SEA_Z, BEACH_Z, PROPERTIES, PLACES } from '../data/world';
import { TOUR } from '../data/tour';
import { tourTarget } from '../game/Tour';
import { rt } from '../systems/runtime';
import { useGame } from '../store/gameStore';

/** Desenha o mapa inteiro num canvas (usado pelo minimapa e pelo mapa grande) */
export function drawWorld(g: CanvasRenderingContext2D, size: number, owned: Record<string, { owned: boolean }> = {}) {
  const s = size / 820;
  const X = (x: number) => (x + 410) * s;
  const Z = (z: number) => (z + 410) * s;
  g.fillStyle = '#a6dc8a';
  g.fillRect(0, 0, size, size);
  for (const zn of ZONES) {
    g.fillStyle = zn.ground;
    g.fillRect(X(zn.x - zn.w / 2), Z(zn.z - zn.d / 2), zn.w * s, zn.d * s);
  }
  g.fillStyle = '#ffe7a6';
  g.fillRect(0, Z(BEACH_Z), size, (SEA_Z - BEACH_Z) * s);
  g.fillStyle = '#5ac8f0';
  g.fillRect(0, Z(SEA_Z), size, size);
  for (const i of ISLANDS) {
    g.fillStyle = i.color;
    g.beginPath(); g.arc(X(i.x), Z(i.z), i.r * s, 0, 7); g.fill();
    g.fillStyle = '#a6dc8a';
    g.beginPath(); g.arc(X(i.x), Z(i.z), (i.r - 6) * s, 0, 7); g.fill();
  }
  g.strokeStyle = '#ffffff';
  g.lineCap = 'round';
  for (const r of ROADS) {
    g.lineWidth = r.w * s;
    g.beginPath(); g.moveTo(X(r.x1), Z(r.z1)); g.lineTo(X(r.x2), Z(r.z2)); g.stroke();
  }
  for (const b of BUILDINGS) {
    g.fillStyle = b.color;
    g.strokeStyle = '#7a3a9a';
    g.lineWidth = 1;
    g.fillRect(X(b.pos[0] - b.size[0] / 2), Z(b.pos[1] - b.size[2] / 2), b.size[0] * s, b.size[2] * s);
    g.strokeRect(X(b.pos[0] - b.size[0] / 2), Z(b.pos[1] - b.size[2] / 2), b.size[0] * s, b.size[2] * s);
  }
  for (const p of PROPERTIES) {
    g.fillStyle = owned[p.id]?.owned ? '#ff5fa2' : p.preset ? '#ffffff' : '#d6f5c0';
    g.fillRect(X(p.pos[0] - 8), Z(p.pos[1] - 6), 16 * s, 12 * s);
  }
  g.fillStyle = '#ff8fc7';
  g.beginPath(); g.arc(X(65), Z(-5), 22 * s, 0, 7); g.fill();
  // destinos
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${Math.max(10, 16 * s)}px sans-serif`;
  for (const p of PLACES) {
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath(); g.arc(X(p.x), Z(p.z), 9 * Math.max(0.7, s), 0, 7); g.fill();
    g.fillText(p.icon, X(p.x), Z(p.z) + 1);
  }
}

export function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const props = useGame((s) => s.properties);
  const bg = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 820;
    drawWorld(c.getContext('2d')!, 820, props);
    bg.current = c;
  }, [props]);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const t = setInterval(() => {
      if (!bg.current) return;
      const W = c.width;
      const p = rt.player.pos;
      const zoom = 2.2;
      g.save();
      g.clearRect(0, 0, W, W);
      g.translate(W / 2, W / 2);
      g.rotate(rt.cam.yaw);
      g.scale(zoom * (W / 128), zoom * (W / 128));
      g.drawImage(bg.current, -(p.x + 410), -(p.z + 410));
      g.restore();
      // seta da jogadora
      g.save();
      g.translate(W / 2, W / 2);
      g.rotate(rt.cam.yaw - rt.player.yaw);
      g.fillStyle = '#ff5fa2';
      g.strokeStyle = '#fff';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 12); g.lineTo(9, -8); g.lineTo(-9, -8); g.closePath();
      g.fill(); g.stroke();
      g.restore();
      // tarefa
      const tour = useGame.getState().tour;
      const tt = tour && !tour.done ? tourTarget(TOUR[tour.step].id) : null;
      if (tt) {
        const dx = tt.x - p.x, dz = tt.z - p.z;
        const a = rt.cam.yaw;
        let rx = (dx * Math.cos(a) - dz * Math.sin(a)) * zoom * (W / 128);
        let rz = (dx * Math.sin(a) + dz * Math.cos(a)) * zoom * (W / 128);
        const l = Math.hypot(rx, rz);
        if (l > W / 2 - 12) { rx = (rx / l) * (W / 2 - 12); rz = (rz / l) * (W / 2 - 12); }
        g.fillStyle = '#9d4edd';
        g.beginPath(); g.arc(W / 2 + rx, W / 2 + rz, 9, 0, 7); g.fill();
        g.font = '13px sans-serif'; g.textAlign = 'center'; g.fillText('⭐', W / 2 + rx, W / 2 + rz + 5);
      }
      const task = useGame.getState().task;
      if (task) {
        for (const tg of task.targets.filter((x) => !x.done)) {
          const dx = tg.pos[0] - p.x, dz = tg.pos[2] - p.z;
          const a = rt.cam.yaw;
          let rx = (dx * Math.cos(a) - dz * Math.sin(a)) * zoom * (W / 128);
          let rz = (dx * Math.sin(a) + dz * Math.cos(a)) * zoom * (W / 128);
          const l = Math.hypot(rx, rz);
          if (l > W / 2 - 10) { rx = (rx / l) * (W / 2 - 10); rz = (rz / l) * (W / 2 - 10); }
          g.font = '16px sans-serif';
          g.textAlign = 'center';
          g.fillText(tg.icon, W / 2 + rx, W / 2 + rz + 6);
        }
      }
    }, 150);
    return () => clearInterval(t);
  }, []);
  return <canvas ref={ref} width={128} height={128} className="minimap" onClick={() => useGame.getState().openPanel('map')} />;
}
