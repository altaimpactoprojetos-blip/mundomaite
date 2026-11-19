import { useGame } from '../store/gameStore';
import { Panel, Swatches } from './Panel';
import { VEHICLES } from '../data/vehicles';
import { CLOTH_COLORS } from '../data/palette';
import { summonVehicle, enterVehicle } from '../game/Vehicles';
import { rt } from '../systems/runtime';

export function VehiclesPanel() {
  const vehicles = useGame((s) => s.vehicles);
  const upd = useGame((s) => s.updateVehicle);
  return (
    <Panel title="Minha Garagem" icon="🚗">
      {vehicles.length === 0 && (
        <div className="mg">
          <div className="big-emoji">🚗🏍️⛵✈️</div>
          <div className="bubble">Sua garagem está vazia! Compre carros, motos, bicicletas, barcos e aviões na loja.</div>
          <button className="btn big pink" onClick={() => useGame.getState().openPanel('shop', 'carros')}>🛍️ Ir à loja de veículos</button>
        </div>
      )}
      {vehicles.map((v) => {
        const def = VEHICLES[v.vtype];
        return (
          <div key={v.id} className="card" style={{ alignItems: 'stretch', textAlign: 'left', marginBottom: 10 }}>
            <div className="row">
              <span style={{ fontSize: 40 }}>{def.icon}</span>
              <input value={v.name} maxLength={18} onChange={(e) => upd(v.id, { name: e.target.value })} style={{ fontSize: 17, fontWeight: 800, border: '3px solid #ffd6e8', borderRadius: 12, padding: '4px 8px', flex: 1, minWidth: 100 }} />
              <button className="btn mint" onClick={() => summonVehicle(v)}>✨ Chamar aqui</button>
              {<button className="btn blue" onClick={() => { summonVehicle(v); const nv = useGame.getState().vehicles.find((x) => x.id === v.id); if (nv) enterVehicle(nv); }}>🚀 Dirigir já</button>}
            </div>
            <div className="muted">{def.medium === 'water' ? '🌊 Anda na água' : def.medium === 'air' ? '☁️ Voa! Use ⬆️/⬇️ (Espaço / C) para subir e descer' : '🛣️ Anda nas ruas'} {rt.vehicle.id === v.id ? '· 🟢 Dirigindo' : v.parked ? '· 🅿️ Estacionado' : '· Na garagem'}</div>
            <div className="section" style={{ margin: '4px 0' }}>Cor principal</div>
            <Swatches colors={CLOTH_COLORS} value={v.color} onChange={(c) => upd(v.id, { color: c })} />
            <div className="section" style={{ margin: '4px 0' }}>Cor dos detalhes</div>
            <Swatches colors={CLOTH_COLORS} value={v.color2} onChange={(c) => upd(v.id, { color2: c })} />
          </div>
        );
      })}
      <p className="muted">🎮 Controles: ⬆️⬇️⬅️➡️ (ou joystick) para dirigir · E / 🚪 para sair · H para buzinar. Para estacionar, é só sair do veículo onde quiser!</p>
    </Panel>
  );
}
