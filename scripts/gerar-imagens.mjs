// Gera as imagens do site com a skill openrouter-img e atualiza o manifesto.
//
//   node scripts/gerar-imagens.mjs              gera só as que ainda não existem
//   node scripts/gerar-imagens.mjs --listar     mostra o que seria gerado (sem custo)
//   node scripts/gerar-imagens.mjs persona-coruja modo-aram   gera só essas
//
// Requer: OPENROUTER_API_KEY no ambiente (ou .env) e acesso a openrouter.ai.
// O caminho do script da skill pode ser trocado com OPENROUTER_IMG_SCRIPT.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const destino = join(raiz, 'public/img/gerado');
const config = JSON.parse(readFileSync(join(raiz, 'scripts/imagens.json'), 'utf8'));
const script = process.env.OPENROUTER_IMG_SCRIPT ?? join(homedir(), '.agents/skills/openrouter-img/scripts/generate_image.py');

const args = process.argv.slice(2);
const listar = args.includes('--listar');
const escolhidas = args.filter((a) => !a.startsWith('--'));

const existentes = () => readdirSync(destino).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
const jaExiste = (nome) => existentes().some((f) => f.replace(/\.[a-z0-9]+$/i, '') === nome);

const fila = config.imagens.filter((i) => (escolhidas.length ? escolhidas.includes(i.arquivo) : !jaExiste(i.arquivo)));

if (listar || !fila.length) {
  console.log(fila.length ? `Seriam geradas ${fila.length} imagens (${config.modelo} @ ${config.resolucao}):` : 'Nada a gerar.');
  for (const i of fila) console.log(`  - ${i.arquivo} (${i.proporcao})`);
  process.exit(0);
}

if (!existsSync(script)) {
  console.error(`Script da skill não encontrado em ${script}. Defina OPENROUTER_IMG_SCRIPT.`);
  process.exit(1);
}

for (const i of fila) {
  console.log(`Gerando ${i.arquivo}…`);
  execFileSync('uv', [
    'run', script,
    '--prompt', `${i.prompt}. ${config.estilo}`,
    '--filename', `${i.arquivo}.png`,
    '--model', config.modelo,
    '--resolution', config.resolucao,
    '--aspect-ratio', i.proporcao,
  ], { cwd: destino, stdio: 'inherit' });
}

const manifesto = { _sobre: 'Imagens geradas por IA (ver docs/prompts-imagens.md). A página só usa as que estiverem listadas aqui.', imagens: existentes().sort() };
writeFileSync(join(destino, 'manifest.json'), `${JSON.stringify(manifesto, null, 2)}\n`);
console.log(`Manifesto atualizado: ${manifesto.imagens.length} imagens.`);
