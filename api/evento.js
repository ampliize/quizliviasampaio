// POST /api/evento — o quiz avisa cada etapa alcançada (via sendBeacon, então o corpo chega como texto).
import { registrar } from './_supabase.js';

const EVENTOS = new Set(['visita', 'inicio', 'etapa', 'pdf', 'comunidade']);
const ETAPAS = new Set(['capa', 'momento', 'A', 'B', 'C', 'D', 'E', 'qualificadoras', 'cuidado', 'contato', 'resultado']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const curto = (v, max = 120) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const inteiro = (v) => (Number.isInteger(v) && v >= 0 && v < 1000 ? v : undefined);

export async function POST(request) {
  let corpo;
  try {
    corpo = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const { sessao, evento } = corpo;
  if (!UUID.test(sessao || '') || !EVENTOS.has(evento)) return new Response(null, { status: 422 });

  const r = corpo.rastreio || {};
  const dados = {
    etapa: ETAPAS.has(corpo.etapa) ? corpo.etapa : undefined,
    pergunta: inteiro(corpo.pergunta),
    total: inteiro(corpo.total),
    momento: curto(corpo.momento, 30),
    dispositivo: curto(corpo.dispositivo, 20),
    rastreio: {
      utm_source: curto(r.utm_source),
      utm_medium: curto(r.utm_medium),
      utm_campaign: curto(r.utm_campaign),
      utm_content: curto(r.utm_content),
      mc_id: curto(r.mc_id),
    },
  };
  // pergunta/total só existem juntos
  if (dados.pergunta === undefined || dados.total === undefined) {
    delete dados.pergunta;
    delete dados.total;
  }
  if (!dados.momento) delete dados.momento;

  await registrar(sessao, evento, dados);
  return new Response(null, { status: 204 });
}
