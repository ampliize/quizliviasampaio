// Acesso ao Supabase do mini CRM, só pelo servidor (service role nunca vai para o navegador).
// Arquivos de /api que começam com "_" não viram rota na Vercel.

// valores colados na Vercel costumam vir com espaço ou barra no fim
const url = () => (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const chave = () => (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const crmAtivo = () => Boolean(url() && chave());

export async function rpc(funcao, args) {
  const resp = await fetch(`${url()}/rest/v1/rpc/${funcao}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: chave(),
      Authorization: `Bearer ${chave()}`,
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(6000),
  });
  if (!resp.ok) throw new Error(`Supabase ${funcao}: ${resp.status} ${await resp.text()}`);
  const texto = await resp.text();
  return texto ? JSON.parse(texto) : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Registra um evento do quiz; nunca derruba a requisição de quem está fazendo o quiz. */
export async function registrar(sessao, evento, dados = {}) {
  if (!crmAtivo() || !UUID.test(sessao || '')) return;
  try {
    await rpc('quiz_registrar', { p_sessao: sessao, p_evento: evento, p_dados: dados });
  } catch (erro) {
    console.error('Falha ao registrar evento no CRM:', erro.message);
  }
}
