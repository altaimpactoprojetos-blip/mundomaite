import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { Panel, Tabs } from './Panel';
import { ITEM_MAP, TOYS } from '../data/catalog';
import { MODEL_MAP } from '../data/models';
import { PROFESSIONS } from '../data/professions';
import { STICKERS } from '../data/quests';
import { teleportPlayer, spawnEffect, rt } from '../systems/runtime';
import { sfx } from '../systems/audio';
import { exitVehicle } from '../game/Vehicles';
import { TourStartButton } from './TourBox';

export function BagPanel() {
  const toys = useGame((s) => s.toys);
  const held = useGame((s) => s.held);
  const inventory = useGame((s) => s.inventory);
  const creative = useGame((s) => s.creative);
  const g = useGame.getState;
  const allToys = creative ? TOYS.map((t) => `t-${t[0]}`) : toys;
  const builds = Object.entries(inventory).filter(([, n]) => n > 0);
  return (
    <Panel title="Minha Mochila" icon="🎒">
      <div className="section">🧸 Brinquedos (toque para segurar)</div>
      <div className="grid">
        <button className={`card ${!held ? 'on' : ''}`} onClick={() => g().hold(null)}><div className="ic">✋</div><div className="nm">Mãos livres</div></button>
        {allToys.map((id) => {
          const it = ITEM_MAP[id];
          if (!it || it.data.kind !== 'toy') return null;
          const toy = it.data.toy;
          return (
            <button key={id} className={`card ${held === toy ? 'on' : ''}`} onClick={() => {
              g().hold(toy); sfx('pop');
              if (toy === 'bolhas') spawnEffect('bubbles', rt.player.pos);
              if (toy === 'varinha') spawnEffect('sparkles', rt.player.pos);
            }}>
              <div className="ic">{it.icon}</div><div className="nm">{it.name}</div>
            </button>
          );
        })}
      </div>
      <div className="section">🛋️ Itens para construir</div>
      {builds.length === 0 ? <p className="muted">{creative ? 'No modo criativo todos os objetos são ilimitados! Abra 🔨 Construir.' : 'Compre móveis na loja para guardar aqui.'}</p> : (
        <div className="grid">
          {builds.map(([m, n]) => <button key={m} className="card" onClick={() => { g().openPanel('build'); g().setBuild({ item: m }); }}><div className="badge">x{n}</div><div className="ic">{MODEL_MAP[m]?.icon}</div><div className="nm">{MODEL_MAP[m]?.name}</div></button>)}
        </div>
      )}
    </Panel>
  );
}

export function JobsPanel() {
  const g = useGame.getState;
  return (
    <Panel title="Profissões" icon="💼">
      <p className="muted">Escolha o que quer ser hoje! Você pode começar agora ou ir até o lugar de trabalho.</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {PROFESSIONS.map((p) => (
          <div key={p.id} className="card">
            <div className="ic">{p.icon}</div>
            <div className="nm">{p.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{p.desc}</div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 4 }}>
              <button className="btn small pink" onClick={() => { g().openPanel(null); g().set({ minigame: p.id }); }}>▶ Jogar</button>
              <button className="btn small" onClick={() => {
                if (rt.vehicle.id && !exitVehicle()) return;
                teleportPlayer(p.where[0], 0, p.where[2]); sfx('whoosh'); g().openPanel(null);
              }}>🚶 Ir</button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function PhotosPanel() {
  const [tab, setTab] = useState<'fotos' | 'quadros' | 'adesivos'>('fotos');
  const photos = useGame((s) => s.photos);
  const paintings = useGame((s) => s.paintings);
  const stickers = useGame((s) => s.stickers);
  const g = useGame.getState;
  return (
    <Panel title="Meu Álbum" icon="📸" wide>
      <Tabs tabs={[{ id: 'fotos', label: `📸 Fotos (${photos.length})` }, { id: 'quadros', label: `🎨 Quadros (${paintings.length})` }, { id: 'adesivos', label: `⭐ Adesivos (${stickers.length}/${STICKERS.length})` }]} value={tab} onChange={setTab} />
      {tab === 'fotos' && (photos.length === 0 ? <p className="muted">Tire fotos com o botão 😊 → 📸 ou conversando com os amigos!</p> : (
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
              <img src={p.url} alt="foto" />
              <button className="btn small" style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => g().set({ photos: g().photos.filter((x) => x.id !== p.id) })}>🗑️</button>
            </div>
          ))}
        </div>
      ))}
      {tab === 'quadros' && (paintings.length === 0 ? <p className="muted">Seja artista no Estúdio para pintar quadros!</p> : (
        <div className="photo-grid">{paintings.map((p) => <img key={p.id} src={p.url} alt="quadro" />)}</div>
      ))}
      {tab === 'adesivos' && (
        <>
          <p className="muted">Complete as ⭐ missões do dia para ganhar adesivos novos!</p>
          <div className="stickers">{STICKERS.map((s) => <div key={s} className={`sticker ${stickers.includes(s) ? '' : 'locked'}`}>{s}</div>)}</div>
        </>
      )}
    </Panel>
  );
}

export function QuestsPanel() {
  const quests = useGame((s) => s.quests.list);
  const g = useGame.getState;
  return (
    <Panel title="Missões do Dia" icon="⭐">
      <div className="card" style={{ flexDirection: 'row', gap: 10, marginBottom: 10, background: '#f6efff' }}>
        <span style={{ fontSize: 40 }}>🦄</span>
        <div style={{ flex: 1, textAlign: 'left' }}><b>Um passeio com Purpurina</b><div className="muted">Escolha uma roupa, diga oi à vizinha, monte no Purpurina, sirva na cafeteria e tire uma foto na fonte!</div></div>
        <TourStartButton />
      </div>
      <p className="muted">Todo dia tem missões novas! Complete para ganhar moedinhas e adesivos ✨</p>
      {quests.map((q) => (
        <div key={q.id} className="card" style={{ flexDirection: 'row', textAlign: 'left', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{q.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>{q.text}</div>
            <div className="row"><div className="bar"><div style={{ width: `${(q.progress / q.target) * 100}%` }} /></div><b>{q.progress}/{q.target}</b></div>
          </div>
          {q.claimed ? <span style={{ fontSize: 28 }}>✅</span> : (
            <button className="btn small yellow" disabled={q.progress < q.target} onClick={() => g().claimQuest(q.id)}>🎁 {q.reward}</button>
          )}
        </div>
      ))}
    </Panel>
  );
}
