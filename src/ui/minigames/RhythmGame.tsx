import { useEffect, useRef, useState } from 'react';
import { sfx } from '../../systems/audio';

const LANES = [['🎵', '#ff5fa2', 1], ['🎶', '#ffd23f', 1.26], ['⭐', '#4aa8ff', 1.5], ['💖', '#3ccf91', 2]] as const;
const DURATION = 30;
const SPEED = 140; // px/s
const H = 300;
const HIT = H - 40 - 25;

interface Note { id: number; lane: number; t: number; hit: boolean }

export function RhythmGame({ onDone }: { onDone: (stars: number) => void }) {
  const [, force] = useState(0);
  const notes = useRef<Note[]>([]);
  const t0 = useRef(performance.now());
  const score = useRef(0);
  const combo = useRef(0);
  const fb = useRef('');
  useEffect(() => {
    let id = 0;
    for (let t = 1.5; t < DURATION - 1; t += 0.55 + Math.random() * 0.5) notes.current.push({ id: id++, lane: Math.floor(Math.random() * 4), t, hit: false });
    let raf = 0;
    const loop = () => {
      const el = (performance.now() - t0.current) / 1000;
      if (el > DURATION) { onDone(Math.min(5, Math.round((score.current / notes.current.length) * 6))); return; }
      force((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const key = (e: KeyboardEvent) => { const i = ['a', 's', 'd', 'f'].indexOf(e.key.toLowerCase()); if (i >= 0) tap(i); };
    window.addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', key); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const el = (performance.now() - t0.current) / 1000;
  const yOf = (n: Note) => HIT - (n.t - el) * SPEED;
  const tap = (lane: number) => {
    const now = (performance.now() - t0.current) / 1000;
    sfx('note', LANES[lane][2] * 0.7);
    const n = notes.current.find((x) => !x.hit && x.lane === lane && Math.abs(x.t - now) < 0.28);
    if (n) { n.hit = true; score.current++; combo.current++; fb.current = combo.current > 4 ? `🔥 Combo ${combo.current}!` : '✨ Isso!'; }
    else { combo.current = 0; fb.current = '🎤'; }
  };
  return (
    <div className="mg">
      <div className="row"><b>🎤 Show da Cantora</b><span className="chip">⭐ {score.current}</span><span className="chip">⏱️ {Math.max(0, Math.ceil(DURATION - el))}s</span><span className="chip">{fb.current}</span></div>
      <div className="lanes" style={{ height: H }}>
        {LANES.map((l, i) => (
          <div key={i} className="lane">
            {notes.current.filter((n) => n.lane === i && !n.hit && yOf(n) > -60 && yOf(n) < H).map((n) => (
              <div key={n.id} className="note" style={{ top: yOf(n), background: l[1] }}>{l[0]}</div>
            ))}
          </div>
        ))}
        <div className="hitline" />
      </div>
      <div className="lanes" style={{ height: 'auto', background: 'none' }}>
        {LANES.map((l, i) => <button key={i} className="btn big" style={{ background: l[1], color: '#fff', padding: '12px 0' }} onPointerDown={() => tap(i)}>{l[0]}</button>)}
      </div>
      <div className="muted">Toque no botão quando a notinha chegar na linha branca! (teclado: A S D F)</div>
    </div>
  );
}
