import { useState } from 'react';
import { sfx } from '../../systems/audio';

interface Q { q: string; a: string; opts: string[]; icon: string }
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function makeQ(): Q {
  const kind = Math.floor(Math.random() * 6);
  if (kind === 0) {
    const x = 1 + Math.floor(Math.random() * 6), y = 1 + Math.floor(Math.random() * 5);
    const a = x + y;
    return { icon: '➕', q: `Quanto é ${x} + ${y}? ${'🍎'.repeat(x)} ${'🍏'.repeat(y)}`, a: String(a), opts: shuffle([a, a + 1, Math.max(0, a - 1), a + 2].map(String)) };
  }
  if (kind === 1) {
    const animals: [string, string][] = [['🐶', 'Au au'], ['🐱', 'Miau'], ['🐮', 'Muuu'], ['🐷', 'Óinc'], ['🐔', 'Có có'], ['🐸', 'Croac']];
    const [e, s] = animals[Math.floor(Math.random() * animals.length)];
    return { icon: '🔊', q: `Qual bichinho faz "${s}"?`, a: e, opts: shuffle(shuffle(animals.map((x) => x[0]).filter((x) => x !== e)).slice(0, 3).concat(e)) };
  }
  if (kind === 2) {
    const colors: [string, string][] = [['🔴', 'vermelho'], ['🟡', 'amarelo'], ['🔵', 'azul'], ['🟢', 'verde'], ['🟣', 'roxo'], ['🟠', 'laranja']];
    const [e, n] = colors[Math.floor(Math.random() * colors.length)];
    return { icon: '🎨', q: `Qual destas é a cor ${n}?`, a: e, opts: shuffle(shuffle(colors.map((x) => x[0]).filter((x) => x !== e)).slice(0, 3).concat(e)) };
  }
  if (kind === 3) {
    const n = 2 + Math.floor(Math.random() * 6);
    const e = ['⭐', '🦋', '🌸', '🎈'][Math.floor(Math.random() * 4)];
    return { icon: '🔢', q: `Quantos tem aqui? ${e.repeat(n)}`, a: String(n), opts: shuffle([n, n + 1, n - 1, n + 2].map(String)) };
  }
  if (kind === 4) {
    const words: [string, string][] = [['🦁', 'L'], ['🐘', 'E'], ['🍌', 'B'], ['🐟', 'P'], ['🌙', 'L'], ['☀️', 'S'], ['🐱', 'G'], ['🍓', 'M']];
    const [e, l] = words[Math.floor(Math.random() * words.length)];
    const letters = shuffle(['A', 'B', 'C', 'D', 'E', 'G', 'L', 'M', 'P', 'S'].filter((x) => x !== l)).slice(0, 3).concat(l);
    return { icon: '🔤', q: `Com que letra começa ${e}?`, a: l, opts: shuffle(letters) };
  }
  const shapes: [string, string][] = [['⚪', 'círculo'], ['🔺', 'triângulo'], ['⬛', 'quadrado'], ['⭐', 'estrela'], ['💗', 'coração']];
  const [e, n] = shapes[Math.floor(Math.random() * shapes.length)];
  return { icon: '🔷', q: `Qual é o ${n}?`, a: e, opts: shuffle(shuffle(shapes.map((x) => x[0]).filter((x) => x !== e)).slice(0, 3).concat(e)) };
}

export function QuizGame({ onDone }: { onDone: (stars: number) => void }) {
  const [i, setI] = useState(0);
  const [q, setQ] = useState(makeQ);
  const [score, setScore] = useState(0);
  const [fb, setFb] = useState<string | null>(null);
  const answer = (o: string) => {
    if (fb) return;
    const ok = o === q.a;
    sfx(ok ? 'coin' : 'error');
    if (ok) setScore(score + 1);
    setFb(ok ? '🎉 Os alunos aplaudiram! Muito bem, professora!' : `A resposta era ${q.a}. Tudo bem, aprender é assim! 💕`);
    setTimeout(() => {
      setFb(null);
      if (i + 1 >= 5) onDone(score + (ok ? 1 : 0));
      else { setI(i + 1); setQ(makeQ()); }
    }, 1400);
  };
  return (
    <div className="mg">
      <div className="row"><b>Aula da Professora</b><span className="chip">Pergunta {i + 1}/5</span><span className="chip">⭐ {score}</span></div>
      <div style={{ fontSize: 40 }}>🧒👧👦 {q.icon}</div>
      <div className="bubble">{fb ?? q.q}</div>
      <div className="choices">{q.opts.map((o) => <button key={o} className="btn" onClick={() => answer(o)}><span>{o}</span></button>)}</div>
    </div>
  );
}
