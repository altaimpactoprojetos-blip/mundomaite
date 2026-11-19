import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { useGame, pickSave, type SaveData } from './gameStore';
import { rt } from '../systems/runtime';

const KEY = 'mundo-da-maite-save-v1';

export async function loadGame() {
  let data: Partial<SaveData> | undefined;
  try {
    data = await idbGet(KEY);
  } catch {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch { /* sem armazenamento */ }
  }
  useGame.getState().hydrate(data ?? {});
  // depois tenta a nuvem (se tiver algo mais novo de outro aparelho)
  void import('./cloud').then(({ cloudPull, startCloudSync }) => cloudPull().finally(startCloudSync));
  const s = useGame.getState();
  rt.player.pos.set(...s.playerPos);
  rt.hour = s.hour;
}

let pending = false;
export async function saveNow() {
  const s = useGame.getState();
  if (!s.loaded) return;
  const p = rt.player.pos;
  const data = { ...pickSave(s), playerPos: [p.x, Math.max(0, p.y), p.z] as [number, number, number], hour: rt.hour };
  try {
    await idbSet(KEY, data);
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...data, photos: data.photos.slice(0, 5) }));
    } catch { /* cheio */ }
  }
}

export function startAutosave() {
  // salva quando algo muda (com atraso) e a cada 20s
  useGame.subscribe(() => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      saveNow();
    }, 1500);
  });
  setInterval(saveNow, 20000);
  window.addEventListener('pagehide', () => void saveNow());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void saveNow();
  });
}

export async function wipeSave() {
  await idbDel(KEY).catch(() => undefined);
  localStorage.removeItem(KEY);
}

export function exportSave(): string {
  return JSON.stringify(pickSave(useGame.getState()));
}
export function importSave(json: string) {
  const d = JSON.parse(json);
  useGame.getState().hydrate(d);
  rt.player.pos.set(...useGame.getState().playerPos);
}
