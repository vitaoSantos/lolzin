// Utilitários de interface compartilhados pelas páginas.

import { DDRAGON } from './nucleo/constantes.js';

export const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const pct = (v) => `${Math.round((v ?? 0) * 100)}%`;
export const num = (v, casas = 1) => (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
export const inteiro = (v) => Math.round(v ?? 0).toLocaleString('pt-BR');

export function tempoRelativo(ts, agora = Date.now()) {
  const min = Math.round((agora - ts) / 60000);
  if (min < 60) return `há ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

// Imagens oficiais da Data Dragon (servidas pela CDN da Riot).
export const arte = {
  splash: (id) => `${DDRAGON}/cdn/img/champion/splash/${id}_0.jpg`,
  retrato: (id) => `${DDRAGON}/cdn/img/champion/loading/${id}_0.jpg`,
  quadrado: (id, versao) => (versao ? `${DDRAGON}/cdn/${versao}/img/champion/${id}.png` : arte.retrato(id)),
  icone: (icone, versao) => (versao ? `${DDRAGON}/cdn/${versao}/img/profileicon/${icone}.png` : null),
};

// Imagens geradas por IA (docs/prompts-imagens.md) só entram quando estão no manifesto.
// O nome é sem extensão: "persona-coruja" encontra persona-coruja.png ou .webp.
let manifesto;
export async function imagemGerada(nome) {
  manifesto ??= fetch('/img/gerado/manifest.json')
    .then((r) => (r.ok ? r.json() : { imagens: [] }))
    .catch(() => ({ imagens: [] }));
  const { imagens } = await manifesto;
  const arquivo = imagens.find((i) => i.replace(/\.[a-z0-9]+$/i, '') === nome);
  return arquivo ? `/img/gerado/${arquivo}` : null;
}

const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Revela elementos [data-revelar] ao entrarem na tela e dispara contadores [data-contar].
const observador = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    if (!entrada.isIntersecting) continue;
    entrada.target.classList.add('visivel');
    entrada.target.querySelectorAll('[data-contar]').forEach(contar);
    if (entrada.target.matches('[data-contar]')) contar(entrada.target);
    observador.unobserve(entrada.target);
  }
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

export function observarRevelacoes(raiz = document) {
  raiz.querySelectorAll('[data-revelar]:not(.visivel), [data-contar]:not([data-contado])').forEach((el) => observador.observe(el));
}

function contar(el) {
  if (el.dataset.contado) return;
  el.dataset.contado = '1';
  const alvo = Number(el.dataset.contar);
  const casas = Number(el.dataset.casas ?? 0);
  const sufixo = el.dataset.sufixo ?? '';
  const formatar = (v) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}${sufixo}`;
  if (reduzMovimento) { el.textContent = formatar(alvo); return; }
  const inicio = performance.now();
  const duracao = 1400;
  const passo = (agora) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    const suave = 1 - Math.pow(2, -10 * t);
    el.textContent = formatar(alvo * (t === 1 ? 1 : suave));
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

// Efeitos de cursor: brilho nos cartões, botões magnéticos e inclinação 3D.
export function ativarEfeitosDeCursor() {
  if (reduzMovimento || matchMedia('(hover: none)').matches) return;

  document.addEventListener('pointermove', (e) => {
    const cartao = e.target.closest?.('[data-brilho]');
    if (cartao) {
      const r = cartao.getBoundingClientRect();
      cartao.style.setProperty('--mx', `${e.clientX - r.left}px`);
      cartao.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
    const inclinavel = e.target.closest?.('[data-inclinar]');
    if (inclinavel) {
      const r = inclinavel.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      inclinavel.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-6px)`;
    }
  }, { passive: true });

  document.addEventListener('pointerout', (e) => {
    const inclinavel = e.target.closest?.('[data-inclinar]');
    if (inclinavel && !inclinavel.contains(e.relatedTarget)) inclinavel.style.transform = '';
  });

  document.querySelectorAll('[data-magnetico]').forEach(tornarMagnetico);
}

export function tornarMagnetico(botao) {
  if (reduzMovimento) return;
  botao.addEventListener('pointermove', (e) => {
    const r = botao.getBoundingClientRect();
    botao.style.setProperty('--x', `${(e.clientX - r.left - r.width / 2) * 0.18}px`);
    botao.style.setProperty('--y', `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
  });
  botao.addEventListener('pointerleave', () => {
    botao.style.setProperty('--x', '0px');
    botao.style.setProperty('--y', '0px');
  });
}

export function topoAoRolar() {
  const topo = document.getElementById('topo');
  if (!topo) return;
  const atualizar = () => topo.classList.toggle('rolou', scrollY > 40);
  addEventListener('scroll', atualizar, { passive: true });
  atualizar();
}

// Riot ID ↔ URL: "Nome#TAG" vira "/br1/Nome-TAG" (a TAG nunca tem hífen).
export function urlDoPerfil(plataforma, riotId) {
  const i = riotId.lastIndexOf('#');
  return `/${plataforma}/${encodeURIComponent(riotId.slice(0, i))}-${encodeURIComponent(riotId.slice(i + 1))}`;
}

const CHAVE_RECENTES = 'lolzin:recentes';

export function lerRecentes() {
  try { return JSON.parse(localStorage.getItem(CHAVE_RECENTES)) ?? []; } catch { return []; }
}

export function salvarRecente(item) {
  try {
    const lista = lerRecentes().filter((r) => !(r.riotId.toLowerCase() === item.riotId.toLowerCase() && r.plataforma === item.plataforma));
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify([item, ...lista].slice(0, 5)));
  } catch { /* armazenamento indisponível: tudo bem */ }
}
