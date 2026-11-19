import type { ActionSpec, ItemCategory } from '../types';

// Definições dos modelos de objetos (móveis, construção, decoração...).
// Tamanho em metros [largura, altura, profundidade]; origem no centro da base.
export interface ModelDef {
  id: string;
  name: string;
  icon: string;
  cat: ItemCategory;
  size: [number, number, number];
  color: string;
  price: number;
  solid?: boolean; // tem colisão
  walk?: boolean; // dá para subir em cima
  action?: ActionSpec;
  water?: boolean; // vira área de água (piscina)
  parts?: 'door' | 'stairs' | 'arch' | 'none';
}

const M = (
  id: string, name: string, icon: string, cat: ItemCategory, size: [number, number, number], color: string, price: number,
  extra: Partial<ModelDef> = {},
): ModelDef => ({ id, name, icon, cat, size, color, price, solid: true, ...extra });

export const MODELS: ModelDef[] = [
  // ---------- Construção ----------
  M('parede', 'Parede', '🧱', 'construcao', [4, 3.2, 0.3], '#fdf6ec', 10),
  M('parede-janela', 'Parede com janela', '🪟', 'construcao', [4, 3.2, 0.3], '#fdf6ec', 15),
  M('parede-porta', 'Parede com porta', '🚪', 'construcao', [4, 3.2, 0.3], '#fdf6ec', 15, { parts: 'door' }),
  M('meia-parede', 'Mureta', '▭', 'construcao', [4, 1.1, 0.3], '#fdf6ec', 8),
  M('piso', 'Piso / Laje', '⬜', 'construcao', [4, 0.2, 4], '#e8d5b7', 8, { walk: true }),
  M('telhado', 'Telhado', '🏠', 'construcao', [4, 1.6, 4], '#e06c75', 12),
  M('escada', 'Escada', '🪜', 'construcao', [2, 3.2, 4.4], '#c8a27a', 20, { parts: 'stairs' }),
  M('rampa', 'Rampa', '📐', 'construcao', [3, 1, 4], '#c8a27a', 15, { parts: 'stairs' }),
  M('coluna', 'Coluna', '🏛️', 'construcao', [0.6, 3.2, 0.6], '#ffffff', 8),
  M('cerca', 'Cerca', '🚧', 'construcao', [3, 1, 0.15], '#ffffff', 5),
  M('arco', 'Arco', '⛩️', 'construcao', [4, 3.5, 0.6], '#ffc2d9', 18, { parts: 'arch' }),
  M('vidro', 'Parede de vidro', '🔲', 'construcao', [4, 3.2, 0.15], '#c7e5ff', 18),
  M('bloco', 'Bloco', '🟫', 'construcao', [1, 1, 1], '#ffd23f', 3, { walk: true }),
  M('plataforma', 'Plataforma', '🟪', 'construcao', [6, 0.4, 6], '#d4b8ff', 15, { walk: true }),

  // ---------- Móveis ----------
  M('sofa', 'Sofá', '🛋️', 'moveis', [2.4, 1, 1], '#ff8fc7', 40, { action: { type: 'sit' }, walk: true }),
  M('poltrona', 'Poltrona', '💺', 'moveis', [1.1, 1, 1], '#9d4edd', 25, { action: { type: 'sit' }, walk: true }),
  M('cama', 'Cama', '🛏️', 'moveis', [1.3, 0.8, 2.2], '#c7e5ff', 45, { action: { type: 'sleep' }, walk: true }),
  M('cama-casal', 'Cama de casal', '🛏️', 'moveis', [2.2, 0.9, 2.4], '#ffc2d9', 70, { action: { type: 'sleep' }, walk: true }),
  M('cama-princesa', 'Cama de princesa', '👑', 'moveis', [1.8, 2.6, 2.4], '#ffb3d9', 120, { action: { type: 'sleep' } }),
  M('beliche', 'Beliche', '🛏️', 'moveis', [1.3, 2.2, 2.2], '#5ab0ff', 60, { action: { type: 'sleep' } }),
  M('mesa', 'Mesa', '🍽️', 'moveis', [2, 0.8, 1.2], '#c8a27a', 30, { walk: true }),
  M('mesa-redonda', 'Mesa redonda', '⚪', 'moveis', [1.3, 0.8, 1.3], '#ffffff', 25, { walk: true }),
  M('cadeira', 'Cadeira', '🪑', 'moveis', [0.6, 1.1, 0.6], '#8d5b3a', 10, { action: { type: 'sit' }, solid: false }),
  M('banquinho', 'Banquinho', '🪑', 'moveis', [0.5, 0.6, 0.5], '#ffd23f', 6, { action: { type: 'sit' }, solid: false }),
  M('estante', 'Estante de livros', '📚', 'moveis', [1.8, 2.2, 0.5], '#8d5b3a', 35),
  M('guarda-roupa', 'Guarda-roupa', '🚪', 'moveis', [1.8, 2.3, 0.7], '#fdf6ec', 50, { action: { type: 'editor', tab: 'roupas' } }),
  M('escrivaninha', 'Escrivaninha', '🖊️', 'moveis', [1.5, 0.8, 0.7], '#ffffff', 30),
  M('geladeira', 'Geladeira', '🧊', 'moveis', [0.9, 2, 0.8], '#f2f2f2', 60, { action: { type: 'snack', item: 'sorvete', name: 'um sorvete' } }),
  M('fogao', 'Fogão', '🍳', 'moveis', [0.9, 1, 0.8], '#ffffff', 45, { action: { type: 'job', job: 'chef' } }),
  M('pia', 'Pia', '🚰', 'moveis', [1.4, 1, 0.7], '#ffffff', 30),
  M('armario', 'Armário de cozinha', '🗄️', 'moveis', [1.8, 1, 0.7], '#bdf5e0', 35),
  M('banheira', 'Banheira', '🛁', 'moveis', [1.8, 0.7, 0.9], '#ffffff', 50, { action: { type: 'bath' } }),
  M('tv', 'Televisão', '📺', 'moveis', [1.8, 1.4, 0.5], '#222831', 70, { action: { type: 'tv' } }),
  M('computador', 'Computador', '💻', 'moveis', [1.2, 1.3, 0.7], '#ffffff', 60, { action: { type: 'message', text: 'Você jogou um joguinho de pintar no computador! 🎨', icon: '💻' } }),
  M('piano', 'Piano', '🎹', 'moveis', [1.8, 1.4, 0.8], '#222831', 90, { action: { type: 'piano' } }),
  M('abajur', 'Abajur', '💡', 'moveis', [0.5, 1.5, 0.5], '#ffe066', 15, { solid: false }),
  M('tapete', 'Tapete', '🟥', 'moveis', [3, 0.03, 2], '#ff8fc7', 15, { solid: false }),
  M('tapete-redondo', 'Tapete redondo', '⭕', 'moveis', [2.4, 0.03, 2.4], '#d4b8ff', 15, { solid: false }),
  M('espelho', 'Espelho mágico', '🪞', 'moveis', [1, 2, 0.2], '#c7e5ff', 30, { action: { type: 'editor' } }),
  M('penteadeira', 'Penteadeira', '💄', 'moveis', [1.4, 1.8, 0.6], '#ffc2d9', 45, { action: { type: 'editor', tab: 'cabelo' } }),
  M('bau', 'Baú de brinquedos', '🧰', 'moveis', [1.2, 0.8, 0.7], '#ff7b54', 25, { action: { type: 'message', text: 'Você encontrou brinquedos no baú! 🧸🪀🎲', icon: '🧸' } }),

  // ---------- Decoração ----------
  M('quadro', 'Quadro', '🖼️', 'decoracao', [1.4, 1, 0.08], '#5ab0ff', 15, { solid: false }),
  M('vaso-flor', 'Vaso de flores', '💐', 'decoracao', [0.5, 0.9, 0.5], '#ff8fc7', 10, { solid: false }),
  M('planta', 'Planta grande', '🪴', 'decoracao', [0.8, 1.6, 0.8], '#3ccf91', 15),
  M('relogio', 'Relógio', '🕰️', 'decoracao', [0.7, 0.7, 0.1], '#ffd23f', 12, { solid: false }),
  M('aquario', 'Aquário', '🐠', 'decoracao', [1.4, 1.4, 0.6], '#5ab0ff', 40),
  M('globo', 'Globo', '🌍', 'decoracao', [0.6, 1, 0.6], '#5ab0ff', 15),
  M('trofeu', 'Troféu', '🏆', 'decoracao', [0.5, 0.9, 0.5], '#ffd23f', 25, { solid: false }),
  M('luzinhas', 'Varal de luzinhas', '✨', 'decoracao', [4, 0.6, 0.1], '#ffe066', 15, { solid: false }),
  M('baloes', 'Balões', '🎈', 'decoracao', [1, 2.6, 1], '#ff5fa2', 8, { solid: false }),
  M('letreiro', 'Letreiro', '🪧', 'decoracao', [3, 1, 0.15], '#ffffff', 10, { solid: false }),
  M('neon', 'Coração neon', '💖', 'decoracao', [1.2, 1.2, 0.1], '#ff5fa2', 25, { solid: false }),
  M('ursao', 'Urso gigante', '🧸', 'decoracao', [1.4, 1.8, 1.2], '#c8a27a', 40),

  // ---------- Jardim ----------
  M('arvore', 'Árvore', '🌳', 'jardim', [3, 5, 3], '#3ccf91', 15),
  M('arvore-flor', 'Cerejeira', '🌸', 'jardim', [3, 5, 3], '#ffb3d9', 20),
  M('palmeira', 'Palmeira', '🌴', 'jardim', [3, 6, 3], '#3ccf91', 18),
  M('pinheiro', 'Pinheiro', '🌲', 'jardim', [2.5, 6, 2.5], '#1f9e63', 15),
  M('arbusto', 'Arbusto', '🌿', 'jardim', [1.5, 1, 1.5], '#3ccf91', 5),
  M('flores', 'Flores', '🌷', 'jardim', [1.2, 0.5, 1.2], '#ff8fc7', 4, { solid: false }),
  M('canteiro', 'Canteiro', '🌼', 'jardim', [3, 0.6, 1], '#ffd23f', 10),
  M('fonte', 'Fonte', '⛲', 'jardim', [3, 2.2, 3], '#c7e5ff', 60),
  M('banco', 'Banco de praça', '🪑', 'jardim', [2, 0.9, 0.7], '#8d5b3a', 15, { action: { type: 'sit' } }),
  M('poste', 'Poste de luz', '🏮', 'jardim', [0.4, 4, 0.4], '#4a4e57', 15),
  M('mesa-piquenique', 'Mesa de piquenique', '🧺', 'jardim', [2, 0.8, 1.8], '#c8a27a', 20, { action: { type: 'sit' } }),
  M('guarda-sol', 'Guarda-sol', '⛱️', 'jardim', [2.6, 2.6, 2.6], '#ff7b54', 15, { solid: false }),
  M('cogumelo', 'Cogumelo gigante', '🍄', 'jardim', [1.6, 2, 1.6], '#e63946', 20),
  M('pedra', 'Pedra', '🪨', 'jardim', [1.4, 0.9, 1.2], '#9aa0a6', 5, { walk: true }),
  M('casinha-passaro', 'Casinha de passarinho', '🐦', 'jardim', [0.6, 2, 0.6], '#ffb066', 12),
  M('horta', 'Canteiro de horta', '🥕', 'jardim', [2, 0.4, 2], '#8d5b3a', 10, { solid: false }),

  // ---------- Parque ----------
  M('balanco', 'Balanço', '🎠', 'parque', [3, 2.6, 1.4], '#ff5fa2', 40, { action: { type: 'swing' } }),
  M('escorregador', 'Escorregador', '🛝', 'parque', [1.2, 2.4, 4], '#5ab0ff', 45, { parts: 'stairs' }),
  M('gangorra', 'Gangorra', '⚖️', 'parque', [4, 1, 0.6], '#ffd23f', 25, { action: { type: 'sit' } }),
  M('cama-elastica', 'Cama elástica', '🤸', 'parque', [3.4, 0.8, 3.4], '#9d4edd', 50, { action: { type: 'trampoline' }, walk: true }),
  M('castelo-inflavel', 'Castelo inflável', '🏰', 'parque', [4, 3.4, 4], '#ff8fc7', 80, { action: { type: 'trampoline' } }),
  M('caixa-areia', 'Caixa de areia', '🏖️', 'parque', [3, 0.4, 3], '#ffe7a6', 15, { solid: false }),
  M('piscina', 'Piscina', '🏊', 'parque', [6, 0.25, 4], '#5ab0ff', 80, { water: true, solid: false }),
  M('piscina-bolinhas', 'Piscina de bolinhas', '🔴', 'parque', [3, 0.8, 3], '#ffffff', 40, { action: { type: 'dance' } }),

  // ---------- Loja ----------
  M('balcao', 'Balcão', '🧾', 'loja', [3, 1.1, 0.9], '#ffc2d9', 30, { action: { type: 'job', job: 'lojista' } }),
  M('prateleira', 'Prateleira', '🗃️', 'loja', [2.4, 2, 0.6], '#fdf6ec', 25),
  M('caixa-registradora', 'Caixa registradora', '💰', 'loja', [1.2, 1.3, 0.8], '#3ccf91', 30, { action: { type: 'job', job: 'lojista' } }),
  M('arara', 'Arara de roupas', '👗', 'loja', [2, 1.8, 0.6], '#9aa0a6', 25, { action: { type: 'shop', cat: 'roupas' } }),
  M('vitrine', 'Vitrine', '🧁', 'loja', [2, 1.2, 0.9], '#c7e5ff', 35, { action: { type: 'job', job: 'cafe' } }),
  M('maquina-cafe', 'Máquina de café', '☕', 'loja', [0.8, 1.6, 0.6], '#8d5b3a', 35, { action: { type: 'job', job: 'cafe' } }),
  M('toldo', 'Toldo', '⛺', 'loja', [4, 0.8, 1.6], '#ff5fa2', 15, { solid: false }),
  M('carrinho-pipoca', 'Carrinho de pipoca', '🍿', 'loja', [1.4, 2.2, 1], '#e63946', 30, { action: { type: 'snack', item: 'pipoca', name: 'pipoca' } }),
  M('carrinho-sorvete', 'Carrinho de sorvete', '🍦', 'loja', [1.6, 2.2, 1], '#ffb3d9', 30, { action: { type: 'snack', item: 'sorvete', name: 'um sorvete' } }),
  M('microfone', 'Palco com microfone', '🎤', 'loja', [4, 0.5, 3], '#9d4edd', 60, { action: { type: 'job', job: 'cantora' }, walk: true }),
  M('cavalete', 'Cavalete de pintura', '🎨', 'loja', [1, 1.8, 0.8], '#c8a27a', 20, { action: { type: 'job', job: 'artista' } }),

  // ---------- Especiais ----------
  M('arco-iris', 'Arco-íris', '🌈', 'especiais', [8, 4.5, 1], '#ff5fa2', 100, { solid: false }),
  M('coracao', 'Coração gigante', '💗', 'especiais', [2.4, 2.4, 0.8], '#ff5fa2', 50),
  M('estrela', 'Estrela gigante', '⭐', 'especiais', [2.4, 2.4, 0.8], '#ffd23f', 50),
  M('nuvem', 'Nuvem fofinha', '☁️', 'especiais', [3, 1.4, 2], '#ffffff', 40, { walk: true }),
  M('bolo', 'Bolo gigante', '🎂', 'especiais', [2.4, 2.4, 2.4], '#ffc2d9', 60, { walk: true }),
  M('estatua-unicornio', 'Estátua de unicórnio', '🦄', 'especiais', [1.6, 2.6, 2.4], '#ffffff', 80),
  M('trono', 'Trono', '👑', 'especiais', [1.4, 2.4, 1.2], '#ffd23f', 90, { action: { type: 'sit' } }),
  M('foguete', 'Foguete', '🚀', 'especiais', [2, 6, 2], '#ffffff', 120),
  M('portal', 'Portal mágico', '🌀', 'especiais', [3, 3.6, 0.6], '#9d4edd', 150, { solid: false, action: { type: 'teleport', to: [0, 0, 10], label: 'Viajar para a Praça' } }),
  M('carrossel', 'Mini carrossel', '🎠', 'especiais', [4, 3.2, 4], '#ffb3d9', 150, { action: { type: 'swing' } }),
  M('castelinho', 'Casinha de boneca', '🏡', 'especiais', [3, 3, 3], '#ffc2d9', 90, { parts: 'door' }),
];

export const MODEL_MAP: Record<string, ModelDef> = Object.fromEntries(MODELS.map((m) => [m.id, m]));
export const getModel = (id: string): ModelDef =>
  MODEL_MAP[id] ?? { id, name: id, icon: '❓', cat: 'decoracao', size: [1, 1, 1], color: '#ccc', price: 0, solid: true };
