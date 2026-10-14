import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analisar } from '../public/js/nucleo/analise.js';
import { CHAVES_DEMO, gerarDemo } from '../public/js/nucleo/demo.js';
import { classificarFila } from '../public/js/nucleo/constantes.js';

const atributos = JSON.parse(readFileSync(new URL('../public/dados/campeoes.json', import.meta.url))).campeoes;
const campeoes = {
  versao: null,
  campeoes: Object.fromEntries(Object.entries(atributos).map(([id, a]) => [id, { key: CHAVES_DEMO[id] ?? null, nome: a.n }])),
};
const AGORA = Date.UTC(2026, 9, 14, 15, 0);
const horaDe = (ts) => new Date(ts).getUTCHours();

function perfilDemo(chave) {
  const { conta, partidas } = gerarDemo(chave, AGORA);
  return analisar({ conta, partidas: conta.partidas.map((id) => partidas[id]), campeoes, atributos, horaDe });
}

test('atributos curados têm formato válido', () => {
  const estilos = new Set(['burst', 'dps', 'poke', 'engage', 'pick', 'mobilidade', 'tanque', 'sustain', 'protecao', 'controle', 'duelo', 'escala', 'early', 'zona']);
  assert.ok(Object.keys(atributos).length >= 165);
  for (const [id, a] of Object.entries(atributos)) {
    assert.ok(a.n && a.r && a.p.length && ['ad', 'ap', 'misto'].includes(a.d) && ['c', 'd'].includes(a.a), id);
    for (const e of a.e) assert.ok(estilos.has(e), `${id}: estilo ${e}`);
    for (const p of a.p) assert.ok(['top', 'jungle', 'mid', 'adc', 'sup'].includes(p), `${id}: posição ${p}`);
  }
});

test('classifica filas por ID e por modo de jogo', () => {
  assert.equal(classificarFila(420, 'CLASSIC').modo, 'ranqueada');
  assert.equal(classificarFila(450, 'ARAM').modo, 'aram');
  assert.equal(classificarFila(9999, 'CHERRY').modo, 'arena');
  assert.equal(classificarFila(9999, 'URF').modo, 'evento');
});

test('demo ranqueada: tema, modo, elo, persona e dicas', () => {
  const p = perfilDemo('ranqueada');
  assert.equal(p.modo.principal, 'ranqueada');
  assert.equal(p.tema.id, 'Ahri');
  assert.equal(p.tema.regiao, 'ionia');
  assert.equal(p.mainHistorico.id, 'Ahri');
  assert.equal(p.posicaoPrincipal, 'mid');
  assert.equal(p.elo.solo.nomeTier, 'Esmeralda');
  assert.equal(p.amostra.partidas, 20);
  assert.ok(p.persona.principal.nome);
  assert.ok(p.dicas.length > 0);
  assert.ok(p.dicas.some((d) => d.area === 'Visão'), 'visão abaixo da referência gera dica');
  assert.ok(p.dicas.some((d) => d.area === 'Cabeça'), 'queda depois de 2 derrotas gera dica');
  assert.equal(p.recomendacoes.length, 4);
  for (const r of p.recomendacoes) {
    assert.ok(!['Ahri', 'Syndra', 'Orianna', 'Lux', 'Yasuo', 'Zed'].includes(r.id), `não recomenda quem já joga: ${r.id}`);
  }
});

test('demo ARAM: tema vem da maestria e há bloco de ARAM', () => {
  const p = perfilDemo('aram');
  assert.equal(p.modo.principal, 'aram');
  assert.equal(p.tema.id, 'Ezreal');
  assert.ok(p.aram.campeoesDistintos >= 8);
  assert.equal(p.elo, null);
});

test('demo Arena: colocações, parceiros e tema do campeão mais jogado', () => {
  const p = perfilDemo('arena');
  assert.equal(p.modo.principal, 'arena');
  assert.equal(p.tema.id, 'Sett');
  assert.equal(p.arena.partidas, 16);
  assert.equal(p.arena.colocacoes.reduce((a, b) => a + b, 0), 16);
  assert.ok(p.arena.parceiros[0].nome.startsWith('Parceiro Fiel') || p.arena.parceiros[0].nome.startsWith('Escudo Humano'));
});

test('ignora remakes e partidas sem o jogador', () => {
  const { conta, partidas } = gerarDemo('ranqueada', AGORA);
  const lista = conta.partidas.map((id) => partidas[id]);
  lista[0] = { ...lista[0], remake: true };
  lista[1] = { ...lista[1], jogadores: lista[1].jogadores.filter((j) => j.puuid !== conta.conta.puuid) };
  const p = analisar({ conta, partidas: lista, campeoes, atributos, horaDe });
  assert.equal(p.amostra.partidas, 18);
});

test('conta sem partidas não quebra', () => {
  const { conta } = gerarDemo('ranqueada', AGORA);
  const p = analisar({ conta: { ...conta, partidas: [] }, partidas: [], campeoes, atributos, horaDe });
  assert.equal(p.persona.principal.id, 'aventureiro');
  assert.equal(p.tema.id, 'Ahri'); // ainda tem maestria
  assert.deepEqual(p.dicas, []);
});
