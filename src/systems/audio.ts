// Sons sintetizados (sem arquivos de áudio — funciona offline e é leve).
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxVol = 0.7;
let musicVol = 0.35;
let musicTimer: number | null = null;

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = musicVol * 0.25;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, delay = 0, slide = 0, dest?: AudioNode) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(dest ?? master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol = 0.2) {
  const c = ac();
  if (!c || !master) return;
  const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource();
  s.buffer = b;
  const g = c.createGain();
  g.gain.value = vol;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 1200;
  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start();
}

export type Sfx = 'click' | 'coin' | 'buy' | 'pop' | 'error' | 'fanfare' | 'sparkle' | 'jump' | 'splash' | 'honk' | 'hug' | 'note' | 'bark' | 'meow' | 'whoosh' | 'camera' | 'door';

export function sfx(name: Sfx, pitch = 1) {
  const v = sfxVol;
  if (v <= 0) return;
  switch (name) {
    case 'click': tone(880, 0.06, 'triangle', 0.15 * v); break;
    case 'pop': tone(500, 0.1, 'sine', 0.3 * v, 0, 400); break;
    case 'coin': tone(988, 0.08, 'square', 0.12 * v); tone(1319, 0.25, 'square', 0.12 * v, 0.08); break;
    case 'buy': [523, 659, 784].forEach((f, i) => tone(f, 0.15, 'triangle', 0.2 * v, i * 0.07)); break;
    case 'error': tone(220, 0.2, 'sawtooth', 0.12 * v, 0, -80); break;
    case 'fanfare': [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.14, 'triangle', 0.22 * v, i * 0.12)); break;
    case 'sparkle': [1568, 2093, 2637].forEach((f, i) => tone(f, 0.12, 'sine', 0.12 * v, i * 0.05)); break;
    case 'jump': tone(300 * pitch, 0.15, 'sine', 0.18 * v, 0, 300); break;
    case 'splash': noise(0.4, 0.25 * v); break;
    case 'honk': tone(392, 0.18, 'square', 0.12 * v); tone(392, 0.25, 'square', 0.12 * v, 0.22); break;
    case 'hug': tone(660, 0.2, 'sine', 0.2 * v); tone(880, 0.3, 'sine', 0.2 * v, 0.12); break;
    case 'note': tone(440 * pitch, 0.45, 'triangle', 0.25 * v); break;
    case 'bark': tone(520, 0.08, 'sawtooth', 0.12 * v, 0, -200); tone(480, 0.1, 'sawtooth', 0.12 * v, 0.14, -200); break;
    case 'meow': tone(700, 0.35, 'sine', 0.15 * v, 0, 300); break;
    case 'whoosh': noise(0.3, 0.15 * v); break;
    case 'camera': noise(0.08, 0.3 * v); tone(1800, 0.05, 'square', 0.08 * v, 0.05); break;
    case 'door': tone(200, 0.12, 'triangle', 0.2 * v); break;
  }
}

export function setVolumes(music: number, effects: number) {
  sfxVol = effects;
  musicVol = music;
  if (musicGain) musicGain.gain.value = music * 0.25;
}

// Musiquinha de fundo procedural (escala pentatônica, calma)
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
const CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];
export function startMusic() {
  if (musicTimer !== null) return;
  let step = 0;
  const base = 261.63;
  const f = (semi: number) => base * Math.pow(2, semi / 12);
  musicTimer = window.setInterval(() => {
    const c = ac();
    if (!c || !musicGain || musicVol <= 0) { step++; return; }
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    if (step % 8 === 0) chord.forEach((s) => tone(f(s - 12), 2.6, 'sine', 0.35, 0, 0, musicGain!));
    if (Math.random() < 0.7) tone(f(SCALE[Math.floor(Math.random() * SCALE.length)] + chord[0] * 0), 0.5, 'triangle', 0.4, 0, 0, musicGain!);
    step++;
  }, 340);
}
export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
}
