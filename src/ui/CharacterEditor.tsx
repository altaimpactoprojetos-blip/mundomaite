import { useEffect, useRef, useState } from 'react';
import { rt } from '../systems/runtime';
import { saveNow } from '../store/persistence';
import { useGame } from '../store/gameStore';
import { Panel, Swatches, Tabs } from './Panel';
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTH_COLORS } from '../data/palette';
import { TOPS, DRESSES, BOTTOMS, SHOES, ACCS, BAGS, ROLE_ACCS, ITEM_MAP } from '../data/catalog';
import type { Appearance, Expression, HairStyle, Personality } from '../types';
import { sfx } from '../systems/audio';

type Tab = 'jeito' | 'rosto' | 'cabelo' | 'roupas' | 'calcados' | 'acessorios' | 'maquiagem';
const HAIR: [HairStyle, string, string][] = [
  ['chiquinhas', 'Maria-chiquinha', '🎀'], ['rabo', 'Rabo de cavalo', '🐴'], ['longo', 'Longo', '💁‍♀️'], ['coque', 'Coque', '🧅'],
  ['cacheado', 'Cacheado', '🌀'], ['trancas', 'Tranças', '🥨'], ['franja', 'Franjinha', '💇‍♀️'], ['black', 'Black power', '☁️'], ['curto', 'Curtinho', '👦'], ['careca', 'Sem cabelo', '🥚'],
];
const EXPR: [Expression, string][] = [['feliz', '🙂'], ['sorriso', '😁'], ['surpresa', '😮'], ['piscadinha', '😉'], ['calma', '😌'], ['lingua', '😛']];
const PERS: [Personality, string, string][] = [
  ['aventureira', 'Aventureira', '🧭'], ['criativa', 'Criativa', '🎨'], ['carinhosa', 'Carinhosa', '💕'], ['engracada', 'Engraçada', '🤪'], ['tranquila', 'Tranquila', '🌿'], ['curiosa', 'Curiosa', '🔍'],
];

export function CharacterEditor() {
  const arg = useGame((s) => s.panelArg);
  const [tab, setTab] = useState<Tab>((['cabelo', 'roupas', 'maquiagem'].includes(arg ?? '') ? arg : 'jeito') as Tab);
  const look = useGame((s) => s.appearance);
  const set = useGame((s) => s.setAppearance);
  const creative = useGame((s) => s.creative);
  const wardrobe = useGame((s) => s.wardrobe);
  const tracked = useRef(false);
  const [snapshot] = useState(() => JSON.parse(JSON.stringify(useGame.getState().appearance)) as Appearance);
  useEffect(() => {
    rt.cam.editorYaw = rt.player.yaw;
    rt.player.seat = null;
    return () => { rt.editorFocus = 'corpo'; rt.cam.yaw = rt.player.yaw + Math.PI; };
  }, []);
  useEffect(() => { rt.editorFocus = tab === 'rosto' || tab === 'cabelo' || tab === 'maquiagem' ? 'rosto' : 'corpo'; }, [tab]);
  const saveLook = () => {
    const s = useGame.getState();
    s.toast('Visual salvo! Você está linda! 💖', '💾');
    s.track('style');
    s.tourEvent('salvar-visual');
    sfx('fanfare');
    void saveNow();
    s.openPanel(null);
  };
  const cancel = () => { set(snapshot); useGame.getState().openPanel(null); sfx('click'); };
  const change = (p: Partial<Appearance>) => {
    set(p);
    sfx('pop');
    tracked.current = true;
  };
  const owns = (id: string) => creative || wardrobe.includes(`w-${id}`) || ROLE_ACCS.some((r) => r[0] === id && wardrobe.includes(`w-${id}`));
  const Item = ({ id, name, icon, on, onPick, price }: { id: string; name: string; icon: string; on: boolean; onPick: () => void; price?: number }) => {
    const has = owns(id) || price === 0;
    return (
      <button className={`card ${on ? 'on' : ''}`} onClick={() => {
        if (has) onPick();
        else { const it = ITEM_MAP[`w-${id}`]; if (it && useGame.getState().buy(it)) onPick(); }
      }}>
        <div className="ic">{icon}</div>
        <div className="nm">{name}</div>
        {!has && <div className="pr">🪙 {price}</div>}
      </button>
    );
  };
  const freeRole = (id: string) => ['jaleco', 'uniforme', 'avental', 'chapeu-chef', 'capacete', 'quepe', 'estetoscopio', 'antena'].includes(id);
  const toggleAcc = (id: string) => {
    const has = look.accessories.includes(id);
    change({ accessories: has ? look.accessories.filter((a) => a !== id) : [...look.accessories, id] });
  };

  return (
    <Panel title="Meu Personagem" icon="👗" side onClose={saveLook} footer={<><button className="btn" onClick={cancel}>↩️ Cancelar</button><button className="btn pink" onClick={saveLook}>💾 Salvar visual</button></>}>
      <div className="muted" style={{ marginBottom: 4 }}>👆 Arraste a tela para girar a Maitê</div>
      <Tabs<Tab>
        wrap
        tabs={[{ id: 'jeito', label: '😊 Eu' }, { id: 'rosto', label: '👀 Rosto' }, { id: 'cabelo', label: '💇 Cabelo' }, { id: 'roupas', label: '👗 Roupas' }, { id: 'calcados', label: '👟 Sapatos' }, { id: 'acessorios', label: '🎀 Acessórios' }, { id: 'maquiagem', label: '💄 Maquiagem' }]}
        value={tab} onChange={setTab}
      />
      {tab === 'jeito' && (
        <>
          <div className="section">Nome</div>
          <input value={look.name} maxLength={16} onChange={(e) => set({ name: e.target.value })} style={{ fontSize: 20, padding: '8px 12px', borderRadius: 14, border: '3px solid #ffd6e8', width: '100%' }} />
          <div className="section">Personalidade</div>
          <div className="grid">{PERS.map(([id, n, i]) => <button key={id} className={`card ${look.personality === id ? 'on' : ''}`} onClick={() => change({ personality: id })}><div className="ic">{i}</div><div className="nm">{n}</div></button>)}</div>
          <div className="section">Altura</div>
          <input type="range" min={0.85} max={1.15} step={0.01} value={look.height} onChange={(e) => set({ height: Number(e.target.value) })} style={{ width: '100%' }} />
          <div className="section">Cor da pele</div>
          <Swatches colors={SKIN_TONES} value={look.skin} onChange={(c) => change({ skin: c })} />
        </>
      )}
      {tab === 'rosto' && (
        <>
          <div className="section">Expressão</div>
          <div className="row">{EXPR.map(([id, i]) => <button key={id} className={`card ${look.expression === id ? 'on' : ''}`} style={{ width: 64 }} onClick={() => change({ expression: id })}><div className="ic">{i}</div></button>)}</div>
          <div className="section">Olhinhos</div>
          <div className="row">{(['redondo', 'brilhante', 'cilios'] as const).map((id) => <button key={id} className={`btn small ${look.eyeStyle === id ? 'pink' : ''}`} onClick={() => change({ eyeStyle: id })}>{id === 'redondo' ? '⚫ Redondo' : id === 'brilhante' ? '✨ Brilhante' : '👁️ Cílios'}</button>)}</div>
          <div className="section">Cor dos olhos</div>
          <Swatches colors={EYE_COLORS} value={look.eyeColor} onChange={(c) => change({ eyeColor: c })} />
        </>
      )}
      {tab === 'cabelo' && (
        <>
          <div className="grid">{HAIR.map(([id, n, i]) => <button key={id} className={`card ${look.hairStyle === id ? 'on' : ''}`} onClick={() => change({ hairStyle: id })}><div className="ic">{i}</div><div className="nm">{n}</div></button>)}</div>
          <div className="section">Cor do cabelo</div>
          <Swatches colors={HAIR_COLORS} value={look.hairColor} onChange={(c) => change({ hairColor: c })} />
        </>
      )}
      {tab === 'roupas' && (
        <>
          <div className="section">Blusas e vestidos</div>
          <div className="grid">
            {[...TOPS, ...DRESSES].map(([id, n, i, p]) => <Item key={id} id={id} name={n} icon={i} price={p} on={look.top === id} onPick={() => change({ top: id })} />)}
            {[['jaleco', 'Jaleco', '🥼'], ['uniforme', 'Uniforme', '👔'], ['avental', 'Avental', '🧑‍🍳']].map(([id, n, i]) => <Item key={id} id={id} name={n} icon={i} price={0} on={look.top === id} onPick={() => change({ top: id })} />)}
          </div>
          <div className="section">Cor da roupa</div>
          <Swatches colors={CLOTH_COLORS} value={look.topColor} onChange={(c) => change({ topColor: c })} />
          <div className="section">Saias, shorts e calças</div>
          <div className="grid">{BOTTOMS.map(([id, n, i, p]) => <Item key={id} id={id} name={n} icon={i} price={p} on={look.bottom === id} onPick={() => change({ bottom: id })} />)}</div>
          <div className="section">Cor</div>
          <Swatches colors={CLOTH_COLORS} value={look.bottomColor} onChange={(c) => change({ bottomColor: c })} />
        </>
      )}
      {tab === 'calcados' && (
        <>
          <div className="grid">{SHOES.map(([id, n, i, p]) => <Item key={id} id={id} name={n} icon={i} price={p} on={look.shoes === id} onPick={() => change({ shoes: id })} />)}</div>
          <div className="section">Cor</div>
          <Swatches colors={CLOTH_COLORS} value={look.shoesColor} onChange={(c) => change({ shoesColor: c })} />
        </>
      )}
      {tab === 'acessorios' && (
        <>
          <div className="muted">Toque para colocar ou tirar. Pode usar vários!</div>
          <div className="grid" style={{ marginTop: 8 }}>
            {[...ACCS, ...BAGS].map(([id, n, i, p]) => <Item key={id} id={id} name={n} icon={i} price={p} on={look.accessories.includes(id)} onPick={() => toggleAcc(id)} />)}
            {ROLE_ACCS.map(([id, n, i]) => (freeRole(id) || wardrobe.includes(`w-${id}`) || creative) && <Item key={id} id={id} name={n} icon={i} price={0} on={look.accessories.includes(id)} onPick={() => toggleAcc(id)} />)}
          </div>
          <div className="section">Cor dos acessórios</div>
          <Swatches colors={CLOTH_COLORS} value={look.accColor} onChange={(c) => change({ accColor: c })} />
        </>
      )}
      {tab === 'maquiagem' && (
        <>
          <div className="muted">Maquiagem de brincadeira (opcional) ✨</div>
          <div className="grid" style={{ marginTop: 8 }}>
            {([['blush', 'Bochechas rosadas', '🌸'], ['glitter', 'Brilhinhos', '✨'], ['lips', 'Batom suave', '💋']] as const).map(([k, n, i]) => (
              <button key={k} className={`card ${look.makeup[k] ? 'on' : ''}`} onClick={() => change({ makeup: { ...look.makeup, [k]: !look.makeup[k] } })}><div className="ic">{i}</div><div className="nm">{n}</div></button>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
