// Adaptador Cloudflare Workers. Os arquivos de public/ são servidos direto pela Cloudflare;
// este código só roda para /api/* e para as URLs de perfil (/br1/Nome-TAG).

import { tratar } from './app.js';

export default {
  fetch(request, env) {
    return tratar(request, env, {
      servirArquivo: (caminho, req) => env.ASSETS.fetch(new Request(new URL(caminho, req.url), req)),
      cacheBorda: caches.default,
    });
  },
};
