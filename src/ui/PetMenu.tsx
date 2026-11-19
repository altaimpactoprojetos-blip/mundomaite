import { useGame } from '../store/gameStore';
import { PETS } from '../data/pets';
import { rt, spawnEffect } from '../systems/runtime';
import { petCuddle, petFx } from '../game/Pets';
import { sfx } from '../systems/audio';

/** Menu rápido ao tocar no pet: carinho, montar, comida... */
export function PetMenu() {
  const id = useGame((s) => s.petMenu);
  const pet = useGame((s) => s.pets.find((p) => p.id === id));
  if (!id || !pet) return null;
  const def = PETS[pet.species];
  const g = useGame.getState;
  const close = () => g().set({ petMenu: null });
  const mounted = rt.player.mounted === pet.id;
  const act = (fn: () => void) => () => { fn(); close(); };
  return (
    <div className="pet-menu" onPointerDown={(e) => e.stopPropagation()}>
      <div style={{ width: '100%', textAlign: 'center', fontWeight: 800 }}>{def.icon} {pet.name}</div>
      <button className="btn pink" onClick={act(() => {
        g().set({ activePet: pet.id });
        petCuddle();
        g().petCare(pet.id, 'pet');
        g().track('pet');
        g().tourEvent('carinho');
        sfx(pet.species === 'gato' ? 'meow' : pet.species === 'cachorro' ? 'bark' : 'sparkle');
        g().toast(`${pet.name} encostou o focinho na sua mão! 💕`, def.icon);
      })}><span>🤲</span>Carinho</button>
      {def.rideable && (
        <button className="btn lilac" onClick={act(() => {
          g().set({ activePet: pet.id });
          rt.player.mounted = mounted ? null : pet.id;
          rt.player.seat = null;
          if (!mounted) { spawnEffect('sparkles', rt.player.pos); g().track('ride'); g().tourEvent('montar'); }
          g().toast(mounted ? `Você desceu do ${pet.name}` : `Você montou no ${pet.name}! Use o joystick para cavalgar 🌈`, def.icon);
        })}><span>{mounted ? '🧍' : '🏇'}</span>{mounted ? 'Descer' : 'Montar'}</button>
      )}
      <button className="btn yellow" onClick={act(() => { g().petCare(pet.id, 'food'); petFx.happyUntil = rt.time + 2; spawnEffect('hearts', rt.player.pos); g().toast(`${pet.name} comeu tudinho! 😋`, '🍎'); })}><span>🍎</span>Comida</button>
      <button className="btn mint" onClick={act(() => { g().petCare(pet.id, 'play'); petFx.happyUntil = rt.time + 3; spawnEffect('stars', rt.player.pos); })}><span>🎾</span>Brincar</button>
      <button className="btn" onClick={act(() => g().openPanel('pets', pet.id))}><span>⚙️</span>Mais</button>
      <button className="btn ghost" onClick={close}><span>✖</span>Fechar</button>
    </div>
  );
}
