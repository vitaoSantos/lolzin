// "Campeões que combinam com você": similaridade de atributos (conteúdo), sem dados de terceiros.
// O perfil do jogador é a média ponderada dos campeões que ele joga; recomendamos os mais
// parecidos que ele ainda não joga, explicando o porquê.

const POSICOES = ['top', 'jungle', 'mid', 'adc', 'sup'];
const ESTILOS = ['burst', 'dps', 'poke', 'engage', 'pick', 'mobilidade', 'tanque', 'sustain', 'protecao', 'controle', 'duelo', 'escala', 'early', 'zona'];

export const NOMES_ESTILO = {
  burst: 'dano explosivo', dps: 'dano contínuo', poke: 'poke à distância', engage: 'iniciação de lutas',
  pick: 'caçar alvos isolados', mobilidade: 'mobilidade', tanque: 'resistência', sustain: 'autocura',
  protecao: 'proteger aliados', controle: 'controle de grupo', duelo: 'duelos', escala: 'força no fim de jogo',
  early: 'força no começo', zona: 'controle de área',
};

function vetor(a) {
  return [
    ...POSICOES.map((p) => (a.p.includes(p) ? 0.6 : 0)),
    a.d === 'ad' || a.d === 'misto' ? (a.d === 'misto' ? 0.25 : 0.5) : 0,
    a.d === 'ap' || a.d === 'misto' ? (a.d === 'misto' ? 0.25 : 0.5) : 0,
    a.a === 'c' ? 0.5 : 0,
    a.a === 'd' ? 0.5 : 0,
    ...ESTILOS.map((e) => (a.e.includes(e) ? 1 : 0)),
  ];
}

function cosseno(x, y) {
  let dot = 0, nx = 0, ny = 0;
  for (let i = 0; i < x.length; i++) { dot += x[i] * y[i]; nx += x[i] ** 2; ny += y[i] ** 2; }
  return nx && ny ? dot / Math.sqrt(nx * ny) : 0;
}

export function recomendar({ porCampeao, maestrias, posicaoPrincipal, modoPrincipal, atributos, quantidade = 4 }) {
  const pesos = new Map();
  for (const c of porCampeao) {
    if (atributos[c.campeao]) pesos.set(c.campeao, (pesos.get(c.campeao) ?? 0) + c.jogos * (0.6 + c.winrate));
  }
  const maiorMaestria = maestrias[0]?.pontos ?? 1;
  for (const m of maestrias.slice(0, 5)) {
    if (atributos[m.campeao]) pesos.set(m.campeao, (pesos.get(m.campeao) ?? 0) + 2 * (m.pontos / maiorMaestria));
  }
  if (!pesos.size) return [];

  const perfil = Array(POSICOES.length + 4 + ESTILOS.length).fill(0);
  for (const [id, peso] of pesos) vetor(atributos[id]).forEach((v, i) => { perfil[i] += v * peso; });

  const conhecidos = new Set([...porCampeao.map((c) => c.campeao), ...maestrias.slice(0, 10).map((m) => m.campeao)]);
  const referencias = [...pesos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  const considerarPosicao = posicaoPrincipal && !['aram', 'arena'].includes(modoPrincipal);

  return Object.entries(atributos)
    .filter(([id]) => !conhecidos.has(id))
    .map(([id, a]) => {
      let nota = cosseno(perfil, vetor(a));
      if (considerarPosicao) nota += a.p.includes(posicaoPrincipal) ? 0.08 : -0.06;
      return { id, a, nota };
    })
    .sort((x, y) => y.nota - x.nota)
    .slice(0, quantidade)
    .map(({ id, a, nota }) => {
      // Explica pela referência mais parecida entre os campeões que o jogador já joga.
      const [parecido] = referencias
        .map((ref) => ({ ref, s: cosseno(vetor(atributos[ref]), vetor(a)) }))
        .sort((x, y) => y.s - x.s);
      const emComum = a.e.filter((e) => atributos[parecido.ref].e.includes(e)).slice(0, 2);
      return {
        id,
        afinidade: Math.round(Math.min(0.99, Math.max(0, nota)) * 100),
        parecidoCom: parecido.ref,
        estilos: emComum.map((e) => NOMES_ESTILO[e]),
        dificuldade: a.x,
      };
    });
}
