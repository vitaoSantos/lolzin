// Seções da landing do invocador. Cada função recebe o perfil analisado e devolve HTML.
// O modo mais jogado decide qual template entra no meio da página.

import { arte, esc, inteiro, num, pct, tempoRelativo } from './comum.js';
import { REFERENCIAS } from './nucleo/constantes.js';

const NOME_PLATAFORMA = {
  br1: 'Brasil', la1: 'LAN', la2: 'LAS', na1: 'América do Norte', euw1: 'Europa Oeste', eun1: 'Europa Nórdica e Leste',
  tr1: 'Turquia', ru: 'Rússia', me1: 'Oriente Médio', kr: 'Coreia', jp1: 'Japão', oc1: 'Oceania', sg2: 'Singapura', tw2: 'Taiwan', vn2: 'Vietnã',
};

const PERIODO_FRASE = { madrugada: 'de madrugada', manha: 'pela manhã', tarde: 'à tarde', noite: 'à noite' };

const seta = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export function brasao(cor) {
  return `<svg class="brasao" viewBox="0 0 100 100" style="--cor-elo:${cor}" aria-hidden="true">
    <path d="M50 4 88 22v38q0 22-38 36Q12 82 12 60V22Z" fill="none" stroke="${cor}" stroke-width="3"/>
    <path d="M50 16 76 29v29q0 16-26 26-26-10-26-26V29Z" fill="${cor}" fill-opacity=".16" stroke="${cor}" stroke-opacity=".55"/>
    <path d="M50 30 62 50 50 70 38 50Z" fill="${cor}"/>
  </svg>`;
}

function cabecalho(numero, sobrancelha, titulo, texto = '') {
  return `<div class="cabecalho">
    <div>
      <p class="sobrancelha" data-revelar>${numero} · ${sobrancelha}</p>
      <h2 class="titulo-secao" data-revelar>${titulo}</h2>
    </div>
    ${texto ? `<p data-revelar style="--i:2">${texto}</p>` : ''}
  </div>`;
}

// ---------------------------------------------------------------------------------------------
// Hero

export function hero(p) {
  const t = p.tema;
  const solo = p.elo?.solo ?? p.elo?.flex;
  const icone = arte.icone(p.conta.icone, p.versaoDados);
  const complemento = t?.titulo ? esc(t.titulo) : t ? `de ${esc(t.nomeRegiao)}` : '';
  return `<section class="hero" id="inicio">
    ${t ? `<img class="hero__splash" id="hero-splash" src="${arte.splash(t.id)}" alt="Arte oficial de ${esc(t.nome)}" fetchpriority="high">` : '<div class="hero__splash"></div>'}
    <div class="hero__veu"></div>
    ${t ? `<p class="hero__eco" aria-hidden="true">${esc(t.nome)}</p>` : ''}
    <div class="hero__conteudo">
      <div class="hero__etiquetas">
        <span class="etiqueta etiqueta--modo">${esc(p.modo.template)}</span>
        <span class="etiqueta">${esc(NOME_PLATAFORMA[p.plataforma] ?? p.plataforma)}</span>
        ${p.aoVivo ? `<span class="etiqueta etiqueta--vivo"><i class="ponto"></i>Em partida agora${p.aoVivo.campeao ? ` · ${esc(p.aoVivo.campeao)}` : ''}</span>` : ''}
      </div>
      <h1 class="hero__nome">${esc(p.conta.nome)}<small>#${esc(p.conta.tag)}</small></h1>
      ${t ? `<p class="hero__titulo">Main de <strong>${esc(t.nome)}</strong>, ${complemento}</p>` : ''}
      <div class="hero__meta">
        <div class="avatar">
          <span class="avatar__inicial" aria-hidden="true">${esc([...p.conta.nome][0] ?? '?')}</span>
          ${icone ? `<img src="${icone}" alt="Ícone de invocador" style="position:absolute;inset:0" onerror="this.remove()">` : ''}
          <span class="avatar__nivel">${inteiro(p.conta.nivel)}</span>
        </div>
        ${solo
          ? `<div style="display:flex;align-items:center;gap:12px">${brasao(solo.cor)}<div class="meta-item"><span>${p.elo.solo ? 'Solo/Duo' : 'Flex'}</span><strong>${esc(solo.nomeTier)} ${esc(solo.divisao)} · ${solo.pdl} PDL</strong></div></div>`
          : '<div class="meta-item"><span>Ranqueada</span><strong>Sem elo nesta temporada</strong></div>'}
        <div class="meta-item"><span>Amostra</span><strong>${p.amostra.partidas} partidas</strong></div>
        <span class="persona-pilula">✦ ${esc(p.persona.principal.nome)}</span>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Faixa de números (muda conforme o modo)

export function numeros(p) {
  const r = p.resumo;
  const ref = p.posicaoPrincipal ? REFERENCIAS[p.posicaoPrincipal] : null;
  const itens = {
    winrate: { valor: r.winrate * 100, casas: 0, sufixo: '%', rotulo: `Vitórias · ${r.vitorias}V ${r.derrotas}D` },
    kda: { valor: r.kda, casas: 2, rotulo: `KDA · ${num(r.k)} / ${num(r.d)} / ${num(r.a)}` },
    cs: { valor: p.rift.csMin, casas: 1, rotulo: 'Farm por minuto', ref: ref?.csMin, refRotulo: 'ref.' },
    visao: { valor: p.rift.visaoMin, casas: 2, rotulo: 'Visão por minuto', ref: ref?.visaoMin, refRotulo: 'ref.' },
    kp: { valor: r.kp * 100, casas: 0, sufixo: '%', rotulo: 'Participação em abates' },
    dano: { valor: p.aram?.danoMedio ?? 0, casas: 0, rotulo: 'Dano por partida (ARAM)' },
    distintos: { valor: p.aram?.campeoesDistintos ?? 0, casas: 0, rotulo: 'Campeões diferentes' },
    top1: { valor: (p.arena?.taxaTop1 ?? 0) * 100, casas: 0, sufixo: '%', rotulo: 'Primeiro lugar na Arena' },
    colocacao: { valor: p.arena?.mediaColocacao ?? 0, casas: 1, sufixo: 'º', rotulo: 'Colocação média' },
    danoPct: { valor: r.danoPct * 100, casas: 0, sufixo: '%', rotulo: 'Do dano do time' },
    solo: { valor: r.abatesSolo ?? 0, casas: 1, rotulo: 'Abates solo por partida' },
  };
  const escolha = {
    ranqueada: ['winrate', 'kda', 'cs', 'visao', 'kp'],
    normal: ['winrate', 'kda', 'cs', 'visao', 'kp'],
    aram: ['winrate', 'kda', 'dano', 'kp', 'distintos'],
    arena: ['top1', 'colocacao', 'kda', 'danoPct', 'solo'],
    evento: ['winrate', 'kda', 'kp', 'danoPct', 'solo'],
  }[p.modo.principal];
  // Sem partidas do Rift não há farm/visão para mostrar.
  const lista = escolha.map((k) => itens[k]).filter((i, n) => !(p.rift.partidas === 0 && (escolha[n] === 'cs' || escolha[n] === 'visao')));

  return `<section class="numeros" aria-label="Seus números">
    ${lista.map((i, n) => {
      const comparacao = i.ref
        ? `<span class="numero__ref ${i.valor >= i.ref ? 'acima' : 'abaixo'}">${i.valor >= i.ref ? '▲' : '▼'} ref. ${num(i.ref, i.casas)}</span>`
        : '';
      return `<div class="numero" data-revelar style="--i:${n}">
        <span class="numero__valor" data-contar="${i.valor}" data-casas="${i.casas}" data-sufixo="${i.sufixo ?? ''}">0</span>
        <span class="numero__rotulo">${i.rotulo}</span>${comparacao}
      </div>`;
    }).join('')}
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Narrativa que acende palavra por palavra ao rolar

export function narrativa(p) {
  if (!p.resumo.partidas) return '';
  const partes = [];
  const main = p.campeoes[0];
  partes.push(['Nas últimas', 0], [`${p.resumo.partidas} partidas,`, 1]);
  if (p.modo.principal === 'aram') {
    partes.push(['a ponte te deu', 0], [`${p.aram?.campeoesDistintos ?? 0} campeões diferentes`, 1], ['e você venceu', 0], [`${pct(p.resumo.winrate)}`, 1], ['delas.', 0]);
  } else {
    partes.push(['você jogou', 0], [`${main.jogos} de ${main.nome}`, 1], ['e venceu', 0], [`${pct(p.resumo.winrate)}`, 1], ['delas.', 0]);
  }
  const fav = p.habitos.periodoFavorito;
  if (fav?.partidas) partes.push([pct(fav.partidas / p.resumo.partidas), 1], [`começaram ${PERIODO_FRASE[fav.chave]}.`, 0]);
  if (p.modo.principal === 'arena' && p.arena) partes.push(['Na Arena, você terminou em primeiro', 0], [`${pct(p.arena.taxaTop1)} das vezes.`, 1]);
  else if (p.elo?.solo) partes.push(['Hoje você é', 0], [`${p.elo.solo.nomeTier} ${p.elo.solo.divisao}`.trim() + '.', 1]);
  partes.push(['Para nós, você é', 0], [`${p.persona.principal.nome}.`, 1]);

  const palavras = partes.flatMap(([texto, destaque]) => texto.split(' ').map((w) => `<span class="n-palavra${destaque ? ' destaque' : ''}">${esc(w)}</span>`));
  return `<section class="secao" id="narrativa" style="padding-block:clamp(90px,14vw,180px)">
    <div class="conteiner"><p class="narrativa" id="texto-narrativa">${palavras.join(' ')}</p></div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Templates por modo

export function secaoModo(p) {
  switch (p.modo.principal) {
    case 'ranqueada': return secaoRanqueada(p);
    case 'aram': return p.aram ? secaoAram(p) : secaoCasual(p);
    case 'arena': return p.arena ? secaoArena(p) : secaoCasual(p);
    default: return secaoCasual(p);
  }
}

function cartaoElo(rotulo, e) {
  if (!e) {
    return `<article class="cartao cartao-elo" data-revelar>${brasao('#5b6070')}<div><h3>${rotulo}</h3><strong style="color:var(--texto-3)">Sem elo</strong><p>Nenhuma partida desta fila na temporada.</p></div></article>`;
  }
  return `<article class="cartao cartao-elo" data-brilho data-revelar style="--cor-elo:${e.cor}">
    ${brasao(e.cor)}
    <div>
      <h3>${rotulo}${e.emSequencia ? ' · 🔥 em sequência' : ''}</h3>
      <strong>${esc(e.nomeTier)} ${esc(e.divisao)}</strong>
      <p>${e.pdl} PDL · ${e.vitorias}V ${e.derrotas}D · ${pct(e.winrate)} de vitórias</p>
      <div class="barra-pdl"><i style="--v:${Math.min(100, e.pdl)}%"></i></div>
    </div>
  </article>`;
}

function blocoPosicoes(p) {
  if (!p.posicoes.length) return '';
  const max = p.posicoes[0].partidas;
  return `<article class="cartao bloco" data-revelar>
    <h3>Onde você joga</h3>
    <div class="barras-posicao">
      ${p.posicoes.map((pos, i) => `<div class="barra-posicao" style="--i:${i}">
        <span>${esc(pos.nome)}</span>
        <span class="barra-posicao__trilho"><i style="--v:${(pos.partidas / max) * 100}%"></i></span>
        <small>${pos.partidas}× · ${pct(pos.winrate)}</small>
      </div>`).join('')}
    </div>
  </article>`;
}

function tabelaCampeoes(p, titulo = 'Seus campeões') {
  return `<article class="cartao bloco" data-revelar style="--i:1">
    <h3>${titulo}</h3>
    <table class="tabela-campeoes">
      <thead><tr><th>Campeão</th><th>Partidas</th><th>Vitórias</th><th class="col-kda">KDA</th></tr></thead>
      <tbody>
        ${p.campeoes.slice(0, 5).map((c) => `<tr>
          <td><span class="campeao-celula"><img src="${arte.quadrado(c.id, p.versaoDados)}" alt="" loading="lazy">${esc(c.nome)}</span></td>
          <td>${c.jogos}</td>
          <td><span class="wr" style="--v:${c.winrate * 100}%;--cor:${c.winrate >= 0.5 ? 'var(--vitoria)' : 'var(--derrota)'}"><i></i>${pct(c.winrate)}</span></td>
          <td class="col-kda">${num(c.kda, 2)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </article>`;
}

function secaoRanqueada(p) {
  return `<section class="secao" id="modo">
    <div class="conteiner">
      ${cabecalho('01', 'Dossiê competitivo', 'Seu <em>dossiê</em> competitivo.', 'Ranqueada é o seu modo. Aqui está a sua situação na escada e onde as vitórias estão vindo.')}
      <div class="grade-2">${cartaoElo('Solo/Duo', p.elo?.solo)}${cartaoElo('Flex', p.elo?.flex)}</div>
      <div class="grade-2 grade-2--topo" style="margin-top:16px">${blocoPosicoes(p)}${tabelaCampeoes(p)}</div>
    </div>
  </section>`;
}

function secaoCasual(p) {
  const outros = p.modo.distribuicao.map((m) => `${esc(m.nome)} ${pct(m.pct)}`).join(' · ');
  return `<section class="secao" id="modo">
    <div class="conteiner">
      ${cabecalho('01', p.modo.template, `Seu <em>${p.modo.principal === 'evento' ? 'modo de festa' : 'palco'}.</em>`, `Você joga pelo prazer de jogar. Seus modos: ${outros}.`)}
      ${p.elo ? `<div class="grade-2" style="margin-bottom:16px">${cartaoElo('Solo/Duo', p.elo.solo)}${cartaoElo('Flex', p.elo.flex)}</div>` : ''}
      <div class="grade-2 grade-2--topo">${blocoPosicoes(p) || tabelaCampeoes(p, 'Mais jogados')}${p.posicoes.length ? tabelaCampeoes(p) : ''}</div>
    </div>
  </section>`;
}

function secaoAram(p) {
  const a = p.aram;
  return `<section class="secao" id="modo">
    <div class="conteiner">
      ${cabecalho('01', 'Caos na ponte', 'Bem-vindo ao <em>caos.</em>', 'No ARAM o campeão é sorteado. O que importa é se adaptar, e isso você faz.')}
      <div class="cartao bloco" data-revelar>
        <h3>Todo mundo que a ponte te deu</h3>
        <div class="mosaico">
          ${a.mosaico.map((m, i) => `<figure class="${m.vitoria ? 'vitoria' : ''}" style="--i:${i}">
            <img src="${arte.quadrado(m.campeao, p.versaoDados)}" alt="${esc(m.nome)}" loading="lazy">
            <figcaption>${esc(m.nome)}</figcaption>
          </figure>`).join('')}
        </div>
      </div>
      <div class="grade-3" style="margin-top:16px">
        <article class="cartao destaque-num" data-revelar><strong data-contar="${a.campeoesDistintos}">0</strong><span>campeões diferentes em ${a.partidas} partidas</span></article>
        <article class="cartao destaque-num" data-revelar style="--i:1"><strong data-contar="${Math.round(a.danoMedio)}">0</strong><span>de dano por partida, em média</span></article>
        <article class="cartao destaque-num" data-revelar style="--i:2">
          <img src="${arte.splash(a.melhorPartida.campeao)}" alt="" loading="lazy">
          <strong data-contar="${a.melhorPartida.dano}">0</strong>
          <span>de dano na sua melhor partida, de ${esc(a.melhorPartida.nome)} (${a.melhorPartida.k}/${a.melhorPartida.d}/${a.melhorPartida.a})</span>
        </article>
      </div>
    </div>
  </section>`;
}

function secaoArena(p) {
  const a = p.arena;
  const max = Math.max(...a.colocacoes, 1);
  return `<section class="secao" id="modo">
    <div class="conteiner">
      ${cabecalho('01', 'Coliseu', 'O seu <em>coliseu.</em>', `Na Arena, ${a.partidas} lutas. A média de colocação é ${num(a.mediaColocacao)}º, e o topo do pódio já é seu ${pct(a.taxaTop1)} das vezes.`)}
      <div class="cartao" data-revelar>
        <div class="podio" style="--n:${a.colocacoes.length}">
          ${a.colocacoes.map((qtd, i) => `<div class="podio__coluna">
            <span class="podio__qtd">${qtd}</span>
            <span class="podio__barra" style="--v:${Math.max(4, (qtd / max) * 100)}%;--i:${i}"></span>
            <span class="podio__lugar">${i + 1}º</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="grade-2 grade-2--topo" style="margin-top:16px">
        <article class="cartao bloco" data-revelar>
          <h3>Seus parceiros de arena</h3>
          ${a.parceiros.length
            ? `<ul class="lista-parceiros">${a.parceiros.map((x) => `<li><strong>${esc(x.nome)}</strong><small>${x.partidas} lutas · média ${num(x.mediaColocacao)}º</small></li>`).join('')}</ul>`
            : '<p style="color:var(--texto-2)">Você troca de parceiro a cada luta. Gladiador solitário.</p>'}
        </article>
        ${tabelaCampeoes(p, 'Seus gladiadores')}
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Persona

export function persona(p, arteGerada) {
  const pe = p.persona.principal;
  const anel = `${pe.nome.toUpperCase()} · `.repeat(4);
  return `<section class="secao" id="persona">
    <div class="conteiner persona">
      <div class="persona__arte" data-revelar>
        ${arteGerada
          ? `<img src="${arteGerada}" alt="Ilustração da persona ${esc(pe.nome)}">`
          : `<svg class="persona__selo" viewBox="0 0 300 300" aria-hidden="true"><defs><path id="anel-persona" d="M150,150 m-120,0 a120,120 0 1,1 240,0 a120,120 0 1,1 -240,0"/></defs><text><textPath href="#anel-persona" textLength="750">${esc(anel)}</textPath></text></svg>
             <span class="persona__letra" aria-hidden="true">${esc(pe.nome.replace(/[^\p{L}]/gu, '')[0] ?? '?')}</span>`}
      </div>
      <div>
        <p class="persona__voce" data-revelar>02 · Sua persona</p>
        <h2 class="persona__nome" data-revelar>${esc(pe.nome)}</h2>
        <p class="persona__frase" data-revelar>${esc(pe.frase)}</p>
        <span class="persona__prova" data-revelar>📊 ${esc(pe.evidencia)}</span>
        ${p.persona.secundarias.length ? `<div class="tracos" data-revelar>
          ${p.persona.secundarias.map((s) => `<span class="traco"><strong>${esc(s.nome)}</strong><span>${esc(s.evidencia)}</span></span>`).join('')}
        </div>` : ''}
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Padrões (relógio, cabeça, sessões, mains, curiosidades)

function relogio(habitos) {
  const max = Math.max(...habitos.horas, 1);
  const barras = habitos.horas.map((qtd, h) => {
    const altura = 4 + (qtd / max) * 66;
    return `<g transform="rotate(${h * 15} 150 150)"><rect class="barra-hora" style="--i:${h};opacity:${qtd ? 1 : 0.25}" x="146" y="${150 - 64 - altura}" width="8" height="${altura}" rx="4"/></g>`;
  }).join('');
  const marcas = [[0, '0h'], [6, '6h'], [12, '12h'], [18, '18h']].map(([h, rotulo]) => {
    const ang = (h * 15 - 90) * (Math.PI / 180);
    return `<text class="marca-hora" x="${150 + Math.cos(ang) * 143}" y="${150 + Math.sin(ang) * 143}">${rotulo}</text>`;
  }).join('');
  const fav = habitos.periodoFavorito;
  return `<svg class="relogio" viewBox="0 0 300 300" role="img" aria-label="Partidas por hora do dia">
    <circle cx="150" cy="150" r="58" fill="none" stroke="rgba(255,255,255,.08)"/>
    ${barras}${marcas}
    <text class="centro-titulo" x="150" y="150">${esc(fav?.nome ?? '—')}</text>
    <text class="centro-sub" x="150" y="170">seu horário</text>
  </svg>`;
}

function medidorTilt(habitos, winrateGeral) {
  const t = habitos.tilt;
  const comprimento = Math.PI * 90;
  if (t.partidas < 3 || t.winrate === null) {
    return `<article class="cartao bp-tilt" data-revelar style="--i:1">
      <h3>Cabeça no lugar</h3>
      <span class="grande">Zen</span>
      <p>Poucas sequências de duas derrotas para medir. Bom sinal.</p>
    </article>`;
  }
  const ang = Math.PI * (1 - winrateGeral);
  const [x1, y1, x2, y2] = [110 + Math.cos(ang) * 78, 110 - Math.sin(ang) * 78, 110 + Math.cos(ang) * 102, 110 - Math.sin(ang) * 102];
  return `<article class="cartao bp-tilt" data-revelar style="--i:1">
    <h3>Depois de duas derrotas seguidas</h3>
    <svg class="medidor" viewBox="0 0 220 120" aria-hidden="true">
      <path class="medidor__trilho" d="M20 110 A90 90 0 0 1 200 110"/>
      <path class="medidor__valor" d="M20 110 A90 90 0 0 1 200 110" style="--d:${comprimento * t.winrate}"/>
      <line class="medidor__ref" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
    </svg>
    <span class="grande" style="color:${t.winrate < winrateGeral ? 'var(--derrota)' : 'var(--vitoria)'}">${pct(t.winrate)}</span>
    <p>de vitórias na partida seguinte (${t.partidas} vezes). Sua média geral é ${pct(winrateGeral)}, o traço no medidor.</p>
  </article>`;
}

export function padroes(p) {
  if (!p.resumo.partidas) return '';
  const h = p.habitos;
  const mesmoMain = p.mainAtual && p.mainHistorico && p.mainAtual.id === p.mainHistorico.id;
  const maestria = p.maestrias[0];
  const atual = p.campeoes[0];
  return `<section class="secao" id="padroes">
    <div class="conteiner">
      ${cabecalho('03', 'Seus padrões', 'O jeito que <em>você joga.</em>', 'Hábitos que aparecem nas suas partidas mais recentes.')}
      <div class="bento-padroes">
        <article class="cartao bp-relogio" data-revelar>
          <h3>Quando você joga</h3>
          ${relogio(h)}
          <p>${h.periodoFavorito?.partidas ? `${h.periodoFavorito.partidas} de ${p.resumo.partidas} partidas começaram ${PERIODO_FRASE[h.periodoFavorito.chave]}.` : ''}</p>
        </article>
        ${medidorTilt(h, p.resumo.winrate)}
        <article class="cartao bp-sessao" data-revelar style="--i:2">
          <h3>Maior maratona</h3>
          <span class="grande" data-contar="${h.maiorSessao}">0</span>
          <p>partidas seguidas, sem pausa maior que 45 minutos. Foram ${h.sessoes} sessões no total.</p>
        </article>
        <article class="cartao bp-mains" data-revelar>
          <h3>${mesmoMain ? 'Fiel desde sempre' : 'Seu coração e o seu momento'}</h3>
          <div class="mains" style="margin-top:16px">
            ${maestria ? `<div class="main-retrato"><img src="${arte.retrato(maestria.id)}" alt="" loading="lazy"><div><span>Main histórico</span><strong>${esc(maestria.nome)}</strong><p>${inteiro(maestria.pontos)} pontos de maestria</p></div></div>` : ''}
            ${atual && !mesmoMain ? `<div class="main-retrato"><img src="${arte.retrato(atual.id)}" alt="" loading="lazy"><div><span>Main do momento</span><strong>${esc(atual.nome)}</strong><p>${atual.jogos} das últimas ${p.resumo.partidas} partidas</p></div></div>` : ''}
            ${atual && mesmoMain ? `<div class="main-retrato" style="grid-template-columns:1fr"><div><span>Nas últimas partidas</span><strong>${atual.jogos} de ${p.resumo.partidas}</strong><p>Maestria e partidas recentes apontam para o mesmo campeão.</p></div></div>` : ''}
          </div>
        </article>
        <article class="cartao bp-curiosidades" data-revelar style="--i:1">
          <h3>Curiosidades</h3>
          <ul class="curiosidades">
            ${p.curiosidades.slice(0, 3).map((c) => `<li><strong data-contar="${c.valor}">0</strong><span>${esc(c.rotulo)}</span></li>`).join('')}
          </ul>
        </article>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Dicas

function comparativo(m) {
  const max = Math.max(m.voce, m.referencia) * 1.25 || 1;
  const formatar = (v) => `${num(v, m.sufixo || v >= 10 ? 0 : 2)}${m.sufixo ?? ''}`;
  return `<div class="comparativo">
    <div class="comparativo__trilho"><i class="comparativo__voce" style="--v:${(m.voce / max) * 100}%"></i><i class="comparativo__ref" style="--r:${(m.referencia / max) * 100}%"></i></div>
    <div class="comparativo__legenda"><span>Você: ${formatar(m.voce)} ${esc(m.unidade)}</span><span>${esc(m.rotuloRef ?? 'Referência')}: ${formatar(m.referencia)}</span></div>
  </div>`;
}

function cartaoDica(d, i) {
  return `<article class="cartao dica dica--${d.tipo}" data-brilho data-revelar style="--i:${i}">
    <span class="dica__area">${esc(d.area)}</span>
    <h4>${esc(d.titulo)}</h4>
    <p>${esc(d.texto)}</p>
    ${d.metrica ? comparativo(d.metrica) : ''}
  </article>`;
}

export function dicas(p) {
  if (!p.dicas.length) return '';
  const melhorias = p.dicas.filter((d) => d.tipo === 'melhoria');
  const forcas = p.dicas.filter((d) => d.tipo === 'forca');
  return `<section class="secao" id="dicas">
    <div class="conteiner">
      ${cabecalho('04', 'Como evoluir', 'Onde você <em>pode crescer.</em>', 'Comparamos você com referências da sua posição e com você mesmo. Referências aproximadas, versão inicial.')}
      <div class="dicas">
        <div class="dicas__coluna"><h3>Para melhorar</h3>${melhorias.length ? melhorias.map(cartaoDica).join('') : '<p style="color:var(--texto-2)">Nada gritante nas últimas partidas. Siga assim.</p>'}</div>
        <div class="dicas__coluna"><h3>Seus pontos fortes</h3>${forcas.length ? forcas.map(cartaoDica).join('') : '<p style="color:var(--texto-2)">Jogue mais algumas partidas para revelarmos seus pontos fortes.</p>'}</div>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Recomendações

export function recomendacoes(p) {
  if (!p.recomendacoes.length) return '';
  return `<section class="secao" id="recomendacoes">
    <div class="conteiner">
      ${cabecalho('05', 'Para você', 'Campeões que <em>combinam com você.</em>', 'Calculado pelo estilo dos campeões que você mais joga. Nenhum deles está no seu histórico recente.')}
      <div class="recs">
        ${p.recomendacoes.map((r, i) => `<article class="rec" data-inclinar data-revelar style="--i:${i}">
          <img src="${arte.retrato(r.id)}" alt="Arte de ${esc(r.nome)}" loading="lazy">
          <span class="rec__afinidade" style="--v:${r.afinidade}" title="Afinidade com o seu estilo"><span>${r.afinidade}%</span></span>
          <div class="rec__info">
            <h3>${esc(r.nome)}</h3>
            ${r.titulo ? `<p class="rec__titulo">${esc(r.titulo)}</p>` : '<p class="rec__titulo"></p>'}
            <p class="rec__motivo">Como ${esc(r.nomeParecido)}: ${esc(r.estilos.join(' e ') || 'estilo parecido')}.</p>
            <div class="dificuldade" aria-label="Dificuldade ${r.dificuldade} de 3"><i class="on"></i><i class="${r.dificuldade >= 2 ? 'on' : ''}"></i><i class="${r.dificuldade >= 3 ? 'on' : ''}"></i><span>&nbsp;dificuldade</span></div>
          </div>
        </article>`).join('')}
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------------------------
// Histórico e compartilhamento

export function historico(p) {
  if (!p.partidas.length) return '';
  return `<section class="secao" id="historico" style="padding-top:0">
    <div class="conteiner">
      ${cabecalho('06', 'Histórico', 'Últimas <em>partidas.</em>')}
      <div class="historico">
        ${p.partidas.map((m, i) => `<article class="partida ${m.vitoria ? 'vitoria' : ''}" data-revelar style="--i:${i % 6}">
          <span class="partida__faixa"></span>
          <img src="${arte.quadrado(m.campeao, p.versaoDados)}" alt="" loading="lazy">
          <div><strong>${esc(m.nomeCampeao)}</strong><small>${esc(m.nomeFila)}</small></div>
          <div><span class="partida__kda">${m.k} / ${m.d} / ${m.a}</span><br><small class="partida__resultado">${m.colocacao ? `${m.colocacao}º lugar` : m.vitoria ? 'Vitória' : 'Derrota'}</small></div>
          <div class="partida__cs"><strong>${m.cs} farm</strong><small>${Math.round(m.minutos)} min</small></div>
          <small class="partida__quando">${tempoRelativo(m.inicio)}</small>
        </article>`).join('')}
      </div>
    </div>
  </section>`;
}

export function compartilhar(p) {
  return `<section class="secao compartilhar" id="compartilhar">
    <div class="conteiner">
      <h2 data-revelar>Esta página <span>nasceu agora.</span></h2>
      <p data-revelar>Ela não está salva em lugar nenhum: quem abrir o link vê tudo ser montado de novo, com os dados mais recentes.</p>
      <div class="acoes" data-revelar>
        <button class="botao botao--primario" type="button" id="botao-compartilhar" data-magnetico>Copiar link da página ${seta}</button>
        <a class="botao botao--fantasma" href="/">Buscar outro invocador</a>
      </div>
    </div>
  </section>`;
}

export function navegacao(p) {
  return [
    ['#modo', p.modo.template],
    ['#persona', 'Persona'],
    ['#padroes', 'Padrões'],
    ['#dicas', 'Dicas'],
    ['#recomendacoes', 'Para você'],
  ].map(([href, rotulo]) => `<a href="${href}">${esc(rotulo)}</a>`).join('');
}

