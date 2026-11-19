import { useEffect, useState } from 'react';
import { useGame } from './store/gameStore';
import { loadGame, startAutosave } from './store/persistence';
import { initInput } from './systems/input';
import { setVolumes, unlockAudio } from './systems/audio';
import { Scene } from './game/Scene';
import { TitleScreen } from './ui/TitleScreen';
import { HUD } from './ui/HUD';
import { CharacterEditor } from './ui/CharacterEditor';
import { ShopPanel } from './ui/ShopPanel';
import { HousePanel } from './ui/HousePanel';
import { BuildPanel } from './ui/BuildPanel';
import { VehiclesPanel } from './ui/VehiclesPanel';
import { PetsPanel } from './ui/PetsPanel';
import { MapPanel } from './ui/MapPanel';
import { SettingsPanel, HelpPanel } from './ui/SettingsPanel';
import { BagPanel, JobsPanel, PhotosPanel, QuestsPanel } from './ui/MiscPanels';
import { Dialogue } from './ui/Dialogue';
import { Overlays } from './ui/Overlays';
import { Minigame } from './ui/minigames/Minigame';
import { PetMenu } from './ui/PetMenu';
import { todayKey } from './data/quests';

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return <div className="toasts">{toasts.map((t) => <div key={t.id} className="toast">{t.icon} {t.text}</div>)}</div>;
}

function Flash() {
  const f = useGame((s) => s.photoFlash);
  const [show, setShow] = useState(0);
  useEffect(() => { if (f) { setShow(f); const t = setTimeout(() => setShow(0), 500); return () => clearTimeout(t); } }, [f]);
  return show ? <div className="flash" key={show} /> : null;
}

function Panels() {
  const panel = useGame((s) => s.panel);
  switch (panel) {
    case 'character': return <CharacterEditor />;
    case 'shop': return <ShopPanel />;
    case 'house': return <HousePanel />;
    case 'build': return <BuildPanel />;
    case 'vehicles': return <VehiclesPanel />;
    case 'pets': return <PetsPanel />;
    case 'map': return <MapPanel />;
    case 'settings': return <SettingsPanel />;
    case 'help': return <HelpPanel />;
    case 'bag': return <BagPanel />;
    case 'jobs': return <JobsPanel />;
    case 'photos': return <PhotosPanel />;
    case 'quests': return <QuestsPanel />;
  }
  return null;
}

/** Contagem de tempo de jogo (controle dos pais) e necessidades dos pets */
function useTimers() {
  useEffect(() => {
    const t = setInterval(() => {
      const s = useGame.getState();
      if (s.screen !== 'game' || document.visibilityState !== 'visible') return;
      const p = s.parental;
      const today = todayKey();
      const played = (p.playedDate === today ? p.playedToday : 0) + 10;
      s.setParental({ playedToday: played, playedDate: today });
      if (p.dailyLimit > 0 && played >= p.dailyLimit * 60 && s.overlay?.kind !== 'rest') s.set({ overlay: { kind: 'rest' }, panel: null });
    }, 10000);
    const pets = setInterval(() => {
      const s = useGame.getState();
      if (s.screen !== 'game') return;
      s.pets.forEach((p) => s.updatePet(p.id, { hunger: Math.max(0, p.hunger - 2), fun: Math.max(0, p.fun - 2), clean: Math.max(0, p.clean - 1) }));
    }, 60000);
    return () => { clearInterval(t); clearInterval(pets); };
  }, []);
}

export default function App() {
  const loaded = useGame((s) => s.loaded);
  const screen = useGame((s) => s.screen);
  const job = useGame((s) => s.minigame);
  const [portrait, setPortrait] = useState(false);
  useTimers();
  useEffect(() => {
    initInput();
    loadGame().then(() => {
      const st = useGame.getState().settings;
      setVolumes(st.music, st.sfx);
      startAutosave();
    });
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    const check = () => setPortrait(window.innerHeight > window.innerWidth * 1.15 && window.innerWidth < 700);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!loaded) {
    return <div className="loading"><div className="spin">🌸</div>Carregando o Mundo da Maitê...</div>;
  }
  return (
    <>
      <Scene />
      {screen === 'title' ? <TitleScreen /> : (
        <div className="ui-layer">
          <HUD />
          <Panels />
          <Dialogue />
          <PetMenu />
          {job && <Minigame key={job} />}
          <Overlays />
        </div>
      )}
      <Toasts />
      <Flash />
      {portrait && <div className="rotate-hint">📱↻ Vire o celular de lado para ver melhor!</div>}
    </>
  );
}
