import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { Panel } from './Panel';
import { exportSave, importSave, wipeSave, saveNow } from '../store/persistence';
import { setVolumes } from '../systems/audio';

function PinGate({ onOk }: { onOk: () => void }) {
  const pin = useGame((s) => s.parental.pin);
  const [v, setV] = useState('');
  const [err, setErr] = useState(false);
  const press = (d: string) => {
    const nv = (v + d).slice(0, 4);
    setV(nv);
    setErr(false);
    if (nv.length === 4) {
      if (nv === pin) onOk();
      else { setErr(true); setTimeout(() => setV(''), 500); }
    }
  };
  return (
    <div className="mg">
      <div className="bubble">🔒 Área dos pais — digite a senha de 4 números</div>
      <div className="pin-dots">{[0, 1, 2, 3].map((i) => <span key={i}>{i < v.length ? '●' : '○'}</span>)}</div>
      {err && <div style={{ color: '#e63946', fontWeight: 800 }}>Senha errada</div>}
      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d) => (
          <button key={d} className="round" style={{ visibility: d ? 'visible' : 'hidden' }} onClick={() => (d === '⌫' ? setV(v.slice(0, -1)) : press(d))}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function Parental() {
  const parental = useGame((s) => s.parental);
  const creative = useGame((s) => s.creative);
  const g = useGame.getState;
  const [newPin, setNewPin] = useState('');
  const [conf, setConf] = useState(false);
  return (
    <div>
      <div className="section">👨‍👩‍👧 Controle dos pais</div>
      <div className="row">
        <span>Senha:</span>
        <input inputMode="numeric" maxLength={4} placeholder="4 números" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} style={{ width: 110, fontSize: 18, padding: 6, borderRadius: 12, border: '3px solid #ffd6e8' }} />
        <button className="btn small mint" disabled={newPin.length !== 4} onClick={() => { g().setParental({ pin: newPin }); setNewPin(''); g().toast('Senha dos pais salva! 🔒', '🔒'); }}>Salvar senha</button>
        {parental.pin && <button className="btn small" onClick={() => g().setParental({ pin: null })}>Remover senha</button>}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <span>⏰ Limite de tempo por dia:</span>
        {[0, 30, 45, 60, 90, 120].map((m) => <button key={m} className={`btn small ${parental.dailyLimit === m ? 'pink' : ''}`} onClick={() => g().setParental({ dailyLimit: m })}>{m === 0 ? 'Sem limite' : `${m} min`}</button>)}
      </div>
      <div className="muted">Hoje já jogou: {Math.floor(parental.playedToday / 60)} min</div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className={`btn small ${creative ? 'mint' : ''}`} onClick={() => g().set({ creative: !creative })}>{creative ? '✅' : '⬜'} Modo criativo (dinheiro infinito)</button>
        <button className={`btn small ${parental.creativeLocked ? 'pink' : ''}`} onClick={() => g().setParental({ creativeLocked: !parental.creativeLocked })}>{parental.creativeLocked ? '🔒' : '🔓'} Só os pais mudam o modo</button>
      </div>
      <div className="section">💾 Progresso</div>
      <div className="row">
        <button className="btn small" onClick={async () => { await saveNow(); g().toast('Jogo salvo neste aparelho! 💾', '💾'); }}>💾 Salvar agora</button>
        <button className="btn small" onClick={() => {
          const blob = new Blob([exportSave()], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'mundo-da-maite-backup.json';
          a.click();
        }}>📤 Baixar cópia de segurança</button>
        <label className="btn small">📥 Restaurar cópia<input type="file" accept="application/json" style={{ display: 'none' }} onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try { importSave(await f.text()); g().toast('Progresso restaurado! 🎉', '📥'); } catch { g().toast('Arquivo inválido', '⚠️'); }
        }} /></label>
        {!conf ? <button className="btn small pink" onClick={() => setConf(true)}>🗑️ Recomeçar do zero</button> : (
          <button className="btn small pink" onClick={async () => { await wipeSave(); g().resetAll(); location.reload(); }}>Tem certeza? Toque de novo</button>
        )}
      </div>
      <p className="muted">🔐 O jogo não tem chat, anúncios, compras com dinheiro real, nem coleta de dados. Tudo fica salvo só neste aparelho e funciona sem internet depois de aberto uma vez.</p>
    </div>
  );
}

export function SettingsPanel() {
  const st = useGame((s) => s.settings);
  const pin = useGame((s) => s.parental.pin);
  const creative = useGame((s) => s.creative);
  const locked = useGame((s) => s.parental.creativeLocked);
  const [ok, setOk] = useState(!pin);
  const g = useGame.getState;
  const set = (p: Partial<typeof st>) => { g().setSettings(p); const n = { ...st, ...p }; setVolumes(n.music, n.sfx); };
  return (
    <Panel title="Configurações" icon="⚙️">
      <div className="section">🔊 Sons</div>
      <div className="row"><span style={{ width: 90 }}>Música</span><input type="range" min={0} max={1} step={0.05} value={st.music} onChange={(e) => set({ music: Number(e.target.value) })} style={{ flex: 1 }} /></div>
      <div className="row"><span style={{ width: 90 }}>Efeitos</span><input type="range" min={0} max={1} step={0.05} value={st.sfx} onChange={(e) => set({ sfx: Number(e.target.value) })} style={{ flex: 1 }} /></div>
      <div className="section">🎮 Jogo</div>
      <div className="row">
        <span>Gráficos:</span>
        {(['baixa', 'media', 'alta'] as const).map((q) => <button key={q} className={`btn small ${st.quality === q ? 'pink' : ''}`} onClick={() => set({ quality: q })}>{q === 'baixa' ? '📱 Leve (celular)' : q === 'media' ? '💻 Médio' : '🖥️ Bonito'}</button>)}
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <span>Visual:</span>
        <button className={`btn small ${st.camMode === 'habbo' ? 'pink' : ''}`} onClick={() => set({ camMode: 'habbo' })}>🧊 Câmera Habbo (de cima)</button>
        <button className={`btn small ${st.camMode === 'livre' ? 'pink' : ''}`} onClick={() => set({ camMode: 'livre' })}>🎥 Câmera 3D livre</button>
        <button className={`btn small ${st.pixel ? 'mint' : ''}`} onClick={() => set({ pixel: !st.pixel })}>{st.pixel ? '✅' : '⬜'} 👾 Estilo pixel</button>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <span>Dia e noite:</span>
        <button className={`btn small ${st.fixedDay ? 'pink' : ''}`} onClick={() => set({ fixedDay: !st.fixedDay })}>{st.fixedDay ? '☀️ Sempre de dia' : '🌙 Dia e noite passam'}</button>
        {[0.5, 1, 2, 4].map((v) => <button key={v} className={`btn small ${st.timeSpeed === v ? 'lilac' : ''}`} onClick={() => set({ timeSpeed: v })}>{v}x</button>)}
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <button className={`btn small ${st.minimap ? 'mint' : ''}`} onClick={() => set({ minimap: !st.minimap })}>{st.minimap ? '✅' : '⬜'} Minimapa</button>
        <span>Câmera:</span><input type="range" min={0.4} max={2} step={0.1} value={st.camSens} onChange={(e) => set({ camSens: Number(e.target.value) })} />
        {!locked && <button className={`btn small ${creative ? 'mint' : ''}`} onClick={() => g().set({ creative: !creative })}>{creative ? '✨ Criativo: dinheiro infinito' : '🪙 Modo moedinhas'}</button>}
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn small" onClick={() => g().openPanel('help')}>❓ Como jogar</button>
        <button className="btn small" onClick={() => { g().set({ screen: 'title', panel: null }); }}>🏠 Tela inicial</button>
        <button className="btn small" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}>⛶ Tela cheia</button>
      </div>
      <div style={{ marginTop: 10, borderTop: '3px dashed #ffd6e8', paddingTop: 6 }}>
        {ok ? <Parental /> : <PinGate onOk={() => setOk(true)} />}
      </div>
    </Panel>
  );
}

export function HelpPanel() {
  return (
    <Panel title="Como jogar" icon="❓">
      <div style={{ fontSize: 17, lineHeight: 1.5 }}>
        <p>👆 <b>Toque no chão</b> para a personagem andar até lá (igual no Habbo!). Toque numa pessoa ou objeto para ir até ele e interagir.</p>
        <p>📱 <b>No celular/tablet:</b> você também pode usar o <b>joystick</b> rosa para andar, <b>arraste a tela</b> para girar a câmera e <b>pince</b> para aproximar. O botão ⬆️ pula, 🏃 corre e ✋ interage.</p>
        <p>💻 <b>No computador:</b> W A S D ou setas para andar, Shift para correr, Espaço para pular, <b>E</b> para interagir, Q para acenar, arraste o mouse para girar e use a rodinha para zoom.</p>
        <p>💬 Chegue perto das pessoas e toque em <b>Conversar</b> para dançar, abraçar, brincar, fazer piquenique e ir ao cinema!</p>
        <p>🏡 Compre casas na caixinha de correio delas ou no menu 🏡. Aumente cômodos, crie andares, piscina e garagem.</p>
        <p>🔨 No modo <b>Construir</b> escolha um objeto e toque no chão. Em <b>Mexer</b>, toque num objeto para girar, aumentar, mudar cor e textura.</p>
        <p>🚗 Compre veículos na loja e chame no menu 🚗. Aviões e helicópteros sobem com ⬆️ e descem com ⬇️.</p>
        <p>💼 Trabalhe nas profissões para ganhar moedinhas e cumpra as ⭐ missões do dia para ganhar adesivos!</p>
        <p>🏝️ Pegue um barco e procure os <b>tesouros</b> nas ilhas secretas, no castelo e na floresta...</p>
      </div>
    </Panel>
  );
}
