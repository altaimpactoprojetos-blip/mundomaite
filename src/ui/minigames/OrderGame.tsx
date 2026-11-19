import { useMemo, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { sfx } from '../../systems/audio';
import { rt, spawnEffect } from '../../systems/runtime';

interface Req { who: string; say: string; answer: string[]; ordered?: boolean }
interface Cfg { title: string; options: [string, string][]; make: () => Req; rounds: number; reward: number }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const CUST = ['👧', '👦', '👩', '👨', '👵', '👴', '🧒', '👱‍♀️'];

export const ORDER_CFG: Record<string, Cfg> = {
  medica: {
    title: 'Consultório da Dra.', rounds: 5, reward: 25,
    options: [['🌡️', 'Termômetro'], ['🩹', 'Curativo'], ['💊', 'Xarope'], ['🧊', 'Gelinho'], ['🩺', 'Escutar'], ['🍎', 'Frutas']],
    make: () => pick([
      { who: pick(CUST), say: 'Estou quentinho... acho que estou com febre! 🥵', answer: ['🌡️'] },
      { who: pick(CUST), say: 'Ralei o joelho brincando! 😢', answer: ['🩹'] },
      { who: pick(CUST), say: 'Estou com tosse... cof cof! 😷', answer: ['💊'] },
      { who: pick(CUST), say: 'Bati a cabeça e fez um galo! 🤕', answer: ['🧊'] },
      { who: pick(CUST), say: 'Meu coração está batendo forte depois de correr!', answer: ['🩺'] },
      { who: pick(CUST), say: 'Quero ficar forte e saudável! 💪', answer: ['🍎'] },
    ]),
  },
  veterinaria: {
    title: 'Clínica dos Bichinhos', rounds: 5, reward: 25,
    options: [['🪮', 'Escovar'], ['🩹', 'Curativo'], ['🦴', 'Petisco'], ['🛁', 'Banho'], ['💉', 'Vacina'], ['🎾', 'Brincar']],
    make: () => pick([
      { who: pick(['🐶', '🐕']), say: 'Au! Meu pelo está todo embaraçado!', answer: ['🪮'] },
      { who: pick(['🐱', '🐈']), say: 'Miau... machuquei a patinha!', answer: ['🩹'] },
      { who: pick(['🐰', '🐹']), say: 'Estou com fominha!', answer: ['🦴'] },
      { who: pick(['🐷', '🐶']), say: 'Rolei na lama e estou sujinho!', answer: ['🛁'] },
      { who: pick(['🐴', '🐮']), say: 'Vim tomar minha vacina para ficar protegido!', answer: ['💉'] },
      { who: pick(['🐕', '🦊']), say: 'Estou tristinho e entediado...', answer: ['🎾'] },
    ]),
  },
  lojista: {
    title: 'Minha Lojinha', rounds: 5, reward: 22,
    options: [['👗', 'Vestido'], ['👟', 'Tênis'], ['🎒', 'Mochila'], ['🧸', 'Ursinho'], ['🎀', 'Laço'], ['👒', 'Chapéu'], ['🕶️', 'Óculos'], ['🎈', 'Balão']],
    make: () => {
      const opts = ['👗', '👟', '🎒', '🧸', '🎀', '👒', '🕶️', '🎈'];
      const names: Record<string, string> = { '👗': 'um vestido', '👟': 'um tênis', '🎒': 'uma mochila', '🧸': 'um ursinho', '🎀': 'um laço', '👒': 'um chapéu', '🕶️': 'óculos', '🎈': 'um balão' };
      const a = pick(opts);
      let b = pick(opts);
      while (b === a) b = pick(opts);
      const two = Math.random() < 0.5;
      return { who: pick(CUST), say: two ? `Eu quero ${names[a]} e ${names[b]}, por favor!` : `Olá! Você tem ${names[a]}?`, answer: two ? [a, b] : [a] };
    },
  },
  cafe: {
    title: 'Cafeteria Nuvem de Leite', rounds: 5, reward: 22,
    options: [['☕', 'Café'], ['🍫', 'Chocolate'], ['🧃', 'Suco'], ['🍰', 'Bolo'], ['🍪', 'Biscoito'], ['🧁', 'Cupcake'], ['🥐', 'Croissant'], ['🍩', 'Rosquinha']],
    make: () => {
      const drinks = ['☕', '🍫', '🧃'];
      const foods = ['🍰', '🍪', '🧁', '🥐', '🍩'];
      const n: Record<string, string> = { '☕': 'um café', '🍫': 'um chocolate quente', '🧃': 'um suco', '🍰': 'bolo', '🍪': 'biscoito', '🧁': 'cupcake', '🥐': 'croissant', '🍩': 'rosquinha' };
      const d = pick(drinks), f = pick(foods);
      return { who: pick(CUST), say: `Quero ${n[d]} com ${n[f]}, por favor! 😋`, answer: [d, f] };
    },
  },
  chef: {
    title: 'Cozinha do Restaurante', rounds: 4, reward: 30,
    options: [['🍝', 'Macarrão'], ['🍅', 'Tomate'], ['🧀', 'Queijo'], ['🥚', 'Ovo'], ['🥛', 'Leite'], ['🍓', 'Morango'], ['🥕', 'Cenoura'], ['🥦', 'Brócolis'], ['🍞', 'Pão'], ['🍌', 'Banana']],
    make: () => pick([
      { who: '🍝', say: 'Receita: MACARRÃO! Coloque na ordem: 🍝 → 🍅 → 🧀', answer: ['🍝', '🍅', '🧀'], ordered: true },
      { who: '🥞', say: 'Receita: PANQUECA! Ordem: 🥚 → 🥛 → 🍓', answer: ['🥚', '🥛', '🍓'], ordered: true },
      { who: '🥗', say: 'Receita: SALADA! Ordem: 🥦 → 🥕 → 🍅', answer: ['🥦', '🥕', '🍅'], ordered: true },
      { who: '🥪', say: 'Receita: SANDUÍCHE! Ordem: 🍞 → 🧀 → 🍅', answer: ['🍞', '🧀', '🍅'], ordered: true },
      { who: '🥤', say: 'Receita: VITAMINA! Ordem: 🍌 → 🍓 → 🥛', answer: ['🍌', '🍓', '🥛'], ordered: true },
    ]),
  },
};

export function OrderGame({ job, onDone }: { job: string; onDone: (stars: number) => void }) {
  const cfg = ORDER_CFG[job];
  const [round, setRound] = useState(0);
  const [req, setReq] = useState<Req>(() => cfg.make());
  const [chosen, setChosen] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const opts = useMemo(() => cfg.options, [cfg]);

  const next = (ok: boolean) => {
    if (ok) { setScore((s) => s + 1); sfx('coin'); spawnEffect('hearts', rt.player.pos); }
    setMsg(ok ? pick(['Perfeito! ⭐', 'Muito obrigada! 💖', 'Você é demais! 🌟', 'Hmmm, delícia! 😋']) : 'Ops! Vamos tentar o próximo 💪');
    setTimeout(() => {
      setMsg(null);
      setChosen([]);
      if (round + 1 >= cfg.rounds) onDone(score + (ok ? 1 : 0));
      else { setRound(round + 1); setReq(cfg.make()); }
    }, 1100);
  };
  const choose = (id: string) => {
    if (msg) return;
    sfx('pop');
    const c = [...chosen, id];
    if (req.ordered) {
      if (req.answer[c.length - 1] !== id) return next(false);
      setChosen(c);
      if (c.length === req.answer.length) next(true);
      return;
    }
    if (!req.answer.includes(id)) return next(false);
    if (c.includes(id) && chosen.includes(id)) return;
    setChosen(c);
    if (req.answer.every((a) => c.includes(a))) next(true);
  };
  return (
    <div className="mg">
      <div className="row"><b>{cfg.title}</b><span className="chip">Cliente {round + 1}/{cfg.rounds}</span><span className="chip">⭐ {score}</span></div>
      <div className="big-emoji" style={{ animation: 'float 2s infinite' }}>{req.who}</div>
      <div className="bubble">{msg ?? req.say}</div>
      <div className="row" style={{ minHeight: 40, fontSize: 30 }}>{chosen.map((c, i) => <span key={i}>{c}</span>)}</div>
      <div className="choices">
        {opts.map(([id, n]) => <button key={id} className={`btn ${chosen.includes(id) ? 'mint' : ''}`} onClick={() => choose(id)}><span>{id}</span>{n}</button>)}
      </div>
    </div>
  );
}
