// Servidor local para testar sem a Vercel:  node dev-server.mjs  →  http://localhost:3000
// Lê o .env (se existir), serve os arquivos estáticos e encaminha POST /api/resultado para a função.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('.', import.meta.url));
if (existsSync(join(raiz, '.env'))) {
  for (const linha of readFileSync(join(raiz, '.env'), 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const rotas = {
  '/api/resultado': (await import('./api/resultado.js')).POST,
  '/api/evento': (await import('./api/evento.js')).POST,
  '/api/crm': (await import('./api/crm.js')).POST,
};
const rotasGet = { '/api/status': (await import('./api/status.js')).GET };

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const porta = Number(process.env.PORT) || 3000;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rota = req.method === 'GET' ? rotasGet[url.pathname] : rotas[url.pathname];
  if (rota && (req.method === 'POST' || req.method === 'GET')) {
    const partes = [];
    for await (const p of req) partes.push(p);
    const resposta = await rota(new Request(url, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(partes) : undefined }));
    res.writeHead(resposta.status, Object.fromEntries(resposta.headers));
    res.end(Buffer.from(await resposta.arrayBuffer()));
    return;
  }
  // imita o cleanUrls da Vercel: /crm serve crm.html
  const pedido = url.pathname === '/' ? 'index.html' : extname(url.pathname) ? url.pathname : `${url.pathname}.html`;
  const caminho = normalize(join(raiz, pedido));
  if (!caminho.startsWith(raiz) || caminho.includes(`${raiz}api`)) {
    res.writeHead(404).end();
    return;
  }
  try {
    const corpo = await readFile(caminho);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] || 'application/octet-stream' });
    res.end(corpo);
  } catch {
    res.writeHead(404).end('Não encontrado');
  }
}).listen(porta, () => console.log(`Quiz rodando em http://localhost:${porta}`));
