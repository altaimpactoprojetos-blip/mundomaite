import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { Panel, Swatches } from './Panel';
import { PROPERTIES } from '../data/world';
import { BUILD_COLORS } from '../data/palette';
import type { HouseConfig, HouseStyle } from '../types';
import { teleportPlayer, spawnEffect, rt } from '../systems/runtime';
import { toWorld } from '../game/hooks';
import { sfx } from '../systems/audio';

const STYLES: [HouseStyle, string, string][] = [['casa', 'Casinha', '🏠'], ['chale', 'Chalé', '🛖'], ['moderna', 'Moderna', '🏢'], ['praia', 'De praia', '🏖️'], ['castelinho', 'Castelinho', '🏰'], ['mansao', 'Mansão', '🏛️']];

export function goToProperty(id: string) {
  const p = PROPERTIES.find((x) => x.id === id);
  if (!p) return;
  const [x, z] = toWorld(p.pos[0], p.pos[1], p.rot, 0, p.lot[1] / 2 + 1);
  teleportPlayer(x, 0, z);
  rt.player.yaw = p.rot + Math.PI;
  rt.cam.yaw = p.rot;
  spawnEffect('sparkles', rt.player.pos);
  sfx('whoosh');
  useGame.getState().openPanel(null);
}

function Manage({ id }: { id: string }) {
  const def = PROPERTIES.find((p) => p.id === id)!;
  const st = useGame((s) => s.properties[id]);
  const update = useGame((s) => s.updateHouse);
  const homeId = useGame((s) => s.homeId);
  const h = st?.house;
  const up = (p: Partial<HouseConfig>) => { update(id, p); sfx('pop'); };
  if (!h) {
    return (
      <div>
        <p style={{ fontSize: 17 }}>Este terreno é seu! Você pode <b>construir do zero</b> com peças (🔨 Construir) ou criar uma casa pronta para depois decorar:</p>
        <div className="grid">
          {STYLES.map(([s, n, i]) => (
            <button key={s} className="card" onClick={() => up({ style: s, name: `Minha ${n}`, rooms: s === 'mansao' ? 4 : 2, floors: s === 'mansao' ? 2 : 1, furnished: true })}>
              <div className="ic">{i}</div><div className="nm">{n}</div>
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn pink" onClick={() => { goToProperty(id); useGame.getState().openPanel('build'); }}>🔨 Construir do zero aqui</button>
          <button className="btn" onClick={() => goToProperty(id)}>🚶 Ir até o terreno</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="row">
        <input value={h.name} maxLength={24} onChange={(e) => update(id, { name: e.target.value })} style={{ fontSize: 18, padding: '6px 12px', borderRadius: 14, border: '3px solid #ffd6e8', flex: 1 }} />
        <button className="btn blue" onClick={() => goToProperty(id)}>🚶 Ir para casa</button>
        {homeId !== id && <button className="btn" onClick={() => useGame.getState().setHome(id)}>⭐ Casa principal</button>}
      </div>
      <div className="section">Estilo</div>
      <div className="row">{STYLES.map(([s, n, i]) => <button key={s} className={`btn small ${h.style === s ? 'pink' : ''}`} onClick={() => up({ style: s })}>{i} {n}</button>)}</div>
      <div className="section">Tamanho</div>
      <div className="row">
        <span>🚪 Cômodos por andar: <b>{h.rooms}</b></span>
        <button className="btn small" onClick={() => up({ rooms: Math.max(1, h.rooms - 1) })}>➖</button>
        <button className="btn small mint" onClick={() => up({ rooms: Math.min(8, h.rooms + 1) })}>➕ Aumentar</button>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <span>🏢 Andares: <b>{h.floors}</b></span>
        <button className="btn small" onClick={() => up({ floors: Math.max(1, h.floors - 1) })}>➖</button>
        <button className="btn small mint" onClick={() => up({ floors: Math.min(5, h.floors + 1) })}>➕ Novo andar</button>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <span>↕️ Profundidade: <b>{h.depth}m</b></span>
        <button className="btn small" onClick={() => up({ depth: Math.max(8, h.depth - 2) })}>➖</button>
        <button className="btn small mint" onClick={() => up({ depth: Math.min(18, h.depth + 2) })}>➕</button>
      </div>
      <div className="section">Extras</div>
      <div className="row">
        {([['pool', '🏊 Piscina'], ['garden', '🌷 Jardim'], ['garage', '🚗 Garagem'], ['furnished', '🛋️ Móveis prontos']] as const).map(([k, n]) => (
          <button key={k} className={`btn small ${h[k] ? 'mint' : ''}`} onClick={() => up({ [k]: !h[k] })}>{h[k] ? '✅' : '⬜'} {n}</button>
        ))}
      </div>
      <div className="section">Cor das paredes</div>
      <Swatches colors={BUILD_COLORS} value={h.wallColor} onChange={(c) => up({ wallColor: c })} />
      <div className="section">Cor do telhado</div>
      <Swatches colors={BUILD_COLORS} value={h.roofColor} onChange={(c) => up({ roofColor: c })} />
      <div className="section">Cor do chão</div>
      <Swatches colors={BUILD_COLORS} value={h.floorColor} onChange={(c) => up({ floorColor: c })} />
      <p className="muted">💡 Para decorar por dentro, entre na casa e use 🔨 Construir: coloque móveis, mude cores e texturas!</p>
    </div>
  );
}

export function HousePanel() {
  const arg = useGame((s) => s.panelArg);
  const props = useGame((s) => s.properties);
  const [sel, setSel] = useState<string | null>(arg);
  const ownedList = PROPERTIES.filter((p) => props[p.id]?.owned);
  const forSale = PROPERTIES.filter((p) => !props[p.id]?.owned);
  const creative = useGame((s) => s.creative);
  const selDef = sel ? PROPERTIES.find((p) => p.id === sel) : null;
  if (selDef) {
    const owned = props[selDef.id]?.owned;
    return (
      <Panel title={owned ? props[selDef.id]?.house?.name ?? 'Meu terreno' : selDef.name} icon={owned ? '🏡' : '🔑'} onClose={() => (arg ? useGame.getState().openPanel(null) : setSel(null))}>
        {!arg && <button className="btn small" onClick={() => setSel(null)} style={{ marginBottom: 8 }}>⬅ Voltar</button>}
        {owned ? <Manage id={selDef.id} /> : (
          <div className="mg">
            <div className="big-emoji">{selDef.preset ? '🏡' : '🌱'}</div>
            <div className="bubble">{selDef.preset ? `${selDef.name} — ${selDef.preset.rooms} cômodos, ${selDef.preset.floors} andar(es)${selDef.preset.pool ? ', piscina' : ''}${selDef.preset.garage ? ', garagem' : ''}` : 'Terreno vazio para construir do seu jeito!'}</div>
            <div className="muted">📍 {selDef.area}</div>
            <div className="row">
              <button className="btn big pink" onClick={() => useGame.getState().buyProperty(selDef.id)}>🔑 Comprar {creative ? '(grátis)' : `por 🪙 ${selDef.price}`}</button>
              <button className="btn" onClick={() => goToProperty(selDef.id)}>👀 Visitar</button>
            </div>
          </div>
        )}
      </Panel>
    );
  }
  return (
    <Panel title="Minhas Casas" icon="🏡">
      <div className="section">Minhas propriedades ({ownedList.length})</div>
      {ownedList.length === 0 && <p className="muted">Você ainda não tem casa. Escolha uma abaixo! Pode ter quantas quiser 💖</p>}
      <div className="grid">
        {ownedList.map((p) => (
          <button key={p.id} className="card on" onClick={() => setSel(p.id)}>
            <div className="ic">{props[p.id]?.house ? '🏡' : '🌱'}</div>
            <div className="nm">{props[p.id]?.house?.name ?? 'Meu terreno'}</div>
            <div className="muted" style={{ fontSize: 11 }}>{p.area}</div>
          </button>
        ))}
      </div>
      <div className="section">À venda ({forSale.length})</div>
      <div className="grid">
        {forSale.map((p) => (
          <button key={p.id} className="card" onClick={() => setSel(p.id)}>
            <div className="ic">{p.preset ? (p.preset.style === 'mansao' ? '🏛️' : p.preset.style === 'castelinho' ? '🏰' : p.preset.style === 'praia' ? '🏖️' : '🏠') : '🌱'}</div>
            <div className="nm">{p.name}</div>
            <div className="pr">{creative ? 'Grátis' : `🪙 ${p.price}`}</div>
          </button>
        ))}
      </div>
    </Panel>
  );
}
