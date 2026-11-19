import { useGame, type PanelId } from '../store/gameStore';
import { unlockAudio, startMusic, sfx } from '../systems/audio';
import { DAILY_GIFTS, todayKey, STICKERS } from '../data/quests';
import { startTour } from '../game/Tour';

export function enterGame(panel: PanelId | null = null) {
  unlockAudio();
  startMusic();
  sfx('fanfare');
  const s = useGame.getState();
  s.set({ screen: 'game', panel, buildMode: panel === 'build' });
  if (s.lastGift !== todayKey()) {
    const gift = DAILY_GIFTS[Math.floor(Math.random() * DAILY_GIFTS.length)];
    const sticker = STICKERS.find((st) => !s.stickers.includes(st));
    s.set({
      lastGift: todayKey(),
      money: s.money + gift.money,
      stickers: sticker ? [...s.stickers, sticker] : s.stickers,
      overlay: { kind: 'gift', data: `${gift.icon} ${gift.text} +${gift.money} moedinhas${sticker ? ` e o adesivo ${sticker}` : ''}!` },
    });
  }
}

const ITEMS: { id: PanelId | null; icon: string; label: string }[] = [
  { id: 'character', icon: '👗', label: 'Meu personagem' },
  { id: 'house', icon: '🏡', label: 'Minha casa' },
  { id: 'build', icon: '🔨', label: 'Construir' },
  { id: 'shop', icon: '🛍️', label: 'Loja' },
  { id: 'vehicles', icon: '🚗', label: 'Veículos' },
  { id: 'pets', icon: '🐶', label: 'Pets' },
  { id: 'map', icon: '🗺️', label: 'Mapa' },
  { id: 'jobs', icon: '💼', label: 'Profissões' },
  { id: 'settings', icon: '⚙️', label: 'Configurações' },
];

export function TitleScreen() {
  const name = useGame((s) => s.appearance.name);
  return (
    <div className="title">
      <div className="logo">
        <h1>Mundo da<br />{name === 'Maitê' || !name ? 'Maitê' : 'Maitê'} ✨</h1>
        <p>Um universo inteiro para imaginar, criar e brincar.</p>
      </div>
      <div className="title-menu">
        <button className="btn yellow play" onClick={() => useGame.getState().set({ mode: 'hotel', screen: 'title' })}>🏨 Voltar ao Hotel da Maitê</button>
        <button className="btn pink play" onClick={() => enterGame(null)}>▶ Jogar no Mundo 3D</button>
        <button className="btn lilac play" style={{ fontSize: 18, padding: 10 }} onClick={() => { enterGame(null); setTimeout(() => startTour(), 50); }}>🦄 Um passeio com Purpurina</button>
        {ITEMS.map((i) => (
          <button key={i.label} className="btn" onClick={() => enterGame(i.id)}><span className="i">{i.icon}</span>{i.label}</button>
        ))}
      </div>
    </div>
  );
}
