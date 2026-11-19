import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { Panel } from './Panel';
import { drawWorld } from './Minimap';
import { PLACES, ZONES } from '../data/world';
import { rt, teleportPlayer, spawnEffect } from '../systems/runtime';
import { sfx } from '../systems/audio';
import { exitVehicle } from '../game/Vehicles';

export function MapPanel() {
  const ref = useRef<HTMLCanvasElement>(null);
  const props = useGame((s) => s.properties);
  const discovered = useGame((s) => s.discovered);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    drawWorld(g, c.width, props);
    const s = c.width / 820;
    const p = rt.player.pos;
    g.fillStyle = '#ff5fa2';
    g.strokeStyle = '#fff';
    g.lineWidth = 4;
    g.beginPath(); g.arc((p.x + 410) * s, (p.z + 410) * s, 9, 0, 7); g.fill(); g.stroke();
  }, [props]);
  const go = (x: number, z: number, name: string) => {
    if (rt.vehicle.id && !exitVehicle()) return;
    teleportPlayer(x, 0.5, z);
    spawnEffect('sparkles', rt.player.pos);
    sfx('whoosh');
    useGame.getState().openPanel(null);
    useGame.getState().toast(`Viagem mágica até: ${name}! ✨`, '🗺️');
  };
  return (
    <Panel title="Mapa do Mundo" icon="🗺️" wide>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 'min(520px, 100%)', aspectRatio: '1' }}>
          <canvas ref={ref} width={820} height={820} style={{ width: '100%', height: '100%', borderRadius: 20, boxShadow: 'var(--shadow)' }} />
          {PLACES.map((pl) => (
            <button key={pl.id} title={pl.name} onClick={() => go(pl.x, pl.z, pl.name)} onPointerEnter={() => setHover(pl.name)}
              style={{ position: 'absolute', left: `${((pl.x + 410) / 820) * 100}%`, top: `${((pl.z + 410) / 820) * 100}%`, transform: 'translate(-50%,-50%)', fontSize: 20, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 30, height: 30, boxShadow: '0 2px 6px rgba(0,0,0,.25)', padding: 0 }}>
              {pl.icon}
            </button>
          ))}
          {hover && <div className="chip" style={{ position: 'absolute', left: 8, bottom: 8 }}>{hover}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="section">Toque num lugar para viajar ✨</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {PLACES.map((pl) => (
              <button key={pl.id} className="card" onClick={() => go(pl.x, pl.z, pl.name)}>
                <div className="ic" style={{ fontSize: 28 }}>{pl.icon}</div>
                <div className="nm" style={{ fontSize: 12 }}>{pl.name}</div>
              </button>
            ))}
          </div>
          <div className="section">Lugares descobertos: {discovered.length} / {ZONES.length + 5}</div>
          <div className="row">{discovered.map((d) => <span key={d} className="chip" style={{ fontSize: 12 }}>⭐ {d}</span>)}</div>
        </div>
      </div>
    </Panel>
  );
}
