import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { sfx } from '../systems/audio';
import { emote, rt, spawnEffect } from '../systems/runtime';

export const DRINKS: [string, string, string][] = [
  ['cafe', '☕', 'Café com leite'], ['chocolate', '🍫', 'Chocolate quente'], ['morango', '🍓', 'Suco de morango'], ['shake', '🥤', 'Milk-shake'],
];
const CUPS: [string, string][] = [['#ffffff', 'Copo branco'], ['#ffc2d9', 'Copo rosa'], ['#c7e5ff', 'Copo azul']];
const TOPS: [string, string][] = [['🍦', 'Chantilly'], ['🍡', 'Marshmallow'], ['🌈', 'Granulado'], ['🥤', 'Canudinho']];
const FILL: [string, string][] = [['🧀', 'Queijo'], ['🍅', 'Tomate'], ['🥬', 'Alface'], ['🥚', 'Ovo'], ['🍗', 'Frango']];

/** Preparar bebida (cafeteria) ou lanche (cozinha de casa), passo a passo. */
export function Prepare() {
  const recipe = useGame((s) => s.overlay?.data) ?? 'bebida';
  const task = useGame((s) => s.task);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const g = useGame.getState;
  const close = () => g().set({ overlay: null });
  const orders = task?.kind === 'cafe' ? task.targets.filter((t) => !t.done) : [];
  const choose = (v: string) => {
    sfx('pop');
    spawnEffect('sparkles', rt.player.pos);
    const np = [...picked, v];
    setPicked(np);
    setStep(step + 1);
  };
  const finish = () => {
    if (recipe === 'lanche') {
      g().hold('sanduiche');
      g().track('snack');
      g().toast('Que lanche delicioso! 🥪😋', '🥪');
    } else {
      const drink = picked[1];
      g().hold(`bebida:${drink}`);
      const name = DRINKS.find((d) => d[0] === drink)?.[2];
      g().toast(orders.length ? `${name} pronto! Leve até o cliente na mesa 🥤` : `${name} pronto! Que cheirinho bom! ☕`, '🥤');
    }
    emote('cheer', 1.2);
    sfx('fanfare');
    close();
  };
  const steps = recipe === 'lanche'
    ? [
      { q: 'Pegue o pão 🍞', opts: [['pao', '🍞', 'Pão de forma'], ['bisnaga', '🥖', 'Pão francês'], ['bola', '🥯', 'Pão redondo']] },
      { q: 'Escolha o recheio', opts: FILL.map(([i, n]) => [n, i, n]) },
      { q: 'Mais um recheio?', opts: FILL.map(([i, n]) => [n, i, n]) },
    ]
    : [
      { q: 'Escolha o copo', opts: CUPS.map(([c, n]) => [c, '🥛', n]) },
      { q: orders.length ? `Qual bebida? Pedido: ${orders.map((o) => o.icon).join(' ')}` : 'Qual bebida vamos fazer?', opts: DRINKS.map(([id, i, n]) => [id, i, n]) },
      { q: 'Coloque uma cobertura', opts: TOPS.map(([i, n]) => [n, i, n]) },
    ];
  const cur = steps[step];
  return (
    <div className="backdrop" onPointerDown={(e) => e.stopPropagation()}>
      <div className="panel" style={{ width: 'min(560px, 100%)' }}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>{recipe === 'lanche' ? '🥪' : '☕'}</span><h2>{recipe === 'lanche' ? 'Preparar lanche' : 'Preparar bebida'}</h2><button className="close" onClick={close}>✖</button></div>
        <div className="panel-body">
          <div className="mg">
            <div style={{ fontSize: 44, minHeight: 54 }}>{picked.map((p, i) => <span key={i}>{(recipe === 'lanche' ? [...steps[0].opts, ...FILL.map(([i2, n]) => [n, i2, n])] : [...DRINKS, ...TOPS.map(([i2, n]) => [n, i2, n]), ...CUPS.map(([c, n]) => [c, '🥛', n])]).find((o) => o[0] === p)?.[1] ?? ''}</span>)}</div>
            {cur ? (
              <>
                <div className="bubble">Passo {step + 1}/{steps.length}: {cur.q}</div>
                <div className="choices">{cur.opts.map(([id, i, n]) => <button key={id} className="btn" onClick={() => choose(id)}><span>{i}</span>{n}</button>)}</div>
              </>
            ) : (
              <>
                <div className="bubble">Prontinho! Ficou lindo! ✨</div>
                <button className="btn big pink" onClick={finish}>{recipe === 'lanche' ? '😋 Pegar o lanche' : '🥤 Pegar a bebida'}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lousa da escola: desenhar com giz e guardar no quadro */
export function BoardDraw() {
  const [ref, setRef] = useState<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState('#ffffff');
  const g = useGame.getState;
  let drawing = false;
  let last: [number, number] | null = null;
  const init = (c: HTMLCanvasElement | null) => {
    if (!c || ref) return;
    setRef(c);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#1f5f43';
    ctx.fillRect(0, 0, 640, 180);
    const old = g().schoolBoard;
    if (old) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, 640, 180); im.src = old; }
  };
  const pos = (e: React.PointerEvent): [number, number] => { const r = ref!.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 640, ((e.clientY - r.top) / r.height) * 180]; };
  const line = (a: [number, number], b: [number, number]) => { const ctx = ref!.getContext('2d')!; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); };
  const write = (txt: string) => { const ctx = ref!.getContext('2d')!; ctx.fillStyle = color; ctx.font = 'bold 40px "Trebuchet MS", sans-serif'; ctx.fillText(txt, 20 + Math.random() * 380, 50 + Math.random() * 100); sfx('pop'); };
  const save = () => {
    g().set({ schoolBoard: ref!.toDataURL('image/png'), overlay: null });
    g().toast('Você escreveu no quadro da escola! Os alunos adoraram ✏️', '🏫');
    g().track('job');
    emote('cheer', 1.5);
  };
  return (
    <div className="backdrop" onPointerDown={(e) => e.stopPropagation()}>
      <div className="panel" style={{ width: 'min(760px, 100%)' }}>
        <div className="panel-head"><span style={{ fontSize: 30 }}>✏️</span><h2>Quadro da escola</h2><button className="close" onClick={() => g().set({ overlay: null })}>✖</button></div>
        <div className="panel-body">
          <canvas ref={init} width={640} height={180} style={{ width: '100%', borderRadius: 12, border: '8px solid #8d5b3a', touchAction: 'none' }}
            onPointerDown={(e) => { drawing = true; last = pos(e); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => { if (!drawing || !last) return; const p = pos(e); line(last, p); last = p; }}
            onPointerUp={() => { drawing = false; last = null; }} />
          <div className="row" style={{ marginTop: 8 }}>
            {['#ffffff', '#ffe066', '#ff8fc7', '#7cc4ff', '#7ee8c7'].map((c) => <button key={c} className={`sw ${c === color ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />)}
            {['ABC', '1 2 3', '⭐', '❤️', 'Oi turma!', '2 + 2 = 4'].map((t) => <button key={t} className="btn small" onClick={() => write(t)}>{t}</button>)}
            <button className="btn small" onClick={() => { const ctx = ref!.getContext('2d')!; ctx.fillStyle = '#1f5f43'; ctx.fillRect(0, 0, 640, 180); }}>🧽 Apagar</button>
            <button className="btn pink" onClick={save}>✅ Pronto</button>
          </div>
        </div>
      </div>
    </div>
  );
}
