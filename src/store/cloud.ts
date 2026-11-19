// Salvamento na nuvem (Supabase do próprio pai/mãe). Sem login e sem dados pessoais:
// o progresso fica guardado com um "código da família" secreto, gerado no aparelho.
import { useGame, pickSave, type SaveData } from './gameStore';

const URL = 'https://vdjovchltmyhuvlwxzwr.supabase.co/rest/v1/rpc';
const KEY = 'sb_publishable_wLOjg2iczMMuH55bjjXLDw_zEBiQRYN'; // chave pública (feita para ficar no app)
const CODE_KEY = 'mundo-da-maite-codigo';

export const cloud = { status: 'off' as 'off' | 'ok' | 'salvando' | 'erro' | 'offline', last: 0 };

function randomCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a = new Uint32Array(20);
  crypto.getRandomValues(a);
  const s = Array.from(a, (n) => abc[n % abc.length]).join('');
  return `MAITE-${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}-${s.slice(15)}`;
}

export function familyCode(): string {
  let c = '';
  try { c = localStorage.getItem(CODE_KEY) || ''; } catch { /* sem armazenamento */ }
  if (!c) { c = randomCode(); try { localStorage.setItem(CODE_KEY, c); } catch { /* */ } }
  return c;
}
export function setFamilyCode(c: string) {
  try { localStorage.setItem(CODE_KEY, c.trim().toUpperCase()); } catch { /* */ }
}

async function rpc(fn: string, body: unknown) {
  const r = await fetch(`${URL}/${fn}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function payload(): SaveData & { savedAt: number } {
  const s = pickSave(useGame.getState());
  // fotos ocupam muito: guarda as 12 mais recentes na nuvem
  return { ...s, photos: s.photos.slice(0, 12), paintings: s.paintings.slice(0, 6), savedAt: Date.now() };
}

export async function cloudPush() {
  if (!useGame.getState().settings.cloud) { cloud.status = 'off'; return; }
  if (!navigator.onLine) { cloud.status = 'offline'; return; }
  cloud.status = 'salvando';
  try {
    await rpc('maite_save', { p_code: familyCode(), p_data: payload() });
    cloud.status = 'ok';
    cloud.last = Date.now();
    try { localStorage.setItem('mundo-da-maite-savedAt', String(Date.now())); } catch { /* */ }
  } catch {
    cloud.status = 'erro';
  }
}

/** Baixa da nuvem; se o da nuvem for mais novo que o deste aparelho, usa ele. */
export async function cloudPull(force = false): Promise<boolean> {
  if (!useGame.getState().settings.cloud && !force) return false;
  if (!navigator.onLine) { cloud.status = 'offline'; return false; }
  try {
    const res = await rpc('maite_load', { p_code: familyCode() });
    if (!res || !res.data) { cloud.status = 'ok'; return false; }
    const remote = res.data as SaveData & { savedAt?: number };
    let localAt = 0;
    try { localAt = Number(localStorage.getItem('mundo-da-maite-savedAt') || 0); } catch { /* */ }
    if (force || (remote.savedAt ?? 0) > localAt) {
      const keepSettings = useGame.getState().settings;
      useGame.getState().hydrate({ ...remote, settings: { ...remote.settings, cloud: keepSettings.cloud } });
      try { localStorage.setItem('mundo-da-maite-savedAt', String(remote.savedAt ?? Date.now())); } catch { /* */ }
      cloud.status = 'ok';
      return true;
    }
    cloud.status = 'ok';
    return false;
  } catch {
    cloud.status = 'erro';
    return false;
  }
}

let timer: number | null = null;
export function startCloudSync() {
  useGame.subscribe(() => {
    if (timer !== null) return;
    timer = window.setTimeout(() => { timer = null; void cloudPush(); }, 12000);
  });
  window.addEventListener('pagehide', () => void cloudPush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void cloudPush(); });
  window.addEventListener('online', () => void cloudPush());
}
