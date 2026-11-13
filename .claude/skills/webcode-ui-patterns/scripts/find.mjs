#!/usr/bin/env node
// Busca no índice de padrões sem carregar a biblioteca inteira no contexto.
//   node find.mjs [--product <id>] [--category <id>] [--theme <id>] [--motion <nivel>] [--q <texto>] [--list]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const index = JSON.parse(fs.readFileSync(path.join(dir, '../data/index.json'), 'utf8'));
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };

if (args.includes('--list')) {
  console.log('categorias:', Object.keys(index.categories).join(', '));
  console.log('produtos:', Object.keys(index.products).join(', '));
  console.log('temas:', index.themes.map((t) => t.name).join(', '));
  console.log('blueprints:', index.blueprints.map((b) => b.id).join(', '));
  process.exit(0);
}

const q = opt('q')?.toLowerCase();
const res = index.patterns.filter((p) =>
  (!opt('product') || p.products.includes(opt('product'))) &&
  (!opt('category') || p.category === opt('category')) &&
  (!opt('theme') || p.themes.includes(opt('theme'))) &&
  (!opt('motion') || p.motion === opt('motion')) &&
  (!q || `${p.id} ${p.title} ${p.summary}`.toLowerCase().includes(q)));

if (!res.length) { console.log('Nenhum padrão. Use --list para ver valores válidos.'); process.exit(0); }
for (const p of res) {
  console.log(`${p.id}  [${p.category} · motion ${p.motion} · ${p.tech}]`);
  console.log(`  ${p.summary}`);
  console.log(`  temas: ${p.themes.join(', ')} · arquivo: data/${p.path}/`);
}
