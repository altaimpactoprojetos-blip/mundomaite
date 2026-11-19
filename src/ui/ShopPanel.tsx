import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { Panel, money } from './Panel';
import { CATALOG, CATEGORIES } from '../data/catalog';
import type { ItemCategory, ShopItem } from '../types';

export function ShopPanel() {
  const arg = useGame((s) => s.panelArg) as ItemCategory | null;
  const [cat, setCat] = useState<ItemCategory>(arg && CATEGORIES.some((c) => c.id === arg) ? arg : 'roupas');
  const [q, setQ] = useState('');
  const creative = useGame((s) => s.creative);
  const m = useGame((s) => s.money);
  const wardrobe = useGame((s) => s.wardrobe);
  const inventory = useGame((s) => s.inventory);
  const toys = useGame((s) => s.toys);
  const items = CATALOG.filter((i) => !i.hidden && (q ? i.name.toLowerCase().includes(q.toLowerCase()) : i.cat === cat));
  const owned = (i: ShopItem) => (i.data.kind === 'wear' ? wardrobe.includes(i.id) : i.data.kind === 'toy' ? toys.includes(i.id) : i.data.kind === 'build' ? (inventory[i.data.model] ?? 0) : 0);
  return (
    <Panel title="Loja Infinita" icon="🛍️" wide>
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="chip">🪙 {money(m, creative)}</div>
        {creative && <div className="chip" style={{ background: '#e8fff4' }}>✨ Modo criativo: tudo de graça!</div>}
        <input placeholder="🔍 Procurar..." value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 120, fontSize: 16, padding: '6px 12px', borderRadius: 14, border: '3px solid #ffd6e8' }} />
      </div>
      {!q && (
        <div className="tabs">
          {CATEGORIES.map((c) => <button key={c.id} className={`tab ${c.id === cat ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.icon} {c.name}</button>)}
        </div>
      )}
      <div className="grid">
        {items.map((i) => {
          const o = owned(i);
          return (
            <button key={i.id} className="card" onClick={() => useGame.getState().buy(i)}>
              {o ? <div className="badge">{typeof o === 'number' ? `x${o}` : '✔'}</div> : null}
              <div className="ic">{i.icon}</div>
              <div className="nm">{i.name}</div>
              <div className="pr">{creative ? 'Grátis' : `🪙 ${i.price}`}</div>
            </button>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>💡 Roupas vão para o guarda-roupa (👗 Visual). Móveis vão para a Construção (🔨). Veículos vão para a garagem (🚗). Pets aparecem do seu ladinho (🐶).</p>
    </Panel>
  );
}
