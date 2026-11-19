import type { Appearance } from '../types';

export const DEFAULT_APPEARANCE: Appearance = {
  name: 'Maitê',
  skin: '#eebb99',
  hairStyle: 'chiquinhas',
  hairColor: '#4a2c1a',
  eyeColor: '#6b4423',
  eyeStyle: 'brilhante',
  top: 'vestido',
  topColor: '#ff8fc7',
  bottom: 'legging',
  bottomColor: '#ffffff',
  shoes: 'tenis',
  shoesColor: '#ffffff',
  accessories: ['laco'],
  accColor: '#ff5fa2',
  makeup: { blush: true, glitter: false, lips: false },
  expression: 'feliz',
  personality: 'criativa',
  height: 1,
};

export const isMobile = () =>
  typeof navigator !== 'undefined' && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100));
