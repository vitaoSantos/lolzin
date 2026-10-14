// Tela de busca: título cinético, mural de campeões, vitrine de recursos e o formulário.

import { arte, ativarEfeitosDeCursor, esc, imagemGerada, lerRecentes, observarRevelacoes, topoAoRolar, urlDoPerfil } from './comum.js';
import { aplicarCores, extrairCores } from './tema.js';
import { REGIOES } from './nucleo/constantes.js';

const MURAL = [
  'Ahri', 'Yasuo', 'Jinx', 'Thresh', 'Lux', 'Zed', 'Ekko', 'Viego', 'Kaisa', 'Sett', 'Seraphine', 'Aatrox',
  'Akali', 'Yone', 'Darius', 'Leona', 'Ezreal', 'Katarina', 'Vi', 'Caitlyn', 'Pyke', 'Senna', 'Sylas', 'Aphelios',
  'Gwen', 'Lillia', 'Samira', 'Briar', 'Hwei', 'Smolder', 'Aurora', 'Mel', 'Ambessa', 'Garen', 'Lucian', 'Irelia',
];

// Vitrine do tema: campeão + região (a paleta da região é o ponto de partida antes da extração).
const VITRINE = [['Ahri', 'ionia'], ['Jinx', 'zaun'], ['Leona', 'targon'], ['Darius', 'noxus'], ['Ashe', 'freljord']];
const PALAVRAS = ['palco.', 'dossiê.', 'coliseu.', 'caos.'];
const PERSONAS = ['ESPECIALISTA', 'CORUJA', 'CARREGADOR', 'DUELISTA', 'GUARDIÃO DA VISÃO', 'CAMALEÃO'];

topoAoRolar();
animarTitulo();
montarMural();
iniciarVitrine();
iniciarCiclos();
configurarFormulario();
mostrarRecentes();
verificarServidor();
observarRevelacoes();
ativarEfeitosDeCursor();

imagemGerada('busca-hero').then((url) => {
  if (url) document.getElementById('veu-hero').style.setProperty('--arte-hero', `url(${url})`);
});

function animarTitulo() {
  let i = 0;
  document.querySelectorAll('[data-cinetico]').forEach((linha) => {
    for (const no of [...linha.childNodes]) {
      if (no.nodeType !== Node.TEXT_NODE) {
        no.style?.setProperty('--i', i++);
        continue;
      }
      const fragmento = document.createDocumentFragment();
      for (const parte of no.textContent.split(/(\s+)/)) {
        if (!parte.trim()) { fragmento.append(parte); continue; }
        const palavra = document.createElement('span');
        palavra.className = 'palavra';
        palavra.innerHTML = `<span style="--i:${i++}">${esc(parte)}</span>`;
        fragmento.append(palavra);
      }
      no.replaceWith(fragmento);
    }
  });
}

function montarMural() {
  const plano = document.getElementById('mural');
  const colunas = 6;
  const porColuna = MURAL.length / colunas;
  for (let c = 0; c < colunas; c++) {
    const nomes = MURAL.slice(c * porColuna, (c + 1) * porColuna);
    const coluna = document.createElement('div');
    coluna.className = 'mural__coluna';
    // Lista duplicada: a animação sobe metade da altura e recomeça sem emenda.
    coluna.innerHTML = [...nomes, ...nomes].map((id) => `<img src="${arte.retrato(id)}" alt="" loading="lazy" decoding="async">`).join('');
    plano.append(coluna);
  }

  if (matchMedia('(hover: hover)').matches) {
    addEventListener('pointermove', (e) => {
      plano.style.setProperty('--px', `${(e.clientX / innerWidth - 0.5) * -30}px`);
      plano.style.setProperty('--py', `${(e.clientY / innerHeight - 0.5) * -30}px`);
    }, { passive: true });
  }
}

async function iniciarVitrine() {
  const caixa = document.getElementById('troca-splash');
  caixa.innerHTML = VITRINE.map(([id], i) => `<img src="${arte.splash(id)}" alt="" loading="${i ? 'lazy' : 'eager'}" decoding="async"${i ? '' : ' class="ativa"'}>`).join('');
  const paletas = await Promise.all(VITRINE.map(([id, regiao]) => extrairCores(arte.retrato(id)).then((c) => c ?? REGIOES[regiao].cores)));
  aplicarCores(paletas[0]);

  const imagens = caixa.querySelectorAll('img');
  let atual = 0;
  setInterval(() => {
    imagens[atual].classList.remove('ativa');
    atual = (atual + 1) % VITRINE.length;
    imagens[atual].classList.add('ativa');
    aplicarCores(paletas[atual]); // o site inteiro acompanha o campeão em destaque
  }, 4200);

  document.getElementById('leque').innerHTML = ['Syndra', 'Leblanc', 'Aurora']
    .map((id) => `<img src="${arte.retrato(id)}" alt="" loading="lazy" decoding="async">`).join('');
}

function iniciarCiclos() {
  const rotativo = document.getElementById('rotativo');
  let palavra = 0;
  setInterval(() => {
    rotativo.classList.add('saindo');
    setTimeout(() => {
      palavra = (palavra + 1) % PALAVRAS.length;
      rotativo.textContent = PALAVRAS[palavra];
      rotativo.classList.remove('saindo');
      rotativo.classList.add('entrando');
      requestAnimationFrame(() => requestAnimationFrame(() => rotativo.classList.remove('entrando')));
    }, 380);
  }, 2600);

  const modos = document.querySelectorAll('#mini-modos .mini-modo');
  const abas = document.querySelectorAll('#mini-abas span');
  let modo = 0;
  setInterval(() => {
    modos[modo].classList.remove('ativo'); abas[modo].classList.remove('ativa');
    modo = (modo + 1) % modos.length;
    modos[modo].classList.add('ativo'); abas[modo].classList.add('ativa');
  }, 2400);

  const texto = document.getElementById('texto-selo');
  const letra = document.getElementById('letra-selo');
  let persona = 0;
  setInterval(() => {
    persona = (persona + 1) % PERSONAS.length;
    const nome = PERSONAS[persona];
    texto.textContent = `${nome} · ${nome} · ${nome} · `.slice(0, 60);
    letra.textContent = nome[0];
  }, 3000);
}

function configurarFormulario() {
  const form = document.getElementById('form-busca');
  const campo = document.getElementById('riot-id');
  const plataforma = document.getElementById('plataforma');
  const ajuda = document.getElementById('ajuda-busca');
  const textoAjuda = ajuda.innerHTML;

  try { plataforma.value = localStorage.getItem('lolzin:plataforma') ?? 'br1'; } catch { /* ok */ }

  campo.addEventListener('input', () => {
    form.classList.remove('invalida');
    ajuda.classList.remove('erro');
    ajuda.innerHTML = textoAjuda;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const riotId = campo.value.trim();
    const i = riotId.lastIndexOf('#');
    const nome = riotId.slice(0, i).trim();
    const tag = riotId.slice(i + 1).trim();
    let erro = null;
    if (!riotId) erro = 'Digite seu Riot ID no formato Nome#TAG.';
    else if (i < 0) erro = `Falta a TAG. Tente <code>${esc(riotId)}#BR1</code> ou confira a sua no cliente do jogo.`;
    else if (nome.length < 3 || nome.length > 16) erro = 'O nome do Riot ID tem de 3 a 16 caracteres.';
    else if (!/^[\p{L}\p{N}]{2,5}$/u.test(tag)) erro = 'A TAG tem de 2 a 5 letras ou números.';

    if (erro) {
      form.classList.remove('invalida');
      void form.offsetWidth; // reinicia a animação de tremor
      form.classList.add('invalida');
      ajuda.classList.add('erro');
      ajuda.innerHTML = erro;
      campo.focus();
      return;
    }
    try { localStorage.setItem('lolzin:plataforma', plataforma.value); } catch { /* ok */ }
    location.href = urlDoPerfil(plataforma.value, `${nome}#${tag}`);
  });

  document.getElementById('voltar-busca').addEventListener('click', () => setTimeout(() => campo.focus({ preventScroll: true }), 600));
}

function mostrarRecentes() {
  const recentes = lerRecentes();
  if (!recentes.length) return;
  const caixa = document.getElementById('recentes');
  caixa.insertAdjacentHTML('beforeend', recentes.map((r) => `
    <a class="chip" href="${urlDoPerfil(r.plataforma, r.riotId)}">
      ${r.campeao ? `<img src="${arte.retrato(r.campeao)}" alt="">` : ''}${esc(r.riotId)}
    </a>`).join(''));
  caixa.hidden = false;
}

async function verificarServidor() {
  const aviso = document.getElementById('aviso-servidor');
  let mensagem = null;
  try {
    const resposta = await fetch('/api/status');
    if (!resposta.ok) throw new Error();
    const { chaveRiot } = await resposta.json();
    if (!chaveRiot) mensagem = 'Este servidor ainda não tem chave da Riot: por enquanto, só os exemplos funcionam.';
  } catch {
    mensagem = 'Sem servidor conectado: por enquanto, só os exemplos funcionam.';
  }
  if (mensagem) {
    aviso.querySelector('span').textContent = mensagem;
    aviso.hidden = false;
  }
}
