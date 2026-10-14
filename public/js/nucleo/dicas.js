// Motor de dicas: compara o jogador com referências por posição e com ele mesmo.
// Cada dica tem peso (tamanho do desvio), e a página mostra as mais relevantes.

import { NOME_POSICAO, REFERENCIAS } from './constantes.js';

const pct = (v) => `${Math.round(v * 100)}%`;
const num = (v, casas = 1) => v.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas });
const OURO_POR_TROPA = 21; // média aproximada de ouro por tropa/monstro

export function gerarDicas(c) {
  const dicas = [];
  const pos = c.posicaoPrincipal;
  const ref = REFERENCIAS[pos];
  const rift = c.rift;
  const nomePos = NOME_POSICAO[pos]?.toLowerCase();

  if (ref && rift.partidas >= 5) {
    if (ref.csMin) {
      const diff = rift.csMin - ref.csMin;
      if (diff < -0.4) {
        const ouro = Math.round(-diff * rift.minutos * OURO_POR_TROPA / 50) * 50;
        dicas.push({
          tipo: 'melhoria', area: 'Farm', peso: -diff / ref.csMin,
          titulo: 'Tem ouro ficando na rota',
          texto: `Você faz ${num(rift.csMin)} de farm por minuto jogando de ${nomePos}; a referência é ${num(ref.csMin)}. Fechar essa diferença vale uns ${ouro.toLocaleString('pt-BR')} de ouro por partida, mais ou menos um item a mais.`,
          metrica: { voce: rift.csMin, referencia: ref.csMin, unidade: 'farm/min' },
        });
      } else if (diff > 0.6) {
        dicas.push({
          tipo: 'forca', area: 'Farm', peso: diff / ref.csMin,
          titulo: 'Seu farm é ponto forte',
          texto: `${num(rift.csMin)} de farm por minuto, acima da referência de ${num(ref.csMin)} para ${nomePos}. Use essa vantagem de ouro para forçar lutas quando seus itens fecharem antes.`,
          metrica: { voce: rift.csMin, referencia: ref.csMin, unidade: 'farm/min' },
        });
      }
    }

    const diffVisao = rift.visaoMin - ref.visaoMin;
    if (diffVisao < -0.15) {
      const controle = rift.sentinelasControle ?? 0;
      dicas.push({
        tipo: 'melhoria', area: 'Visão', peso: -diffVisao / ref.visaoMin,
        titulo: 'Jogando no escuro',
        texto: `Seu placar de visão é ${num(rift.visaoMin, 2)} por minuto (referência: ${num(ref.visaoMin, 2)}) e você compra ${num(controle)} sentinela de controle por partida. Uma sentinela de controle a cada volta à base já muda esse número.`,
        metrica: { voce: rift.visaoMin, referencia: ref.visaoMin, unidade: 'visão/min' },
      });
    } else if (diffVisao > ref.visaoMin * 0.3) {
      dicas.push({
        tipo: 'forca', area: 'Visão', peso: diffVisao / ref.visaoMin,
        titulo: 'Você ilumina o mapa',
        texto: `${num(rift.visaoMin, 2)} de visão por minuto, bem acima da referência de ${num(ref.visaoMin, 2)}. Seu time sabe onde o inimigo está porque você mostrou.`,
        metrica: { voce: rift.visaoMin, referencia: ref.visaoMin, unidade: 'visão/min' },
      });
    }

    if (rift.d > ref.mortes + 0.7) {
      dicas.push({
        tipo: 'melhoria', area: 'Sobrevivência', peso: (rift.d - ref.mortes) / ref.mortes,
        titulo: 'Cada morte é ouro para o inimigo',
        texto: `${num(rift.d)} mortes por partida, contra uma referência de ${num(ref.mortes)}. Antes de avançar sem visão, pergunte: onde está o caçador inimigo?`,
        metrica: { voce: rift.d, referencia: ref.mortes, unidade: 'mortes', menorMelhor: true },
      });
    }

    if (rift.kp < ref.kp - 0.08) {
      dicas.push({
        tipo: 'melhoria', area: 'Mapa', peso: (ref.kp - rift.kp) / ref.kp,
        titulo: 'As lutas estão acontecendo sem você',
        texto: `Você participa de ${pct(rift.kp)} dos abates do time; para ${nomePos} a referência é ${pct(ref.kp)}. Olhe o minimapa a cada onda de tropas e chegue antes da luta começar.`,
        metrica: { voce: rift.kp * 100, referencia: ref.kp * 100, sufixo: '%', unidade: 'de participação' },
      });
    }

    if (ref.csAos10 && rift.csAos10 !== null && rift.csAos10 < ref.csAos10 - 8) {
      dicas.push({
        tipo: 'melhoria', area: 'Fase de rotas', peso: (ref.csAos10 - rift.csAos10) / ref.csAos10,
        titulo: 'Os primeiros 10 minutos decidem',
        texto: `Aos 10 minutos você tem em média ${Math.round(rift.csAos10)} tropas; a referência é ${ref.csAos10}. Treine o último golpe numa partida personalizada: 5 minutos por dia já fazem diferença.`,
        metrica: { voce: rift.csAos10, referencia: ref.csAos10, unidade: 'tropas aos 10 min' },
      });
    }
  }

  // Campeões: foco no que funciona.
  const comAmostra = c.porCampeao.filter((x) => x.jogos >= 3);
  const melhor = [...comAmostra].sort((a, b) => b.winrate - a.winrate)[0];
  const pior = [...comAmostra].sort((a, b) => a.winrate - b.winrate)[0];
  if (melhor && pior && melhor.campeao !== pior.campeao && melhor.winrate - pior.winrate >= 0.25) {
    dicas.push({
      tipo: 'melhoria', area: 'Campeões', peso: melhor.winrate - pior.winrate,
      titulo: `Mais ${c.nomeCampeao(melhor.campeao)}, menos ${c.nomeCampeao(pior.campeao)}`,
      texto: `Você vence ${pct(melhor.winrate)} com ${c.nomeCampeao(melhor.campeao)} e ${pct(pior.winrate)} com ${c.nomeCampeao(pior.campeao)}. ${c.modoPrincipal === 'ranqueada' ? 'Na ranqueada, jogue o que já funciona e treine o resto nas normais.' : 'Quando o resultado importar, vá no que já funciona.'}`,
    });
  }

  // Tilt: como você joga depois de duas derrotas seguidas.
  const tilt = c.habitos.tilt;
  if (tilt.partidas >= 3 && tilt.winrate !== null && c.resumo.winrate - tilt.winrate >= 0.12) {
    dicas.push({
      tipo: 'melhoria', area: 'Cabeça', peso: (c.resumo.winrate - tilt.winrate) * 1.5,
      titulo: 'Duas derrotas? Hora de parar',
      texto: `Depois de duas derrotas seguidas, sua taxa de vitória cai de ${pct(c.resumo.winrate)} para ${pct(tilt.winrate)}. Uma pausa de 15 minutos vale mais do que a terceira partida.`,
      metrica: { voce: tilt.winrate * 100, referencia: c.resumo.winrate * 100, sufixo: '%', unidade: 'de vitórias após 2 derrotas', rotuloRef: 'Sua média' },
    });
  }

  // Horário: melhor e pior período com amostra mínima.
  const periodos = c.habitos.periodos.filter((p) => p.partidas >= 4);
  if (periodos.length >= 2) {
    const ordenados = [...periodos].sort((a, b) => b.winrate - a.winrate);
    const [bom, ruim] = [ordenados[0], ordenados.at(-1)];
    if (bom.winrate - ruim.winrate >= 0.2) {
      dicas.push({
        tipo: 'melhoria', area: 'Rotina', peso: bom.winrate - ruim.winrate,
        titulo: `Seu horário é a ${bom.nome.toLowerCase()}`,
        texto: `Você vence ${pct(bom.winrate)} das partidas de ${bom.nome.toLowerCase()} e ${pct(ruim.winrate)} das de ${ruim.nome.toLowerCase()}. ${c.modoPrincipal === 'ranqueada' ? 'Guarde as ranqueadas' : 'Guarde as partidas que importam'} para o seu melhor horário.`,
      });
    }
  }

  // Duração: jogos curtos x longos indicam campeões de começo ou de fim de jogo.
  const curtos = c.jogos.filter((j) => j.minutos < 25);
  const longos = c.jogos.filter((j) => j.minutos > 32);
  if (curtos.length >= 3 && longos.length >= 3) {
    const wrCurtos = curtos.filter((j) => j.vitoria).length / curtos.length;
    const wrLongos = longos.filter((j) => j.vitoria).length / longos.length;
    if (Math.abs(wrCurtos - wrLongos) >= 0.25) {
      const cedo = wrCurtos > wrLongos;
      dicas.push({
        tipo: 'forca', area: 'Ritmo', peso: Math.abs(wrCurtos - wrLongos),
        titulo: cedo ? 'Você decide cedo' : 'Você cresce com o tempo',
        texto: cedo
          ? `Você vence ${pct(wrCurtos)} das partidas com menos de 25 minutos e ${pct(wrLongos)} das que passam de 32. Pressione cedo e feche o jogo antes que o inimigo escale.`
          : `Você vence ${pct(wrLongos)} das partidas longas e ${pct(wrCurtos)} das curtas. Jogue seguro no começo: o tempo trabalha a seu favor.`,
      });
    }
  }

  // Arena e ARAM têm leitura própria.
  if (c.arena && c.arena.partidas >= 5 && c.arena.mediaColocacao > 4.5) {
    dicas.push({
      tipo: 'melhoria', area: 'Arena', peso: (c.arena.mediaColocacao - 4.5) / 4,
      titulo: 'Sobreviva às primeiras rodadas',
      texto: `Sua colocação média na Arena é ${num(c.arena.mediaColocacao)}º. Nas primeiras rodadas, aumentos defensivos rendem mais do que dano: quem chega vivo ao fim escolhe mais aumentos.`,
    });
  }

  // Pontos fortes gerais, valem para qualquer modo.
  if (c.resumo.partidas >= 5) {
    if (c.resumo.kp >= 0.7) {
      dicas.push({
        tipo: 'forca', area: 'Presença', peso: (c.resumo.kp - 0.6) * 2,
        titulo: 'Sempre onde a luta está',
        texto: `Você participa de ${pct(c.resumo.kp)} dos abates do seu time. Quando a luta começa, você já está lá.`,
      });
    }
    if (c.resumo.danoPct >= 0.3) {
      dicas.push({
        tipo: 'forca', area: 'Dano', peso: (c.resumo.danoPct - 0.25) * 3,
        titulo: 'Seu dano decide partidas',
        texto: `${pct(c.resumo.danoPct)} do dano do seu time aos campeões inimigos sai de você.`,
      });
    }
    if (c.resumo.kda >= 4) {
      dicas.push({
        tipo: 'forca', area: 'Lutas', peso: (c.resumo.kda - 3.5) / 3,
        titulo: 'Lutas limpas',
        texto: `KDA de ${num(c.resumo.kda, 2)}: você entra nas lutas e sai delas vivo na maioria das vezes.`,
      });
    }
  }

  const porPeso = (a, b) => b.peso - a.peso;
  return [
    ...dicas.filter((d) => d.tipo === 'melhoria').sort(porPeso).slice(0, 4),
    ...dicas.filter((d) => d.tipo === 'forca').sort(porPeso).slice(0, 3),
  ];
}
