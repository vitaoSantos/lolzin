// Cliente mínimo da Riot API.
// Usa só `fetch` padrão, então roda igual em Cloudflare Workers, Node 18+, Deno e Bun.

const REGIAO_POR_PLATAFORMA = {
  br1: 'americas', la1: 'americas', la2: 'americas', na1: 'americas',
  euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe', me1: 'europe',
  kr: 'asia', jp1: 'asia',
  oc1: 'sea', sg2: 'sea', tw2: 'sea', vn2: 'sea',
};

export const PLATAFORMAS = Object.keys(REGIAO_POR_PLATAFORMA);

export function regiaoDe(plataforma) {
  const regiao = REGIAO_POR_PLATAFORMA[plataforma];
  if (!regiao) throw new ErroRiot(400, `Plataforma desconhecida: ${plataforma}`);
  return regiao;
}

// account-v1 não existe no cluster "sea"; contas de lá são resolvidas pela Ásia.
function regiaoDaConta(plataforma) {
  const regiao = regiaoDe(plataforma);
  return regiao === 'sea' ? 'asia' : regiao;
}

// O ID de partida carrega a plataforma: "BR1_3012345678".
export function plataformaDaPartida(idPartida) {
  const prefixo = String(idPartida).split('_')[0].toLowerCase();
  regiaoDe(prefixo);
  return prefixo;
}

export class ErroRiot extends Error {
  constructor(status, mensagem, tentarEm = null) {
    super(mensagem);
    this.status = status;
    this.tentarEm = tentarEm;
  }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export function criarClienteRiot({ chave, fetch = globalThis.fetch }) {
  if (!chave) throw new ErroRiot(503, 'RIOT_API_KEY não configurada');

  async function get(host, caminho) {
    const url = `https://${host}.api.riotgames.com${caminho}`;
    for (let tentativa = 0; ; tentativa++) {
      const resposta = await fetch(url, { headers: { 'X-Riot-Token': chave } });
      if (resposta.ok) return resposta.json();

      const cabecalho = resposta.headers.get('Retry-After');
      const tentarEm = cabecalho === null || Number.isNaN(Number(cabecalho)) ? null : Number(cabecalho);
      // Limite estourado por pouco tempo: espera e tenta de novo uma vez.
      if (resposta.status === 429 && tentativa === 0 && tentarEm !== null && tentarEm <= 3) {
        await dormir(tentarEm * 1000);
        continue;
      }
      throw new ErroRiot(resposta.status, `Riot API respondeu ${resposta.status} em ${caminho}`, tentarEm);
    }
  }

  const enc = encodeURIComponent;

  return {
    conta: (plataforma, nome, tag) =>
      get(regiaoDaConta(plataforma), `/riot/account/v1/accounts/by-riot-id/${enc(nome)}/${enc(tag)}`),
    invocador: (plataforma, puuid) =>
      get(plataforma, `/lol/summoner/v4/summoners/by-puuid/${enc(puuid)}`),
    elo: (plataforma, puuid) =>
      get(plataforma, `/lol/league/v4/entries/by-puuid/${enc(puuid)}`),
    maestrias: (plataforma, puuid) =>
      get(plataforma, `/lol/champion-mastery/v4/champion-masteries/by-puuid/${enc(puuid)}`),
    idsPartidas: (plataforma, puuid, quantidade) =>
      get(regiaoDe(plataforma), `/lol/match/v5/matches/by-puuid/${enc(puuid)}/ids?start=0&count=${quantidade}`),
    partida: (idPartida) =>
      get(regiaoDe(plataformaDaPartida(idPartida)), `/lol/match/v5/matches/${enc(idPartida)}`),
    async aoVivo(plataforma, puuid) {
      try {
        return await get(plataforma, `/lol/spectator/v5/active-games/by-summoner/${enc(puuid)}`);
      } catch (erro) {
        if (erro.status === 404) return null; // fora de partida
        throw erro;
      }
    },
  };
}
