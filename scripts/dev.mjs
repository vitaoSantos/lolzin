// Servidor local sem dependências: `npm run dev` (ou `node scripts/dev.mjs`).
// Serve public/ e a mesma API do Worker. A chave da Riot vem de RIOT_API_KEY ou do arquivo .dev.vars.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tratar } from '../src/app.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const publico = join(raiz, 'public');
const porta = Number(process.env.PORT) || 8787;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function lerDevVars() {
  const arquivo = join(raiz, '.dev.vars');
  if (!existsSync(arquivo)) return {};
  return Object.fromEntries(
    readFileSync(arquivo, 'utf8').split('\n')
      .map((linha) => linha.trim()).filter((linha) => linha && !linha.startsWith('#') && linha.includes('='))
      .map((linha) => [linha.slice(0, linha.indexOf('=')).trim(), linha.slice(linha.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]),
  );
}

const env = { ...lerDevVars(), ...(process.env.RIOT_API_KEY ? { RIOT_API_KEY: process.env.RIOT_API_KEY } : {}) };

// Mesma resolução de caminhos da Cloudflare: "/" → index.html, "/invocador" → invocador.html.
async function servirArquivo(caminho) {
  const limpo = normalize(decodeURIComponent(caminho)).replace(/^(\.\.[/\\])+/, '');
  const candidatos = limpo.endsWith('/') ? [join(limpo, 'index.html')] : [limpo, `${limpo}.html`, join(limpo, 'index.html')];
  for (const candidato of candidatos) {
    const arquivo = join(publico, candidato);
    if (!arquivo.startsWith(publico)) break;
    try {
      if ((await stat(arquivo)).isFile()) {
        return new Response(await readFile(arquivo), {
          headers: { 'content-type': TIPOS[extname(arquivo)] ?? 'application/octet-stream', 'cache-control': 'no-cache' },
        });
      }
    } catch { /* tenta o próximo */ }
  }
  return new Response('Não encontrado', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

createServer(async (req, res) => {
  try {
    const request = new Request(`http://localhost:${porta}${req.url}`, { method: req.method, headers: req.headers });
    const resposta = await tratar(request, env, { servirArquivo: (caminho) => servirArquivo(caminho) });
    res.writeHead(resposta.status, Object.fromEntries(resposta.headers));
    res.end(Buffer.from(await resposta.arrayBuffer()));
  } catch (erro) {
    console.error(erro);
    res.writeHead(500).end('Erro interno');
  }
}).listen(porta, () => {
  console.log(`lolzin rodando em http://localhost:${porta}`);
  console.log(env.RIOT_API_KEY ? 'Chave da Riot: configurada' : 'Chave da Riot: ausente (só os exemplos de demonstração funcionam)');
});
