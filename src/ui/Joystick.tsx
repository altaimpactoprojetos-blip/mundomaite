import { useRef } from 'react';
import { joy } from '../systems/input';

export function Joystick({ mini = false }: { mini?: boolean }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const id = useRef<number | null>(null);
  const update = (cx: number, cy: number) => {
    const r = base.current!.getBoundingClientRect();
    const R = r.width / 2;
    let dx = cx - (r.left + R);
    let dy = cy - (r.top + R);
    const l = Math.hypot(dx, dy);
    if (l > R) { dx = (dx / l) * R; dy = (dy / l) * R; }
    knob.current!.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / R;
    joy.y = -dy / R;
    joy.active = true;
  };
  const end = () => {
    id.current = null;
    joy.x = joy.y = 0;
    joy.active = false;
    if (knob.current) knob.current.style.transform = '';
  };
  return (
    <div
      ref={base}
      className={`joystick ${mini ? 'mini' : ''}`}
      onPointerDown={(e) => { e.stopPropagation(); id.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); update(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (id.current === e.pointerId) update(e.clientX, e.clientY); }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="knob" />
    </div>
  );
}
