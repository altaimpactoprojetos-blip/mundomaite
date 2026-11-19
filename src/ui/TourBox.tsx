import { useGame } from '../store/gameStore';
import { TOUR } from '../data/tour';
import { startTour } from '../game/Tour';

export function TourBox() {
  const tour = useGame((s) => s.tour);
  if (!tour) return null;
  const g = useGame.getState;
  if (tour.done) {
    return (
      <div className="tour">
        <div className="step">🎉 Passeio completo!</div>
        <div>Você e o Purpurina se divertiram muito! A foto está no Álbum.</div>
        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn small pink" onClick={() => { g().set({ tour: null }); g().openPanel('photos'); }}>📸 Ver foto</button>
          <button className="btn small" onClick={() => g().set({ tour: null })}>✖</button>
        </div>
      </div>
    );
  }
  const st = TOUR[tour.step];
  return (
    <div className="tour" onPointerDown={(e) => e.stopPropagation()}>
      <div className="muted" style={{ fontSize: 12 }}>🦄 Um passeio com Purpurina · {tour.step + 1}/{TOUR.length}</div>
      <div className="step">{st.icon} {st.title}</div>
      <div>{st.hint}</div>
      <div className="row" style={{ marginTop: 4, gap: 2 }}>{TOUR.map((t, i) => <span key={t.id} style={{ opacity: i < tour.step ? 1 : i === tour.step ? 0.9 : 0.3, fontSize: 14 }}>{i < tour.step ? '✅' : t.icon}</span>)}</div>
      <div className="row" style={{ marginTop: 4 }}>
        {st.id === 'roupa' && <button className="btn small pink" onClick={() => g().openPanel('character', 'roupas')}>👗 Abrir editor</button>}
        <button className="btn small" onClick={() => g().set({ tour: null, task: null })}>Sair do passeio</button>
      </div>
    </div>
  );
}

export function TourStartButton({ big }: { big?: boolean }) {
  return (
    <button className={`btn ${big ? 'big' : ''} lilac`} onClick={() => startTour()}>🦄 Um passeio com Purpurina</button>
  );
}
