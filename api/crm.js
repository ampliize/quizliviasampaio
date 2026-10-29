// POST /api/crm — dados do painel. Protegido pela senha única CRM_SENHA.
import { timingSafeEqual, createHash } from 'node:crypto';
import { crmAtivo, rpc } from './_supabase.js';

const PERIODOS = { '1': 1, '7': 7, '30': 30, '90': 90 };

function senhaConfere(recebida) {
  const certa = process.env.CRM_SENHA;
  if (!certa || typeof recebida !== 'string') return false;
  // compara hashes de mesmo tamanho para não vazar nada pelo tempo de resposta
  const h = (t) => createHash('sha256').update(t).digest();
  return timingSafeEqual(h(recebida), h(certa));
}

export async function POST(request) {
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: 'Requisição inválida.' }, { status: 400 });
  }
  if (!senhaConfere(corpo.senha)) {
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ erro: 'Senha incorreta.' }, { status: 401 });
  }
  if (!crmAtivo()) {
    return Response.json(
      { erro: 'O banco do CRM ainda não está configurado. Cadastre SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.' },
      { status: 503 },
    );
  }

  const dias = PERIODOS[corpo.periodo];
  const desde = dias ? new Date(Date.now() - dias * 86400000).toISOString() : null;
  const origem = typeof corpo.origem === 'string' && corpo.origem ? corpo.origem.slice(0, 120) : null;
  try {
    const painel = await rpc('quiz_painel', { p_desde: desde, p_origem: origem });
    return Response.json(painel, { headers: { 'Cache-Control': 'no-store' } });
  } catch (erro) {
    console.error(erro.message);
    return Response.json({ erro: 'Não foi possível ler o banco do CRM. Veja os logs da função na Vercel.' }, { status: 502 });
  }
}
