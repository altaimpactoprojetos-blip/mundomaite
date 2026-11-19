import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { sfx } from '../../systems/audio';

const COLORS = ['#ff5f5f', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa', '#ff8fc7', '#8d5b3a', '#222831', '#ffffff'];
const STAMPS = ['⭐', '💖', '🌸', '🦋', '🌈', '☀️', '🐱', '🦄'];

export function PaintGame({ onDone }: { onDone: (stars: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#ff5fa2');
  const [size, setSize] = useState(10);
  const [stamp, setStamp] = useState<string | null>(null);
  const drawing = useRef(false);
  const last = useRef<[number, number] | null>(null);
  const strokes = useRef(0);
  useEffect(() => {
    const g = ref.current!.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 480, 340);
  }, []);
  const pos = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 480, ((e.clientY - r.top) / r.height) * 340];
  };
  const down = (e: React.PointerEvent) => {
    e.stopPropagation();
    const g = ref.current!.getContext('2d')!;
    const p = pos(e);
    strokes.current++;
    if (stamp) {
      g.font = `${size * 4}px sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(stamp, p[0], p[1]);
      sfx('pop');
      return;
    }
    drawing.current = true;
    last.current = p;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const g = ref.current!.getContext('2d')!;
    const p = pos(e);
    g.strokeStyle = color;
    g.lineWidth = size;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(...last.current);
    g.lineTo(...p);
    g.stroke();
    last.current = p;
  };
  const up = () => { drawing.current = false; last.current = null; };
  const save = () => {
    const url = ref.current!.toDataURL('image/jpeg', 0.8);
    useGame.getState().addPainting(url);
    useGame.getState().toast('Quadro guardado no seu Álbum 🎨', '🖼️');
    onDone(Math.min(5, 2 + Math.floor(strokes.current / 6)));
  };
  return (
    <div className="mg">
      <div className="paint-wrap">
        <canvas ref={ref} width={480} height={340} style={{ width: 'min(480px, 88vw)' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 220 }}>
          <div className="swatches">{COLORS.map((c) => <button key={c} className={`sw ${c === color && !stamp ? 'on' : ''}`} style={{ background: c }} onClick={() => { setColor(c); setStamp(null); }} />)}</div>
          <div className="row">{[5, 10, 20, 34].map((s) => <button key={s} className={`btn small ${size === s ? 'pink' : ''}`} onClick={() => setSize(s)}>{s === 5 ? '•' : s === 10 ? '●' : s === 20 ? '⬤' : '🟣'}</button>)}</div>
          <div className="row">{STAMPS.map((s) => <button key={s} className={`btn small ${stamp === s ? 'pink' : ''}`} onClick={() => setStamp(s)}>{s}</button>)}</div>
          <button className="btn small" onClick={() => { const g = ref.current!.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, 480, 340); }}>🧽 Limpar</button>
          <button className="btn pink" onClick={save}>🖼️ Terminar e guardar</button>
        </div>
      </div>
    </div>
  );
}
