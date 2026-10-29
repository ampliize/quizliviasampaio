// POST /api/resultado
// Recebe as respostas, recalcula o perfil (não confia no navegador), pede à OpenAI a devolutiva
// personalizada e, se configurado, repassa o lead para um webhook (n8n, ManyChat, Make, Supabase...).
import {
  PERFIS,
  QUALIFICADORAS,
  calcularResultado,
  precisaCuidado,
} from '../assets/quiz-data.js';
import { devolutivaPadrao } from '../assets/fallback.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODELO = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const TIMEOUT_IA_MS = 20000;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['saudacao', 'acolhimento', 'oQueSinaliza', 'forcas', 'exercicio', 'proximoPasso', 'convite', 'fraseFinal'],
  properties: {
    saudacao: { type: 'string' },
    acolhimento: { type: 'string' },
    oQueSinaliza: { type: 'array', items: { type: 'string' } },
    forcas: { type: 'array', items: { type: 'string' } },
    exercicio: {
      type: 'object',
      additionalProperties: false,
      required: ['titulo', 'passos'],
      properties: {
        titulo: { type: 'string' },
        passos: { type: 'array', items: { type: 'string' } },
      },
    },
    proximoPasso: { type: 'string' },
    convite: { type: 'string' },
    fraseFinal: { type: 'string' },
  },
};

const SISTEMA = `Você escreve devolutivas do quiz de autoconhecimento "A-Livia-ndo", da Lívia Sampaio (@lliviasampaio),
que inspira mulheres com amor-próprio, autoestima e relações saudáveis. Escreva em português do Brasil,
falando diretamente com a participante ("você"), com tom acolhedor, seguro, pessoal e prático — como a Lívia
falaria olhando nos olhos de uma seguidora. Frases curtas, nada de jargão.

Regras obrigatórias:
- É um resultado EDUCATIVO, não um diagnóstico. Nunca use "diagnóstico", "transtorno", "patologia", "tóxica" como rótulo
  para a participante, nem diga que ela "é" algo de forma definitiva. Fale em "momento", "padrão", "trilha".
- Não julgue, não culpe, não prometa resultados (nada de "você vai encontrar o amor", "vai salvar seu relacionamento").
- Não use emojis, hashtags nem markdown.
- Use os dados do perfil e das respostas para personalizar de verdade: cite o momento de vida, o desejo e a frase escolhida
  sem repetir literalmente as alternativas.
- Se houver trilha complementar, mencione que as duas caminham juntas.
- O convite para a comunidade deve ser suave e contextual (1 a 2 frases), ligando o perfil ao que existe no A-Livia-ndo:
  e-books exclusivos escritos pela Lívia, lives quinzenais com ela e especialistas, materiais sobre autocuidado, autoestima,
  limites e relacionamentos, e uma comunidade de mulheres. Sem urgência, sem escassez, sem preço.

Formato:
- saudacao: 1 frase usando o primeiro nome, se houver.
- acolhimento: 2 a 3 frases.
- oQueSinaliza: 2 a 3 parágrafos curtos sobre o que esse padrão pode estar sinalizando no momento dela.
- forcas: 3 forças que as respostas mostram (frases curtas, até 8 palavras cada).
- exercicio: um exercício de 3 minutos, com título curto e 3 passos concretos.
- proximoPasso: um próximo passo gratuito para os próximos 7 dias (1 a 2 frases).
- convite: convite para conhecer a comunidade.
- fraseFinal: uma frase de encerramento inspiradora, no estilo "A mulher que aprende a escolher não perde tempo. Ela ganha vida."`;

function textoQualificadora(chave, valor) {
  return QUALIFICADORAS[chave]?.opcoes?.[valor] || 'não informado';
}

function montarPedido({ nome, resultado, qualificadoras }) {
  const perfil = PERFIS[resultado.perfil];
  const comp = resultado.complementar ? PERFIS[resultado.complementar] : null;
  const placar = resultado.placar.map((b) => `- ${b.nome}: força ${b.forca}/100`).join('\n');
  return `Primeiro nome: ${nome || 'não informado'}
Perfil educativo principal: ${perfil.nome} — "${perfil.frase}"
Trilha complementar: ${comp ? `${comp.nome} — "${comp.frase}"` : 'nenhuma'}
Mapa por dimensão (quanto maior, mais fortalecida está a área):
${placar}
Momento de vida: ${textoQualificadora('momento', qualificadoras.momento)}
O que mais deseja desenvolver: ${textoQualificadora('desejo', qualificadoras.desejo)}
Formato de apoio preferido: ${textoQualificadora('formato', qualificadoras.formato)}
Tempo por semana: ${textoQualificadora('tempo', qualificadoras.tempo)}
Frase que representa o momento: ${textoQualificadora('frase', qualificadoras.frase)}`;
}

async function gerarDevolutivaIA(dados) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) return null;

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_IA_MS);
  try {
    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      signal: controle.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          { role: 'system', content: SISTEMA },
          { role: 'user', content: montarPedido(dados) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'devolutiva', strict: true, schema: SCHEMA },
        },
      }),
    });
    if (!resp.ok) {
      console.error('OpenAI respondeu', resp.status, await resp.text());
      return null;
    }
    const json = await resp.json();
    const conteudo = json.choices?.[0]?.message?.content;
    if (!conteudo) return null;
    return { ...JSON.parse(conteudo), origem: 'ia' };
  } catch (erro) {
    console.error('Falha ao gerar devolutiva com IA:', erro.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function enviarLead(payload) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LEAD_WEBHOOK_SECRET ? { 'X-Webhook-Secret': process.env.LEAD_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (erro) {
    console.error('Falha ao enviar lead para o webhook:', erro.message);
  }
}

const limpar = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request) {
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const qualificadoras = corpo.qualificadoras || {};
  let resultado;
  try {
    resultado = calcularResultado(corpo.respostas || {}, qualificadoras.momento);
  } catch (erro) {
    return Response.json({ erro: erro.message }, { status: 422 });
  }

  const nome = limpar(corpo.lead?.nome, 60);
  const cuidado = precisaCuidado(corpo.triagem);
  const dados = { nome, resultado, qualificadoras };

  const [devolutiva] = await Promise.all([
    gerarDevolutivaIA(dados).then((d) => d || devolutivaPadrao({ ...resultado, nome })),
    enviarLead({
      evento: 'quiz_concluido',
      data: new Date().toISOString(),
      nome,
      email: limpar(corpo.lead?.email),
      whatsapp: limpar(corpo.lead?.whatsapp, 30),
      consentimento: corpo.lead?.consentimento === true,
      perfil: resultado.perfil,
      perfil_nome: PERFIS[resultado.perfil].nome,
      complementar: resultado.complementar,
      placar: Object.fromEntries(resultado.placar.map((b) => [b.id, b.forca])),
      qualificadoras,
      // Só a sinalização — as respostas da triagem não saem daqui.
      // Use para NÃO disparar sequência de venda para quem sinalizou risco.
      cuidado,
      rastreio: corpo.rastreio || {},
    }),
  ]);

  return Response.json({ ...resultado, cuidado, devolutiva });
}
