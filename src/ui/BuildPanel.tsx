import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { MODELS, getModel } from '../data/models';
import { BUILD_COLORS, TEXTURES } from '../data/palette';
import type { ItemCategory, PlacedObject, Vec3 } from '../types';
import { Swatches } from './Panel';
import { sfx } from '../systems/audio';
import { rt } from '../systems/runtime';

const CATS: [ItemCategory, string][] = [['construcao', '🧱 Construção'], ['moveis', '🛋️ Móveis'], ['decoracao', '🖼️ Decoração'], ['jardim', '🌷 Jardim'], ['parque', '🛝 Parque'], ['loja', '🏪 Loja'], ['especiais', '✨ Especiais']];

export function BuildPanel() {
  const [cat, setCat] = useState<ItemCategory>('construcao');
  const [pop, setPop] = useState<null | 'cor' | 'tex'>(null);
  const build = useGame((s) => s.build);
  const placed = useGame((s) => s.placed);
  const inventory = useGame((s) => s.inventory);
  const creative = useGame((s) => s.creative);
  const g = useGame.getState;
  const sel = placed.find((o) => o.id === build.selected) ?? null;
  const step = build.snap ? Math.PI / 4 : Math.PI / 12;

  const upd = (p: Partial<PlacedObject>) => { if (sel) { g().updatePlaced(sel.id, p); sfx('click'); } };
  const scaleBy = (k: number, axis?: 0 | 1 | 2) => {
    if (!sel) return;
    const s = [...sel.scale] as Vec3;
    const cl = (v: number) => Math.max(0.2, Math.min(12, Math.round(v * 100) / 100));
    if (axis === undefined) upd({ scale: s.map((v) => cl(v * k)) as Vec3 });
    else { s[axis] = cl(s[axis] * k); upd({ scale: s }); }
  };
  const move = (dy: number) => sel && upd({ pos: [sel.pos[0], Math.max(0, Math.round((sel.pos[1] + dy) * 10) / 10), sel.pos[2]] });
  const nudge = (dx: number, dz: number) => {
    if (!sel) return;
    // relativo à câmera
    const y = rt.cam.yaw;
    const fx = -Math.sin(y), fz = -Math.cos(y);
    const rx = Math.cos(y), rz = -Math.sin(y);
    const st = build.snap ? 0.5 : 0.1;
    upd({ pos: [Math.round((sel.pos[0] + (rx * dx + fx * dz) * st) * 10) / 10, sel.pos[1], Math.round((sel.pos[2] + (rz * dx + fz * dz) * st) * 10) / 10] });
  };
  const color = sel ? sel.color : build.color ?? (build.item ? getModel(build.item).color : '#ffffff');
  const setColor = (c: string) => { if (sel) upd({ color: c }); else g().setBuild({ color: c }); };
  const tex = sel ? sel.texture : build.texture;
  const setTex = (t: typeof tex) => { if (sel) upd({ texture: t }); else g().setBuild({ texture: t }); };
  const rotate = (d: number) => { if (sel) upd({ rotY: sel.rotY + d }); else g().setBuild({ rot: build.rot + d }); sfx('click'); };

  return (
    <div className="build-bar" onPointerDown={(e) => e.stopPropagation()}>
      <div className="build-tools">
        <button className={`btn small ${build.item ? 'pink' : ''}`} onClick={() => g().setBuild({ item: build.item ?? 'parede', selected: null })}>➕ Colocar</button>
        <button className={`btn small ${!build.item ? 'pink' : ''}`} onClick={() => g().setBuild({ item: null })}>👆 Mexer</button>
        {CATS.map(([c, n]) => <button key={c} className={`btn small ${cat === c ? 'lilac' : 'ghost'}`} onClick={() => { setCat(c); }}>{n}</button>)}
        <button className="btn small blue" style={{ marginLeft: 'auto' }} onClick={() => g().openPanel(null)}>✅ Pronto</button>
      </div>
      <div className="build-items">
        {MODELS.filter((m) => m.cat === cat).map((m) => {
          const n = inventory[m.id] ?? 0;
          return (
            <button key={m.id} className={`card ${build.item === m.id ? 'on' : ''}`} onClick={() => { g().setBuild({ item: m.id, selected: null, color: null }); sfx('click'); }}>
              {n > 0 && <div className="badge">x{n}</div>}
              <div className="ic">{m.icon}</div>
              <div className="nm">{m.name}</div>
              {!creative && n === 0 && <div className="pr">🪙{m.price}</div>}
            </button>
          );
        })}
      </div>
      {pop === 'cor' && <Swatches colors={BUILD_COLORS} value={color} onChange={setColor} />}
      {pop === 'tex' && (
        <div className="build-tools">
          {TEXTURES.map((t) => <button key={t.id} className={`btn small ${tex === t.id ? 'pink' : ''}`} onClick={() => setTex(t.id)}>{t.icon} {t.name}</button>)}
        </div>
      )}
      <div className="build-tools">
        <button className="btn small" onClick={() => rotate(step)}>⟲</button>
        <button className="btn small" onClick={() => rotate(-step)}>⟳</button>
        <button className={`btn small ${pop === 'cor' ? 'pink' : ''}`} onClick={() => setPop(pop === 'cor' ? null : 'cor')}>🎨 Cor</button>
        <button className={`btn small ${pop === 'tex' ? 'pink' : ''}`} onClick={() => setPop(pop === 'tex' ? null : 'tex')}>🧵 Textura</button>
        <span className="chip" style={{ boxShadow: 'none' }}>🏢 Andar {build.level}</span>
        <button className="btn small" onClick={() => g().setBuild({ level: Math.max(0, build.level - 1) })}>⬇</button>
        <button className="btn small" onClick={() => g().setBuild({ level: Math.min(9, build.level + 1) })}>⬆</button>
        <button className={`btn small ${build.snap ? 'mint' : ''}`} onClick={() => g().setBuild({ snap: !build.snap })}>📏 Grade</button>
        {sel && (
          <>
            <span className="chip" style={{ boxShadow: 'none', background: '#fff4fa' }}>{getModel(sel.model).icon} {getModel(sel.model).name}</span>
            <button className="btn small" onClick={() => scaleBy(1.15)}>➕ Maior</button>
            <button className="btn small" onClick={() => scaleBy(1 / 1.15)}>➖ Menor</button>
            <button className="btn small" onClick={() => scaleBy(1.25, 0)}>↔️ Largura+</button>
            <button className="btn small" onClick={() => scaleBy(0.8, 0)}>↔️ Largura−</button>
            <button className="btn small" onClick={() => scaleBy(1.25, 1)}>↕️ Altura+</button>
            <button className="btn small" onClick={() => scaleBy(0.8, 1)}>↕️ Altura−</button>
            <button className="btn small" onClick={() => scaleBy(1.25, 2)}>🔳 Fundo+</button>
            <button className="btn small" onClick={() => scaleBy(0.8, 2)}>🔳 Fundo−</button>
            <button className="btn small" onClick={() => move(0.25)}>🔼 Subir</button>
            <button className="btn small" onClick={() => move(-0.25)}>🔽 Descer</button>
            <button className="btn small" onClick={() => nudge(0, 1)}>⬆️</button>
            <button className="btn small" onClick={() => nudge(0, -1)}>⬇️</button>
            <button className="btn small" onClick={() => nudge(-1, 0)}>⬅️</button>
            <button className="btn small" onClick={() => nudge(1, 0)}>➡️</button>
            {sel.model === 'letreiro' && <input value={sel.label ?? ''} maxLength={20} onChange={(e) => g().updatePlaced(sel.id, { label: e.target.value })} style={{ fontSize: 15, borderRadius: 12, border: '3px solid #ffd6e8', padding: '4px 8px', width: 140 }} />}
            <button className="btn small mint" onClick={() => { const { id: _id, ...rest } = sel; const nid = g().addPlaced({ ...rest, pos: [sel.pos[0] + 1, sel.pos[1], sel.pos[2] + 1] }); g().setBuild({ selected: nid }); }}>📋 Copiar</button>
            <button className="btn small pink" onClick={() => g().removePlaced(sel.id)}>🗑️ Apagar</button>
          </>
        )}
        {!sel && placed.length > 0 && <button className="btn small" onClick={() => g().removePlaced(placed[placed.length - 1].id)}>↩️ Desfazer</button>}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        {build.item ? `Toque no chão para colocar ${getModel(build.item).name}. Toque em cima de outro objeto para empilhar!` : 'Toque num objeto para escolher. Arraste o objeto escolhido para mover.'} Arraste o fundo para girar a câmera.
      </div>
    </div>
  );
}
