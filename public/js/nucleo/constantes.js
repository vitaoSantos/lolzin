// Tabelas fixas: regiões (com paleta de cor), modos de jogo, posições e elos.

// Paleta usada quando não dá para extrair as cores da splash art: [principal, profunda, brilho].
export const REGIOES = {
  ionia: { nome: 'Ionia', cores: ['#ff6fae', '#5b3bd6', '#ffd6ea'] },
  noxus: { nome: 'Noxus', cores: ['#ff3b3b', '#5a0d16', '#ffb347'] },
  demacia: { nome: 'Demacia', cores: ['#f2c94c', '#2f6fd1', '#fff4d6'] },
  freljord: { nome: 'Freljord', cores: ['#7fd4ff', '#24508f', '#eaf8ff'] },
  piltover: { nome: 'Piltover', cores: ['#f5b041', '#9c5a22', '#fff0cc'] },
  zaun: { nome: 'Zaun', cores: ['#4ef08a', '#145c46', '#d4ff5e'] },
  shurima: { nome: 'Shurima', cores: ['#ffc24b', '#a3601a', '#ffe8b3'] },
  targon: { nome: 'Targon', cores: ['#9b87ff', '#25237a', '#ffd98a'] },
  ilhas: { nome: 'Ilhas das Sombras', cores: ['#33e6c4', '#083b39', '#b0ffee'] },
  bilgewater: { nome: 'Águas de Sentina', cores: ['#22c3c3', '#b6522a', '#f8d48c'] },
  ixtal: { nome: 'Ixtal', cores: ['#36d98f', '#0c5547', '#f3e45d'] },
  bandle: { nome: 'Cidade de Bandle', cores: ['#ffd23f', '#e8508a', '#a6e85f'] },
  vazio: { nome: 'O Vazio', cores: ['#b65cff', '#ff3cac', '#2c0a4d'] },
  runeterra: { nome: 'Runeterra', cores: ['#c8aa6e', '#0ac8b9', '#f0e6d2'] },
};

// Cada modo tem um template próprio de landing.
export const MODOS = {
  ranqueada: { nome: 'Ranqueada', template: 'Dossiê competitivo', palavra: 'dossiê' },
  aram: { nome: 'ARAM', template: 'Caos na ponte', palavra: 'caos' },
  arena: { nome: 'Arena', template: 'Coliseu', palavra: 'coliseu' },
  normal: { nome: 'Normal', template: 'Modo casual', palavra: 'palco' },
  evento: { nome: 'Modo de evento', template: 'Modo de evento', palavra: 'festa' },
};

const FILAS = {
  420: ['ranqueada', 'Ranqueada Solo/Duo'],
  440: ['ranqueada', 'Ranqueada Flex'],
  400: ['normal', 'Escolha Alternada'],
  430: ['normal', 'Às Cegas'],
  480: ['normal', 'Swiftplay'],
  490: ['normal', 'Partida Rápida'],
  450: ['aram', 'ARAM'],
  1700: ['arena', 'Arena'],
  1710: ['arena', 'Arena'],
};

// Fila conhecida pelo ID; senão, pelo modo do jogo. O que não reconhecemos vira "evento".
export function classificarFila(fila, modoJogo) {
  if (FILAS[fila]) return { modo: FILAS[fila][0], nomeFila: FILAS[fila][1] };
  if (modoJogo === 'ARAM') return { modo: 'aram', nomeFila: 'ARAM' };
  if (modoJogo === 'CHERRY') return { modo: 'arena', nomeFila: 'Arena' };
  if (modoJogo === 'CLASSIC') return { modo: 'normal', nomeFila: 'Summoner\'s Rift' };
  return { modo: 'evento', nomeFila: modoJogo ? capitalizar(modoJogo) : 'Evento' };
}

function capitalizar(texto) {
  return texto.charAt(0) + texto.slice(1).toLowerCase();
}

export const POSICOES = {
  TOP: { chave: 'top', nome: 'Topo' },
  JUNGLE: { chave: 'jungle', nome: 'Selva' },
  MIDDLE: { chave: 'mid', nome: 'Meio' },
  BOTTOM: { chave: 'adc', nome: 'Atirador' },
  UTILITY: { chave: 'sup', nome: 'Suporte' },
};

export const NOME_POSICAO = Object.fromEntries(Object.values(POSICOES).map((p) => [p.chave, p.nome]));

export const ELOS = {
  IRON: { nome: 'Ferro', cor: '#8a7a74' },
  BRONZE: { nome: 'Bronze', cor: '#b87a55' },
  SILVER: { nome: 'Prata', cor: '#a9b4bf' },
  GOLD: { nome: 'Ouro', cor: '#e8b84f' },
  PLATINUM: { nome: 'Platina', cor: '#43c2ad' },
  EMERALD: { nome: 'Esmeralda', cor: '#2ecc7a' },
  DIAMOND: { nome: 'Diamante', cor: '#7b97ff' },
  MASTER: { nome: 'Mestre', cor: '#b66bff' },
  GRANDMASTER: { nome: 'Grão-Mestre', cor: '#ff5a4f' },
  CHALLENGER: { nome: 'Desafiante', cor: '#ffd978' },
};

// Referências aproximadas por posição (v1, valores manuais). Serão trocadas por medianas
// reais por elo quando houver coleta offline (ver docs/estudo-de-caso.md, seção 9).
export const REFERENCIAS = {
  top: { csMin: 6.5, visaoMin: 0.7, kp: 0.45, mortes: 5.5, csAos10: 60 },
  jungle: { csMin: 5.5, visaoMin: 1.0, kp: 0.6, mortes: 5.5, csAos10: null },
  mid: { csMin: 7.0, visaoMin: 0.7, kp: 0.5, mortes: 5.0, csAos10: 62 },
  adc: { csMin: 7.5, visaoMin: 0.6, kp: 0.5, mortes: 5.0, csAos10: 65 },
  sup: { csMin: null, visaoMin: 2.0, kp: 0.6, mortes: 6.0, csAos10: null },
};

export const DDRAGON = 'https://ddragon.leagueoflegends.com';
