// Transforma conta + partidas (formato enxuto do backend) no "perfil" que a landing renderiza.
// Funciona igual no navegador e no Node (testes), sem dependências.

import { classificarFila, ELOS, MODOS, NOME_POSICAO, POSICOES, REGIOES } from './constantes.js';
import { escolherPersonas } from './personas.js';
import { gerarDicas } from './dicas.js';
import { recomendar } from './recomendacao.js';

const MODOS_DO_RIFT = new Set(['ranqueada', 'normal']);

/**
 * @param {object} p
 * @param {object} p.conta      resposta de /api/conta
 * @param {object[]} p.partidas respostas de /api/partida/:id
 * @param {{versao: string|null, campeoes: Record<string, {key?: number, nome: string, titulo?: string, resumo?: string, tags?: string[]}>}} p.campeoes
 * @param {Record<string, object>} p.atributos  public/dados/campeoes.json → campeoes
 * @param {(ts: number) => number} [p.horaDe]   hora local de um timestamp (injetável nos testes)
 */
export function analisar({ conta, partidas, campeoes, atributos, horaDe = (ts) => new Date(ts).getHours() }) {
  const indice = criarIndice(campeoes, atributos);
  const puuid = conta.conta.puuid;

  const jogos = partidas
    .filter((p) => p && !p.remake)
    .map((p) => ({ partida: p, eu: p.jogadores.find((j) => j.puuid === puuid) }))
    .filter((x) => x.eu)
    .map(({ partida, eu }) => montarJogo(partida, eu, indice))
    .sort((a, b) => b.inicio - a.inicio);

  const resumo = resumir(jogos);
  const porModo = contar(jogos, (j) => j.modo);
  const modoPrincipal = porModo[0]?.chave ?? 'normal';
  const porCampeao = agruparPorCampeao(jogos);
  const posicoes = agruparPorPosicao(jogos.filter((j) => MODOS_DO_RIFT.has(j.modo)));
  const posicaoPrincipal = posicoes[0]?.chave ?? null;

  const maestrias = conta.maestrias
    .map((m) => ({ ...m, campeao: indice.porChave.get(m.campeaoId) }))
    .filter((m) => m.campeao)
    .sort((a, b) => b.pontos - a.pontos);

  const mainAtual = porCampeao[0]?.campeao ?? null;
  const mainHistorico = maestrias[0]?.campeao ?? null;
  // No ARAM o campeão é sorteado, então o "main" do tema vem da maestria.
  const temaId = modoPrincipal === 'aram'
    ? (mainHistorico ?? mainAtual)
    : ((porCampeao[0]?.jogos ?? 0) >= 3 || !mainHistorico ? (mainAtual ?? mainHistorico) : mainHistorico);

  const habitos = analisarHabitos(jogos, horaDe);
  const contexto = {
    jogos, resumo, porCampeao, posicoes, posicaoPrincipal, modoPrincipal, habitos,
    rift: resumir(jogos.filter((j) => MODOS_DO_RIFT.has(j.modo))),
    arena: analisarArena(jogos),
    nomeCampeao: (id) => indice.dados(id).nome,
  };

  return {
    plataforma: conta.plataforma,
    conta: { nome: conta.conta.nome, tag: conta.conta.tag, nivel: conta.invocador.nivel, icone: conta.invocador.icone },
    versaoDados: campeoes.versao,
    aoVivo: conta.aoVivo
      ? { ...conta.aoVivo, campeao: indice.porChave.has(conta.aoVivo.campeaoId) ? indice.dados(indice.porChave.get(conta.aoVivo.campeaoId)).nome : null, ...classificarFila(conta.aoVivo.fila, conta.aoVivo.modoJogo) }
      : null,
    tema: temaId ? temaDoCampeao(temaId, indice) : null,
    mainAtual: mainAtual && indice.dados(mainAtual),
    mainHistorico: mainHistorico && indice.dados(mainHistorico),
    modo: {
      principal: modoPrincipal,
      ...MODOS[modoPrincipal],
      distribuicao: porModo.map((m) => ({ ...m, nome: MODOS[m.chave].nome })),
    },
    elo: montarElo(conta.elo),
    amostra: { partidas: jogos.length, de: jogos.at(-1)?.inicio ?? null, ate: jogos[0]?.inicio ?? null },
    resumo,
    rift: contexto.rift,
    posicoes,
    posicaoPrincipal,
    campeoes: porCampeao.slice(0, 8).map((c) => ({ ...c, ...indice.dados(c.campeao) })),
    maestrias: maestrias.slice(0, 5).map((m) => ({ ...m, ...indice.dados(m.campeao) })),
    habitos,
    arena: contexto.arena,
    aram: analisarAram(jogos, indice),
    curiosidades: curiosidades(jogos),
    persona: escolherPersonas(contexto),
    dicas: gerarDicas(contexto),
    recomendacoes: recomendar({
      porCampeao,
      maestrias,
      posicaoPrincipal,
      modoPrincipal,
      atributos,
    }).map((r) => ({ ...r, ...indice.dados(r.id), nomeParecido: indice.dados(r.parecidoCom).nome })),
    partidas: jogos.slice(0, 12).map((j) => ({
      id: j.id, campeao: j.campeao, nomeCampeao: indice.dados(j.campeao).nome, modo: j.modo, nomeFila: j.nomeFila,
      vitoria: j.vitoria, k: j.k, d: j.d, a: j.a, cs: j.cs, minutos: j.minutos, inicio: j.inicio, colocacao: j.colocacao,
    })),
  };
}

// ---------------------------------------------------------------------------------------------

function criarIndice(campeoes, atributos) {
  const porMinusculo = new Map();
  const porChave = new Map();
  for (const [id, c] of Object.entries(campeoes.campeoes)) {
    porMinusculo.set(id.toLowerCase(), id);
    if (c.key) porChave.set(c.key, id);
  }
  for (const id of Object.keys(atributos)) if (!porMinusculo.has(id.toLowerCase())) porMinusculo.set(id.toLowerCase(), id);

  return {
    porChave,
    // A Riot às vezes muda a caixa entre fontes (ex.: "FiddleSticks" na partida, "Fiddlesticks" na Data Dragon).
    resolver: (nome) => porMinusculo.get(String(nome).toLowerCase()) ?? nome,
    dados(id) {
      const c = campeoes.campeoes[id] ?? {};
      const a = atributos[id] ?? {};
      return {
        id,
        nome: c.nome ?? a.n ?? id,
        titulo: c.titulo ?? null,
        resumo: c.resumo ?? null,
        tags: c.tags ?? [],
        regiao: a.r ?? 'runeterra',
      };
    },
  };
}

function montarJogo(partida, eu, indice) {
  const { modo, nomeFila } = classificarFila(partida.fila, partida.modoJogo);
  const minutos = Math.max(1, partida.duracao / 60);
  const aliados = partida.jogadores.filter((j) =>
    modo === 'arena' ? j.subtime === eu.subtime : j.time === eu.time);
  const abatesDoTime = soma(aliados, (j) => j.k);
  const danoDoTime = soma(aliados, (j) => j.dano);

  return {
    id: partida.id,
    modo,
    nomeFila,
    inicio: partida.inicio,
    minutos,
    vitoria: eu.vitoria,
    campeao: indice.resolver(eu.campeao),
    posicao: POSICOES[eu.posicao]?.chave ?? null,
    k: eu.k, d: eu.d, a: eu.a,
    cs: eu.cs,
    dano: eu.dano,
    curaAliados: eu.curaAliados,
    visao: eu.visao,
    sentinelasControle: eu.sentinelasControle,
    kp: eu.kp ?? (abatesDoTime ? (eu.k + eu.a) / abatesDoTime : 0),
    danoPct: eu.danoPct ?? (danoDoTime ? eu.dano / danoDoTime : 0),
    csAos10: eu.csAos10,
    abatesSolo: eu.abatesSolo,
    esquivas: eu.esquivas,
    pings: eu.pings,
    tempoMorto: eu.tempoMorto,
    pentas: eu.pentas,
    maiorMulti: eu.maiorMulti,
    colocacao: eu.colocacao,
    parceiros: modo === 'arena'
      ? aliados.filter((j) => j.puuid !== eu.puuid).map((j) => (j.tag ? `${j.nome}#${j.tag}` : j.nome))
      : [],
  };
}

function resumir(jogos) {
  const n = jogos.length;
  if (!n) return { partidas: 0, vitorias: 0, derrotas: 0, winrate: 0, k: 0, d: 0, a: 0, kda: 0, csMin: 0, visaoMin: 0, kp: 0, danoPct: 0, minutos: 0 };
  const minutos = soma(jogos, (j) => j.minutos);
  const vitorias = jogos.filter((j) => j.vitoria).length;
  const k = soma(jogos, (j) => j.k);
  const d = soma(jogos, (j) => j.d);
  const a = soma(jogos, (j) => j.a);
  return {
    partidas: n,
    vitorias,
    derrotas: n - vitorias,
    winrate: vitorias / n,
    k: k / n,
    d: d / n,
    a: a / n,
    kda: (k + a) / Math.max(1, d),
    csMin: soma(jogos, (j) => j.cs) / minutos,
    visaoMin: soma(jogos, (j) => j.visao) / minutos,
    kp: soma(jogos, (j) => j.kp) / n,
    danoPct: soma(jogos, (j) => j.danoPct) / n,
    sentinelasControle: soma(jogos, (j) => j.sentinelasControle) / n,
    curaAliados: soma(jogos, (j) => j.curaAliados) / n,
    abatesSolo: media(jogos.filter((j) => j.abatesSolo !== null), (j) => j.abatesSolo),
    csAos10: media(jogos.filter((j) => j.csAos10 !== null), (j) => j.csAos10),
    minutos: minutos / n,
  };
}

function agruparPorCampeao(jogos) {
  const grupos = new Map();
  for (const j of jogos) {
    const g = grupos.get(j.campeao) ?? [];
    g.push(j);
    grupos.set(j.campeao, g);
  }
  return [...grupos.entries()]
    .map(([campeao, lista]) => {
      const r = resumir(lista);
      return { campeao, jogos: lista.length, vitorias: r.vitorias, winrate: r.winrate, kda: r.kda, k: r.k, d: r.d, a: r.a };
    })
    .sort((x, y) => y.jogos - x.jogos || y.vitorias - x.vitorias);
}

function agruparPorPosicao(jogos) {
  return contar(jogos.filter((j) => j.posicao), (j) => j.posicao).map((p) => {
    const lista = jogos.filter((j) => j.posicao === p.chave);
    return { ...p, nome: NOME_POSICAO[p.chave], winrate: lista.filter((j) => j.vitoria).length / lista.length };
  });
}

function analisarHabitos(jogos, horaDe) {
  const horas = Array(24).fill(0);
  for (const j of jogos) horas[horaDe(j.inicio)]++;

  const periodos = [
    { chave: 'madrugada', nome: 'Madrugada', de: 0, ate: 5 },
    { chave: 'manha', nome: 'Manhã', de: 6, ate: 11 },
    { chave: 'tarde', nome: 'Tarde', de: 12, ate: 17 },
    { chave: 'noite', nome: 'Noite', de: 18, ate: 23 },
  ].map((p) => {
    const lista = jogos.filter((j) => { const h = horaDe(j.inicio); return h >= p.de && h <= p.ate; });
    return { ...p, partidas: lista.length, winrate: lista.length ? lista.filter((j) => j.vitoria).length / lista.length : null };
  });

  // Sessão = partidas com menos de 45 min de intervalo entre o fim de uma e o começo da outra.
  const cronologico = [...jogos].sort((a, b) => a.inicio - b.inicio);
  const sessoes = [];
  for (const j of cronologico) {
    const atual = sessoes.at(-1);
    const fimAnterior = atual ? atual.at(-1).inicio + atual.at(-1).minutos * 60000 : 0;
    if (atual && j.inicio - fimAnterior < 45 * 60000) atual.push(j);
    else sessoes.push([j]);
  }

  // Desempenho logo depois de 2+ derrotas seguidas.
  let derrotasSeguidas = 0;
  const posTilt = [];
  for (const j of cronologico) {
    if (derrotasSeguidas >= 2) posTilt.push(j.vitoria);
    derrotasSeguidas = j.vitoria ? 0 : derrotasSeguidas + 1;
  }

  return {
    horas,
    periodos,
    periodoFavorito: [...periodos].sort((a, b) => b.partidas - a.partidas)[0],
    sessoes: sessoes.length,
    maiorSessao: Math.max(0, ...sessoes.map((s) => s.length)),
    tilt: {
      partidas: posTilt.length,
      winrate: posTilt.length ? posTilt.filter(Boolean).length / posTilt.length : null,
    },
  };
}

function analisarArena(jogos) {
  const arena = jogos.filter((j) => j.modo === 'arena' && j.colocacao);
  if (!arena.length) return null;
  const maxColocacao = Math.max(8, ...arena.map((j) => j.colocacao));
  const colocacoes = Array(maxColocacao).fill(0);
  for (const j of arena) colocacoes[j.colocacao - 1]++;

  const parceiros = new Map();
  for (const j of arena) {
    for (const p of j.parceiros) {
      const atual = parceiros.get(p) ?? { nome: p, partidas: 0, somaColocacao: 0 };
      atual.partidas++;
      atual.somaColocacao += j.colocacao;
      parceiros.set(p, atual);
    }
  }
  return {
    partidas: arena.length,
    colocacoes,
    mediaColocacao: media(arena, (j) => j.colocacao),
    taxaTop1: arena.filter((j) => j.colocacao === 1).length / arena.length,
    taxaTop4: arena.filter((j) => j.colocacao <= Math.ceil(maxColocacao / 2)).length / arena.length,
    parceiros: [...parceiros.values()]
      .filter((p) => p.partidas >= 2)
      .map((p) => ({ nome: p.nome, partidas: p.partidas, mediaColocacao: p.somaColocacao / p.partidas }))
      .sort((a, b) => b.partidas - a.partidas)
      .slice(0, 3),
  };
}

function analisarAram(jogos, indice) {
  const aram = jogos.filter((j) => j.modo === 'aram');
  if (!aram.length) return null;
  const melhor = [...aram].sort((a, b) => b.dano - a.dano)[0];
  const distintos = new Set(aram.map((j) => j.campeao));
  return {
    partidas: aram.length,
    campeoesDistintos: distintos.size,
    mosaico: aram.map((j) => ({ campeao: j.campeao, nome: indice.dados(j.campeao).nome, vitoria: j.vitoria })),
    danoMedio: media(aram, (j) => j.dano),
    melhorPartida: { campeao: melhor.campeao, nome: indice.dados(melhor.campeao).nome, dano: melhor.dano, k: melhor.k, d: melhor.d, a: melhor.a },
    winrate: aram.filter((j) => j.vitoria).length / aram.length,
  };
}

function curiosidades(jogos) {
  if (!jogos.length) return [];
  const itens = [
    { chave: 'interrogacao', rotulo: 'pings de "?"', valor: soma(jogos, (j) => j.pings?.interrogacao ?? 0) },
    { chave: 'aCaminho', rotulo: 'pings de "a caminho"', valor: soma(jogos, (j) => j.pings?.aCaminho ?? 0) },
    { chave: 'tempoMorto', rotulo: 'minutos esperando renascer', valor: Math.round(soma(jogos, (j) => j.tempoMorto) / 60) },
    { chave: 'esquivas', rotulo: 'habilidades esquivadas', valor: soma(jogos, (j) => j.esquivas ?? 0) },
    { chave: 'pentas', rotulo: 'pentakills', valor: soma(jogos, (j) => j.pentas) },
    { chave: 'controle', rotulo: 'sentinelas de controle', valor: soma(jogos, (j) => j.sentinelasControle) },
  ];
  return itens.filter((i) => i.valor > 0);
}

function montarElo(entradas) {
  const formatar = (e) => e && {
    tier: e.tier,
    nomeTier: ELOS[e.tier]?.nome ?? e.tier,
    cor: ELOS[e.tier]?.cor ?? '#c8aa6e',
    divisao: ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(e.tier) ? '' : e.divisao,
    pdl: e.pdl,
    vitorias: e.vitorias,
    derrotas: e.derrotas,
    winrate: e.vitorias / Math.max(1, e.vitorias + e.derrotas),
    emSequencia: e.emSequencia,
  };
  const solo = formatar(entradas.find((e) => e.fila === 'RANKED_SOLO_5x5'));
  const flex = formatar(entradas.find((e) => e.fila === 'RANKED_FLEX_SR'));
  return solo || flex ? { solo: solo ?? null, flex: flex ?? null } : null;
}

function temaDoCampeao(id, indice) {
  const dados = indice.dados(id);
  return { ...dados, nomeRegiao: REGIOES[dados.regiao]?.nome ?? 'Runeterra', cores: REGIOES[dados.regiao]?.cores ?? REGIOES.runeterra.cores };
}

// ---------------------------------------------------------------------------------------------

function contar(lista, chaveDe) {
  const contagem = new Map();
  for (const item of lista) contagem.set(chaveDe(item), (contagem.get(chaveDe(item)) ?? 0) + 1);
  return [...contagem.entries()]
    .map(([chave, partidas]) => ({ chave, partidas, pct: partidas / lista.length }))
    .sort((a, b) => b.partidas - a.partidas);
}

function soma(lista, valor) {
  return lista.reduce((total, item) => total + (valor(item) || 0), 0);
}

function media(lista, valor) {
  return lista.length ? soma(lista, valor) / lista.length : null;
}
