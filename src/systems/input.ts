// Entrada unificada: teclado + joystick virtual (tablet).
const keys = new Set<string>();
const pressed = new Set<string>();

export const joy = { x: 0, y: 0, active: false };
export const touchBtns = { jump: false, up: false, down: false, run: false };

function isTyping() {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (isTyping()) return;
    const k = e.key.toLowerCase();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
}

export const key = (k: string) => keys.has(k);

/** Retorna true uma única vez por toque de tecla. */
export function consume(k: string) {
  if (pressed.has(k)) {
    pressed.delete(k);
    return true;
  }
  return false;
}
export function press(k: string) {
  pressed.add(k);
}
export function clearPressed() {
  pressed.clear();
}

/** Vetor de movimento (x: direita, y: frente) */
export function moveVector() {
  let x = 0;
  let y = 0;
  if (keys.has('w') || keys.has('arrowup')) y += 1;
  if (keys.has('s') || keys.has('arrowdown')) y -= 1;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (joy.active) {
    x += joy.x;
    y += joy.y;
  }
  const l = Math.hypot(x, y);
  if (l > 1) {
    x /= l;
    y /= l;
  }
  return { x, y };
}
export const wantsRun = () => keys.has('shift') || touchBtns.run;
export const wantsUp = () => keys.has(' ') || touchBtns.up || touchBtns.jump;
export const wantsDown = () => keys.has('control') || keys.has('c') || touchBtns.down;
