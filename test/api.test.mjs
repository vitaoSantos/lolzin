import { test } from 'node:test';
import assert from 'node:assert/strict';
import { separarRiotId, tratar } from '../src/app.js';

const PUUID = 'puuid-teste';

function participante(i, extra = {}) {
  return {
    puuid: i === 0 ? PUUID : `outro-${i}`, riotIdGameName: i === 0 ? 'Teste' : `Jogador${i}`, riotIdTagline: 'BR1',
    championName: i === 0 ? 'FiddleSticks' : 'Ahri', championId: i === 0 ? 9 : 103, teamId: i < 5 ? 100 : 200,
    teamPosition: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'][i % 5], win: i < 5,
    kills: 5, deaths: 3, assists: 7, totalMinionsKilled: 150, neutralMinionsKilled: 20, goldEarned: 11000,
    totalDamageDealtToChampions: 20000, totalDamageTaken: 18000, totalHealsOnTeammates: 100, totalDamageShieldedOnTeammates: 50,
    visionScore: 25, visionWardsBoughtInGame: 2, champLevel: 16, item0: 1, item1: 2, item2: 3, item3: 4, item4: 5, item5: 6, item6: 3340,
    largestMultiKill: 2, pentaKills: 0, totalTimeSpentDead: 60, enemyMissingPings: 4, onMyWayPings: 2,
    challenges: { killParticipation: 0.6, teamDamagePercentage: 0.22, laneMinionsFirst10Minutes: 60, soloKills: 1, skillshotsDodged: 12 },
    ...extra,
  };
}

const PARTIDA = {
  metadata: { matchId: 'BR1_123' },
  info: { queueId: 420, gameMode: 'CLASSIC', mapId: 11, gameStartTimestamp: 1760000000000, gameDuration: 1800, gameVersion: '15.20.1', participants: Array.from({ length: 10 }, (_, i) => participante(i)) },
};

function riotFalso(sobrescrever = {}) {
  const chamadas = [];
  const respostas = {
    '/riot/account/v1/accounts/by-riot-id/Teste/BR1': { puuid: PUUID, gameName: 'Teste', tagLine: 'BR1' },
    [`/lol/summoner/v4/summoners/by-puuid/${PUUID}`]: { profileIconId: 29, summonerLevel: 150 },
    [`/lol/league/v4/entries/by-puuid/${PUUID}`]: [{ queueType: 'RANKED_SOLO_5x5', tier: 'GOLD', rank: 'II', leaguePoints: 40, wins: 10, losses: 8, hotStreak: true }],
    [`/lol/champion-mastery/v4/champion-masteries/by-puuid/${PUUID}`]: [{ championId: 9, championPoints: 50000, championLevel: 7, lastPlayTime: 1 }],
    [`/lol/match/v5/matches/by-puuid/${PUUID}/ids?start=0&count=20`]: ['BR1_123'],
    [`/lol/spectator/v5/active-games/by-summoner/${PUUID}`]: 404,
    '/lol/match/v5/matches/BR1_123': PARTIDA,
    ...sobrescrever,
  };
  const fetch = async (url, opcoes) => {
    const u = new URL(url);
    chamadas.push({ host: u.host, caminho: u.pathname + u.search, chave: opcoes?.headers?.['X-Riot-Token'] });
    const r = respostas[u.pathname + u.search];
    if (typeof r === 'function') return r();
    if (r === undefined) return new Response('{}', { status: 404 });
    if (typeof r === 'number') return new Response('{}', { status: r });
    return new Response(JSON.stringify(r), { status: 200 });
  };
  return { fetch, chamadas };
}

const servirArquivo = async (caminho) => new Response(`arquivo:${caminho}`);
const pedir = (caminho, env, opcoes) => tratar(new Request(`http://localhost${caminho}`), env, { servirArquivo, ...opcoes });
const ENV = { RIOT_API_KEY: 'RGAPI-teste' };

test('separa Riot ID pelo último #', () => {
  assert.deepEqual(separarRiotId('Nome Com Espaço#BR1'), { nome: 'Nome Com Espaço', tag: 'BR1' });
  assert.equal(separarRiotId('SemTag'), null);
  assert.equal(separarRiotId('ab#BR1'), null);
  assert.equal(separarRiotId('Nome#TAG-ERRADA'), null);
});

test('/api/conta consulta as rotas certas e devolve o formato enxuto', async () => {
  const riot = riotFalso();
  const resposta = await pedir('/api/conta?riotId=Teste%23BR1&plataforma=br1', ENV, { fetch: riot.fetch });
  assert.equal(resposta.status, 200);
  const dados = await resposta.json();
  assert.equal(dados.conta.puuid, PUUID);
  assert.equal(dados.invocador.nivel, 150);
  assert.equal(dados.elo[0].tier, 'GOLD');
  assert.equal(dados.maestrias[0].campeaoId, 9);
  assert.deepEqual(dados.partidas, ['BR1_123']);
  assert.equal(dados.aoVivo, null);
  assert.ok(riot.chamadas.every((c) => c.chave === 'RGAPI-teste'));
  assert.equal(riot.chamadas.find((c) => c.caminho.startsWith('/riot/account')).host, 'americas.api.riotgames.com');
  assert.equal(riot.chamadas.find((c) => c.caminho.startsWith('/lol/summoner')).host, 'br1.api.riotgames.com');
  assert.equal(riot.chamadas.find((c) => c.caminho.includes('/match/v5/matches/by-puuid')).host, 'americas.api.riotgames.com');
});

test('/api/partida enxuga a partida e manda cache imutável', async () => {
  const riot = riotFalso();
  const resposta = await pedir('/api/partida/BR1_123', ENV, { fetch: riot.fetch });
  assert.equal(resposta.status, 200);
  assert.match(resposta.headers.get('cache-control'), /immutable/);
  const p = await resposta.json();
  assert.equal(p.jogadores.length, 10);
  assert.equal(p.jogadores[0].campeao, 'FiddleSticks');
  assert.equal(p.jogadores[0].cs, 170);
  assert.equal(p.jogadores[0].kp, 0.6);
  assert.equal(p.jogadores[0].pings.interrogacao, 4);
  assert.ok(JSON.stringify(p).length < 8000, 'partida enxuta continua pequena');
});

test('erros da Riot viram mensagens amigáveis', async () => {
  const naoAchou = await pedir('/api/conta?riotId=Outro%23BR1', ENV, { fetch: riotFalso().fetch });
  assert.equal(naoAchou.status, 404);
  assert.equal((await naoAchou.json()).erro, 'nao_encontrado');

  // Outro Riot ID: o da primeira consulta já está no cache em memória.
  const expirada = await pedir('/api/conta?riotId=Expirada%23BR1', ENV, {
    fetch: riotFalso({ '/riot/account/v1/accounts/by-riot-id/Expirada/BR1': 401 }).fetch,
  });
  assert.equal((await expirada.json()).erro, 'chave_invalida');

  const semChave = await pedir('/api/partida/BR1_999', {}, { fetch: riotFalso().fetch });
  assert.equal(semChave.status, 503);

  const invalido = await pedir('/api/conta?riotId=SemTag', ENV, {});
  assert.equal(invalido.status, 400);
});

test('limite estourado por pouco tempo é tentado de novo uma vez', async () => {
  let tentativas = 0;
  const riot = riotFalso({
    '/lol/match/v5/matches/BR1_777': () => (++tentativas === 1
      ? new Response('{}', { status: 429, headers: { 'Retry-After': '0' } })
      : new Response(JSON.stringify({ ...PARTIDA, metadata: { matchId: 'BR1_777' } }), { status: 200 })),
  });
  const resposta = await pedir('/api/partida/BR1_777', ENV, { fetch: riot.fetch });
  assert.equal(resposta.status, 200);
  assert.equal(tentativas, 2);
});

test('URL de perfil serve a página do invocador', async () => {
  const resposta = await pedir('/br1/Teste-BR1', ENV, {});
  assert.equal(await resposta.text(), 'arquivo:/invocador');
  const comum = await pedir('/css/base.css', ENV, {});
  assert.equal(await comum.text(), 'arquivo:/css/base.css');
});
