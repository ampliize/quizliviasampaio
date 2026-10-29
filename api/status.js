// GET /api/status — diz o que está configurado, sem revelar nenhum valor.
// Serve para descobrir por que o /crm não abre (variável faltando, schema não rodado, chave errada).
import { crmAtivo, rpc } from './_supabase.js';

export async function GET() {
  const status = {
    funcoes: 'ok',
    openai: Boolean(process.env.OPENAI_API_KEY),
    senha_crm: Boolean(process.env.CRM_SENHA),
    supabase_url: Boolean(process.env.SUPABASE_URL),
    supabase_chave: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    banco: 'não testado',
  };
  if (crmAtivo()) {
    try {
      await rpc('quiz_painel', { p_desde: new Date().toISOString(), p_origem: null });
      status.banco = 'ok';
    } catch (erro) {
      const m = erro.message;
      status.banco = /PGRST202|Could not find the function/i.test(m)
        ? 'as funções do CRM não existem: rode supabase/schema.sql no SQL Editor'
        : /permission denied|42501/i.test(m)
          ? 'chave sem permissão: use a service_role key (não a anon/publishable)'
          : /401|Invalid API key|JWT/i.test(m)
            ? 'chave inválida: confira SUPABASE_SERVICE_ROLE_KEY'
            : /fetch failed|ENOTFOUND|timeout/i.test(m)
              ? 'não conectou: confira SUPABASE_URL (https://xxxx.supabase.co)'
              : `erro: ${m.slice(0, 160)}`;
    }
  }
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } });
}
