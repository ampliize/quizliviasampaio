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
const trilha = document.getElementById('progresso');
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
// Cada tela pertence a um "trecho" (a parte do quiz). O trecho decide a cor de fundo
// e o segmento da barra de progresso. O roteiro depende do momento de vida (bloco E some para solteiras).
function roteiro() {
  const telas = [{ tipo: 'capa', trecho: null, campo: 'escuro' }];
  telas.push({ tipo: 'qualificadora', chave: 'momento', trecho: 'inicio', campo: 'neutro' });
  blocosAplicaveis(estado.qualificadoras.momento).forEach((bloco) => {
    telas.push({ tipo: 'introBloco', bloco, trecho: bloco.id, campo: bloco.id });
    bloco.perguntas.forEach((texto, i) => telas.push({ tipo: 'escala', bloco, i, texto, trecho: bloco.id, campo: bloco.id }));
  });
  ['desejo', 'formato', 'tempo', 'frase'].forEach((chave) => telas.push({ tipo: 'qualificadora', chave, trecho: 'fim', campo: 'neutro' }));
  telas.push({ tipo: 'introTriagem', trecho: 'fim', campo: 'papel' });
  Object.keys(TRIAGEM).forEach((chave) => telas.push({ tipo: 'triagem', chave, trecho: 'fim', campo: 'papel' }));
  telas.push({ tipo: 'lead', trecho: 'fim', campo: 'neutro' });
  telas.push({ tipo: 'resultado', trecho: null, campo: 'escuro' });
  return telas;
}

const ehPergunta = (t) => ['escala', 'qualificadora', 'triagem'].includes(t.tipo);

function ir(passo) {
  estado.passo = Math.max(0, passo);
  salvar();
  render();
  window.scrollTo({ top: 0 });
}

btnVoltar.addEventListener('click', () => {
  if (roteiro()[estado.passo]?.tipo === 'resultado') return;
  ir(estado.passo - 1);
});

function atualizarTopo(telas, tela) {
  topo.hidden = !tela.trecho;
  if (!tela.trecho) return;
  btnVoltar.disabled = estado.passo <= 1;

  const perguntas = telas.filter(ehPergunta);
  const atual = perguntas.indexOf(tela);
  contador.textContent = atual >= 0 ? `${atual + 1} de ${perguntas.length}` : '';

  // um segmento por trecho, com largura proporcional ao número de perguntas
  const trechos = [...new Set(telas.filter((t) => t.trecho).map((t) => t.trecho))];
  trilha.innerHTML = '';
  let feitasTotal = 0;
  trechos.forEach((id) => {
    const doTrecho = perguntas.filter((t) => t.trecho === id);
    const feitas = doTrecho.filter((t) => telas.indexOf(t) < estado.passo).length;
    feitasTotal += feitas;
    const seg = h('span', { style: `--peso:${doTrecho.length || 1};--feito:${(feitas / (doTrecho.length || 1)) * 100}%` }, h('i'));
    trilha.appendChild(seg);
  });
  trilha.setAttribute('aria-valuenow', String(Math.round((feitasTotal / perguntas.length) * 100)));
}

function render() {
  const telas = roteiro();
  if (estado.passo >= telas.length) estado.passo = telas.length - 1;
  const tela = telas[estado.passo];
  document.body.dataset.campo = tela.campo;
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
  filhos.flat().forEach((f) => f != null && f !== false && el.append(f.nodeType ? f : document.createTextNode(f)));
  return el;
}
function borboleta() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'borboleta');
  svg.setAttribute('viewBox', '0 0 100 70');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', '#borboleta');
  svg.appendChild(use);
  return svg;
}
const primeiroNome = () => (estado.lead.nome || '').trim().split(/\s+/)[0];

// Seleção com "glider" (adaptado do Animated Radio, 21st.dev): uma pílula desliza por trás das
// opções até a escolhida, com uma curva que passa um pouco do ponto e volta.
function listaOpcoes(opcoes, selecionado, aoEscolher) {
  const glider = h('span', { class: 'glider', 'aria-hidden': 'true' });
  const grupo = h('div', { class: 'opcoes', role: 'group' }, glider);
  const moverPara = (botao, animar) => {
    glider.classList.toggle('sem-animacao', !animar);
    glider.style.setProperty('--y', `${botao.offsetTop}px`);
    glider.style.setProperty('--h', `${botao.offsetHeight}px`);
    glider.classList.add('on');
  };
  let travado = false;
  opcoes.forEach(({ valor, rotulo, antes }) => {
    const botao = h(
      'button',
      {
        class: 'opcao',
        type: 'button',
        'aria-pressed': String(selecionado === valor),
        onclick: () => {
          if (travado) return;
          travado = true;
          grupo.querySelectorAll('.opcao').forEach((b) => b.setAttribute('aria-pressed', 'false'));
          botao.setAttribute('aria-pressed', 'true');
          // sem escolha anterior, a pílula nasce no lugar; com escolha, ela desliza
          moverPara(botao, glider.classList.contains('on'));
          setTimeout(() => aoEscolher(valor), 420);
        },
      },
      antes,
      h('span', {}, rotulo),
    );
    grupo.appendChild(botao);
  });
  // volta de "Voltar": posiciona na resposta já dada assim que a tela estiver no DOM
  requestAnimationFrame(() => {
    const marcado = grupo.querySelector('.opcao[aria-pressed="true"]');
    if (marcado) moverPara(marcado, false);
  });
  return grupo;
}
const deObjeto = (obj) => Object.entries(obj).map(([valor, rotulo]) => ({ valor, rotulo }));
const continuar = (rotulo = 'Continuar') =>
  h('div', { class: 'acoes' }, h('button', { class: 'btn', type: 'button', onclick: () => ir(estado.passo + 1) }, rotulo));

// ---------- telas ----------
function capa() {
  const iniciar = () => {
    rastrear('quiz_inicio', estado.rastreio);
    ir(1);
  };
  const nome = primeiroNome();
  return h(
    'section',
    { class: 'capa' },
    borboleta(),
    h('p', { class: 'nome-marca' }, 'A-Livia-ndo'),
    h('h1', {}, nome ? `${nome}, qual padrão hoje mais pesa na forma como você se escolhe?` : 'Qual padrão hoje mais pesa na forma como você se escolhe?'),
    h('p', { class: 'sub' }, 'Responda com calma e descubra por onde começar a cuidar de você agora.'),
    h(
      'ul',
      { class: 'como' },
      h('li', { style: '--cor:var(--A)' }, 'Cerca de 5 minutos, uma frase por vez'),
      h('li', { style: '--cor:var(--B)' }, 'Seu resultado aparece na hora'),
      h('li', { style: '--cor:var(--C)' }, 'Você leva o mapa completo em PDF, com um exercício'),
    ),
    h('div', { class: 'acoes' }, h('button', { class: 'btn btn-claro', type: 'button', onclick: iniciar }, 'Começar')),
    h(
      'p',
      { class: 'miudo' },
      'O resultado é educativo, um ponto de partida para se conhecer melhor. Não substitui psicóloga, psiquiatra, advogada ou outro profissional.',
    ),
    h('div', { class: 'assina' }, h('span', { class: 'foto', 'aria-hidden': 'true' }, 'L'), h('span', {}, h('strong', {}, 'Lívia Sampaio'), CONFIG.instagram)),
  );
}

function qualificadora({ chave }) {
  const q = QUALIFICADORAS[chave];
  const dica = chave === 'momento' ? 'Assim as próximas perguntas e o seu resultado ficam mais certeiros.' : null;
  return h(
    'section',
    { class: 'pergunta' },
    h('p', { class: 'area' }, chave === 'momento' ? 'Antes de começar' : 'Sobre o seu momento'),
    h('h2', {}, q.pergunta),
    dica && h('p', { class: 'dica' }, dica),
    listaOpcoes(deObjeto(q.opcoes), estado.qualificadoras[chave], (valor) => {
      estado.qualificadoras[chave] = valor;
      ir(estado.passo + 1);
    }),
  );
}

function introBloco({ bloco }) {
  const blocos = blocosAplicaveis(estado.qualificadoras.momento);
  const indice = blocos.indexOf(bloco) + 1;
  return h(
    'section',
    { class: 'abertura' },
    h('p', { class: 'parte' }, `Parte ${indice} de ${blocos.length}`),
    h('h2', {}, bloco.nome),
    h('p', { class: 'intro' }, bloco.intro),
    indice === 1 && h('p', { class: 'instrucao' }, 'Para cada frase, marque o que mais se parece com a sua vida hoje. Não existe resposta certa, só a honesta.'),
    continuar(),
  );
}

function escala({ bloco, i, texto }) {
  const dica =
    bloco.id === 'E' && estado.qualificadoras.momento === 'recuperando'
      ? 'Se a relação já terminou, pense em como ela era nos últimos meses.'
      : null;
  const pontos = (n) => h('span', { class: 'freq', 'aria-hidden': 'true' }, [0, 1, 2, 3].map((k) => h('b', { class: k < n ? 'on' : '' })));
  return h(
    'section',
    { class: 'pergunta' },
    h('p', { class: 'area' }, `${bloco.nome}, frase ${i + 1} de ${bloco.perguntas.length}`),
    h('h2', {}, texto),
    dica && h('p', { class: 'dica' }, dica),
    listaOpcoes(
      ESCALA.map((e) => ({ valor: e.valor, rotulo: e.rotulo, antes: pontos(e.valor) })),
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
    { class: 'abertura' },
    h('p', { class: 'parte' }, 'Antes do resultado'),
    h('h2', {}, 'Quatro perguntas para cuidar de você'),
    h(
      'p',
      { class: 'intro' },
      'Elas não entram no seu resultado e você pode escolher não responder. Se houver ameaça, violência ou risco agora, procure ajuda e priorize sua segurança.',
    ),
    continuar(),
  );
}

function triagem({ chave }) {
  const q = TRIAGEM[chave];
  return h(
    'section',
    { class: 'pergunta' },
    h('p', { class: 'area' }, 'Cuidado com você'),
    h('h2', {}, q.pergunta),
    listaOpcoes(deObjeto(q.opcoes), estado.triagem[chave], (valor) => {
      estado.triagem[chave] = valor;
      ir(estado.passo + 1);
    }),
  );
}

function lead() {
  const form = h(
    'form',
    {
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
    h('h2', {}, 'Pronto. Como você quer ser chamada no seu resultado?'),
    h('label', { class: 'campo-form' }, h('span', {}, 'Primeiro nome'), h('input', { name: 'nome', autocomplete: 'given-name', required: true, maxlength: '60', value: estado.lead.nome, autofocus: true })),
    h('label', { class: 'campo-form' }, h('span', {}, 'E-mail, se quiser receber conteúdos'), h('input', { name: 'email', type: 'email', autocomplete: 'email', inputmode: 'email', maxlength: '120', value: estado.lead.email })),
    h('label', { class: 'campo-form' }, h('span', {}, 'WhatsApp, se preferir'), h('input', { name: 'whatsapp', type: 'tel', autocomplete: 'tel', inputmode: 'tel', maxlength: '30', placeholder: '(00) 00000-0000', value: estado.lead.whatsapp })),
    h(
      'label',
      { class: 'check' },
      h('input', { type: 'checkbox', name: 'consentimento', checked: estado.lead.consentimento }),
      h('span', {}, 'Quero receber meu resultado e conteúdos da Lívia sobre autoestima e relacionamentos. Posso cancelar quando quiser.'),
    ),
    h('div', { class: 'acoes' }, h('button', { class: 'btn', type: 'submit' }, 'Ver meu resultado')),
    h('p', { class: 'miudo', style: 'margin-top:18px' }, 'Seus dados servem para personalizar o resultado e, se você autorizar, para receber conteúdos. As respostas de cuidado ficam só com você.'),
  );
  return h('section', { class: 'pergunta' }, form);
}

// ---------- resultado ----------
const MENSAGENS_ESPERA = [
  'Lendo suas respostas…',
  'Montando o seu mapa…',
  'Escolhendo um exercício para o seu momento…',
  'Preparando o seu PDF…',
];

function resultado() {
  const nome = primeiroNome();
  const el = h(
    'section',
    { class: 'carregando' },
    borboleta(),
    h('h2', {}, nome ? `${nome}, respira. Seu mapa está quase pronto.` : 'Respira. Seu mapa está quase pronto.'),
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
      document.body.dataset.campo = 'papel';
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

  // Revelação do mapa (adaptado do Animated Chart, 21st.dev): as barras saem do zero com mola,
  // uma após a outra, quando o mapa entra na tela; o número aparece na metade do movimento.
  const mapa = h(
    'div',
    { class: 'mapa' },
    dados.placar.map((b, i) =>
      h(
        'div',
        {
          class: `linha${b.id === dados.perfil || b.id === dados.complementar ? ' foco' : ''}`,
          style: `--cor:var(--${b.id});--alvo:${Math.max(b.forca, 4)}%;--atraso:${i * 0.12}s`,
        },
        h('div', { class: 'rot' }, h('span', {}, b.nome), h('em', {}, `${b.forca}%`)),
        h('div', { class: 'barra' }, h('i')),
      ),
    ),
  );
  const revelar = () => mapa.classList.add('visivel');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && (revelar(), io.disconnect())),
      { threshold: 0.5 },
    );
    io.observe(mapa);
  } else revelar();

  const baixar = async (e) => {
    const botao = e.currentTarget;
    botao.disabled = true;
    botao.textContent = 'Gerando seu PDF…';
    try {
      await gerarPdf({ dados, nome: estado.lead.nome, link });
      rastrear('quiz_pdf_baixado', { perfil: dados.perfil });
      botao.textContent = 'PDF baixado';
    } catch {
      botao.textContent = 'Não deu para gerar o PDF. Tocar para tentar de novo';
    } finally {
      botao.disabled = false;
    }
  };

  const cuidado =
    dados.cuidado &&
    h(
      'section',
      { class: 'cuidado' },
      h('h3', {}, 'Antes de tudo: sua segurança'),
      h('p', {}, 'Algumas respostas mostram que você pode estar vivendo algo difícil. Se estiver em perigo agora, ligue 190 ou procure alguém de confiança.'),
      h('p', {}, `O ${CONFIG.contatoCuidado} acolhe e orienta mulheres em situação de violência. É gratuito, sigiloso e funciona 24 horas.`),
      h('a', { class: 'btn', href: 'tel:180' }, `Ligar para o ${CONFIG.contatoCuidado}`),
    );

  const convite =
    !dados.cuidado &&
    h(
      'section',
      { class: 'convite' },
      h('h3', {}, `Sua trilha de ${perfil.trilha.toLowerCase()} continua no A-Livia-ndo`),
      h('p', {}, d.convite),
      h(
        'a',
        { class: 'btn btn-claro', href: link, onclick: () => rastrear('quiz_clique_comunidade', { perfil: dados.perfil }) },
        'Conhecer o A-Livia-ndo',
      ),
    );

  return h(
    'article',
    { class: 'resultado', style: `--cor-perfil:var(--${dados.perfil})` },
    h(
      'header',
      { class: 'resultado-topo' },
      h('p', { class: 'saudacao' }, d.saudacao),
      h('h1', {}, perfil.nome),
      h('p', { class: 'frase' }, perfil.frase),
      comp && h('p', { class: 'comp' }, `Seu momento também conversa com a trilha de ${comp.trilha.toLowerCase()}.`),
    ),
    cuidado,
    h('p', { class: 'acolhe' }, d.acolhimento),
    h('section', { class: 'bloco' }, h('h3', {}, 'O que esse padrão pode estar dizendo'), d.oQueSinaliza.map((t) => h('p', {}, t))),
    h(
      'section',
      { class: 'bloco' },
      h('h3', {}, 'Seu mapa de hoje'),
      mapa,
      h('p', { class: 'miudo', style: 'margin-top:12px' }, 'Quanto mais cheia a barra, mais fortalecida está a área. As contornadas são o seu ponto de partida.'),
    ),
    h('section', { class: 'bloco' }, h('h3', {}, 'O que já é força em você'), h('ul', { class: 'forcas' }, d.forcas.map((f) => h('li', {}, f)))),
    h(
      'section',
      { class: 'exercicio' },
      h('p', { class: 'tempo' }, 'Para fazer agora, em 3 minutos'),
      h('h3', {}, d.exercicio.titulo),
      h('ol', {}, d.exercicio.passos.map((p) => h('li', {}, p))),
    ),
    h('section', { class: 'bloco' }, h('h3', {}, 'Nos próximos 7 dias'), h('p', {}, d.proximoPasso)),
    h('div', { class: 'acoes' }, h('button', { class: 'btn btn-contorno', type: 'button', onclick: baixar }, 'Baixar meu mapa em PDF')),
    convite,
    h('p', { class: 'fecho' }, d.fraseFinal),
    h(
      'p',
      { class: 'miudo' },
      'Este resultado é educativo e não é um diagnóstico. Não substitui acompanhamento psicológico, médico ou jurídico. Em situação de risco, ligue 180 ou 190.',
    ),
  );
}

render();
