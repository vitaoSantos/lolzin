# lolzin

Landing pages de League of Legends montadas na hora. A pessoa digita o Riot ID e a página nasce
com a cara do seu main, o layout do modo que mais joga, uma persona, dicas para evoluir e campeões
que combinam com ela. Nada é guardado: tudo é calculado no momento da busca.

- Estudo de viabilidade: [`docs/estudo-de-caso.md`](docs/estudo-de-caso.md)
- Hospedagem gratuita e migração: [`docs/hospedagem.md`](docs/hospedagem.md)
- Imagens geradas por IA: [`docs/prompts-imagens.md`](docs/prompts-imagens.md)

## Rodar

```bash
npm install
npm run dev      # http://localhost:8787
npm test
```

Sem chave da Riot, use os exemplos de demonstração (jogadores fictícios):

- <http://localhost:8787/invocador?demo=ranqueada>
- <http://localhost:8787/invocador?demo=aram>
- <http://localhost:8787/invocador?demo=arena>

Com chave: copie `.dev.vars.example` para `.dev.vars`, cole a chave do
[portal da Riot](https://developer.riotgames.com) e busque qualquer Riot ID na página inicial.

## Como funciona

```
navegador                                   Worker (Cloudflare)            Riot
─────────                                   ───────────────────            ────
index.html ── Nome#TAG ──▶ /br1/Nome-TAG
invocador.html
  └ fonte.js ── /api/conta ───────────────▶ conta, elo, maestria, IDs ───▶ account/summoner/league/mastery/match
             ── /api/partida/:id (×20) ───▶ partida enxuta (cache) ───────▶ match-v5
             ── /api/campeoes ────────────▶ nomes pt_BR ──────────────────▶ Data Dragon
  └ analise.js  persona · dicas · recomendações (roda no navegador)
  └ secoes.js   hero · template do modo · persona · padrões · dicas · para você
```

| Pasta | Conteúdo |
|-------|----------|
| `src/` | Backend portátil: `app.js` (rotas), `riot.js` (cliente), `enxugar.js`, `worker.js` (adaptador Cloudflare) |
| `public/js/nucleo/` | Análise compartilhada (navegador e testes): `analise.js`, `personas.js`, `dicas.js`, `recomendacao.js`, `demo.js` |
| `public/js/` | Interface: `busca.js`, `invocador.js`, `secoes.js`, `tema.js` (paleta dinâmica), `particulas.js` |
| `public/dados/campeoes.json` | Atributos curados de 171 campeões (região, posições, estilo) para tema e recomendação |
| `scripts/` | Servidor local (`dev.mjs`) e geração de imagens (`gerar-imagens.mjs`) |
| `test/` | Testes do backend e da análise (`node --test`) |

## Aviso legal

O lolzin não é endossado pela Riot Games e não reflete as opiniões da Riot Games ou de qualquer
pessoa oficialmente envolvida na produção ou gestão das propriedades da Riot Games. Riot Games e
todas as propriedades associadas são marcas comerciais ou registradas da Riot Games, Inc.
