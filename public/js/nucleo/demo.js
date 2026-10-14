// Perfis de DEMONSTRAÇÃO: jogadores fictícios, gerados de forma determinística no próprio navegador.
// Saem no mesmo formato do backend (/api/conta e /api/partida), então passam pela mesma análise
// que um jogador real. Servem para desenvolver e mostrar a página sem chave da Riot.

// IDs numéricos (key) dos campeões usados nos exemplos, para a maestria funcionar sem Data Dragon.
export const CHAVES_DEMO = {
  Ahri: 103, Syndra: 134, Orianna: 61, Lux: 99, Yasuo: 157, Zed: 238, Viktor: 112, Katarina: 55,
  Ezreal: 81, Jinx: 222, Caitlyn: 51, MissFortune: 21, Vayne: 67, Ashe: 22, Kaisa: 145, Draven: 119,
  Sett: 875, Darius: 122, Samira: 360, Garen: 86, Mordekaiser: 82, Illaoi: 420, Aatrox: 266, Volibear: 106,
  Thresh: 412, Leona: 89, Nautilus: 111, Blitzcrank: 53, Lulu: 117, Nami: 267, Sona: 37, Senna: 235,
  Malphite: 54, Brand: 63, Veigar: 45, Morgana: 25, Teemo: 17, Annie: 1, Fizz: 105, Vladimir: 8,
  Seraphine: 147, Swain: 50, Riven: 92, Irelia: 39, Nasus: 75, Jax: 24, Akali: 84, Yone: 777,
  Ziggs: 115, Xerath: 101, Velkoz: 161, Jhin: 202, Twitch: 29, Varus: 110, Galio: 3, Neeko: 518,
  LeeSin: 64, Viego: 234, Hecarim: 120, Graves: 104, Kayn: 141, Vi: 254, Warwick: 19, Amumu: 32,
  Sejuani: 113, Zac: 154, Chogath: 31, DrMundo: 36, Shen: 98, Gwen: 887, Lillia: 876, Kindred: 203,
};

export const DEMOS = {
  ranqueada: {
    rotulo: 'Ranqueada · Ahri',
    nome: 'Raposa Arcana', tag: 'DEMO', nivel: 312, icone: 23, semente: 38,
    partidas: 20,
    filas: [[420, 17], [440, 3]],
    campeoes: [['Ahri', 11], ['Syndra', 4], ['Orianna', 3], ['Lux', 2]],
    posicao: 'MIDDLE',
    horas: [22, 23, 23, 0, 0, 1, 1, 2, 21, 20, 19, 15],
    vitoria: 0.6, tilt: true,
    medias: { k: 7.2, d: 4.6, a: 7.8, csMin: 6.2, visaoMin: 0.52, danoPct: 0.29, csAos10: 54, abatesSolo: 1.4, cura: 600, interrogacao: 3 },
    elo: [
      { fila: 'RANKED_SOLO_5x5', tier: 'EMERALD', divisao: 'II', pdl: 47, vitorias: 112, derrotas: 98, emSequencia: false },
      { fila: 'RANKED_FLEX_SR', tier: 'GOLD', divisao: 'I', pdl: 12, vitorias: 30, derrotas: 26, emSequencia: false },
    ],
    maestrias: [['Ahri', 612400, 52], ['Syndra', 210300, 21], ['Lux', 151200, 15], ['Orianna', 98100, 10], ['Yasuo', 87400, 9], ['Zed', 40100, 5]],
  },
  aram: {
    rotulo: 'ARAM · Caos',
    nome: 'Ponte Gelada', tag: 'ARAM', nivel: 488, icone: 15, semente: 21,
    partidas: 20,
    filas: [[450, 17], [490, 3]],
    campeoes: 'sorteio',
    posicao: '',
    horas: [12, 13, 14, 18, 19, 19, 20, 20, 21, 22, 16, 17],
    vitoria: 0.52, tilt: false,
    medias: { k: 11.5, d: 8.6, a: 21.4, csMin: 2.4, visaoMin: 0.2, danoPct: 0.24, csAos10: null, abatesSolo: 0.6, cura: 2600, interrogacao: 9 },
    elo: [],
    maestrias: [['Ezreal', 281000, 31], ['Lux', 140500, 14], ['Jinx', 120800, 12], ['Brand', 76000, 8], ['Veigar', 51000, 6]],
  },
  arena: {
    rotulo: 'Arena · Gladiador',
    nome: 'Gladiadora', tag: 'ARENA', nivel: 233, icone: 7, semente: 42,
    partidas: 20,
    filas: [[1700, 16], [450, 4]],
    campeoes: [['Sett', 5], ['Darius', 4], ['Samira', 3], ['Mordekaiser', 3], ['Illaoi', 2], ['Garen', 3]],
    posicao: '',
    horas: [19, 20, 20, 21, 21, 22, 22, 23, 18, 0],
    vitoria: 0.6, tilt: false,
    medias: { k: 9.4, d: 6.1, a: 4.2, csMin: 0.4, visaoMin: 0.1, danoPct: 0.52, csAos10: null, abatesSolo: 2.4, cura: 900, interrogacao: 1 },
    elo: [{ fila: 'RANKED_SOLO_5x5', tier: 'SILVER', divisao: 'III', pdl: 64, vitorias: 21, derrotas: 24, emSequencia: true }],
    maestrias: [['Sett', 398000, 40], ['Darius', 220400, 22], ['Garen', 110000, 11], ['Samira', 66000, 7], ['Volibear', 30500, 4]],
    parceiros: ['Parceiro Fiel#BR1', 'Escudo Humano#BR1'],
  },
};

const POOL = Object.keys(CHAVES_DEMO);
const NOMES_FICTICIOS = ['Brisa Rúnica', 'Lâmina Gentil', 'Faísca Azul', 'Noite Quieta', 'Pé de Pato', 'Sombra Leve', 'Raio Manso', 'Trovão Doce', 'Eco Distante', 'Pedra Viva', 'Chama Fria', 'Vento Norte', 'Lua Torta', 'Garra Mole', 'Grito Calmo'];
const POSICOES_SR = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];

function mulberry32(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gerarDemo(chave, agora = Date.now()) {
  const cfg = DEMOS[chave];
  if (!cfg) return null;
  const rnd = mulberry32(cfg.semente);
  const perto = (media, variacao = 0.35) => Math.max(0, media * (1 + (rnd() * 2 - 1) * variacao));
  const sortear = (lista) => lista[Math.floor(rnd() * lista.length)];
  const embaralhar = (lista) => lista.map((v) => [rnd(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

  const puuid = `demo-${chave}`;
  const filas = embaralhar(cfg.filas.flatMap(([fila, n]) => Array(n).fill(fila)));
  const campeoes = cfg.campeoes === 'sorteio'
    ? Array.from({ length: cfg.partidas }, () => sortear(POOL))
    : embaralhar(cfg.campeoes.flatMap(([c, n]) => Array(n).fill(c)));

  // Datas: do mais recente para o mais antigo, com sessões de 2 a 5 partidas seguidas.
  const inicios = [];
  let dia = 0;
  while (inicios.length < cfg.partidas) {
    const hora = sortear(cfg.horas);
    const base = new Date(agora - dia * 86400000);
    base.setHours(hora, Math.floor(rnd() * 50), 0, 0);
    const naSessao = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < naSessao && inicios.length < cfg.partidas; i++) inicios.push(base.getTime() + i * 36 * 60000);
    dia += 1 + Math.floor(rnd() * 2);
  }
  inicios.sort((a, b) => a - b);

  // Resultados em ordem cronológica, para o padrão de "tilt" aparecer quando configurado.
  const vitorias = [];
  let derrotasSeguidas = 0;
  for (let i = 0; i < cfg.partidas; i++) {
    const chance = cfg.tilt && derrotasSeguidas >= 2 ? 0.25 : cfg.vitoria;
    const venceu = rnd() < chance;
    vitorias.push(venceu);
    derrotasSeguidas = venceu ? 0 : derrotasSeguidas + 1;
  }

  const partidas = inicios.map((inicio, i) => {
    const fila = filas[i % filas.length];
    const id = `BR1_${9100000000 + cfg.semente * 1000 + i}`;
    const minutos = fila === 1700 ? 18 + rnd() * 8 : fila === 450 ? 16 + rnd() * 9 : 21 + rnd() * 17;
    return fila === 1700
      ? partidaArena({ id, fila, inicio, minutos, campeao: campeoes[i], venceu: vitorias[i], cfg, puuid, rnd, perto, sortear, embaralhar })
      : partidaTimes({ id, fila, inicio, minutos, campeao: campeoes[i], venceu: vitorias[i], cfg, puuid, rnd, perto, sortear });
  });

  const conta = {
    plataforma: 'br1',
    demo: true,
    conta: { puuid, nome: cfg.nome, tag: cfg.tag },
    invocador: { nivel: cfg.nivel, icone: cfg.icone },
    elo: cfg.elo,
    maestrias: cfg.maestrias.map(([c, pontos, nivel], i) => ({ campeaoId: CHAVES_DEMO[c], pontos, nivel, ultimaVez: agora - i * 86400000 * 3 })),
    partidas: [...partidas].reverse().map((p) => p.id),
    aoVivo: null,
  };
  return { conta, partidas: Object.fromEntries(partidas.map((p) => [p.id, p])) };
}

function jogador({ puuid, nome, tag, campeao, time, subtime = null, posicao = '', vitoria, m, perto, rnd, minutos, eu = false }) {
  const k = Math.round(perto(m.k, 0.6));
  const d = Math.round(perto(m.d, 0.5));
  const a = Math.round(perto(m.a, 0.5));
  return {
    puuid, nome, tag, campeao, campeaoId: CHAVES_DEMO[campeao] ?? 0, time, subtime, posicao, vitoria,
    k, d, a,
    cs: Math.round(perto(m.csMin, 0.15) * minutos),
    ouro: Math.round((300 + 380 * minutos) * (vitoria ? 1.1 : 0.95)),
    dano: Math.round(perto(m.dano ?? 900, 0.3) * minutos),
    danoRecebido: Math.round(perto(800, 0.3) * minutos),
    curaAliados: Math.round(perto(m.cura, 0.5)),
    visao: Math.round(perto(m.visaoMin, 0.25) * minutos),
    sentinelasControle: Math.round(perto(eu ? 0.8 : 1.5, 0.8)),
    nivel: Math.min(18, Math.round(minutos / 2)),
    itens: [3089, 3157, 3020, 4645, 3165, 0, 3363],
    maiorMulti: Math.min(5, 1 + Math.floor(rnd() * (eu ? 3.2 : 2.5))),
    pentas: eu && rnd() < 0.04 ? 1 : 0,
    tempoMorto: Math.round(d * (15 + minutos)),
    colocacao: null,
    aumentos: [],
    kp: null,
    danoPct: null,
    csAos10: eu && m.csAos10 ? Math.round(perto(m.csAos10, 0.15)) : null,
    abatesSolo: eu ? Math.round(perto(m.abatesSolo, 0.6)) : 0,
    esquivas: eu ? Math.round(perto(18, 0.5)) : 0,
    pings: {
      interrogacao: eu ? Math.round(perto(m.interrogacao, 0.7)) : 0,
      aCaminho: eu ? Math.round(perto(5, 0.7)) : 0,
      perigo: 0, tudoOuNada: 0, ajuda: 0,
    },
  };
}

function partidaTimes({ id, fila, inicio, minutos, campeao, venceu, cfg, puuid, rnd, perto, sortear }) {
  const aram = fila === 450;
  const usados = new Set([campeao]);
  const outroCampeao = () => { let c; do c = sortear(POOL); while (usados.has(c)); usados.add(c); return c; };
  const minhaPosicao = aram ? '' : (cfg.posicao || sortear(POSICOES_SR));
  const mediasOutros = { k: aram ? 9 : 5, d: aram ? 9 : 5.5, a: aram ? 18 : 7, csMin: aram ? 2.5 : 5.5, visaoMin: aram ? 0.2 : 0.8, cura: 700, dano: aram ? 1100 : 750 };

  const jogadores = [];
  for (const time of [100, 200]) {
    const venceuTime = time === 100 ? venceu : !venceu;
    POSICOES_SR.forEach((posicao, i) => {
      const eu = time === 100 && (aram ? i === 0 : posicao === minhaPosicao);
      const m = eu ? { ...cfg.medias, dano: (aram ? 1500 : 820) * (cfg.medias.danoPct / 0.22) } : mediasOutros;
      jogadores.push(jogador({
        puuid: eu ? puuid : `${id}-${time}-${i}`,
        nome: eu ? cfg.nome : sortear(NOMES_FICTICIOS),
        tag: eu ? cfg.tag : 'BR1',
        campeao: eu ? campeao : outroCampeao(),
        time, posicao: aram ? '' : posicao, vitoria: venceuTime, m, perto, rnd, minutos, eu,
      }));
    });
  }
  return { id, fila, modoJogo: aram ? 'ARAM' : 'CLASSIC', mapa: aram ? 12 : 11, inicio, duracao: Math.round(minutos * 60), versao: '15.20', remake: false, jogadores };
}

function partidaArena({ id, fila, inicio, minutos, campeao, venceu, cfg, puuid, rnd, perto, sortear, embaralhar }) {
  const usados = new Set([campeao]);
  const outroCampeao = () => { let c; do c = sortear(POOL); while (usados.has(c)); usados.add(c); return c; };
  // Vitória na Arena = terminar entre os 4 primeiros.
  const minhaColocacao = venceu ? 1 + Math.floor(rnd() ** 1.6 * 4) : 5 + Math.floor(rnd() * 4);
  const colocacoes = embaralhar([1, 2, 3, 4, 5, 6, 7, 8].filter((c) => c !== minhaColocacao));
  const parceiro = rnd() < 0.7 ? sortear(cfg.parceiros) : `${sortear(NOMES_FICTICIOS)}#BR1`;
  const mediasOutros = { k: 6, d: 6, a: 3, csMin: 0.3, visaoMin: 0.1, cura: 500, dano: 1300 };

  const jogadores = [];
  for (let subtime = 1; subtime <= 8; subtime++) {
    const colocacao = subtime === 1 ? minhaColocacao : colocacoes[subtime - 2];
    for (let i = 0; i < 2; i++) {
      const eu = subtime === 1 && i === 0;
      const [nomeParceiro, tagParceiro] = parceiro.split('#');
      const j = jogador({
        puuid: eu ? puuid : `${id}-${subtime}-${i}`,
        nome: eu ? cfg.nome : subtime === 1 ? nomeParceiro : sortear(NOMES_FICTICIOS),
        tag: eu ? cfg.tag : subtime === 1 ? tagParceiro : 'BR1',
        campeao: eu ? campeao : outroCampeao(),
        time: 100 + subtime, subtime, vitoria: colocacao <= 4,
        m: eu ? { ...cfg.medias, dano: 2100 } : mediasOutros, perto, rnd, minutos, eu,
      });
      j.colocacao = colocacao;
      jogadores.push(j);
    }
  }
  return { id, fila, modoJogo: 'CHERRY', mapa: 30, inicio, duracao: Math.round(minutos * 60), versao: '15.20', remake: false, jogadores };
}
