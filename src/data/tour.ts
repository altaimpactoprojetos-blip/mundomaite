// "Um passeio com Purpurina" — atividade guiada opcional
export interface TourStep { id: string; ev: string; title: string; hint: string; icon: string }
export const TOUR: TourStep[] = [
  { id: 'roupa', ev: 'salvar-visual', title: 'Escolha sua roupa', hint: 'Experimente roupas no editor e toque em 💾 Salvar visual.', icon: '👗' },
  { id: 'sair', ev: 'saiu', title: 'Saia de casa', hint: 'Abra a porta da Mansão das Estrelas e vá até o jardim.', icon: '🚪' },
  { id: 'vizinho', ev: 'vizinho', title: 'Diga oi para a vizinha', hint: 'A vizinha Lu está no portão. Toque nela para conversar.', icon: '👋' },
  { id: 'carinho', ev: 'carinho', title: 'Carinho no Purpurina', hint: 'Toque no Purpurina e escolha 🤲 Carinho.', icon: '🦄' },
  { id: 'montar', ev: 'montar', title: 'Monte no Purpurina', hint: 'Toque no Purpurina de novo e escolha 🏇 Montar.', icon: '🏇' },
  { id: 'cafe', ev: 'cafe-chegou', title: 'Cavalgue até a cafeteria', hint: 'Siga a seta ⬇️ e o minimapa até a Cafeteria Nuvem de Leite.', icon: '☕' },
  { id: 'bebida', ev: 'servir', title: 'Prepare e sirva uma bebida', hint: 'No balcão, prepare a bebida do pedido e leve até o cliente na mesa.', icon: '🥤' },
  { id: 'praca', ev: 'fonte', title: 'Vá até a fonte da praça', hint: 'Siga a seta até a fonte da Praça Central.', icon: '⛲' },
  { id: 'foto', ev: 'foto-fonte', title: 'Foto com o Purpurina', hint: 'Perto da fonte, toque em 📸 Foto com Purpurina.', icon: '📸' },
];
