import { useGame } from '../store/gameStore';
import { rt, emote } from '../systems/runtime';
import { sfx } from '../systems/audio';

/** Tira uma foto da tela do jogo e guarda no álbum (só no aparelho). */
export function takePhoto() {
  const c = rt.canvas;
  if (!c) return;
  emote('photo', 1);
  sfx('camera');
  requestAnimationFrame(() => {
    try {
      const W = 640;
      const H = Math.round((c.height / c.width) * W);
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const g = off.getContext('2d')!;
      g.drawImage(c, 0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(0, H - 34, W, 34);
      g.fillStyle = '#e83e8c';
      g.font = 'bold 20px sans-serif';
      g.fillText('📸 Mundo da Maitê', 12, H - 11);
      const url = off.toDataURL('image/jpeg', 0.75);
      const s = useGame.getState();
      s.addPhoto(url, (window as unknown as { __zone?: string }).__zone ?? '');
      (window as unknown as { __zone?: string }).__zone = undefined;
      s.toast('Foto guardada no álbum! 📸', '📸');
    } catch {
      useGame.getState().toast('Não deu para tirar a foto agora', '📷');
    }
  });
}
