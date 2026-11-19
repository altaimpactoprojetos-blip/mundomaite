import { useEffect, useState } from 'react';
import { useGame, type PanelId } from '../store/gameStore';
import { rt, emote, spawnEffect } from '../systems/runtime';
import { ui } from '../game/Player';
import { press, touchBtns } from '../systems/input';
import { Joystick } from './Joystick';
import { Minimap } from './Minimap';
import { money } from './Panel';
import { VEHICLES } from '../data/vehicles';
import { exitVehicle } from '../game/Vehicles';
import { sfx } from '../systems/audio';
import { takePhoto } from './photo';
import { findNearest } from '../systems/interactions';
import { petFx, petCuddle } from '../game/Pets';
import { TourBox } from './TourBox';
import { PETS } from '../data/pets';

export function callPet(id: string) {
  const s = useGame.getState();
  s.set({ activePet: id });
  petFx.callAt = rt.time;
  const p = s.pets.find((x) => x.id === id);
  if (p) s.set({ petMenu: id });
  sfx('sparkle');
}

const MENU: { id: PanelId; icon: string; label: string }[] = [
  { id: 'character', icon: '👗', label: 'Visual' },
  { id: 'house', icon: '🏡', label: 'Casa' },
  { id: 'build', icon: '🔨', label: 'Construir' },
  { id: 'shop', icon: '🛍️', label: 'Loja' },
  { id: 'vehicles', icon: '🚗', label: 'Veículos' },
  { id: 'pets', icon: '🐶', label: 'Pets' },
  { id: 'map', icon: '🗺️', label: 'Mapa' },
  { id: 'bag', icon: '🎒', label: 'Mochila' },
  { id: 'jobs', icon: '💼', label: 'Trabalhos' },
  { id: 'quests', icon: '⭐', label: 'Missões' },
  { id: 'photos', icon: '📸', label: 'Álbum' },
  { id: 'settings', icon: '⚙️', label: 'Ajustes' },
];

function useTick(ms: number) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

function Clock() {
  useTick(1000);
  const h = Math.floor(rt.hour);
  const m = Math.floor((rt.hour % 1) * 60);
  const icon = h >= 6 && h < 18 ? '☀️' : h >= 18 && h < 20 ? '🌇' : '🌙';
  return <div className="chip">{icon} {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</div>;
}
function Zone() {
  useTick(1000);
  return ui.zone ? <div className="chip zone">📍 {ui.zone}</div> : null;
}

function Prompt() {
  useTick(150);
  const p = ui.prompt;
  if (!p || rt.vehicle.id) return null;
  const touch = matchMedia('(pointer: coarse)').matches;
  return (
    <button className="prompt" onClick={() => press('e')}>
      <span style={{ fontSize: 24 }}>{p.icon}</span> {p.label} {!touch && <kbd>E</kbd>}
    </button>
  );
}

function TaskBox() {
  const task = useGame((s) => s.task);
  if (!task) return null;
  const left = task.targets.filter((t) => !t.done).length;
  const tourOn = useGame.getState().tour && !useGame.getState().tour?.done;
  if (tourOn && task.kind === 'cafe') return null;
  return (
    <div className="task-box" style={tourOn ? { top: 'calc(190px + var(--safe-t))' } : undefined}>
      🎯 {task.title}: <b>{task.targets.length - left}/{task.targets.length}</b>
      <div className="row" style={{ marginTop: 4 }}>{task.targets.map((t) => <span key={t.id} style={{ opacity: t.done ? 0.3 : 1 }}>{t.done ? '✅' : t.icon}</span>)}
        <button className="btn small" onClick={() => useGame.getState().setTask(null)}>Parar</button>
      </div>
    </div>
  );
}

function Actions() {
  useTick(250);
  const [wheel, setWheel] = useState(false);
  const [run, setRun] = useState(false);
  const vehicles = useGame((s) => s.vehicles);
  const pets = useGame((s) => s.pets);
  const activePet = useGame((s) => s.activePet);
  const inV = rt.vehicle.id;
  const v = vehicles.find((x) => x.id === inV);
  const def = v ? VEHICLES[v.vtype] : null;
  const hold = (k: keyof typeof touchBtns) => ({
    onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); touchBtns[k] = true; },
    onPointerUp: () => { touchBtns[k] = false; },
    onPointerLeave: () => { touchBtns[k] = false; },
    onPointerCancel: () => { touchBtns[k] = false; },
  });
  if (inV && def) {
    return (
      <div className="actions">
        {def.medium === 'air' ? <button className="round" {...hold('up')}>⬆️<small>Subir</small></button> : <button className="round" onClick={() => sfx('honk')}>📯<small>Buzina</small></button>}
        {def.medium === 'air' ? <button className="round" {...hold('down')}>⬇️<small>Descer</small></button> : <button className="round" onClick={() => takePhoto()}>📸<small>Foto</small></button>}
        <button className="round main" onClick={() => exitVehicle()}>🚪<small>Sair</small></button>
      </div>
    );
  }
  const pet = pets.find((p) => p.id === activePet);
  const doEmote = (a: Parameters<typeof emote>[0], fx?: Parameters<typeof spawnEffect>[0], ev?: string) => {
    emote(a, 3);
    if (fx) spawnEffect(fx, rt.player.pos);
    if (ev) useGame.getState().track(ev);
    setWheel(false);
    sfx('pop');
  };
  return (
    <>
      {wheel && (
        <div className="emote-wheel">
          <button className="round" onClick={() => doEmote('dance', 'notes', 'dance')}>💃<small>Dançar</small></button>
          <button className="round" onClick={() => doEmote('wave')}>👋<small>Oi!</small></button>
          <button className="round" onClick={() => doEmote('cheer', 'confetti')}>🎉<small>Festa</small></button>
          <button className="round" onClick={() => doEmote('hug', 'hearts')}>🤗<small>Abraço</small></button>
          <button className="round" onClick={() => doEmote('sing', 'notes')}>🎤<small>Cantar</small></button>
          <button className="round" onClick={() => { setWheel(false); takePhoto(); }}>📸<small>Foto</small></button>
          {pet && (
            <button className="round" onClick={() => {
              const s = useGame.getState();
              const def2 = pet.species;
              if (['cavalo', 'unicornio'].includes(def2)) {
                rt.player.mounted = rt.player.mounted ? null : pet.id;
                s.toast(rt.player.mounted ? `Você montou em ${pet.name}! 🐴` : 'Desceu do pet', '🐴');
                if (rt.player.mounted) s.track('ride');
              } else { petCuddle(); s.petCare(pet.id, 'pet'); s.toast(`${pet.name} adorou o carinho!`, '🐾'); }
              setWheel(false);
            }}>{['cavalo', 'unicornio'].includes(pet.species) ? '🐴' : '🎾'}<small>{['cavalo', 'unicornio'].includes(pet.species) ? 'Montar' : 'Pet'}</small></button>
          )}
          {rt.player.seat && <button className="round" onClick={() => { rt.player.seat = null; setWheel(false); }}>🧍<small>Levantar</small></button>}
        </div>
      )}
      <div className="actions">
        <button className="round" onClick={() => setWheel(!wheel)}>😊<small>Ações</small></button>
        {pet && <button className="round" onClick={() => callPet(pet.id)}>{PETS[pet.species].icon}<small>Chamar</small></button>}
        <button className="round" style={run ? { background: '#ffd6e8' } : undefined} onClick={() => { touchBtns.run = !run; setRun(!run); }}>🏃<small>Correr</small></button>
        <button className="round main" {...hold('jump')} onClick={() => press(' ')}>⬆️</button>
        {ui.prompt && <button className="round main" style={{ gridColumn: '3', background: 'linear-gradient(180deg,#ffb3d9,#ff5fa2)' }} onClick={() => { const it = findNearest(rt.player.pos, rt.player.yaw); it?.action(); }}>✋</button>}
      </div>
    </>
  );
}

export function HUD() {
  const name = useGame((s) => s.appearance.name);
  const m = useGame((s) => s.money);
  const creative = useGame((s) => s.creative);
  const buildMode = useGame((s) => s.buildMode);
  const showMap = useGame((s) => s.settings.minimap);
  const openPanel = useGame((s) => s.openPanel);
  const quests = useGame((s) => s.quests.list);
  const questReady = quests.some((q) => q.progress >= q.target && !q.claimed);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="hud-top">
        <div className="chip">🌸 {name}</div>
        <div className="chip">🪙 {money(m, creative)}</div>
        <Clock />
        <Zone />
      </div>
      <div className="menu-quick">
        <button className="round" onClick={() => openPanel('map')}>🗺️<small>Mapa</small></button>
        <button className="round" onClick={() => openPanel('bag')}>🎒<small>Mochila</small></button>
        <button className="round" style={menuOpen || questReady ? { background: '#ffd6e8' } : undefined} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '✖' : '☰'}<small>Menu</small></button>
      </div>
      {menuOpen && (
        <div className="menu-bar" onClick={() => setMenuOpen(false)}>
          {MENU.filter((b) => b.id !== 'map' && b.id !== 'bag').map((b) => (
            <button key={b.id} className="round" onClick={() => openPanel(b.id === 'build' && buildMode ? null : b.id)}
              style={(b.id === 'build' && buildMode) || (b.id === 'quests' && questReady) ? { background: '#ffd6e8' } : undefined}>
              {b.icon}<small>{b.label}</small>
            </button>
          ))}
        </div>
      )}
      {showMap && !buildMode && <Minimap />}
      <TourBox />
      <TaskBox />
      <Joystick mini={buildMode} />
      {!buildMode && <Actions />}
      {!buildMode && <Prompt />}
    </>
  );
}
