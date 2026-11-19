import type { NPCDef, NPCRoutineStep } from '../types';
import { BUILDINGS, PROPERTIES } from './world';

export const MANSION = PROPERTIES.find((p) => p.preset?.name === 'Mansão das Estrelas')!;
/** Ponto em coordenadas locais do lote (frente = rua) */
export function lotPoint(lx: number, lz: number): [number, number] {
  const c = Math.cos(MANSION.rot), s = Math.sin(MANSION.rot);
  return [MANSION.pos[0] + lx * c + lz * s, MANSION.pos[1] - lx * s + lz * c];
}

/** Converte coordenadas locais de um prédio (frente = +z) para o mundo. */
export function inside(id: string, lx: number, lz: number): [number, number] {
  const b = BUILDINGS.find((x) => x.id === id)!;
  const c = Math.cos(b.rot);
  const s = Math.sin(b.rot);
  return [b.pos[0] + lx * c + lz * s, b.pos[1] - lx * s + lz * c];
}
const front = (id: string, dist = 6): [number, number] => {
  const b = BUILDINGS.find((x) => x.id === id)!;
  return inside(id, 0, b.size[2] / 2 + dist);
};

const work = (id: string, lx: number, lz: number, from = 7, to = 18, radius = 1.5): NPCRoutineStep => ({ from, to, at: inside(id, lx, lz), activity: 'work', radius });
const at = (x: number, z: number, from: number, to: number, activity: NPCRoutineStep['activity'], radius = 6): NPCRoutineStep => ({ from, to, at: [x, z], activity, radius });
const home = (x: number, z: number): NPCRoutineStep => ({ from: 21, to: 7, at: [x, z], activity: 'sleep', radius: 0 });

const PRACA: [number, number] = [65, -5];

export const NPCS: NPCDef[] = [
  { id: 'vizinha-lu', name: 'Vizinha Lu', role: 'Vizinha da Mansão', icon: '👩', personality: 'carinhosa', look: { hairStyle: 'rabo', hairColor: '#d9a35b', top: 'blusa-babado', topColor: '#5ad1ff', bottom: 'saia', bottomColor: '#ffffff', height: 1.12 },
    routine: [{ from: 6, to: 21, at: lotPoint(6, 17.5), activity: 'work', radius: 1 }, home(-185, -82)],
    lines: ['Bom dia, vizinha! Que roupa linda! 🌸', 'O Purpurina está brilhando hoje! Posso fazer carinho nele? 🦄', 'Dizem que o chocolate quente da cafeteria é o melhor da cidade! ☕', 'Vamos brincar na praça mais tarde?'] },
  // ---- Centro ----
  { id: 'lia', name: 'Lia', role: 'Vendedora do Shopping', icon: '🛍️', personality: 'engracada', look: { hairStyle: 'rabo', hairColor: '#c0392b', top: 'blusa-babado', topColor: '#ff8fc7' }, shop: 'roupas',
    routine: [work('shopping', -20, -8, 8, 19), at(...PRACA, 19, 21, 'walk', 15), home(-200, -40)],
    lines: ['Oi, oi! Chegaram roupas novas cheias de brilho! ✨', 'Sabia que o rosa e o roxo combinam super bem?', 'Quando eu era pequena, sonhava em ter uma loja. Agora eu tenho!'] },
  { id: 'nanda', name: 'Professora Nanda', role: 'Professora', icon: '👩‍🏫', personality: 'carinhosa', job: 'professora', look: { hairStyle: 'coque', hairColor: '#2b1a12', top: 'sueter', topColor: '#9d4edd', accessories: ['oculos-coracao'], height: 1.15 },
    routine: [work('escola', 0, -8, 7, 16), at(-60, -40, 16, 20, 'walk', 10), home(-330, -60)],
    lines: ['Bom dia, estrelinha! Hoje vamos aprender coisas incríveis!', 'Ler um livro é como viajar sem sair do lugar! 📚', 'Quer me ajudar a dar aula hoje? Os alunos adoram você!'] },
  { id: 'dra-bia', name: 'Dra. Bia', role: 'Médica', icon: '👩‍⚕️', personality: 'tranquila', job: 'medica', look: { hairStyle: 'longo', hairColor: '#7a4b2a', top: 'jaleco', topColor: '#ffffff', accessories: ['estetoscopio'], skin: '#a86b45', height: 1.12 },
    routine: [work('hospital', -6, -6, 7, 19), home(-190, 20)],
    lines: ['Olá! Lembre de beber água e comer frutinhas! 🍎', 'Aqui cuidamos de todo mundo com muito carinho.', 'Dormir bem deixa a gente forte e feliz!'] },
  { id: 'teo', name: 'Téo', role: 'Atendente da Cafeteria', icon: '☕', personality: 'engracada', job: 'cafe', look: { hairStyle: 'curto', hairColor: '#f2d27a', top: 'avental', topColor: '#c8a27a', height: 1.1 },
    routine: [work('cafeteria', 0, -3, 6, 17), at(...PRACA, 17, 21, 'sit', 6), home(-300, 30)],
    lines: ['Um chocolate quente com marshmallow saindo! ☕', 'Hoje o bolo de morango está fofíssimo!', 'Por que o café foi à polícia? Porque foi assaltado... de tão gostoso! 😂'] },
  { id: 'vet-carol', name: 'Carol', role: 'Veterinária', icon: '🩺', personality: 'carinhosa', job: 'veterinaria', look: { hairStyle: 'trancas', hairColor: '#2b1a12', skin: '#6b3d24', top: 'jaleco', topColor: '#bdf5e0', height: 1.1 },
    routine: [work('petshop', 4, -4, 8, 18), at(80, 10, 18, 20, 'walk', 10), home(-220, -100)],
    lines: ['Os bichinhos sentem quando a gente tem carinho por eles 🐾', 'Já pensou em adotar um amiguinho? Temos vários aqui!', 'Dar banho e comida faz os pets felizes!'] },
  { id: 'seu-ze', name: 'Seu Zé', role: 'Motorista de Ônibus', icon: '🚌', personality: 'tranquila', look: { hairStyle: 'careca', top: 'uniforme', topColor: '#ffd23f', height: 1.15 }, routine: [at(0, 40, 0, 24, 'work', 0)],
    lines: ['Próxima parada: diversão! 🚌', 'Já dei mais de mil voltas pela cidade!', 'Segurem firme, crianças!'] },
  { id: 'sgt-rafa', name: 'Policial Rafa', role: 'Policial', icon: '👮', personality: 'aventureira', job: 'policial', look: { hairStyle: 'curto', hairColor: '#2b1a12', top: 'uniforme', topColor: '#2f6fdf', accessories: ['quepe'], height: 1.15 },
    routine: [{ from: 6, to: 22, at: [0, 0], activity: 'patrol', path: [[-5, -55], [-5, 45], [125, 45], [125, -55]] }, home(-35, 132)],
    lines: ['Tudo tranquilo na cidade! 👍', 'Se encontrar alguém precisando de ajuda, me avise!', 'Quer ser policial também? Temos objetos perdidos para encontrar!'] },
  { id: 'bombeira-ju', name: 'Bombeira Ju', role: 'Bombeira', icon: '👩‍🚒', personality: 'aventureira', job: 'bombeira', look: { hairStyle: 'rabo', hairColor: '#a8673a', top: 'uniforme', topColor: '#e63946', accessories: ['capacete'], height: 1.12 },
    routine: [work('bombeiros', 5, 2, 7, 20), home(-330, 72)],
    lines: ['Segurança em primeiro lugar! 🚒', 'Nosso caminhão é o mais vermelho da cidade!', 'Quer ajudar a apagar uns focos de fogo?'] },
  { id: 'jardineiro-ben', name: 'Seu Ben', role: 'Jardineiro', icon: '🌻', personality: 'tranquila', look: { hairStyle: 'curto', hairColor: '#f7f0d0', top: 'macacao', topColor: '#3ccf91', accessories: ['chapeu-sol'], skin: '#8a5233', height: 1.08 },
    routine: [at(65, -5, 6, 18, 'wander', 30), home(-185, 28)],
    lines: ['Cada florzinha precisa de sol e água 🌷', 'Olha que bonita essa cerejeira!', 'Plantar uma árvore é dar um presente para o futuro.'] },
  { id: 'chef-leo', name: 'Chef Léo', role: 'Chef de Cozinha', icon: '👨‍🍳', personality: 'engracada', job: 'chef', look: { hairStyle: 'curto', hairColor: '#2b1a12', top: 'avental', topColor: '#ffffff', accessories: ['chapeu-chef'], height: 1.12 },
    routine: [work('restaurante', -6, -5, 10, 22), home(-305, -38)],
    lines: ['Hoje tem macarrão com almôndegas! 🍝', 'O segredo de uma boa comida é muito amor!', 'Quer cozinhar comigo?'] },
  { id: 'tati', name: 'Tati', role: 'Cabeleireira', icon: '💇', personality: 'criativa', look: { hairStyle: 'cacheado', hairColor: '#ff7eb6', top: 'blusa-babado', topColor: '#d4b8ff', height: 1.1 },
    routine: [work('salao', 0, -4, 8, 19), at(...PRACA, 19, 21, 'dance', 6), home(-335, 28)],
    lines: ['Que tal um penteado novo hoje? 💇‍♀️', 'Cabelo colorido é a minha paixão! 🌈', 'Sente na cadeira mágica e mude seu visual!'] },
  { id: 'gui-sorvete', name: 'Gui', role: 'Sorveteiro', icon: '🍦', personality: 'engracada', look: { hairStyle: 'franja', hairColor: '#4a2c1a', top: 'listrada', topColor: '#ff8fc7', height: 1.05 },
    routine: [work('sorveteria', 0, -2, 9, 21), home(-155, 28)],
    lines: ['Sorvete de unicórnio: morango, baunilha e brilho! 🦄', 'Uma bola ou duas? Que tal três?!', 'Picolé de manga é o meu favorito!'] },
  { id: 'dona-rosa', name: 'Dona Rosa', role: 'Moça do Mercado', icon: '🛒', personality: 'carinhosa', look: { hairStyle: 'coque', hairColor: '#ffffff', top: 'avental', topColor: '#3ccf91', skin: '#d9a47c', height: 1.05 },
    routine: [work('mercado', 8, -6, 7, 20), home(-365, 72)],
    lines: ['Frutinhas fresquinhas hoje! 🍓🍌', 'Coma legumes coloridos para ficar forte!', 'Precisa de alguma coisa, querida?'] },
  { id: 'cine-max', name: 'Max', role: 'Bilheteiro do Cinema', icon: '🎬', personality: 'curiosa', look: { hairStyle: 'black', hairColor: '#2b1a12', skin: '#6b3d24', top: 'uniforme', topColor: '#9d4edd', height: 1.08 },
    routine: [work('cinema', 8, 8, 12, 23), home(-215, -82)],
    lines: ['Hoje está passando "As Aventuras do Coelho Espacial"! 🐰🚀', 'Pipoca doce ou salgada?', 'Sente-se e aproveite o filme!'] },
  { id: 'fit-duda', name: 'Duda', role: 'Professora de Dança', icon: '💃', personality: 'aventureira', look: { hairStyle: 'rabo', hairColor: '#2b1a12', top: 'regata', topColor: '#ff5fa2', bottom: 'legging', bottomColor: '#9d4edd', height: 1.1 },
    routine: [{ from: 7, to: 19, at: inside('academia', 0, 0), activity: 'dance', radius: 3 }, home(-185, -82)],
    lines: ['Vamos mexer o esqueleto! 💃', 'Dançar faz o coração ficar feliz!', 'Um, dois, três... pula!'] },
  { id: 'livia-livros', name: 'Lívia', role: 'Bibliotecária', icon: '📚', personality: 'curiosa', look: { hairStyle: 'franja', hairColor: '#7a4b2a', accessories: ['oculos-coracao'], top: 'sueter', topColor: '#ffd23f', height: 1.1 },
    routine: [work('biblioteca', 0, -4, 8, 18), home(-305, 72)],
    lines: ['Já leu a história da sereia que queria voar? 🧜‍♀️', 'Os livros guardam mundos inteiros!', 'Silêncio... a biblioteca está sonhando 💤'] },
  { id: 'rick-carros', name: 'Rick', role: 'Vendedor de Carros', icon: '🚗', personality: 'engracada', look: { hairStyle: 'curto', hairColor: '#d9a35b', top: 'jaqueta', topColor: '#2f6fdf', height: 1.12 }, shop: 'carros',
    routine: [work('concessionaria', 0, -6, 8, 19), home(-365, -38)],
    lines: ['Vrum vrum! Quer um carro novinho? 🚗', 'Temos carros, motos, bicicletas e até patinetes!', 'Escolha sua cor favorita!'] },
  { id: 'estrela', name: 'Estrela', role: 'Cantora', icon: '🎤', personality: 'criativa', job: 'cantora', look: { hairStyle: 'longo', hairColor: '#9b59ff', top: 'vestido-babados', topColor: '#ffd23f', accessories: ['tiara'], height: 1.1 },
    routine: [work('estudio', -5, -3, 10, 20), at(...PRACA, 20, 22, 'dance', 4), home(-155, -38)],
    lines: ['Lá lá lá! 🎶 Quer cantar comigo?', 'Todo mundo tem uma voz especial!', 'Meu sonho é fazer um show no castelo!'] },
  { id: 'pinta', name: 'Pinta', role: 'Artista', icon: '🎨', personality: 'criativa', job: 'artista', look: { hairStyle: 'chiquinhas', hairColor: '#4aa8ff', top: 'macacao', topColor: '#ffffff', height: 1.05 },
    routine: [work('estudio', 6, -4, 9, 18), home(-335, -142)],
    lines: ['As cores são mágicas! 🎨', 'Pinte o que sentir no coração.', 'Quer pintar um quadro comigo?'] },
  { id: 'dona-flor', name: 'Dona Flor', role: 'Administradora do Shopping', icon: '🏬', personality: 'tranquila', job: 'shopping', look: { hairStyle: 'coque', hairColor: '#7a4b2a', top: 'jaqueta', topColor: '#ff8fc7', height: 1.12 },
    routine: [work('shopping', 22, 10, 9, 19), home(-365, -142)],
    lines: ['O shopping precisa de uma ajudante esperta como você!', 'Quais lojas você colocaria aqui?', 'Organizar é divertido!'] },
  // ---- Crianças ----
  ...(['Pedrinho', 'Sofia', 'Lulu', 'Davi', 'Alice', 'Bento', 'Manu', 'Clara'] as const).map((name, i): NPCDef => ({
    id: `kid-${i}`, name, role: 'Amiguinho(a) do parque', icon: '🧒', kid: true,
    personality: (['aventureira', 'engracada', 'carinhosa', 'curiosa'] as const)[i % 4],
    look: { height: 0.82 },
    routine: [
      i < 5 ? at(PRACA[0] + (i - 2) * 6, PRACA[1] + 10, 8, 19, 'play', 8) : at(260 + (i - 6) * 10, -5, 9, 19, 'play', 12),
      at(0 + i * 14 - 50, 200, 19, 21, 'play', 10),
      home(-240 + i * 15, 30),
    ],
    lines: [
      'Vamos brincar de pega-pega? Tá com você! 🏃', 'Eu adoro o carrossel do parque!', 'Você viu o unicórnio na ilha?! Dizem que existe!',
      'Meu pet se chama Biscoito! 🐶', 'Quer ser minha amiga?', 'Hoje eu tomei sorvete de chocolate!',
    ],
  })),
  // ---- Fazenda / Floresta / Castelo / Futuro / Praia ----
  { id: 'fazendeira-ana', name: 'Fazendeira Ana', role: 'Fazendeira', icon: '👩‍🌾', personality: 'tranquila', job: 'cuidadora', look: { hairStyle: 'trancas', hairColor: '#d9a35b', top: 'macacao', topColor: '#5ab0ff', accessories: ['chapeu-sol'], height: 1.1 },
    routine: [at(240, 105, 6, 19, 'wander', 25), home(210, 75)],
    lines: ['Bom dia! As galinhas já botaram ovinhos 🥚', 'Plante uma sementinha na horta e veja crescer!', 'A vaca Mimosa adora carinho!'] },
  { id: 'rei-arthurzinho', name: 'Rei Bolota', role: 'Rei do Castelo', icon: '🤴', personality: 'engracada', look: { hairStyle: 'curto', hairColor: '#ffffff', top: 'jaqueta', topColor: '#9d4edd', accessories: ['coroa', 'capa'], height: 1.1 },
    routine: [at(-260, -290, 0, 24, 'wander', 8)],
    lines: ['Bem-vinda ao meu reino, nobre aventureira! 👑', 'Decreto real: hoje é dia de sorvete!', 'O dragãozinho do castelo é muito fofo, não tenha medo!'] },
  { id: 'princesa-ayla', name: 'Princesa Ayla', role: 'Princesa', icon: '👸', personality: 'aventureira', look: { hairStyle: 'longo', hairColor: '#f2d27a', top: 'vestido-princesa', topColor: '#5ad1ff', accessories: ['coroa'], height: 1 },
    routine: [at(-250, -250, 8, 20, 'walk', 25), at(-260, -290, 20, 8, 'sit', 2)],
    lines: ['Princesas também sobem em árvores e exploram florestas! 🌲', 'Vamos procurar a ilha secreta?', 'Meu cavalo se chama Relâmpago!'] },
  { id: 'fada-luz', name: 'Fada Luz', role: 'Fada da Floresta', icon: '🧚', personality: 'carinhosa', look: { hairStyle: 'longo', hairColor: '#7ee8c7', top: 'vestido-fada', topColor: '#bdf5e0', accessories: ['asas-fada'], height: 0.9 },
    routine: [at(-330, -320, 0, 24, 'wander', 15)],
    lines: ['Psiu... a floresta tem segredos mágicos ✨', 'Os cogumelos daqui brilham à noite!', 'Quem tem bom coração encontra tesouros!'] },
  { id: 'robo-bip', name: 'Bip', role: 'Robô Ajudante', icon: '🤖', personality: 'curiosa', look: { robot: true, accessories: ['antena'], skin: '#c9d6ff', top: 'uniforme', topColor: '#5ad1ff', height: 1 },
    routine: [at(0, -230, 0, 24, 'wander', 30)],
    lines: ['BIP BOP! Olá, humana amiga! 🤖', 'Calculando... nível de fofura: MÁXIMO!', 'Pise nos círculos brilhantes para teletransportar!'] },
  { id: 'robo-zeta', name: 'Zeta', role: 'Robô Dançarino', icon: '🤖', personality: 'engracada', look: { robot: true, accessories: ['antena'], skin: '#ffc2d9', top: 'uniforme', topColor: '#ff5fa2', height: 0.9 },
    routine: [at(30, -300, 0, 24, 'dance', 3)],
    lines: ['Dança robô ativada! 🕺', 'Meu programa favorito é... DIVERSÃO.exe', 'Bip bip, você dança muito bem!'] },
  { id: 'cientista-nina', name: 'Dra. Nina', role: 'Cientista', icon: '👩‍🔬', personality: 'curiosa', look: { hairStyle: 'black', hairColor: '#2b1a12', skin: '#4f2c1a', top: 'jaleco', topColor: '#ffffff', accessories: ['oculos-coracao'], height: 1.12 },
    routine: [work('lab', 0, -5, 8, 20), home(-300, -142)],
    lines: ['Você sabia que as estrelas são sóis muito distantes? ⭐', 'Um dia vamos morar na Lua!', 'Experimentar é o jeito mais legal de aprender!'] },
  { id: 'piloto-sam', name: 'Comandante Sam', role: 'Piloto', icon: '👩‍✈️', personality: 'aventureira', look: { hairStyle: 'coque', hairColor: '#4a2c1a', top: 'uniforme', topColor: '#2b2d42', accessories: ['quepe'], height: 1.12 }, shop: 'avioes',
    routine: [work('terminal', -10, -5, 6, 20), home(-155, -142)],
    lines: ['Senhores passageiros, apertem os cintos! ✈️', 'Lá de cima a cidade parece um brinquedo!', 'Quer um avião só seu? Temos na loja!'] },
  { id: 'marinheiro-tom', name: 'Marinheiro Tom', role: 'Capitão do Porto', icon: '⚓', personality: 'engracada', look: { hairStyle: 'curto', hairColor: '#f7f0d0', top: 'listrada', topColor: '#2f6fdf', accessories: ['bone'], height: 1.12 }, shop: 'barcos',
    routine: [at(330, 215, 6, 20, 'wander', 10), home(335, 188)],
    lines: ['Ahoy, marujinha! ⚓', 'Dizem que há um tesouro numa ilha ao sul!', 'Com um barco você pode visitar as ilhas secretas!'] },
  { id: 'salva-vidas-bel', name: 'Bel', role: 'Salva-vidas', icon: '🏊', personality: 'aventureira', look: { hairStyle: 'rabo', hairColor: '#f2d27a', top: 'regata', topColor: '#e63946', bottom: 'shorts', bottomColor: '#e63946', height: 1.12 },
    routine: [at(0, 205, 7, 19, 'wander', 20), home(-290, 196)],
    lines: ['Nade sempre perto de um adulto! 🏊', 'O mar hoje está calminho!', 'Use protetor solar! ☀️'] },
  { id: 'surfista-kai', name: 'Kai', role: 'Surfista', icon: '🏄', personality: 'tranquila', look: { hairStyle: 'cacheado', hairColor: '#d9a35b', skin: '#a86b45', top: 'regata', topColor: '#5ad1ff', bottom: 'bermuda', bottomColor: '#ffd23f', height: 1.1 },
    routine: [at(-100, 210, 8, 19, 'wander', 20), at(...PRACA, 19, 21, 'sit', 5), home(-330, 196)],
    lines: ['E aí! As ondas estão maneiras hoje 🌊', 'Já viu os golfinhos perto das ilhas?', 'A vida é melhor com areia no pé!'] },
  { id: 'palhaco-pipo', name: 'Pipo', role: 'Palhaço do Parque', icon: '🤡', personality: 'engracada', look: { hairStyle: 'cacheado', hairColor: '#ff7eb6', top: 'listrada', topColor: '#ffd23f', accessories: ['chapeu-sol'], height: 1.05 },
    routine: [at(230, -10, 9, 21, 'dance', 10), home(240, -110)],
    lines: ['Hahaha! Quer ver um truque? 🎈', 'Por que o tomate ficou vermelho? Porque viu a salada se trocando! 😂', 'A roda-gigante é a mais alta da cidade!'] },
  { id: 'vovo-lena', name: 'Vovó Lena', role: 'Vovó da Praça', icon: '👵', personality: 'carinhosa', look: { hairStyle: 'coque', hairColor: '#ffffff', top: 'sueter', topColor: '#ffc2d9', accessories: ['oculos-coracao'], height: 0.98 },
    routine: [at(75, -15, 8, 18, 'sit', 1), home(-185, -38)],
    lines: ['Que menina linda! Quer um biscoitinho? 🍪', 'Na minha época, a gente brincava de amarelinha!', 'Dê um abraço na vovó!'] },
];

export const NPC_MAP: Record<string, NPCDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));
export { front };
