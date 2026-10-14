// Reduz as respostas da Riot ao que o front usa.
// Uma partida bruta tem ~60 KB; enxuta fica em ~6 KB e pode ir para o cache de borda sem custo.

export function enxugarPartida(bruta) {
  const info = bruta.info;
  return {
    id: bruta.metadata.matchId,
    fila: info.queueId,
    modoJogo: info.gameMode,
    mapa: info.mapId,
    inicio: info.gameStartTimestamp ?? info.gameCreation,
    duracao: info.gameDuration,
    versao: info.gameVersion,
    remake: info.participants.some((p) => p.gameEndedInEarlySurrender),
    jogadores: info.participants.map(enxugarJogador),
  };
}

function enxugarJogador(p) {
  const c = p.challenges ?? {};
  return {
    puuid: p.puuid,
    nome: p.riotIdGameName ?? p.summonerName ?? '',
    tag: p.riotIdTagline ?? '',
    campeao: p.championName,
    campeaoId: p.championId,
    time: p.teamId,
    subtime: p.playerSubteamId || null,
    posicao: p.teamPosition || '',
    vitoria: Boolean(p.win),
    k: p.kills,
    d: p.deaths,
    a: p.assists,
    cs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
    ouro: p.goldEarned,
    dano: p.totalDamageDealtToChampions,
    danoRecebido: p.totalDamageTaken,
    curaAliados: (p.totalHealsOnTeammates ?? 0) + (p.totalDamageShieldedOnTeammates ?? 0),
    visao: p.visionScore,
    sentinelasControle: p.visionWardsBoughtInGame ?? c.controlWardsPlaced ?? 0,
    nivel: p.champLevel,
    itens: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
    maiorMulti: p.largestMultiKill ?? 0,
    pentas: p.pentaKills ?? 0,
    tempoMorto: p.totalTimeSpentDead ?? 0,
    colocacao: p.placement || p.subteamPlacement || null,
    aumentos: [1, 2, 3, 4, 5, 6].map((i) => p[`playerAugment${i}`]).filter(Boolean),
    // Métricas que a Riot já calcula no objeto `challenges` (podem faltar em alguns modos).
    kp: c.killParticipation ?? null,
    danoPct: c.teamDamagePercentage ?? null,
    csAos10: c.laneMinionsFirst10Minutes ?? null,
    abatesSolo: c.soloKills ?? null,
    esquivas: c.skillshotsDodged ?? null,
    pings: {
      interrogacao: p.enemyMissingPings ?? 0,
      aCaminho: p.onMyWayPings ?? 0,
      perigo: p.dangerPings ?? 0,
      tudoOuNada: p.allInPings ?? 0,
      ajuda: p.assistMePings ?? 0,
    },
  };
}

export function enxugarConta({ plataforma, conta, invocador, elo, maestrias, idsPartidas, aoVivo }) {
  const eu = aoVivo?.participants?.find((p) => p.puuid === conta.puuid);
  return {
    plataforma,
    conta: { puuid: conta.puuid, nome: conta.gameName, tag: conta.tagLine },
    invocador: { nivel: invocador.summonerLevel, icone: invocador.profileIconId },
    elo: elo.map((e) => ({
      fila: e.queueType,
      tier: e.tier,
      divisao: e.rank,
      pdl: e.leaguePoints,
      vitorias: e.wins,
      derrotas: e.losses,
      emSequencia: Boolean(e.hotStreak),
    })),
    maestrias: maestrias.map((m) => ({
      campeaoId: m.championId,
      pontos: m.championPoints,
      nivel: m.championLevel,
      ultimaVez: m.lastPlayTime,
    })),
    partidas: idsPartidas,
    aoVivo: aoVivo
      ? { fila: aoVivo.gameQueueConfigId, modoJogo: aoVivo.gameMode, inicio: aoVivo.gameStartTime, campeaoId: eu?.championId ?? null }
      : null,
  };
}

export function enxugarCampeoes(versao, championJson) {
  const campeoes = {};
  for (const c of Object.values(championJson.data)) {
    campeoes[c.id] = { key: Number(c.key), nome: c.name, titulo: c.title, resumo: c.blurb, tags: c.tags };
  }
  return { versao, campeoes };
}
