import { useState } from 'react';
import { useGame } from '../../store/gameStore';
import { PROF_MAP } from '../../data/professions';
import { Panel } from '../Panel';
import { OrderGame, ORDER_CFG } from './OrderGame';
import { QuizGame } from './QuizGame';
import { RhythmGame } from './RhythmGame';
import { PaintGame } from './PaintGame';
import { MallGame } from './MallGame';
import { makeTask } from '../../game/Tasks';
import { sfx } from '../../systems/audio';
import { spawnEffect, rt } from '../../systems/runtime';

export function Minigame() {
  const job = useGame((s) => s.minigame);
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [stars, setStars] = useState(0);
  if (!job) return null;
  const p = PROF_MAP[job];
  if (!p) return null;
  const g = useGame.getState;
  const close = () => { g().set({ minigame: null }); setPhase('intro'); };
  const finish = (s: number) => {
    setStars(s);
    setPhase('done');
    const reward = 20 + s * 20;
    g().earn(reward, p.name);
    g().track('job');
    sfx('fanfare');
    spawnEffect('confetti', rt.player.pos);
  };
  const start = () => {
    if (p.game === 'task') {
      const kind = job === 'bombeira' ? 'fires' : job === 'policial' ? 'lost' : 'farm';
      g().setTask(makeTask(kind));
      g().toast(kind === 'fires' ? 'Siga as setas ⬇️ e o minimapa para achar o fogo! 🚒' : kind === 'lost' ? 'Procure os objetos perdidos pela cidade! 🔍' : 'Leve comida para os cochos dos animais! 🌾', p.icon);
      close();
      return;
    }
    setPhase('play');
  };
  const wear = () => {
    if (!p.outfit) return;
    const a = g().appearance;
    g().setAppearance({
      top: p.outfit.top ?? a.top,
      topColor: p.outfit.topColor ?? a.topColor,
      accessories: p.outfit.acc ? [...a.accessories.filter((x) => !['chapeu-chef', 'capacete', 'quepe', 'estetoscopio'].includes(x)), p.outfit.acc] : a.accessories,
    });
    sfx('sparkle');
    spawnEffect('sparkles', rt.player.pos);
  };
  return (
    <Panel title={p.name} icon={p.icon} onClose={close} wide={p.game === 'paint'}>
      {phase === 'intro' && (
        <div className="mg">
          <div className="big-emoji" style={{ animation: 'float 2s infinite' }}>{p.icon}</div>
          <div className="bubble">{p.desc}</div>
          <div className="muted">📍 {p.place}</div>
          <div className="row">
            {p.outfit && <button className="btn lilac" onClick={wear}>👔 Vestir uniforme</button>}
            <button className="btn big pink" onClick={start}>▶ Começar!</button>
          </div>
        </div>
      )}
      {phase === 'play' && p.game === 'order' && ORDER_CFG[job] && <OrderGame job={job} onDone={finish} />}
      {phase === 'play' && p.game === 'quiz' && <QuizGame onDone={finish} />}
      {phase === 'play' && p.game === 'rhythm' && <RhythmGame onDone={finish} />}
      {phase === 'play' && p.game === 'paint' && <PaintGame onDone={finish} />}
      {phase === 'play' && p.game === 'mall' && <MallGame onDone={finish} />}
      {phase === 'done' && (
        <div className="mg">
          <div className="big-emoji">🏆</div>
          <div style={{ fontSize: 40 }}>{'⭐'.repeat(Math.max(1, Math.round(stars)))}</div>
          <div className="bubble">Trabalho incrível! Você ganhou {20 + stars * 20} moedinhas! 🪙</div>
          <div className="row">
            <button className="btn pink" onClick={() => setPhase('play')}>🔁 De novo</button>
            <button className="btn" onClick={close}>✅ Terminar</button>
          </div>
        </div>
      )}
    </Panel>
  );
}
