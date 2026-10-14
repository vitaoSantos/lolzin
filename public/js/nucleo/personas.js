// Arquétipos estilo "retrospectiva": regras simples sobre as estatísticas.
// Cada regra devolve uma nota (> 0 = se aplica; quanto maior, mais forte) e a evidência em números.

import { REFERENCIAS } from './constantes.js';

const pct = (v) => `${Math.round(v * 100)}%`;
const num = (v, casas = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas });
// Quanto o valor passou do limite, em proporção do próprio limite.
const excesso = (valor, limite) => (valor - limite) / limite;

export const PERSONAS = [
  {
    id: 'especialista',
    nome: 'Especialista',
    frase: (c) => `Você não joga com ${c.nomeCampeao(c.porCampeao[0].campeao)}. Você joga de ${c.nomeCampeao(c.porCampeao[0].campeao)}.`,
    avaliar(c) {
      const share = (c.porCampeao[0]?.jogos ?? 0) / Math.max(1, c.resumo.partidas);
      if (c.resumo.partidas < 8 || c.modoPrincipal === 'aram') return null;
      return { nota: excesso(share, 0.45), evidencia: `${pct(share)} das partidas com o mesmo campeão` };
    },
  },
  {
    id: 'camaleao',
    nome: 'Camaleão',
    frase: () => 'Qualquer campeão serve. Você se adapta ao que a partida pedir.',
    avaliar(c) {
      if (c.resumo.partidas < 8) return null;
      const variedade = c.porCampeao.length / c.resumo.partidas;
      return { nota: excesso(variedade, 0.6), evidencia: `${c.porCampeao.length} campeões diferentes em ${c.resumo.partidas} partidas` };
    },
  },
  {
    id: 'carregador',
    nome: 'Carregador',
    frase: () => 'O time joga em volta de você, e você sabe disso.',
    avaliar: (c) => ({ nota: excesso(c.resumo.danoPct, 0.27), evidencia: `${pct(c.resumo.danoPct)} do dano do time sai de você` }),
  },
  {
    id: 'guardiao',
    nome: 'Guardião da Visão',
    frase: () => 'Ninguém pega o seu time de surpresa.',
    avaliar(c) {
      const ref = REFERENCIAS[c.posicaoPrincipal]?.visaoMin;
      if (!ref || c.rift.partidas < 5) return null;
      return { nota: excesso(c.rift.visaoMin, ref * 1.25), evidencia: `${num(c.rift.visaoMin, 2)} de placar de visão por minuto` };
    },
  },
  {
    id: 'fazendeiro',
    nome: 'Fazendeiro',
    frase: () => 'Cada tropa é sua. Cada uma.',
    avaliar(c) {
      const ref = REFERENCIAS[c.posicaoPrincipal]?.csMin;
      if (!ref || c.rift.partidas < 5) return null;
      return { nota: excesso(c.rift.csMin, ref + 0.8), evidencia: `${num(c.rift.csMin)} de farm por minuto` };
    },
  },
  {
    id: 'kamikaze',
    nome: 'Kamikaze',
    frase: () => 'Morrer faz parte. Desde que leve alguém junto.',
    avaliar(c) {
      if (c.resumo.kp < 0.55) return null;
      return { nota: excesso(c.resumo.d, 7), evidencia: `${num(c.resumo.d)} mortes e ${pct(c.resumo.kp)} de participação por partida` };
    },
  },
  {
    id: 'intocavel',
    nome: 'Intocável',
    frase: () => 'Morrer? Você nem lembra como é.',
    avaliar: (c) => (c.resumo.partidas < 5 ? null : { nota: excesso(3.5, Math.max(0.5, c.resumo.d)), evidencia: `só ${num(c.resumo.d)} mortes por partida` }),
  },
  {
    id: 'duelista',
    nome: 'Duelista',
    frase: () => '1 contra 1? Sempre. Em qualquer lugar.',
    avaliar: (c) => (c.resumo.abatesSolo === null ? null : { nota: excesso(c.resumo.abatesSolo, 1.5), evidencia: `${num(c.resumo.abatesSolo)} abates solo por partida` }),
  },
  {
    id: 'coruja',
    nome: 'Coruja',
    frase: () => 'Suas partidas começam quando a cidade dorme.',
    avaliar(c) {
      const madrugada = c.habitos.periodos.find((p) => p.chave === 'madrugada');
      const share = madrugada.partidas / Math.max(1, c.resumo.partidas);
      return { nota: excesso(share, 0.35), evidencia: `${pct(share)} das partidas entre meia-noite e 6h` };
    },
  },
  {
    id: 'maratonista',
    nome: 'Maratonista',
    frase: () => '"Só mais uma." (Foram muitas.)',
    avaliar: (c) => ({ nota: excesso(c.habitos.maiorSessao, 6), evidencia: `${c.habitos.maiorSessao} partidas seguidas numa sessão` }),
  },
  {
    id: 'protetor',
    nome: 'Protetor',
    frase: () => 'Seu time vive mais quando você está por perto.',
    avaliar: (c) => ({ nota: excesso(c.resumo.curaAliados, 4000), evidencia: `${Math.round(c.resumo.curaAliados).toLocaleString('pt-BR')} de cura e escudo em aliados por partida` }),
  },
  {
    id: 'interrogacao',
    nome: 'Rei do "?"',
    frase: () => 'Você pinga mais do que fala. E pinga "?".',
    avaliar(c) {
      const porPartida = c.jogos.reduce((t, j) => t + (j.pings?.interrogacao ?? 0), 0) / Math.max(1, c.resumo.partidas);
      return { nota: excesso(porPartida, 6), evidencia: `${num(porPartida)} pings de "?" por partida` };
    },
  },
  {
    id: 'gladiador',
    nome: 'Gladiador',
    frase: () => 'Na Arena, o primeiro lugar já é rotina.',
    avaliar: (c) => (!c.arena || c.arena.partidas < 5 ? null : { nota: excesso(c.arena.taxaTop1, 0.25), evidencia: `${pct(c.arena.taxaTop1)} de primeiros lugares na Arena` }),
  },
];

const AVENTUREIRO = {
  id: 'aventureiro',
  nome: 'Aventureiro',
  frase: 'Sua história em Runeterra ainda está sendo escrita.',
  evidencia: 'poucas partidas para traçar um padrão (ainda)',
  nota: 0,
};

export function escolherPersonas(contexto) {
  if (!contexto.resumo.partidas) return { principal: AVENTUREIRO, secundarias: [] };

  const avaliadas = PERSONAS
    .map((p) => {
      const r = p.avaliar(contexto);
      return r && Number.isFinite(r.nota) && r.nota > 0
        ? { id: p.id, nome: p.nome, frase: p.frase(contexto), evidencia: r.evidencia, nota: r.nota }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.nota - a.nota);

  return { principal: avaliadas[0] ?? AVENTUREIRO, secundarias: avaliadas.slice(1, 4) };
}
