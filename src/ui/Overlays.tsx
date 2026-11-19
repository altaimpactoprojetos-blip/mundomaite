import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { rt } from '../systems/runtime';
import { sfx } from '../systems/audio';
import { Prepare, BoardDraw } from './Prepare';

const MOVIES = [
  { title: 'As Aventuras do Coelho Espacial', scenes: [['🐰', '🚀', 'Era uma vez um coelhinho que sonhava com as estrelas...'], ['🚀', '🌙', 'Ele construiu um foguete de cenoura!'], ['🌙', '👽', 'Na Lua, encontrou um amigo verdinho!'], ['👽', '🎉', 'Eles fizeram uma festa espacial!'], ['🪐', '🐰', 'E voltaram para casa antes do jantar.'], ['💖', '✨', 'FIM — Amigos são o melhor tesouro!']] },
  { title: 'A Sereia e o Arco-Íris', scenes: [['🧜‍♀️', '🌊', 'No fundo do mar vivia uma sereia curiosa.'], ['🌈', '🧜‍♀️', 'Um dia ela viu um arco-íris no céu!'], ['🐬', '🐢', 'Os golfinhos e a tartaruga ajudaram a chegar lá.'], ['☁️', '🧜‍♀️', 'Ela pulou tão alto que tocou as nuvens!'], ['🌈', '💖', 'FIM — Quem sonha alto chega longe!']] },
  { title: 'O Dragãozinho Confeiteiro', scenes: [['🐲', '🎂', 'Faísca era um dragão que amava bolos.'], ['🔥', '🧁', 'Seu fogo assava cupcakes perfeitos!'], ['🏰', '👑', 'O rei pediu um bolo gigante para a festa.'], ['🎂', '🎉', 'Todo o reino comemorou junto!'], ['🐲', '💖', 'FIM — Cada um tem um talento especial!']] },
];

function Cinema({ withName }: { withName?: string }) {
  const [movie] = useState(() => MOVIES[Math.floor(Math.random() * MOVIES.length)]);
  const [i, setI] = useState(0);
  const close = () => { useGame.getState().set({ overlay: null }); rt.player.seat = null; };
  useEffect(() => {
    if (i >= movie.scenes.length - 1) return;
    const t = setTimeout(() => { setI(i + 1); sfx('sparkle'); }, 3600);
    return () => clearTimeout(t);
  }, [i, movie]);
  const sc = movie.scenes[i];
  return (
    <div className="overlay dark">
      <div style={{ fontSize: 22, fontWeight: 800 }}>🎬 {movie.title} {withName ? `· com ${withName} 🍿` : ''}</div>
      <div className="screen-movie">
        <div key={i} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, fontSize: 'min(90px, 16vw)', animation: 'rise 0.6s' }}>
          <span style={{ animation: 'float 2s infinite' }}>{sc[0]}</span><span style={{ animation: 'float 2.4s infinite' }}>{sc[1]}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, fontSize: 'min(22px, 4.5vw)', fontWeight: 800, background: 'rgba(0,0,0,.45)', borderRadius: 12, padding: 6 }}>{sc[2]}</div>
      </div>
      <div className="row">
        <button className="btn" onClick={() => useGame.getState().hold('pipoca')}>🍿 Pipoca</button>
        <button className="btn pink" onClick={close}>{i >= movie.scenes.length - 1 ? '👏 Sair do cinema' : '🚪 Sair'}</button>
      </div>
    </div>
  );
}

const CHANNELS = [
  ['📺 Desenhos', ['🐱', '🐭', '🧀']], ['🍳 Culinária', ['👩‍🍳', '🥞', '🍓']], ['🐾 Bichos', ['🦁', '🐘', '🦒']], ['🎵 Músicas', ['🎤', '🎸', '🥁']], ['🌌 Espaço', ['🪐', '🌠', '👩‍🚀']],
] as const;
function TV() {
  const [c, setC] = useState(0);
  const ch = CHANNELS[c];
  return (
    <div className="overlay dark">
      <div className="screen-movie" style={{ background: 'linear-gradient(135deg,#5a2a7a,#2f6fdf)' }}>
        <div key={c} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, fontSize: 'min(80px, 14vw)' }}>
          {ch[1].map((e, i) => <span key={i} style={{ animation: `float ${1.5 + i * 0.4}s infinite` }}>{e}</span>)}
        </div>
        <div style={{ position: 'absolute', top: 8, left: 12, fontWeight: 800, fontSize: 20 }}>{ch[0]}</div>
      </div>
      <div className="row">
        <button className="btn" onClick={() => { setC((c + 1) % CHANNELS.length); sfx('click'); }}>📡 Trocar canal</button>
        <button className="btn pink" onClick={() => useGame.getState().set({ overlay: null })}>⏻ Desligar</button>
      </div>
    </div>
  );
}

function Sleep() {
  useEffect(() => {
    const t = setTimeout(() => {
      rt.hour = 7;
      rt.player.seat = null;
      const s = useGame.getState();
      s.set({ overlay: null });
      s.toast('Bom dia, dorminhoca! ☀️ Um novo dia começou!', '☀️');
      s.pets.forEach((p) => s.updatePet(p.id, { fun: Math.min(100, p.fun + 20) }));
      sfx('fanfare');
    }, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="overlay dark" style={{ animation: 'rise 1s' }}>
      <div style={{ fontSize: 90, animation: 'float 2s infinite' }}>🌙</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>Zzz... bons sonhos! 💤</div>
      <div style={{ fontSize: 40 }}>⭐ ✨ ⭐</div>
    </div>
  );
}

const NOTES: [string, number, string][] = [['Dó', 1, '#ff5f5f'], ['Ré', 1.122, '#ffa94d'], ['Mi', 1.26, '#ffe066'], ['Fá', 1.335, '#69db7c'], ['Sol', 1.498, '#4dabf7'], ['Lá', 1.682, '#9775fa'], ['Si', 1.888, '#ff8fc7'], ['Dó²', 2, '#ff5f5f']];
function Piano() {
  return (
    <div className="overlay dark">
      <div style={{ fontSize: 26, fontWeight: 800 }}>🎹 Toque uma música!</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {NOTES.map(([n, p, c]) => (
          <button key={n} onPointerDown={() => sfx('note', p * 0.6)} style={{ width: 'min(64px, 10vw)', height: 'min(220px, 45vh)', borderRadius: '0 0 16px 16px', background: '#fff', borderBottom: `14px solid ${c}`, fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>{n}</button>
        ))}
      </div>
      <div className="muted" style={{ color: '#fff' }}>Experimente: Dó Ré Mi Fá Fá Fá 🎵</div>
      <button className="btn pink" onClick={() => useGame.getState().set({ overlay: null })}>✖ Fechar</button>
    </div>
  );
}

function Rest() {
  const [pin, setPin] = useState('');
  const parental = useGame((s) => s.parental);
  return (
    <div className="overlay" style={{ background: 'linear-gradient(180deg,#ffd6e8,#e0f1ff)' }}>
      <div style={{ fontSize: 90 }}>🌈😴</div>
      <div style={{ fontSize: 30, fontWeight: 800 }}>Hora de descansar!</div>
      <div style={{ fontSize: 18 }}>Você brincou muito hoje! Seu mundo fica guardadinho esperando você voltar amanhã 💖</div>
      {parental.pin && (
        <div className="row">
          <input inputMode="numeric" maxLength={4} placeholder="Senha dos pais" value={pin} onChange={(e) => setPin(e.target.value)} style={{ fontSize: 18, padding: 8, borderRadius: 12, border: '3px solid #ffd6e8', width: 160 }} />
          <button className="btn" onClick={() => { if (pin === parental.pin) useGame.getState().set({ overlay: null, parental: { ...parental, playedToday: 0 } }); }}>Liberar mais tempo</button>
        </div>
      )}
    </div>
  );
}

function Gift() {
  const data = useGame((s) => s.overlay?.data) ?? '';
  const [open, setOpen] = useState(false);
  return (
    <div className="overlay" style={{ background: 'rgba(255,214,232,0.85)' }}>
      <div style={{ fontSize: 26, fontWeight: 800 }}>🎁 Presente do dia!</div>
      <button style={{ fontSize: 120, background: 'none', animation: open ? 'rise .4s' : 'float 1.2s infinite' }} onClick={() => { setOpen(true); sfx('fanfare'); }}>{open ? '🎉' : '🎁'}</button>
      {open ? <div className="bubble" style={{ fontSize: 20, background: '#fff', borderRadius: 20, padding: 12 }}>{data}</div> : <div style={{ fontWeight: 700 }}>Toque no presente para abrir!</div>}
      {open && <button className="btn big pink" onClick={() => useGame.getState().set({ overlay: null })}>Obaaa! 💖</button>}
    </div>
  );
}

export function Overlays() {
  const o = useGame((s) => s.overlay);
  if (!o) return null;
  switch (o.kind) {
    case 'cinema': return <Cinema withName={o.data} />;
    case 'tv': return <TV />;
    case 'sleep': return <Sleep />;
    case 'piano': return <Piano />;
    case 'rest': return <Rest />;
    case 'gift': return <Gift />;
    case 'prepare': return <Prepare />;
    case 'board': return <BoardDraw />;
  }
  return null;
}
