import type { ReactNode } from 'react';
import { useGame } from '../store/gameStore';

export function Panel({ title, icon, children, side, onClose, wide }: { title: string; icon: string; children: ReactNode; side?: boolean; onClose?: () => void; wide?: boolean }) {
  const close = onClose ?? (() => useGame.getState().openPanel(null));
  const inner = (
    <div className="panel" style={wide ? { width: 'min(1100px, 100%)' } : undefined} onPointerDown={(e) => e.stopPropagation()}>
      <div className="panel-head">
        <span style={{ fontSize: 30 }}>{icon}</span>
        <h2>{title}</h2>
        <button className="close" onClick={close} aria-label="Fechar">✖</button>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
  if (side) return <div className="side-panel">{inner}</div>;
  return <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>{inner}</div>;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={`tab ${t.id === value ? 'on' : ''}`} onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  );
}

export function Swatches({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="swatches">
      {colors.map((c) => <button key={c} className={`sw ${c === value ? 'on' : ''}`} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />)}
      <label className="sw" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', position: 'relative', overflow: 'hidden' }} title="Qualquer cor">
        <input type="color" value={value.length === 7 ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </label>
    </div>
  );
}

export const money = (n: number, creative: boolean) => (creative ? '∞' : n.toLocaleString('pt-BR'));
