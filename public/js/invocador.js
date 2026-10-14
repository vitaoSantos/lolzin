// Página do invocador: lê o pedido da URL, mostra o carregamento e monta a landing.

import { carregarPerfil } from './nucleo/fonte.js';
import { REGIOES } from './nucleo/constantes.js';
import { DEMOS } from './nucleo/demo.js';
import { arte, ativarEfeitosDeCursor, esc, imagemGerada, observarRevelacoes, salvarRecente, tornarMagnetico, topoAoRolar, urlDoPerfil } from './comum.js';
import { aplicarCores, extrairCores } from './tema.js';
import { iniciarParticulas } from './particulas.js';
import * as secoes from './secoes.js';

const PLATAFORMAS = ['br1', 'la1', 'la2', 'na1', 'euw1', 'eun1', 'tr1', 'ru', 'me1', 'kr', 'jp1', 'oc1', 'sg2', 'tw2', 'vn2'];

const el = (id) => document.getElementById(id);

function lerPedido() {
  const busca = new URLSearchParams(location.search);
  const demo = busca.get('demo');
  if (demo) return DEMOS[demo] ? { demo, rotulo: `${DEMOS[demo].nome}#${DEMOS[demo].tag}` } : null;

  // /br1/Nome-TAG (a TAG nunca tem hífen, então o último "-" separa os dois).
  const caminho = location.pathname.match(/^\/([a-z0-9]+)\/([^/]+)\/?$/i);
  const plataforma = (caminho?.[1] ?? busca.get('plataforma') ?? 'br1').toLowerCase();
  const slug = caminho?.[2] ?? busca.get('id');
  if (!slug || !PLATAFORMAS.includes(plataforma)) return null;
  const i = slug.lastIndexOf('-');
  if (i <= 0) return null;
  const riotId = `${decodeURIComponent(slug.slice(0, i))}#${decodeURIComponent(slug.slice(i + 1))}`;
  return { riotId, plataforma, rotulo: riotId };
}

// ---------------------------------------------------------------------------------------------
// Carregamento

const PESOS = { conta: 8, 'conta-ok': 22, analise: 96 };

function progresso(valor) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  el('anel-progresso').style.strokeDashoffset = String(377 - (377 * v) / 100);
  el('anel-pct').textContent = `${v}%`;
}

function marcarEtapa(etapa) {
  const ordem = ['conta', 'maestria', 'partidas', 'montagem'];
  const atual = etapa === 'fim' ? ordem.length : ordem.indexOf(etapa);
  document.querySelectorAll('#etapas li').forEach((li) => {
    const i = ordem.indexOf(li.dataset.etapa);
    li.classList.toggle('feita', i < atual);
    li.classList.toggle('ativa', i === atual);
  });
}

function aoProgredir(evento) {
  if (evento.etapa === 'conta') { marcarEtapa('conta'); progresso(PESOS.conta); }
  if (evento.etapa === 'conta-ok') {
    marcarEtapa('maestria');
    progresso(PESOS['conta-ok']);
    // Assim que sabemos o main histórico, a arte dele já aparece atrás do carregamento.
    const { conta, campeoes, atributos } = evento;
    const top = [...conta.maestrias].sort((a, b) => b.pontos - a.pontos)[0];
    const id = top && Object.entries(campeoes.campeoes).find(([, c]) => c.key === top.campeaoId)?.[0];
    if (id) {
      const fundo = el('carregador-fundo');
      const img = new Image();
      img.onload = () => { fundo.style.setProperty('--fundo', `url(${img.src})`); fundo.classList.add('pronto'); };
      img.src = arte.splash(id);
      aplicarCores(REGIOES[atributos[id]?.r]?.cores ?? REGIOES.runeterra.cores);
    }
    setTimeout(() => marcarEtapa('partidas'), 350);
  }
  if (evento.etapa === 'partida') {
    el('contador-partidas').textContent = `${evento.prontas}/${evento.total}`;
    progresso(PESOS['conta-ok'] + (evento.prontas / evento.total) * (PESOS.analise - PESOS['conta-ok'] - 4));
  }
  if (evento.etapa === 'analise') { marcarEtapa('montagem'); progresso(PESOS.analise); }
}

// ---------------------------------------------------------------------------------------------
// Montagem

async function montar(perfil) {
  document.title = `${perfil.conta.nome}#${perfil.conta.tag} · lolzin`;
  document.body.dataset.modo = perfil.modo.principal;

  if (perfil.tema) {
    aplicarCores(perfil.tema.cores);
    // Refina com as cores reais da arte (se a CDN permitir ler os pixels).
    extrairCores(arte.retrato(perfil.tema.id)).then((cores) => cores && aplicarCores(cores));
  }

  const arteGerada = await imagemGerada(`persona-${perfil.persona.principal.id}`);
  el('pagina').innerHTML = [
    secoes.hero(perfil),
    secoes.numeros(perfil),
    secoes.narrativa(perfil),
    secoes.secaoModo(perfil),
    secoes.persona(perfil, arteGerada),
    secoes.padroes(perfil),
    secoes.dicas(perfil),
    secoes.recomendacoes(perfil),
    secoes.historico(perfil),
    secoes.compartilhar(perfil),
  ].join('');
  el('nav-perfil').innerHTML = secoes.navegacao(perfil);
  imagemGerada(`modo-${perfil.modo.principal}`).then((url) => url && el('modo')?.style.setProperty('--arte-modo', `url(${url})`));

  if (perfil.demo) {
    document.body.insertAdjacentHTML('beforeend', '<div class="aviso-demo" role="note">⚠ Perfil de demonstração: jogador e partidas fictícios.</div>');
  } else {
    salvarRecente({ riotId: `${perfil.conta.nome}#${perfil.conta.tag}`, plataforma: perfil.plataforma, campeao: perfil.tema?.id ?? null });
  }

  el('pagina').hidden = false;
  observarRevelacoes(el('pagina'));
  ativarEfeitosDeCursor();
  document.querySelectorAll('#pagina [data-magnetico]').forEach(tornarMagnetico);
  iniciarParticulas(el('particulas'), perfil.modo.principal);
  ativarParallaxDoHero();
  ativarNarrativa();
  ativarCompartilhar(perfil);
}

function ativarParallaxDoHero() {
  const splash = el('hero-splash');
  if (!splash || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  splash.addEventListener('error', () => splash.removeAttribute('src'), { once: true });
  addEventListener('pointermove', (e) => {
    splash.style.setProperty('--px', `${(e.clientX / innerWidth - 0.5) * -24}px`);
    splash.style.setProperty('--py', `${(e.clientY / innerHeight - 0.5) * -16}px`);
  }, { passive: true });
}

// Acende as palavras da narrativa conforme o texto atravessa a tela.
function ativarNarrativa() {
  const texto = el('texto-narrativa');
  if (!texto) return;
  const palavras = [...texto.querySelectorAll('.n-palavra')];
  const atualizar = () => {
    const r = texto.getBoundingClientRect();
    const inicio = innerHeight * 0.85;
    const fim = innerHeight * 0.35;
    const t = Math.max(0, Math.min(1, (inicio - r.top) / (inicio - fim + r.height * 0.6)));
    const acesas = Math.round(t * palavras.length);
    palavras.forEach((p, i) => p.classList.toggle('acesa', i < acesas));
  };
  addEventListener('scroll', atualizar, { passive: true });
  atualizar();
}

function ativarCompartilhar(perfil) {
  const botao = el('botao-compartilhar');
  if (!botao) return;
  const url = perfil.demo ? location.href : new URL(urlDoPerfil(perfil.plataforma, `${perfil.conta.nome}#${perfil.conta.tag}`), location.origin).href;
  botao.addEventListener('click', async () => {
    const titulo = `${perfil.conta.nome}#${perfil.conta.tag} no lolzin`;
    if (navigator.share && matchMedia('(hover: none)').matches) {
      try { await navigator.share({ title: titulo, url }); return; } catch { /* cancelado */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      botao.firstChild.textContent = 'Link copiado! ';
    } catch {
      prompt('Copie o link da página:', url);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Erros

const MENSAGENS = {
  nao_encontrado: ['Não achamos esse invocador', 'Confira o nome, a TAG (depois do #) e a região. O Riot ID aparece no cliente, ao passar o mouse no seu ícone.'],
  sem_chave: ['O servidor ainda não tem chave da Riot', 'Enquanto a chave não é configurada, só os perfis de demonstração funcionam.'],
  chave_invalida: ['A chave da Riot expirou', 'A chave de desenvolvimento da Riot vale 24 horas. Quem cuida do servidor precisa gerar uma nova.'],
  limite: ['Muita gente buscando agora', 'Atingimos o limite de consultas da Riot por alguns segundos. Tente de novo em instantes.'],
  rede: ['Sem conexão com o servidor', 'Este site precisa do backend para buscar jogadores reais. Os exemplos funcionam mesmo assim.'],
  url: ['Endereço inválido', 'Use a busca da página inicial para montar a sua página.'],
};

function mostrarErro(codigo, mensagemServidor) {
  const [titulo, texto] = MENSAGENS[codigo] ?? ['Algo deu errado', mensagemServidor ?? 'Tente de novo em instantes.'];
  el('carregador').classList.add('saindo');
  el('pagina').hidden = false;
  el('pagina').innerHTML = `<section class="erro-tela">
    <div class="cartao">
      <p class="sobrancelha">Ops</p>
      <h1>${esc(titulo)}</h1>
      <p>${esc(texto)}</p>
      <div class="acoes">
        <a class="botao botao--primario" href="/">Voltar à busca</a>
        <a class="botao botao--fantasma" href="/invocador?demo=ranqueada">Ver um exemplo</a>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------

topoAoRolar();
const pedido = lerPedido();
if (!pedido) {
  mostrarErro('url');
} else {
  el('carregador-alvo').innerHTML = `${esc(pedido.rotulo.split('#')[0])}<small>#${esc(pedido.rotulo.split('#')[1] ?? '')}</small>`;
  try {
    const perfil = await carregarPerfil(pedido, aoProgredir);
    progresso(100);
    marcarEtapa('fim');
    await montar(perfil);
    setTimeout(() => {
      el('carregador').classList.add('saindo');
      setTimeout(() => el('carregador').remove(), 1200);
    }, 450);
  } catch (erro) {
    console.error(erro);
    mostrarErro(erro.codigo, erro.message);
  }
}
