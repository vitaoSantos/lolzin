// Roteador portátil: recebe um `Request` padrão e devolve um `Response` padrão.
// Os adaptadores (src/worker.js para Cloudflare, scripts/dev.mjs para Node) só ligam os fios.
// Migrar de hospedagem = escrever outro adaptador de poucas linhas.

import { criarClienteRiot, ErroRiot, PLATAFORMAS } from './riot.js';
import { enxugarCampeoes, enxugarConta, enxugarPartida } from './enxugar.js';
import { criarCacheMemoria } from './cache.js';

const memoria = criarCacheMemoria();
const UM_ANO = 31536000;

const ROTA_PERFIL = new RegExp(`^/(${PLATAFORMAS.join('|')})/[^/]+/?$`, 'i');

/**
 * @param {Request} request
 * @param {{ RIOT_API_KEY?: string }} env
 * @param {{
 *   servirArquivo: (caminho: string, request: Request) => Promise<Response>,
 *   cacheBorda?: { match(r: Request): Promise<Response|undefined>, put(r: Request, res: Response): Promise<void> },
 *   fetch?: typeof fetch,
 * }} opcoes
 */
export async function tratar(request, env, opcoes) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    if (request.method !== 'GET') return json({ erro: 'metodo', mensagem: 'Só GET.' }, 405);
    try {
      return await tratarApi(url, request, env, opcoes);
    } catch (erro) {
      return respostaDeErro(erro);
    }
  }

  // URL compartilhável: /br1/Nome-TAG abre a landing do invocador.
  if (ROTA_PERFIL.test(url.pathname)) return opcoes.servirArquivo('/invocador', request);

  return opcoes.servirArquivo(url.pathname, request);
}

async function tratarApi(url, request, env, opcoes) {
  const fetchRiot = opcoes.fetch ?? globalThis.fetch;
  const rota = url.pathname.replace(/\/+$/, '');

  if (rota === '/api/status') {
    return json({ chaveRiot: Boolean(env.RIOT_API_KEY) }, 200, 30);
  }

  if (rota === '/api/campeoes') {
    const idioma = /^[a-z]{2}_[A-Z]{2}$/.test(url.searchParams.get('idioma') ?? '') ? url.searchParams.get('idioma') : 'pt_BR';
    const dados = await memoria.obter(`campeoes:${idioma}`, 6 * 3600, () => buscarCampeoes(idioma, fetchRiot));
    return json(dados, 200, 6 * 3600);
  }

  if (rota === '/api/conta') {
    const plataforma = (url.searchParams.get('plataforma') ?? 'br1').toLowerCase();
    if (!PLATAFORMAS.includes(plataforma)) return json({ erro: 'plataforma', mensagem: 'Região inválida.' }, 400);
    const riotId = separarRiotId(url.searchParams.get('riotId'));
    if (!riotId) return json({ erro: 'riot_id', mensagem: 'Use o formato Nome#TAG.' }, 400);
    const quantidade = Math.min(40, Math.max(5, Number(url.searchParams.get('n')) || 20));

    const riot = criarClienteRiot({ chave: env.RIOT_API_KEY, fetch: fetchRiot });
    const chave = `conta:${plataforma}:${riotId.nome}#${riotId.tag}:${quantidade}`.toLowerCase();
    const dados = await memoria.obter(chave, 120, () => buscarConta(riot, plataforma, riotId, quantidade));
    return json(dados, 200, 120);
  }

  const partida = rota.match(/^\/api\/partida\/([A-Za-z0-9]+_\d+)$/);
  if (partida) {
    const idPartida = partida[1].toUpperCase();
    // Partidas terminadas nunca mudam: cache "para sempre" na borda e no navegador.
    const chaveBorda = new Request(new URL(`/api/partida/${idPartida}`, url), { method: 'GET' });
    const emCache = await opcoes.cacheBorda?.match(chaveBorda);
    if (emCache) return emCache;

    const riot = criarClienteRiot({ chave: env.RIOT_API_KEY, fetch: fetchRiot });
    const dados = await memoria.obter(`partida:${idPartida}`, 3600, async () => enxugarPartida(await riot.partida(idPartida)));
    const resposta = json(dados, 200, UM_ANO, true);
    await opcoes.cacheBorda?.put(chaveBorda, resposta.clone());
    return resposta;
  }

  return json({ erro: 'rota', mensagem: 'Rota não encontrada.' }, 404);
}

async function buscarConta(riot, plataforma, { nome, tag }, quantidade) {
  const conta = await riot.conta(plataforma, nome, tag);
  const [invocador, elo, maestrias, idsPartidas, aoVivo] = await Promise.all([
    riot.invocador(plataforma, conta.puuid),
    riot.elo(plataforma, conta.puuid),
    riot.maestrias(plataforma, conta.puuid),
    riot.idsPartidas(plataforma, conta.puuid, quantidade),
    riot.aoVivo(plataforma, conta.puuid).catch(() => null), // opcional: não derruba a página
  ]);
  return enxugarConta({ plataforma, conta, invocador, elo, maestrias, idsPartidas, aoVivo });
}

async function buscarCampeoes(idioma, fetchDados) {
  const base = 'https://ddragon.leagueoflegends.com';
  const versoes = await (await fetchDados(`${base}/api/versions.json`)).json();
  const versao = versoes[0];
  const resposta = await fetchDados(`${base}/cdn/${versao}/data/${idioma}/champion.json`);
  if (!resposta.ok) throw new ErroRiot(502, 'Data Dragon indisponível');
  return enxugarCampeoes(versao, await resposta.json());
}

export function separarRiotId(texto) {
  if (!texto) return null;
  const i = texto.lastIndexOf('#');
  if (i <= 0) return null;
  const nome = texto.slice(0, i).trim();
  const tag = texto.slice(i + 1).trim();
  if (nome.length < 3 || nome.length > 16 || !/^[\p{L}\p{N}]{2,5}$/u.test(tag)) return null;
  return { nome, tag };
}

function respostaDeErro(erro) {
  if (!(erro instanceof ErroRiot)) {
    console.error(erro);
    return json({ erro: 'interno', mensagem: 'Algo deu errado do nosso lado.' }, 500);
  }
  switch (erro.status) {
    case 404:
      return json({ erro: 'nao_encontrado', mensagem: 'Não encontramos esse Riot ID nessa região.' }, 404);
    case 400:
      return json({ erro: 'requisicao', mensagem: erro.message }, 400);
    case 401:
    case 403:
      return json({ erro: 'chave_invalida', mensagem: 'A chave da Riot expirou ou é inválida.' }, 502);
    case 429:
      return json({ erro: 'limite', mensagem: 'Muita gente buscando ao mesmo tempo. Tente de novo em instantes.', tentarEm: erro.tentarEm }, 429);
    case 503:
      return json({ erro: 'sem_chave', mensagem: 'O servidor ainda não tem uma chave da Riot configurada.' }, 503);
    default:
      return json({ erro: 'riot_indisponivel', mensagem: 'A API da Riot não respondeu como esperado.' }, 502);
  }
}

function json(dados, status = 200, segundosCache = 0, imutavel = false) {
  const cache = segundosCache > 0 && status === 200
    ? `public, max-age=${segundosCache}${imutavel ? ', immutable' : ''}`
    : 'no-store';
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}
