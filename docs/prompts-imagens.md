# Imagens geradas por IA

O site já tem os **lugares** para arte gerada por IA. Enquanto as imagens não existem, cada lugar
usa uma alternativa feita em código (degradês, selo SVG girando, splash arts oficiais da Data
Dragon). Quando uma imagem é gerada e entra no manifesto, ela aparece sozinha, sem mudar código.

## Onde cada imagem entra

| Arquivo | Proporção | Onde aparece | Alternativa atual |
|---------|-----------|--------------|-------------------|
| `busca-hero` | 16:9 | Fundo da tela de busca, atrás do mural de campeões | Só o mural + aurora de cor |
| `modo-ranqueada`, `modo-aram`, `modo-arena`, `modo-normal`, `modo-evento` | 16:9 | Fundo da seção do template do modo (opacidade baixa) | Fundo liso com partículas |
| `persona-<id>` (14 personas) | 1:1 | Ilustração grande da seção "Sua persona" | Selo SVG com a inicial e o nome girando |

Os prompts estão em [`scripts/imagens.json`](../scripts/imagens.json). Todos pedem **arte
original**: nenhum campeão, logo ou texto da Riot (a política de fãs permite usar as artes
oficiais, mas não gerar imitações delas). As artes oficiais dos campeões continuam vindo da
Data Dragon.

Estilo comum a todas: *dark cinematic high-fantasy*, fundo azul-noite quase preto, luz volumétrica,
grão de filme. Assim combinam com qualquer paleta de campeão aplicada por cima.

## Como gerar

```bash
node scripts/gerar-imagens.mjs --listar     # mostra o que falta (não gasta nada)
node scripts/gerar-imagens.mjs              # gera o que falta e atualiza o manifesto
node scripts/gerar-imagens.mjs persona-coruja modo-aram   # regera só essas
```

O script chama a skill **openrouter-img** (modelo `flash`, 1K) e salva em `public/img/gerado/`.
Custo estimado: 20 imagens × ~US$ 0,07 ≈ **US$ 1,40**. Para trocar de modelo, edite `modelo` em
`scripts/imagens.json` (ex.: `seedream` para arte mais barata, `flux-max` para mais qualidade).

## Por que ainda não foram geradas

No ambiente em nuvem onde o projeto foi montado, a geração ficou bloqueada por três motivos:

1. **Rede:** o domínio `openrouter.ai` não está liberado na política de rede do ambiente.
2. **Chave:** a variável `OPENROUTER_API_KEY` não está configurada no ambiente.
3. **Script da skill:** o arquivo `~/.agents/skills/openrouter-img/scripts/generate_image.py`
   não existe nesse ambiente (só a descrição da skill foi sincronizada).

Para liberar, nas configurações do ambiente (menu do ambiente na barra de título da sessão →
*Edit*): adicionar `openrouter.ai` em *Allowed domains* e a `OPENROUTER_API_KEY` como segredo ou
variável de ambiente. O item 3 depende de a skill trazer o script junto; se não trouxer, dá para
rodar `gerar-imagens.mjs` no seu computador, onde a skill funciona, apontando
`OPENROUTER_IMG_SCRIPT` para o script.
