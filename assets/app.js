import {
  ESCALA,
  BLOCOS,
  QUALIFICADORAS,
  TRIAGEM,
  PERFIS,
  blocosAplicaveis,
  calcularResultado,
  precisaCuidado,
} from './quiz-data.js';
import { devolutivaPadrao } from './fallback.js';
import { CONFIG } from './config.js';
import { gerarPdf } from './pdf.js';

const app = document.getElementById('app');
const topo = document.getElementById('topo');
const btnVoltar = document.getElementById('voltar');
const barra = document.getElementById('progresso-barra');
const progresso = document.getElementById('progresso');
const contador = document.getElementById('contador');

const CHAVE_SALVO = 'aliviando_quiz_v1';
const PARAMS_RASTREIO = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'mc_id', 'origem'];

// ---------- estado ----------
const estado = carregar() || {
  passo: 0,
  respostas: Object.fromEntries(BLOCOS.map((b) => [b.id, Array(b.perguntas.length).fill(null)])),
  qualificadoras: {},
  triagem: {},
  lead: { nome: '', email: '', whatsapp: '', consentimento: false },
  rastreio: {},
};
capturarRastreio();

function carregar() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_SALVO));
  } catch {
    return null;
  }
}
function salvar() {
  try {
    sessionStorage.setItem(CHAVE_SALVO, JSON.stringify(estado));
  } catch {
    /* navegação privada: segue sem salvar */
  }
}
function capturarRastreio() {
  const url = new URLSearchParams(location.search);
  PARAMS_RASTREIO.forEach((p) => {
    if (url.get(p)) estado.rastreio[p] = url.get(p).slice(0, 120);
  });
  // ManyChat pode mandar o primeiro nome no link: ?nome={{first_name}}
  if (url.get('nome') && !estado.lead.nome) estado.lead.nome = url.get('nome').slice(0, 60);
}

function rastrear(evento, dados = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: evento, ...dados });
  if (typeof window.fbq === 'function') window.fbq('trackCustom', evento, dados);
}

// ---------- roteiro de telas ----------
// O roteiro é recalculado a cada passo porque depende do momento de vida (bloco E some para solteiras).
function roteiro() {
  const telas = [{ tipo: 'capa' }];
  telas.push({ tipo: 'qualificadora', chave: 'momento' });
  blocosAplicaveis(estado.qualificadoras.momento).forEach((bloco) => {
    telas.push({ tipo: 'introBloco', bloco });
    bloco.perguntas.forEach((texto, i) => telas.push({ tipo: 'escala', bloco, i, texto }));
  });
  ['desejo', 'formato', 'tempo', 'frase'].forEach((chave) => telas.push({ tipo: 'qualificadora', chave }));
  telas.push({ tipo: 'introTriagem' });
  Object.keys(TRIAGEM).forEach((chave) => telas.push({ tipo: 'triagem', chave }));
  telas.push({ tipo: 'lead' });
  telas.push({ tipo: 'resultado' });
  return telas;
}

function perguntasRespondiveis(telas) {
  return telas.filter((t) => ['escala', 'qualificadora', 'triagem'].includes(t.tipo));
}

function ir(passo) {
  estado.passo = Math.max(0, passo);
  salvar();
  render();
  window.scrollTo({ top: 0 });
}

btnVoltar.addEventListener('click', () => {
  const telas = roteiro();
  if (telas[estado.passo]?.tipo === 'resultado') return;
  ir(estado.passo - 1);
});

function atualizarTopo(telas, tela) {
  const semTopo = tela.tipo === 'capa' || tela.tipo === 'resultado';
  topo.hidden = semTopo;
  if (semTopo) return;
  const perguntas = perguntasRespondiveis(telas);
  const atual = perguntas.indexOf(tela);
  const feitas = perguntas.filter((t) => telas.indexOf(t) < estado.passo).length;
  const pct = Math.round((feitas / perguntas.length) * 100);
  barra.style.width = `${pct}%`;
  progresso.setAttribute('aria-valuenow', String(pct));
  contador.textContent = atual >= 0 ? `${atual + 1} de ${perguntas.length}` : '';
}

function render() {
  const telas = roteiro();
  if (estado.passo >= telas.length) estado.passo = telas.length - 1;
  const tela = telas[estado.passo];
  atualizarTopo(telas, tela);
  const renderizadores = { capa, qualificadora, introBloco, escala, introTriagem, triagem, lead, resultado };
  app.innerHTML = '';
  const el = renderizadores[tela.tipo](tela);
  el.classList.add('tela');
  app.appendChild(el);
  el.querySelector('[autofocus]')?.focus();
}

// ---------- helpers de DOM ----------
function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  });
  filhos.flat().forEach((f) => f != null && el.append(f.nodeType ? f : document.createTextNode(f)));
  return el;
}
const borboleta = (cls = 'marca') => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', `bfly ${cls}`);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', '#butterfly');
  svg.appendChild(use);
  return svg;
};

function listaOpcoes(opcoes, selecionado, aoEscolher) {
  return h(
    'div',
    { class: 'opcoes', role: 'group' },
    opcoes.map(([valor, rotulo]) =>
      h(
        'button',
        {
          class: 'opcao',
          type: 'button',
          'aria-pressed': String(selecionado === valor),
          onclick: (e) => {
            e.currentTarget.parentElement.querySelectorAll('.opcao').forEach((b) => b.setAttribute('aria-pressed', 'false'));
            e.currentTarget.setAttribute('aria-pressed', 'true');
            // pequena pausa para a pessoa ver a marcação antes de avançar
            setTimeout(() => aoEscolher(valor), 180);
          },
        },
        h('span', { class: 'bolinha' }),
        rotulo,
      ),
    ),
  );
}

// ---------- telas ----------
function capa() {
  const iniciar = () => {
    rastrear('quiz_inicio', estado.rastreio);
    ir(1);
  };
  return h(
    'section',
    { class: 'capa' },
    borboleta(),
    h('p', { class: 'eyebrow' }, 'Análise gratuita de perfil'),
    h('h1', {}, 'Qual padrão hoje mais interfere na forma como ', h('em', {}, 'você se escolhe'), '?'),
    h('p', { class: 'sub' }, 'Um mapa de autoconhecimento para descobrir qual área da sua vida merece mais atenção neste momento.'),
    h(
      'ul',
      { class: 'beneficios' },
      h('li', {}, 'Leva cerca de 5 minutos'),
      h('li', {}, 'Resultado personalizado na hora'),
      h('li', {}, 'Seu mapa completo em PDF, com um exercício prático'),
    ),
    h('div', { class: 'acoes' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: iniciar, autofocus: true }, 'Começar minha análise')),
    h(
      'p',
      { class: 'aviso' },
      'Responda pensando na sua realidade atual, não no que você gostaria de responder. O resultado é educativo e serve como ponto de partida para o autoconhecimento. Ele não substitui avaliação de psicóloga, psiquiatra, advogada ou outro profissional.',
    ),
    h('p', { class: 'assinatura' }, 'Lívia Sampaio'),
  );
}

function qualificadora({ chave }) {
  const q = QUALIFICADORAS[chave];
  const dica = chave === 'momento' ? 'Isso ajuda a deixar as próximas perguntas e o seu resultado mais certeiros.' : null;
  return h(
    'section',
    { class: 'pergunta' },
    h('span', { class: 'eyebrow bloco' }, 'Seu momento'),
    h('h2', {}, q.pergunta),
    dica && h('p', { class: 'dica' }, dica),
    listaOpcoes(Object.entries(q.opcoes), estado.qualificadoras[chave], (valor) => {
      estado.qualificadoras[chave] = valor;
      ir(estado.passo + 1);
    }),
  );
}

function introBloco({ bloco }) {
  const indice = blocosAplicaveis(estado.qualificadoras.momento).indexOf(bloco) + 1;
  return h(
    'section',
    { class: 'intro-bloco' },
    borboleta(),
    h('p', { class: 'eyebrow' }, `Parte ${indice}`),
    h('h2', {}, bloco.nome),
    h('p', {}, bloco.intro),
    indice === 1 && h('p', {}, 'Para cada frase, escolha o que mais se aproxima do que acontece hoje. Não existe resposta certa — existe a resposta honesta.'),
    h('div', { class: 'acoes' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => ir(estado.passo + 1), autofocus: true }, 'Continuar')),
  );
}

function escala({ bloco, i, texto }) {
  const dica =
    bloco.id === 'E' && estado.qualificadoras.momento === 'recuperando'
      ? 'Se a relação já terminou, pense em como ela era nos últimos meses.'
      : null;
  return h(
    'section',
    { class: 'pergunta' },
    h('span', { class: 'eyebrow bloco' }, bloco.nome),
    h('h2', {}, texto),
    dica && h('p', { class: 'dica' }, dica),
    listaOpcoes(
      ESCALA.map((e) => [e.valor, e.rotulo]),
      estado.respostas[bloco.id][i],
      (valor) => {
        estado.respostas[bloco.id][i] = valor;
        ir(estado.passo + 1);
      },
    ),
  );
}

function introTriagem() {
  return h(
    'section',
    { class: 'intro-bloco' },
    borboleta(),
    h('p', { class: 'eyebrow' }, 'Cuidado com você'),
    h('h2', {}, 'Quatro perguntas rápidas'),
    h(
      'p',
      {},
      'As próximas perguntas existem para cuidar melhor de você e não entram no seu resultado. Você pode escolher não responder. Se houver ameaça, violência ou risco imediato, procure ajuda e priorize sua segurança.',
    ),
    h('div', { class: 'acoes' }, h('button', { class: 'btn btn-primario', type: 'button', onclick: () => ir(estado.passo + 1), autofocus: true }, 'Continuar')),
  );
}

function triagem({ chave }) {
  const q = TRIAGEM[chave];
  return h(
    'section',
    { class: 'pergunta' },
    h('span', { class: 'eyebrow bloco' }, 'Cuidado com você'),
    h('h2', {}, q.pergunta),
    listaOpcoes(Object.entries(q.opcoes), estado.triagem[chave], (valor) => {
      estado.triagem[chave] = valor;
      ir(estado.passo + 1);
    }),
  );
}

function lead() {
  const form = h(
    'form',
    {
      class: 'cartao',
      novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        const dados = new FormData(form);
        estado.lead = {
          nome: String(dados.get('nome') || '').trim(),
          email: String(dados.get('email') || '').trim(),
          whatsapp: String(dados.get('whatsapp') || '').trim(),
          consentimento: dados.get('consentimento') === 'on',
        };
        if (!estado.lead.nome) {
          form.querySelector('[name=nome]').focus();
          return;
        }
        ir(estado.passo + 1);
      },
    },
    h('p', { class: 'eyebrow' }, 'Quase lá'),
    h('h2', { style: 'font-size:24px;margin-top:8px' }, 'Seu mapa está pronto para ser gerado'),
    h('p', { class: 'dica', style: 'margin-top:10px;color:var(--ink-soft)' }, 'Como você quer ser chamada no seu resultado?'),
    h('label', { class: 'campo' }, h('span', {}, 'Seu primeiro nome'), h('input', { name: 'nome', autocomplete: 'given-name', required: true, maxlength: '60', value: estado.lead.nome, autofocus: true })),
    h('label', { class: 'campo' }, h('span', {}, 'E-mail (opcional)'), h('input', { name: 'email', type: 'email', autocomplete: 'email', inputmode: 'email', maxlength: '120', value: estado.lead.email })),
    h('label', { class: 'campo' }, h('span', {}, 'WhatsApp (opcional)'), h('input', { name: 'whatsapp', type: 'tel', autocomplete: 'tel', inputmode: 'tel', maxlength: '30', placeholder: '(00) 00000-0000', value: estado.lead.whatsapp })),
    h(
      'label',
      { class: 'check' },
      h('input', { type: 'checkbox', name: 'consentimento', checked: estado.lead.consentimento }),
      h('span', {}, 'Quero receber meu resultado e conteúdos da Lívia sobre autoestima e relacionamentos. Posso cancelar quando quiser.'),
    ),
    h('div', { class: 'acoes' }, h('button', { class: 'btn btn-primario', type: 'submit' }, 'Ver meu resultado')),
    h(
      'p',
      { class: 'aviso' },
      'Usamos seus dados apenas para personalizar o resultado e, se você autorizar, para enviar conteúdos da Lívia. As respostas de cuidado não são compartilhadas.',
    ),
  );
  return h('section', { class: 'pergunta' }, form);
}

// ---------- resultado ----------
const MENSAGENS_ESPERA = [
  'Lendo suas respostas com carinho…',
  'Montando o seu mapa de padrões…',
  'Escolhendo um exercício para o seu momento…',
  'Preparando o seu PDF…',
];

function resultado() {
  const el = h(
    'section',
    { class: 'carregando' },
    borboleta(),
    h('h2', {}, `${estado.lead.nome ? estado.lead.nome + ', s' : 'S'}eu resultado está quase pronto`),
    h('p', { id: 'espera' }, MENSAGENS_ESPERA[0]),
  );
  let i = 0;
  const giro = setInterval(() => {
    i = (i + 1) % MENSAGENS_ESPERA.length;
    const p = document.getElementById('espera');
    if (p) p.textContent = MENSAGENS_ESPERA[i];
  }, 2200);

  buscarResultado()
    .then((dados) => {
      clearInterval(giro);
      rastrear('quiz_concluido', { perfil: dados.perfil, complementar: dados.complementar, cuidado: dados.cuidado });
      app.innerHTML = '';
      const tela = telaResultado(dados);
      tela.classList.add('tela');
      app.appendChild(tela);
    })
    .catch(() => clearInterval(giro));
  return el;
}

async function buscarResultado() {
  if (estado.resultado) return estado.resultado;
  const corpo = {
    respostas: estado.respostas,
    qualificadoras: estado.qualificadoras,
    triagem: estado.triagem,
    lead: estado.lead,
    rastreio: estado.rastreio,
  };
  let dados;
  try {
    const resp = await fetch('/api/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    dados = await resp.json();
  } catch {
    // Sem servidor (ou fora do ar): calcula aqui mesmo e usa a devolutiva pronta.
    const calc = calcularResultado(estado.respostas, estado.qualificadoras.momento);
    dados = { ...calc, cuidado: precisaCuidado(estado.triagem), devolutiva: devolutivaPadrao({ ...calc, nome: estado.lead.nome }) };
  }
  estado.resultado = dados;
  salvar();
  return dados;
}

export function linkComunidade(dados) {
  const url = new URL(CONFIG.comunidadeUrl);
  const params = { ...CONFIG.utmPadrao, ...estado.rastreio, utm_content: `perfil_${dados.perfil}` };
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  return url.toString();
}

function telaResultado(dados) {
  const perfil = PERFIS[dados.perfil];
  const comp = dados.complementar ? PERFIS[dados.complementar] : null;
  const d = dados.devolutiva;
  const link = linkComunidade(dados);

  const mapa = h(
    'div',
    { class: 'mapa' },
    dados.placar.map((b) =>
      h(
        'div',
        { class: `linha${b.id === dados.perfil || b.id === dados.complementar ? ' destaque' : ''}` },
        h('div', { class: 'rotulo' }, h('strong', {}, b.nome), h('span', {}, `${b.forca}%`)),
        h('div', { class: 'trilho' }, h('span', { style: `width:${Math.max(b.forca, 3)}%` })),
      ),
    ),
  );

  const baixar = async (e) => {
    const botao = e.currentTarget;
    botao.disabled = true;
    botao.textContent = 'Gerando seu PDF…';
    try {
      await gerarPdf({ dados, nome: estado.lead.nome, link });
      rastrear('quiz_pdf_baixado', { perfil: dados.perfil });
    } finally {
      botao.disabled = false;
      botao.textContent = 'Baixar meu resultado em PDF';
    }
  };

  const cuidado = dados.cuidado
    ? h(
        'section',
        { class: 'cartao cuidado' },
        h('h3', {}, 'Antes de tudo: você importa'),
        h(
          'p',
          {},
          'Algumas das suas respostas mostram que você pode estar vivendo uma situação difícil. Sua segurança vem primeiro. Se você estiver em perigo, procure um serviço de emergência (190) ou uma rede de apoio de confiança.',
        ),
        h(
          'p',
          {},
          `No Brasil, o ${CONFIG.contatoCuidado} acolhe e orienta mulheres em situação de violência — é gratuito, sigiloso e funciona 24 horas.`,
        ),
        h('div', { class: 'acoes' }, h('a', { class: 'btn btn-primario', href: 'tel:180' }, `Ligar para o ${CONFIG.contatoCuidado}`)),
      )
    : null;

  const convite = dados.cuidado
    ? null
    : h(
        'section',
        { class: 'destaque-escuro' },
        h('p', { class: 'eyebrow', style: 'color:#e8c48a' }, `Sua trilha: ${perfil.trilha}`),
        h('h3', { style: 'margin-top:8px' }, 'Continue essa jornada no A-Livia-ndo'),
        h('p', {}, d.convite),
        h(
          'a',
          { class: 'btn', href: link, onclick: () => rastrear('quiz_clique_comunidade', { perfil: dados.perfil }) },
          'Conhecer minha trilha no A-Livia-ndo',
        ),
      );

  return h(
    'article',
    { class: 'resultado' },
    h(
      'div',
      { class: 'topo-resultado' },
      borboleta(),
      h('p', { class: 'saudacao' }, d.saudacao),
      h('p', { class: 'eyebrow', style: 'margin-top:14px' }, 'Seu perfil educativo de hoje'),
      h('h1', {}, perfil.nome),
      h('p', { class: 'frase-perfil' }, `“${perfil.frase}”`),
      comp && h('span', { class: 'comp' }, `Trilha complementar: ${comp.trilha}`),
    ),
    cuidado,
    h('section', { class: 'cartao' }, h('p', {}, d.acolhimento)),
    h('section', {}, h('h3', {}, 'O que esse padrão pode estar sinalizando'), d.oQueSinaliza.map((t) => h('p', {}, t))),
    h(
      'section',
      { class: 'cartao' },
      h('h3', {}, 'Seu mapa de hoje'),
      mapa,
      h('p', { class: 'mapa-legenda' }, 'Quanto maior a barra, mais fortalecida está a área. As destacadas são o seu ponto de partida.'),
    ),
    h('section', {}, h('h3', {}, 'Forças que suas respostas mostram'), h('ul', { class: 'forcas' }, d.forcas.map((f) => h('li', {}, f)))),
    h(
      'section',
      { class: 'cartao' },
      h('p', { class: 'eyebrow' }, 'Exercício de 3 minutos'),
      h('h3', { style: 'margin-top:6px' }, d.exercicio.titulo),
      h('ol', { class: 'passos' }, d.exercicio.passos.map((p) => h('li', {}, p))),
    ),
    h('section', {}, h('h3', {}, 'Seu próximo passo (gratuito)'), h('p', {}, d.proximoPasso)),
    h('div', { class: 'acoes' }, h('button', { class: 'btn btn-secundario', type: 'button', onclick: baixar }, 'Baixar meu resultado em PDF')),
    convite,
    h('section', {}, h('p', { class: 'frase-final' }, d.fraseFinal)),
    h(
      'p',
      { class: 'aviso', style: 'text-align:center' },
      'Este resultado é educativo e não é um diagnóstico. Ele não substitui acompanhamento psicológico, médico ou jurídico. Em situações de risco, ligue 180 ou 190.',
    ),
  );
}

render();
