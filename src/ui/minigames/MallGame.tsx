import { useEffect, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { sfx } from '../../systems/audio';

const STORES: [string, string, string, number][] = [
  ['roupas', 'Moda', '👗', 3], ['brinquedos', 'Brinquedos', '🧸', 3], ['sorvete', 'Sorveteria', '🍦', 2], ['livros', 'Livraria', '📚', 2],
  ['sapatos', 'Sapataria', '👟', 3], ['pets', 'Pet Shop', '🐾', 3], ['doces', 'Doceria', '🍬', 2], ['cinema', 'Cineminha', '🎬', 4],
  ['jogos', 'Jogos', '🎮', 4], ['flores', 'Floricultura', '🌷', 2], ['joias', 'Bijuterias', '💍', 4], ['salao', 'Salão', '💅', 3],
];

export function MallGame({ onDone }: { onDone: (stars: number) => void }) {
  const mall = useGame((s) => s.mall);
  const [slot, setSlot] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<string[]>([]);
  const income = Math.min(400, Math.floor(((Date.now() - mall.lastCollect) / 60000) * mall.stores.reduce((a, s) => a + (STORES.find((x) => x[0] === s)?.[3] ?? 1), 0) * (new Set(mall.stores).size / 2)));
  useEffect(() => {
    const t = setInterval(() => setVisitors((v) => [...v.slice(-9), ['👧', '👦', '👩', '👨', '👵', '🧒'][Math.floor(Math.random() * 6)]]), 700);
    return () => clearInterval(t);
  }, []);
  const setStore = (id: string) => {
    if (slot === null) return;
    const stores = [...mall.stores];
    stores[slot] = id;
    useGame.getState().set({ mall: { ...mall, stores } });
    setSlot(null);
    sfx('pop');
  };
  return (
    <div className="mg">
      <div className="bubble">Escolha as lojas do Shopping Brilho! Lojas diferentes atraem mais clientes 🛍️</div>
      <div style={{ fontSize: 28, minHeight: 40 }}>{visitors.join(' ')}</div>
      <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))' }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const s = STORES.find((x) => x[0] === mall.stores[i]);
          return <button key={i} className={`btn ${slot === i ? 'pink' : ''}`} onClick={() => setSlot(i)}><span>{s?.[2] ?? '➕'}</span>{s?.[1] ?? 'Vazio'}</button>;
        })}
      </div>
      {slot !== null && (
        <>
          <div className="section">Que loja colocar no espaço {slot + 1}?</div>
          <div className="choices">{STORES.map(([id, n, i]) => <button key={id} className="btn" onClick={() => setStore(id)}><span>{i}</span>{n}</button>)}</div>
        </>
      )}
      <div className="row">
        <span className="chip">💰 Lucro acumulado: {income}</span>
        <button className="btn big yellow" onClick={() => {
          useGame.getState().set({ mall: { ...useGame.getState().mall, lastCollect: Date.now() } });
          if (income > 0) useGame.getState().earn(income, 'shopping');
          onDone(Math.min(5, 2 + new Set(mall.stores).size / 2));
        }}>🪙 Recolher e terminar</button>
      </div>
    </div>
  );
}
