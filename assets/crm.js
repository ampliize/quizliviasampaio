import { BLOCOS, PERFIS, QUALIFICADORAS } from './quiz-data.js';

const CHAVE_SENHA = 'aliviando_crm_senha';
const ATIVA_MINUTOS = 30;

const NOMES_ETAPA = {
  capa: 'Abriu e não começou',
  momento: 'Perfil (momento, filhos, vida, prioridade)',
  ...Object.fromEntries(BLOCOS.map((b) => [b.id, b.nome])),
  qualificadoras: 'Renda, mudança e área a melhorar',
  cuidado: 'Triagem de cuidado',
  contato: 'Tela de contato',
  resultado: 'Viu o resultado',
};
const NOMES_FUNIL = { ...NOMES_ETAPA, capa: 'Abriram o link', resultado: 'Viram o resultado' };
// etapas que existem no banco mas não estão no quiz de captação (relação e triagem saíram a pedido da Lívia)
const FORA_DO_QUIZ = ['E', 'cuidado'];
// o que o painel mostra em "Quem é o público"
const PUBLICO = ['filhos', 'sentimento', 'prioridade', 'renda', 'area'];
const TITULO_PUBLICO = { filhos: 'Filhos', sentimento: 'Como se sente com a vida', prioridade: 'Maior prioridade', renda: 'Renda mensal', area: 'Área que mais precisa melhorar' };
const resposta = (chave, v) => QUALIFICADORAS[chave]?.opcoes[v]?.replace(/\.$/, '') || '';
const COR_ETAPA = { A: 'var(--A)', B: 'var(--B)', C: 'var(--C)', D: 'var(--D)', E: 'var(--E)' };

const $ = (id) => document.getElementById(id);
const filtro = { periodo: '7', origem: '', lista: 'todos', busca: '' };
let dados = null;

// ---------- helpers ----------
function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'style') el.setAttribute('style', v);
    else if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v);
  });
  filhos.flat().forEach((f) => f != null && f !== false && el.append(f.nodeType ? f : document.createTextNode(String(f))));
  return el;
}
const num = (n) => Number(n || 0).toLocaleString('pt-BR');
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '0%');
const quando = (iso) => {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  if (min < 60 * 24) return `há ${Math.round(min / 60)} h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
const lerSenha = () => {
  try {
    return sessionStorage.getItem(CHAVE_SENHA) || '';
  } catch {
    return '';
  }
};
const guardarSenha = (s) => {
  try {
    s ? sessionStorage.setItem(CHAVE_SENHA, s) : sessionStorage.removeItem(CHAVE_SENHA);
  } catch {
    /* sem storage: pede a senha de novo no recarregamento */
  }
};

function situacao(l) {
  if (l.clicou_comunidade) return { texto: 'Clicou na comunidade', tipo: 'ok' };
  if (l.concluido_em) return { texto: l.baixou_pdf ? 'Viu o resultado e baixou o PDF' : 'Viu o resultado', tipo: 'ok' };
  const ativa = Date.now() - new Date(l.ultima_atividade) < ATIVA_MINUTOS * 60000;
  const onde = NOMES_ETAPA[l.etapa] || l.etapa;
  const pergunta = l.pergunta && l.total_perguntas ? `, pergunta ${l.pergunta} de ${l.total_perguntas}` : '';
  if (l.etapa === 'capa') return { texto: ativa ? 'Abriu agora, ainda não começou' : onde, tipo: ativa ? 'agora' : 'parou' };
  if (ativa) return { texto: `Fazendo agora: ${onde}${pergunta}`, tipo: 'agora' };
  return { texto: `Parou em ${onde}${pergunta}`, tipo: 'parou' };
}

// ---------- dados ----------
async function carregar() {
  $('atualizar').disabled = true;
  $('atualizar').textContent = 'Atualizando…';
  try {
    const resp = await fetch('/api/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: lerSenha(), periodo: filtro.periodo, origem: filtro.origem }),
    });
    const json = await resp.json().catch(() => ({}));
    if (resp.status === 404) {
      mostrarEntrada('O servidor do painel não foi encontrado neste endereço. Confira se o deploy incluiu a pasta api/.');
      return;
    }
    if (resp.status === 503) {
      guardarSenha('');
      mostrarEntrada(`${json.erro} Diagnóstico completo em /api/status.`);
      return;
    }
    if (resp.status === 401) {
      guardarSenha('');
      mostrarEntrada('Senha incorreta. Confira com quem configurou o painel.');
      return;
    }
    if (!resp.ok) {
      avisar(`${json.erro || `O painel não respondeu (erro ${resp.status}).`} Diagnóstico completo em /api/status.`);
      return;
    }
    avisar('');
    dados = json;
    desenhar();
  } catch {
    avisar('Sem conexão com o servidor. Verifique a internet e toque em Atualizar.');
  } finally {
    $('atualizar').disabled = false;
    $('atualizar').textContent = 'Atualizar';
  }
}

function avisar(texto) {
  $('aviso').hidden = !texto;
  $('aviso').textContent = texto;
}

function mostrarEntrada(erro = '') {
  $('painel').hidden = true;
  $('entrar').hidden = false;
  $('erro-senha').textContent = erro;
  $('senha').focus();
}

// ---------- desenho ----------
function desenhar() {
  const t = dados.totais;
  const visitas = dados.funil[0]?.alcancaram || 0;
  $('totais').replaceChildren(
    ...[
      ['Abriram o link', t.sessoes, null],
      ['Viram o resultado', t.concluiram, pct(t.concluiram, t.sessoes)],
      ['Deixaram contato', t.com_contato, pct(t.com_contato, t.sessoes)],
      ['Baixaram o PDF', t.baixaram_pdf, pct(t.baixaram_pdf, t.concluiram)],
      ['Clicaram na comunidade', t.clicaram_comunidade, pct(t.clicaram_comunidade, t.concluiram)],
    ].map(([rotulo, n, taxa]) =>
      h('div', { class: 'total' }, h('strong', {}, num(n)), h('span', {}, rotulo), taxa && h('em', {}, taxa === '0%' ? '' : taxa)),
    ),
  );

  // funil
  const funil = dados.funil.filter((f) => !FORA_DO_QUIZ.includes(f.etapa));
  $('funil').replaceChildren(
    ...funil.map((f, i) => {
      const antes = i ? funil[i - 1].alcancaram : f.alcancaram;
      const perdeu = antes - f.alcancaram;
      return h(
        'li',
        { style: `--cor:${COR_ETAPA[f.etapa] || 'var(--neutro-forte)'}` },
        h('div', { class: 'f-rot' }, h('span', {}, NOMES_FUNIL[f.etapa]), h('strong', {}, num(f.alcancaram))),
        h('div', { class: 'f-barra' }, h('i', { style: `width:${visitas ? Math.max((f.alcancaram / visitas) * 100, f.alcancaram ? 1.5 : 0) : 0}%` })),
        i > 0 && perdeu > 0 ? h('p', { class: 'f-perda' }, `${num(perdeu)} ${perdeu === 1 ? 'parou' : 'pararam'} aqui (${pct(perdeu, antes)} de quem chegou na etapa anterior)`) : null,
      );
    }),
  );

  // onde param
  const paradas = dados.paradas.filter((p) => p.pessoas > 0);
  const totalParados = paradas.reduce((s, p) => s + p.pessoas, 0);
  $('paradas').replaceChildren(
    ...(paradas.length
      ? paradas.map((p) =>
          h('li', {}, h('span', {}, NOMES_ETAPA[p.etapa] || p.etapa), h('strong', {}, num(p.pessoas)), h('em', {}, pct(p.pessoas, totalParados))),
        )
      : [h('li', { class: 'vazio' }, 'Ninguém parou no meio neste período.')]),
  );

  const perfis = Object.entries(dados.perfis || {}).sort((a, b) => b[1] - a[1]);
  $('perfis').replaceChildren(
    ...(perfis.length
      ? perfis.map(([id, n]) => h('li', { style: `--cor:var(--${id})` }, h('span', {}, PERFIS[id]?.nome || id), h('strong', {}, num(n))))
      : [h('li', { class: 'vazio' }, 'Ainda não há resultados neste período.')]),
  );

  // quem é o público: distribuição de cada resposta de perfil
  const publico = dados.publico || {};
  $('publico').replaceChildren(
    ...PUBLICO.map((chave) => {
      const contagem = Object.entries(publico[chave] || {}).sort((a, b) => b[1] - a[1]);
      const total = contagem.reduce((s, [, n]) => s + n, 0);
      return h(
        'div',
        { class: 'pub' },
        h('h3', {}, TITULO_PUBLICO[chave]),
        contagem.length
          ? h(
              'ul',
              {},
              contagem.map(([v, n]) =>
                h(
                  'li',
                  {},
                  h('div', { class: 'pub-rot' }, h('span', {}, resposta(chave, v) || v), h('em', {}, `${num(n)} (${pct(n, total)})`)),
                  h('div', { class: 'f-barra' }, h('i', { style: `width:${(n / total) * 100}%` })),
                ),
              ),
            )
          : h('p', { class: 'legenda' }, 'Ainda sem respostas.'),
      );
    }),
  );

  // origens no select (mantém a escolhida)
  const sel = $('origem');
  const atual = filtro.origem;
  sel.replaceChildren(
    h('option', { value: '' }, 'Todas as origens'),
    ...dados.origens.map((o) => h('option', { value: o.origem, selected: o.origem === atual }, `${o.origem} (${num(o.sessoes)})`)),
  );

  desenharLeads();
}

function leadsFiltrados() {
  const busca = filtro.busca.trim().toLowerCase();
  return dados.leads.filter((l) => {
    if (filtro.lista === 'contato' && !(l.email || l.whatsapp)) return false;
    if (filtro.lista === 'abandonaram' && l.concluido_em) return false;
    if (filtro.lista === 'concluiram' && !l.concluido_em) return false;
    if (filtro.lista === 'comunidade' && !l.clicou_comunidade) return false;
    if (filtro.lista === 'cuidado' && !l.cuidado) return false;
    if (busca && ![l.nome, l.email, l.whatsapp].some((v) => (v || '').toLowerCase().includes(busca))) return false;
    return true;
  });
}

function desenharLeads() {
  const lista = leadsFiltrados();
  $('leads').replaceChildren(
    ...(lista.length
      ? lista.map((l) => {
          const s = situacao(l);
          const whats = (l.whatsapp || '').replace(/\D/g, '');
          return h(
            'tr',
            {},
            h(
              'td',
              { 'data-rotulo': 'Pessoa' },
              h('strong', {}, l.nome || 'Sem nome ainda'),
              l.email && h('a', { href: `mailto:${l.email}` }, l.email),
              whats && h('a', { href: `https://wa.me/${whats.length <= 11 ? '55' + whats : whats}`, target: '_blank', rel: 'noopener' }, l.whatsapp),
              l.email || l.whatsapp ? (l.consentimento ? h('small', {}, 'Autorizou receber conteúdos') : h('small', {}, 'Não autorizou conteúdos')) : null,
            ),
            h(
              'td',
              { 'data-rotulo': 'Situação' },
              h('span', { class: `status ${s.tipo}` }, s.texto),
              l.cuidado && h('small', { class: 'risco' }, 'Sinalizou risco: não enviar oferta'),
              l.momento && h('small', {}, QUALIFICADORAS.momento.opcoes[l.momento] || l.momento),
            ),
            h(
              'td',
              { 'data-rotulo': 'Perfil' },
              l.perfil ? h('span', { class: 'perfil', style: `--cor:var(--${l.perfil})` }, PERFIS[l.perfil]?.nome || l.perfil) : h('span', { class: 'mudo' }, 'Sem resultado'),
              l.qualificadoras?.area && h('small', {}, `Quer melhorar: ${resposta('area', l.qualificadoras.area)}`),
              l.qualificadoras?.filhos && h('small', {}, `Filhos: ${resposta('filhos', l.qualificadoras.filhos)}`),
              l.qualificadoras?.renda && h('small', {}, `Renda: ${resposta('renda', l.qualificadoras.renda)}`),
            ),
            h(
              'td',
              { 'data-rotulo': 'Origem' },
              l.utm_source || '(direto)',
              (l.utm_medium || l.utm_content) && h('small', {}, [l.utm_medium, l.utm_content].filter(Boolean).join(' / ')),
            ),
            h('td', { 'data-rotulo': 'Última atividade' }, quando(l.ultima_atividade), h('small', {}, `Entrou ${quando(l.criado_em)}`)),
          );
        })
      : [h('tr', {}, h('td', { colspan: '5', class: 'vazio' }, 'Nenhum lead com esses filtros.'))]),
  );
  $('contagem').textContent = `${num(lista.length)} de ${num(dados.leads.length)} pessoas${dados.leads.length >= 1000 ? ' (mostrando as 1.000 mais recentes)' : ''}.`;
}

function exportarCsv() {
  if (!dados) return;
  const colunas = [
    ['nome', 'Nome'], ['email', 'E-mail'], ['whatsapp', 'WhatsApp'], ['consentimento', 'Autorizou conteúdos'],
    ['situacao', 'Situação'], ['perfil_nome', 'Perfil'], ['momento', 'Momento'],
    ...PUBLICO.map((c) => [c, TITULO_PUBLICO[c]]),
    ['cuidado', 'Sinalizou risco'],
    ['utm_source', 'utm_source'], ['utm_medium', 'utm_medium'], ['utm_campaign', 'utm_campaign'], ['utm_content', 'utm_content'],
    ['mc_id', 'ManyChat ID'], ['criado_em', 'Entrou em'], ['ultima_atividade', 'Última atividade'],
  ];
  const linhas = leadsFiltrados().map((l) => ({
    ...l,
    situacao: situacao(l).texto,
    perfil_nome: PERFIS[l.perfil]?.nome || '',
    momento: QUALIFICADORAS.momento.opcoes[l.momento] || '',
    ...Object.fromEntries(PUBLICO.map((c) => [c, resposta(c, l.qualificadoras?.[c])])),
    consentimento: l.consentimento ? 'sim' : 'não',
    cuidado: l.cuidado ? 'sim' : 'não',
    criado_em: new Date(l.criado_em).toLocaleString('pt-BR'),
    ultima_atividade: new Date(l.ultima_atividade).toLocaleString('pt-BR'),
  }));
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [colunas.map((c) => esc(c[1])).join(';'), ...linhas.map((l) => colunas.map((c) => esc(l[c[0]])).join(';'))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: `leads-quiz-aliviando-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- eventos ----------
function grupoRadio(id, aoEscolher) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button[role="radio"]');
    if (!b) return;
    $(id).querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    aoEscolher(b.dataset);
  });
}

$('form-senha').addEventListener('submit', async (e) => {
  e.preventDefault();
  guardarSenha($('senha').value);
  $('entrar').hidden = true;
  $('painel').hidden = false;
  await carregar();
});
grupoRadio('periodo', (d) => {
  filtro.periodo = d.v;
  carregar();
});
grupoRadio('chips', (d) => {
  filtro.lista = d.f;
  if (dados) desenharLeads();
});
$('origem').addEventListener('change', (e) => {
  filtro.origem = e.target.value;
  carregar();
});
$('busca').addEventListener('input', (e) => {
  filtro.busca = e.target.value;
  if (dados) desenharLeads();
});
$('atualizar').addEventListener('click', carregar);
$('csv').addEventListener('click', exportarCsv);

if (lerSenha()) {
  $('entrar').hidden = true;
  $('painel').hidden = false;
  carregar();
} else {
  mostrarEntrada();
}
