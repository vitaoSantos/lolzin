// Orquestra o carregamento: conta → partidas (em paralelo, com progresso) → campeões → análise.
// Funciona com a API real (/api/*) ou com os perfis de demonstração, sem mudar o resto da página.

import { analisar } from './analise.js';
import { CHAVES_DEMO, gerarDemo } from './demo.js';
import { DDRAGON } from './constantes.js';

export class ErroCarregamento extends Error {
  constructor(codigo, mensagem) {
    super(mensagem);
    this.codigo = codigo;
  }
}

async function obterJson(url) {
  let resposta;
  try {
    resposta = await fetch(url);
  } catch {
    throw new ErroCarregamento('rede', 'Sem conexão com o servidor.');
  }
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new ErroCarregamento(corpo.erro ?? `http_${resposta.status}`, corpo.mensagem ?? 'Falha ao carregar.');
  return corpo;
}

function fonteApi() {
  return {
    conta: (riotId, plataforma, n) =>
      obterJson(`/api/conta?riotId=${encodeURIComponent(riotId)}&plataforma=${plataforma}&n=${n}`),
    partida: (id) => obterJson(`/api/partida/${id}`),
  };
}

function fonteDemo(chave) {
  const demo = gerarDemo(chave);
  if (!demo) throw new ErroCarregamento('demo', 'Exemplo inexistente.');
  const atraso = (ms) => new Promise((r) => setTimeout(r, ms));
  return {
    // Pequenos atrasos para a demonstração mostrar a página se montando, como numa busca real.
    conta: async () => { await atraso(500); return demo.conta; },
    partida: async (id) => { await atraso(60 + Math.random() * 140); return demo.partidas[id]; },
  };
}

// Nomes e títulos oficiais em pt_BR: backend (com cache) → Data Dragon direto → só a lista curada.
export async function carregarCampeoes(atributos) {
  try {
    return await obterJson('/api/campeoes?idioma=pt_BR');
  } catch { /* sem backend: tenta direto */ }
  try {
    const versoes = await (await fetch(`${DDRAGON}/api/versions.json`)).json();
    const dados = await (await fetch(`${DDRAGON}/cdn/${versoes[0]}/data/pt_BR/champion.json`)).json();
    const campeoes = {};
    for (const c of Object.values(dados.data)) campeoes[c.id] = { key: Number(c.key), nome: c.name, titulo: c.title, resumo: c.blurb, tags: c.tags };
    return { versao: versoes[0], campeoes };
  } catch { /* sem Data Dragon: segue com o que temos */ }
  const campeoes = {};
  for (const [id, a] of Object.entries(atributos)) campeoes[id] = { key: CHAVES_DEMO[id] ?? null, nome: a.n };
  return { versao: null, campeoes };
}

let atributosEmCache = null;
export async function carregarAtributos() {
  atributosEmCache ??= obterJson('/dados/campeoes.json').then((d) => d.campeoes);
  return atributosEmCache;
}

async function emParalelo(itens, limite, tarefa) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  async function trabalhador() {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await tarefa(itens[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}

/**
 * @param {{ riotId?: string, plataforma?: string, demo?: string, n?: number }} pedido
 * @param {(evento: object) => void} aoProgredir
 */
export async function carregarPerfil(pedido, aoProgredir = () => {}) {
  const fonte = pedido.demo ? fonteDemo(pedido.demo) : fonteApi();
  const atributosP = carregarAtributos();
  const campeoesP = atributosP.then(carregarCampeoes);

  aoProgredir({ etapa: 'conta' });
  const conta = await fonte.conta(pedido.riotId, pedido.plataforma ?? 'br1', pedido.n ?? 20);
  const [atributos, campeoes] = await Promise.all([atributosP, campeoesP]);
  aoProgredir({ etapa: 'conta-ok', conta, campeoes, atributos });

  let prontas = 0;
  const total = conta.partidas.length;
  const partidas = await emParalelo(conta.partidas, 4, async (id) => {
    try {
      return await fonte.partida(id);
    } catch (erro) {
      // Uma partida que falha não derruba a página; só fica fora da análise.
      if (erro.codigo === 'chave_invalida' || erro.codigo === 'sem_chave') throw erro;
      return null;
    } finally {
      aoProgredir({ etapa: 'partida', prontas: ++prontas, total });
    }
  });

  aoProgredir({ etapa: 'analise' });
  const perfil = analisar({ conta, partidas: partidas.filter(Boolean), campeoes, atributos });
  perfil.demo = Boolean(pedido.demo);
  return perfil;
}
