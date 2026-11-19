import type { Fixture, ItemCategory } from '../types';

// Móveis e objetos interativos dentro de cada estabelecimento (coordenadas locais; porta em +z).
const F = (model: string, x: number, z: number, rot = 0, extra: Partial<Fixture> = {}): Fixture => ({ model, x, z, rot, ...extra });
const shop = (cat: ItemCategory, title?: string) => ({ type: 'shop' as const, cat, title });

function rows(model: string, x0: number, x1: number, z0: number, z1: number, dx: number, dz: number, rot = 0, extra: Partial<Fixture> = {}) {
  const out: Fixture[] = [];
  for (let x = x0; x <= x1 + 0.01; x += dx) for (let z = z0; z <= z1 + 0.01; z += dz) out.push(F(model, x, z, rot, extra));
  return out;
}

export function interiorFor(type: string, w: number, d: number): Fixture[] {
  const bz = -d / 2 + 1.2; // perto da parede do fundo
  const hw = w / 2 - 1.5;
  switch (type) {
    case 'escola':
      return [
        F('quadro', 0, bz - 0.5, 0, { color: '#1f6f4a', scale: [4, 1.6, 1] }),
        F('escrivaninha', 0, bz + 2, Math.PI, { color: '#ffd23f', action: { type: 'job', job: 'professora' }, label: 'Dar aula' }),
        ...rows('escrivaninha', -9, 9, -3, 3, 4.5, 3, Math.PI, { color: '#5ab0ff', scale: [0.7, 0.9, 0.9] }),
        ...rows('banquinho', -9, 9, -2.2, 3.8, 4.5, 3, 0, { color: '#ff8fc7' }),
        F('estante', -hw, 5, Math.PI / 2), F('estante', hw, 5, -Math.PI / 2), F('globo', hw - 1, bz + 1),
        F('letreiro', -8, bz - 0.4, 0, { label: 'ABC 123', color: '#ffe066' }),
        F('tapete', 0, 8, 0, { color: '#d4b8ff', scale: [2, 1, 1.5] }),
      ];
    case 'hospital':
      return [
        F('balcao', 0, 4, Math.PI, { color: '#ffffff', action: { type: 'job', job: 'medica' }, label: 'Atender pacientes' }),
        ...[-12, -7, 7, 12].map((x) => F('cama', x, bz + 1.5, 0, { color: '#c7e5ff' })),
        ...[-12, -7, 7, 12].map((x) => F('abajur', x + 1.4, bz + 0.5)),
        F('armario', 0, bz, 0, { color: '#ffffff', label: 'Remédios' }),
        ...rows('cadeira', -8, 8, 8, 8, 2, 1, Math.PI, { color: '#5ab0ff' }),
        F('planta', -hw, 10), F('planta', hw, 10), F('coracao', 0, bz - 0.2, 0, { color: '#e63946', scale: [0.5, 0.5, 0.5], y: 2.2 }),
      ];
    case 'cinema':
      return [
        ...rows('poltrona', -8, 8, -3, 4, 2, 2.3, Math.PI, { color: '#e63946', action: { type: 'cinema' }, label: 'Assistir filme' }),
        F('carrinho-pipoca', -hw + 1, d / 2 - 4, Math.PI / 2, { action: { type: 'snack', item: 'pipoca', name: 'pipoca' } }),
        F('balcao', hw - 2, d / 2 - 4, -Math.PI / 2, { color: '#9d4edd' }),
      ];
    case 'academia':
      return [
        ...rows('bloco', -8, -4, -6, 0, 2, 3, 0, { color: '#4a4e57', scale: [1.4, 0.5, 2.2], action: { type: 'exercise' }, label: 'Esteira' }),
        ...rows('tapete', 3, 9, -6, 2, 3, 4, 0, { color: '#ff8fc7', scale: [0.8, 1, 1] }),
        F('piscina-bolinhas', 6, 5, 0, { color: '#5ab0ff' }),
        F('microfone', -5, 6, 0, { color: '#ff7b54', action: { type: 'dance' }, label: 'Dançar' }),
        F('espelho', 0, bz - 0.3, 0, { scale: [4, 1, 1] }),
      ];
    case 'shopping': {
      const stores: [string, ItemCategory, string, string][] = [
        ['arara', 'roupas', 'Loja de Roupas', '#ff8fc7'], ['arara', 'vestidos', 'Vestidos', '#c77dff'], ['prateleira', 'calcados', 'Tênis & Sapatos', '#5ab0ff'],
        ['prateleira', 'bolsas', 'Bolsas', '#ffb066'], ['prateleira', 'acessorios', 'Acessórios', '#ffe066'], ['prateleira', 'brinquedos', 'Brinquedos', '#3ccf91'],
        ['prateleira', 'moveis', 'Móveis', '#c8a27a'], ['prateleira', 'decoracao', 'Decoração', '#9d4edd'],
      ];
      const out: Fixture[] = [];
      stores.forEach(([model, cat, title, color], i) => {
        const side = i < 4 ? -1 : 1;
        const k = i % 4;
        const x = -w / 2 + 6 + k * ((w - 12) / 3);
        const z = side < 0 ? bz + 0.5 : bz + 7;
        out.push(F(model, x, z, 0, { color, action: shop(cat, title), label: title }));
        out.push(F('letreiro', x, z - 0.6, 0, { color: '#ffffff', label: title, y: 1.2, scale: [1, 0.8, 1] }));
      });
      out.push(F('fonte', 0, 6, 0, { color: '#ffc2d9' }));
      out.push(...rows('mesa-redonda', -14, 14, 11, 11, 7, 1, 0, { color: '#ffffff' }));
      out.push(F('balcao', 22, 10, -Math.PI / 2, { color: '#ffd23f', action: { type: 'job', job: 'shopping' }, label: 'Administrar shopping' }));
      out.push(F('caixa-registradora', -22, 10, Math.PI / 2, { action: { type: 'job', job: 'lojista' }, label: 'Ser vendedora' }));
      out.push(F('carrinho-sorvete', 12, 15, Math.PI));
      out.push(F('arvore-flor', -6, 3, 0, { scale: [0.7, 0.7, 0.7] }), F('arvore-flor', 6, 3, 0, { scale: [0.7, 0.7, 0.7] }));
      return out;
    }
    case 'mercado':
      return [
        ...rows('prateleira', -10, 6, -6, 2, 4, 4, 0),
        F('geladeira', -hw, bz, 0, { color: '#c7e5ff', scale: [2, 1, 1] }), F('geladeira', -hw + 2.2, bz, 0, { color: '#c7e5ff', scale: [2, 1, 1] }),
        F('caixa-registradora', 10, 6, -Math.PI / 2, { action: { type: 'job', job: 'lojista' }, label: 'Ser caixa' }),
        F('balcao', 10, 0, -Math.PI / 2, { color: '#3ccf91', action: shop('brinquedos', 'Mercadinho'), label: 'Comprar' }),
        F('vitrine', 4, 9, Math.PI, { color: '#ffd23f', action: { type: 'snack', item: 'algodao', name: 'um docinho' }, label: 'Pegar docinho' }),
      ];
    case 'petshop':
      return [
        F('balcao', 0, 3, Math.PI, { color: '#7ee8c7', action: { type: 'adopt' }, label: 'Adotar um pet' }),
        F('mesa', 6, bz + 1.5, 0, { color: '#ffffff', action: { type: 'job', job: 'veterinaria' }, label: 'Cuidar dos bichinhos' }),
        ...rows('bau', -9, -3, bz + 0.5, bz + 0.5, 3, 1, 0, { color: '#ff8fc7' }),
        F('prateleira', hw - 1, 2, -Math.PI / 2, { action: shop('pets', 'Pets'), label: 'Ver pets' }),
        F('banheira', -6, 4, 0, { color: '#c7e5ff', action: { type: 'bath' }, label: 'Banho no pet' }),
        F('tapete-redondo', 0, 6, 0, { color: '#ffd23f' }),
      ];
    case 'salao':
      return [
        ...[-6, -2, 2, 6].map((x) => F('poltrona', x, bz + 1.5, 0, { color: '#ff8fc7', action: { type: 'editor', tab: 'cabelo' }, label: 'Mudar penteado' })),
        ...[-6, -2, 2, 6].map((x) => F('espelho', x, bz - 0.3, 0)),
        F('penteadeira', hw, 3, -Math.PI / 2, { action: { type: 'editor', tab: 'maquiagem' }, label: 'Maquiagem' }),
        F('balcao', -4, 5, Math.PI, { color: '#d4b8ff', action: shop('acessorios', 'Acessórios'), label: 'Acessórios' }),
        F('vaso-flor', 4, 5),
      ];
    case 'policia':
      return [
        F('escrivaninha', -5, -1, Math.PI, { color: '#7b9cff', action: { type: 'job', job: 'policial' }, label: 'Começar patrulha' }),
        F('escrivaninha', 5, -1, Math.PI, { color: '#7b9cff' }), F('computador', 5, bz),
        F('quadro', 0, bz - 0.4, 0, { color: '#c7e5ff', scale: [3, 1.5, 1] }), F('trofeu', -hw, bz),
        F('cadeira', -5, 0.5, 0), F('cadeira', 5, 0.5, 0),
      ];
    case 'restaurante':
      return [
        F('fogao', -6, bz, 0, { action: { type: 'job', job: 'chef' }, label: 'Cozinhar' }), F('fogao', -5, bz, 0), F('pia', -2.6, bz), F('geladeira', -9, bz),
        F('balcao', -5, bz + 3, 0, { color: '#ff9f5a' }),
        ...rows('mesa-redonda', 0, 9, 0, 6, 4.5, 6, 0, { color: '#ffffff' }),
        ...rows('cadeira', -1.2, 7.8, 0, 6, 4.5, 6, Math.PI / 2, { color: '#e63946' }),
        ...rows('cadeira', 1.2, 10.2, 0, 6, 4.5, 6, -Math.PI / 2, { color: '#e63946' }),
        F('vaso-flor', 0, 0, 0, { y: 0.82 }),
      ];
    case 'cafeteria':
      return [
        F('balcao', 0, -2, Math.PI, { color: '#c8a27a', action: { type: 'job', job: 'cafe' }, label: 'Atender clientes' }),
        F('maquina-cafe', -2, bz), F('vitrine', 2, bz + 0.3, 0, { color: '#ffffff', action: { type: 'snack', item: 'sorvete', name: 'um bolinho' }, label: 'Comer bolinho' }),
        ...rows('mesa-redonda', -6, 6, 3, 3, 6, 1, 0, { color: '#ffc2d9', scale: [0.8, 1, 0.8] }),
        ...rows('banquinho', -7, 7, 3, 3, 2, 1, 0, { color: '#8d5b3a' }), F('luzinhas', 0, bz - 0.3),
      ];
    case 'bombeiros':
      return [
        F('bloco', 5, -2, 0, { color: '#e63946', scale: [3, 2.6, 7], label: 'Caminhão' }),
        F('escrivaninha', -7, 0, Math.PI, { color: '#ffd23f', action: { type: 'job', job: 'bombeira' }, label: 'Atender chamado' }),
        F('coluna', -3, -4, 0, { color: '#ffd23f', scale: [0.4, 2, 0.4] }), F('armario', -9, bz, 0, { color: '#e63946', scale: [1, 2, 1] }),
      ];
    case 'sorveteria':
      return [
        F('vitrine', 0, -2, Math.PI, { color: '#bdf5e0', action: { type: 'snack', item: 'sorvete', name: 'um sorvete' }, label: 'Pegar sorvete' }),
        ...rows('mesa-redonda', -4, 4, 3, 3, 4, 1, 0, { color: '#ff8fc7', scale: [0.8, 1, 0.8] }), F('carrinho-sorvete', 5, bz + 0.5),
        ...rows('banquinho', -5, 5, 4.2, 4.2, 2.5, 1, 0, { color: '#ffffff' }),
      ];
    case 'concessionaria':
      return [
        F('balcao', 0, bz + 2, Math.PI, { color: '#5ab0ff', action: shop('carros', 'Carros'), label: 'Comprar carro' }),
        F('balcao', -10, bz + 2, Math.PI, { color: '#9d4edd', action: shop('motos', 'Motos'), label: 'Comprar moto' }),
        F('balcao', 10, bz + 2, Math.PI, { color: '#ff8fc7', action: shop('bicicletas', 'Bicicletas'), label: 'Bicicletas e patinetes' }),
        F('plataforma', -8, 4, 0, { color: '#ffffff', scale: [1, 0.5, 1] }), F('plataforma', 8, 4, 0, { color: '#ffffff', scale: [1, 0.5, 1] }),
      ];
    case 'estudio':
      return [
        F('microfone', -5, bz + 2, 0, { action: { type: 'job', job: 'cantora' }, label: 'Cantar' }),
        F('piano', -9, 2, Math.PI / 2, { action: { type: 'piano' }, label: 'Tocar piano' }),
        F('cavalete', 5, 0, Math.PI, { action: { type: 'job', job: 'artista' }, label: 'Pintar' }), F('cavalete', 8, 0, Math.PI),
        F('quadro', 6, bz - 0.4, 0, { color: '#ff8fc7' }), F('quadro', 9, bz - 0.4, 0, { color: '#ffd23f' }), F('luzinhas', -5, bz - 0.3),
      ];
    case 'biblioteca':
      return [
        ...rows('estante', -9, 9, bz, bz, 3, 1, 0), ...rows('estante', -9, -3, 0, 0, 3, 1, 0),
        F('poltrona', 5, 2, Math.PI, { color: '#ff8fc7', action: { type: 'message', text: 'Você leu "A Sereia que Queria Voar" — que história linda! 📖✨', icon: '📚' }, label: 'Ler um livro' }),
        F('poltrona', 8, 2, Math.PI, { color: '#5ab0ff', action: { type: 'message', text: 'Você leu "O Dragão que Tinha Medo do Escuro". Ele fez amizade com os vaga-lumes! 🐉', icon: '📚' }, label: 'Ler um livro' }),
        F('tapete-redondo', 6.5, 4, 0, { color: '#ffe066' }), F('globo', -hw, 6),
      ];
    case 'terminal':
      return [
        ...rows('balcao', -18, -6, bz + 2, bz + 2, 6, 1, Math.PI, { color: '#5ab0ff' }),
        F('balcao', 8, bz + 2, Math.PI, { color: '#ffd23f', action: shop('avioes', 'Aviões'), label: 'Comprar avião' }),
        ...rows('cadeira', -10, 10, 5, 7, 2, 2, Math.PI, { color: '#9aa0a6' }),
        F('letreiro', 0, bz - 0.4, 0, { label: 'Embarque ✈️', color: '#ffffff', y: 2 }),
      ];
    case 'hangar':
      return [F('bloco', 0, 0, 0, { color: '#9aa0a6', scale: [3, 0.2, 3] })];
    case 'celeiro':
      return [
        ...rows('bloco', -8, -4, -3, 3, 2, 3, 0, { color: '#ffe066', scale: [1.6, 1, 1] }),
        F('balcao', 5, 0, -Math.PI / 2, { color: '#8d5b3a', action: { type: 'job', job: 'cuidadora' }, label: 'Cuidar dos animais' }),
        F('bloco', 6, -4, 0, { color: '#3ccf91', scale: [2, 1.5, 3] }),
      ];
    case 'porto':
      return [
        F('balcao', 0, 0, Math.PI, { color: '#5ad1ff', action: shop('barcos', 'Barcos'), label: 'Comprar barco' }),
        F('aquario', -5, bz, 0), F('aquario', 5, bz, 0),
      ];
    case 'clube':
      return [F('balcao', 0, -2, Math.PI, { color: '#5ab0ff', action: { type: 'snack', item: 'sorvete', name: 'um suco geladinho' }, label: 'Pegar suco' }), ...rows('cadeira', -6, 6, 2, 2, 3, 1, Math.PI)];
    case 'lab':
      return [
        F('computador', -6, bz, 0, { action: { type: 'message', text: 'O telescópio mostrou Saturno e seus anéis! 🪐', icon: '🔭' }, label: 'Olhar o espaço' }),
        F('foguete', 6, -2, 0, { scale: [0.6, 0.6, 0.6] }), F('globo', 0, bz), F('estante', -9, 4, Math.PI / 2),
      ];
    case 'robos':
      return [
        F('balcao', 0, 0, Math.PI, { color: '#5ad1ff', action: shop('especiais', 'Itens especiais'), label: 'Itens especiais' }),
        F('estatua-unicornio', -6, bz + 1, 0, { color: '#c9d6ff' }), F('neon', 6, bz - 0.3, 0, { color: '#5ad1ff' }),
      ];
  }
  return [];
}
