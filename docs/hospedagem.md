# Hospedagem gratuita (e como migrar depois)

**Resposta curta:** dá para hospedar front e backend de graça, sem cartão de crédito, na
**Cloudflare Workers**. O projeto já está pronto para isso. Quando chegar a hora de um servidor
"de verdade", o código migra sem reescrita (seção 5).

---

## 1. Por que a Cloudflare

| Opção | Grátis? | Backend? | Uso comercial no grátis | Observação |
|-------|---------|----------|-------------------------|------------|
| **Cloudflare Workers** (escolhida) | Sim, sem cartão | Sim | Sim | ~100 mil requisições/dia, cache de borda, KV opcional |
| Vercel Hobby | Sim | Sim | **Não** (só pessoal) | Se virar produto, precisa do plano Pro (US$ 20/mês) |
| Netlify Free | Sim (300 créditos/mês) | Sim | Sim | O site **pausa** quando os créditos acabam |
| GitHub Pages | Sim | **Não** | Sim | Só estático: funcionariam apenas os exemplos de demonstração |

O que pesou: a Cloudflare serve os arquivos de `public/` e a API no mesmo lugar, com uma cota
diária generosa e sem o risco de o site pausar no meio do mês.

### Limites do plano gratuito que importam para nós

- **~100 mil requisições por dia.** Cada busca usa ~22 requisições ao nosso Worker (1 de conta +
  20 de partidas + 1 de campeões), então cabem ~4.500 buscas por dia, com folga para o tráfego
  dos arquivos estáticos (que não contam como execução do Worker).
- **50 chamadas externas por requisição.** Por isso a arquitetura divide o trabalho: `/api/conta`
  faz 6 chamadas à Riot e cada `/api/partida/:id` faz 1. Nenhuma requisição chega perto do limite.
- **Pouco tempo de CPU por requisição.** O Worker só repassa e "enxuga" o JSON da Riot. Toda a
  análise (persona, dicas, recomendações) roda **no navegador**, então o servidor faz pouco.

> Números de outubro de 2026, de fontes secundárias. Confira no painel da Cloudflare.

---

## 2. O gargalo de verdade não é a hospedagem, é a chave da Riot

| Chave | Validade | Uso |
|-------|----------|-----|
| Desenvolvimento | **expira a cada 24 h** | Testar. Precisa ser trocada todo dia (`npx wrangler secret put RIOT_API_KEY`) |
| Pessoal | não expira | Ideal para esta fase: registre o lolzin como *personal project* no portal da Riot |
| Produção | não expira | Site público. Exige registro e aprovação da Riot (ver `docs/estudo-de-caso.md`) |

Sem chave nenhuma, o site funciona com os **perfis de demonstração** (`/invocador?demo=ranqueada`,
`aram`, `arena`), gerados no próprio navegador.

---

## 3. Rodar no seu computador

Requisito: Node.js 18 ou mais novo.

```bash
npm install                      # instala o wrangler (ferramenta da Cloudflare)
cp .dev.vars.example .dev.vars   # cole a chave da Riot dentro (opcional)
npm run dev                      # http://localhost:8787 (servidor Node, sem dependências)
```

Para rodar no mesmo motor da Cloudflare (mais fiel ao ambiente publicado):

```bash
npm run dev:cloudflare           # http://localhost:8787 via wrangler
```

Testes: `npm test`.

---

## 4. Publicar na Cloudflare (uma vez, ~10 minutos)

1. Crie uma conta gratuita em <https://dash.cloudflare.com/sign-up> (não pede cartão).
2. No terminal, dentro do projeto:
   ```bash
   npx wrangler login             # abre o navegador para autorizar
   npx wrangler deploy            # publica; mostra a URL https://lolzin.<seu-subdominio>.workers.dev
   ```
3. Cadastre a chave da Riot como **segredo** (ela nunca fica no código nem no navegador):
   ```bash
   npx wrangler secret put RIOT_API_KEY
   ```
4. Pronto. Para atualizar o site depois, basta `npx wrangler deploy` de novo.

**Domínio próprio** (opcional, pago só o domínio): no painel da Cloudflare, *Workers & Pages →
lolzin → Settings → Domains & Routes*. Com domínio próprio, o cache de borda das partidas passa a
valer entre todos os visitantes (no `workers.dev` ele pode não ter efeito).

**Deploy automático** (opcional): conecte o repositório do GitHub em *Workers & Pages → Create →
Import a repository*, e cada push na branch principal publica sozinho.

---

## 5. Migração futura

O backend foi escrito para não depender da Cloudflare:

```
src/app.js      ← toda a lógica, com Request/Response padrão da web
src/riot.js     ← cliente da Riot, só usa fetch
src/worker.js   ← adaptador Cloudflare (12 linhas)
scripts/dev.mjs ← adaptador Node (o mesmo que roda local)
```

Para levar para outro lugar, escreve-se só um adaptador novo:

| Destino | O que muda |
|---------|------------|
| VPS / servidor próprio (Node) | Usar `scripts/dev.mjs` como servidor (ou trocá-lo por Express/Fastify chamando `tratar()`) atrás de um Nginx |
| Vercel / Netlify Functions | Função de poucas linhas que chama `tratar(request, process.env, …)` |
| Deno Deploy / Bun | `Deno.serve((req) => tratar(req, env, …))` |
| Docker | Imagem `node:22-alpine` rodando `node scripts/dev.mjs` |

Os arquivos de `public/` são estáticos e vão para qualquer lugar.

Se um dia for preciso guardar algo (ex.: referências por elo, cache de partidas), a ordem natural
é: JSON no repositório → KV da Cloudflare (grátis até 100 mil leituras/dia) → banco de verdade.
