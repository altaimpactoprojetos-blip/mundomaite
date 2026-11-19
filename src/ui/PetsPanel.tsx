import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { Panel, Swatches } from './Panel';
import { PETS, PET_ACCESSORIES } from '../data/pets';
import { CLOTH_COLORS } from '../data/palette';
import { rt, spawnEffect } from '../systems/runtime';
import { petFx } from '../game/Pets';
import { sfx } from '../systems/audio';

export function PetsPanel() {
  const pets = useGame((s) => s.pets);
  const arg = useGame((s) => s.panelArg);
  const active = useGame((s) => s.activePet);
  const [sel, setSel] = useState<string | null>(arg ?? active ?? pets[0]?.id ?? null);
  const pet = pets.find((p) => p.id === sel);
  const g = useGame.getState;
  if (pets.length === 0) {
    return (
      <Panel title="Meus Pets" icon="🐶">
        <div className="mg">
          <div className="big-emoji">🐶🐱🐰🦄</div>
          <div className="bubble">Você ainda não tem um amiguinho! Adote um no Pet Shop ou na loja.</div>
          <button className="btn big pink" onClick={() => g().openPanel('shop', 'pets')}>🐾 Adotar um pet</button>
        </div>
      </Panel>
    );
  }
  const care = (kind: 'food' | 'play' | 'bath' | 'pet', msg: string, fx: Parameters<typeof spawnEffect>[0]) => {
    if (!pet) return;
    g().petCare(pet.id, kind);
    petFx.happyUntil = rt.time + 2.5;
    spawnEffect(fx, rt.player.pos);
    g().toast(msg, PETS[pet.species].icon);
    sfx(pet.species === 'gato' ? 'meow' : pet.species === 'cachorro' ? 'bark' : 'sparkle');
  };
  const def = pet ? PETS[pet.species] : null;
  return (
    <Panel title="Meus Pets" icon="🐶">
      <div className="tabs">
        {pets.map((p) => <button key={p.id} className={`tab ${p.id === sel ? 'on' : ''}`} onClick={() => setSel(p.id)}>{PETS[p.species].icon} {p.name}{p.id === active ? ' ⭐' : ''}</button>)}
        <button className="tab" onClick={() => g().openPanel('shop', 'pets')}>➕ Adotar</button>
      </div>
      {pet && def && (
        <>
          <div className="row">
            <span style={{ fontSize: 54 }}>{def.icon}</span>
            <input value={pet.name} maxLength={14} onChange={(e) => g().updatePet(pet.id, { name: e.target.value })} style={{ fontSize: 20, fontWeight: 800, border: '3px solid #ffd6e8', borderRadius: 14, padding: '4px 10px', flex: 1, minWidth: 120 }} />
            {active !== pet.id ? <button className="btn mint" onClick={() => g().set({ activePet: pet.id })}>🐾 Passear comigo</button> : <button className="btn" onClick={() => g().set({ activePet: null })}>🏡 Deixar em casa</button>}
          </div>
          <div className="muted" style={{ margin: '4px 0' }}>{def.name} · "{def.sound}"</div>
          {([['hunger', '🍖 Barriguinha'], ['fun', '🎾 Diversão'], ['clean', '🫧 Limpeza'], ['love', '💖 Amor']] as const).map(([k, n]) => (
            <div key={k} className="row" style={{ margin: '3px 0' }}><span style={{ width: 120, fontWeight: 700 }}>{n}</span><div className="bar"><div style={{ width: `${pet[k]}%` }} /></div></div>
          ))}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn yellow" onClick={() => care('food', `${pet.name} comeu tudinho! 😋`, 'hearts')}>🍖 Alimentar</button>
            <button className="btn pink" onClick={() => care('play', `${pet.name} adorou brincar! 🎾`, 'stars')}>🎾 Brincar</button>
            <button className="btn blue" onClick={() => care('bath', `${pet.name} está cheirosinho! 🫧`, 'bubbles')}>🛁 Dar banho</button>
            <button className="btn lilac" onClick={() => care('pet', `${pet.name} ama seu carinho! 💕`, 'hearts')}>🤲 Carinho</button>
            {def.rideable && <button className="btn mint" onClick={() => { g().set({ activePet: pet.id }); rt.player.mounted = rt.player.mounted === pet.id ? null : pet.id; g().openPanel(null); }}>🐴 {rt.player.mounted === pet.id ? 'Descer' : 'Montar'}</button>}
          </div>
          <div className="section">Cor</div>
          <Swatches colors={[...def.colors, ...CLOTH_COLORS.slice(0, 10)]} value={pet.color} onChange={(c) => g().updatePet(pet.id, { color: c })} />
          <div className="section">Acessório</div>
          <div className="row">{PET_ACCESSORIES.map((a) => <button key={a.id} className={`btn small ${pet.accessory === a.id ? 'pink' : ''}`} onClick={() => g().updatePet(pet.id, { accessory: a.id })}>{a.icon} {a.name}</button>)}</div>
          <div className="section">Cor do acessório</div>
          <Swatches colors={CLOTH_COLORS} value={pet.accColor} onChange={(c) => g().updatePet(pet.id, { accColor: c })} />
        </>
      )}
    </Panel>
  );
}
