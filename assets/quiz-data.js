// Conteúdo e lógica de pontuação do quiz A-Livia-ndo.
// Compartilhado entre o navegador (assets/app.js) e o servidor (api/resultado.js),
// para que o perfil seja sempre calculado com a mesma regra dos dois lados.

// Versão de captação: 3 opções, pedido da Lívia (5 níveis confundiam as respostas).
export const ESCALA = [
  { valor: 0, rotulo: 'Nunca' },
  { valor: 1, rotulo: 'Às vezes' },
  { valor: 2, rotulo: 'Sempre' },
];
const MAX_ESCALA = 2;

// As 6 áreas da vida que o quiz avalia (pedido da Lívia: o quiz aponta qual área precisa de mais atenção).
// Uma frase por área, sempre positiva: "Sempre" quer dizer que a área está bem, então ninguém cai
// numa área por responder de forma confiante. Os ids A–F são os mesmos usados nas cores e no funil do CRM.
export const BLOCOS = [
  { id: 'A', nome: 'Autoestima', rotuloForca: 'Autoestima', pergunta: 'Eu me olho no espelho e gosto da mulher que vejo.' },
  { id: 'B', nome: 'Relacionamento', rotuloForca: 'Relacionamento', pergunta: 'Me sinto em paz com a minha vida amorosa, do jeito que ela está hoje.' },
  { id: 'C', nome: 'Família', rotuloForca: 'Família', pergunta: 'Tenho tempo de qualidade e harmonia com a minha família.' },
  { id: 'D', nome: 'Carreira e dinheiro', rotuloForca: 'Carreira e dinheiro', pergunta: 'Me sinto realizada e segura com meu trabalho e meu dinheiro.' },
  { id: 'E', nome: 'Corpo e saúde', rotuloForca: 'Corpo e saúde', pergunta: 'Cuido do meu corpo e da minha saúde com carinho e constância.' },
  { id: 'F', nome: 'Saúde mental', rotuloForca: 'Saúde mental', pergunta: 'Consigo lidar com a ansiedade e as preocupações sem me perder de mim.' },
];

// Perguntas qualificadoras: não entram na pontuação (a área a melhorar só desempata).
// Servem para conhecer o público (CRM) e personalizar a devolutiva.
export const QUALIFICADORAS = {
  momento: {
    rotulo: 'Antes de começar',
    pergunta: 'Em qual momento você está hoje?',
    dica: 'Assim as próximas perguntas e o seu resultado ficam mais certeiros.',
    opcoes: {
      solteira: 'Estou solteira e quero me preparar para escolher melhor.',
      conhecendo: 'Estou conhecendo alguém e quero enxergar a situação com mais clareza.',
      feliz: 'Estou feliz no meu relacionamento, mas melhorar sempre é bom.',
      conflitos: 'Estou em um relacionamento com conflitos recorrentes.',
      recuperando: 'Estou encerrando ou me recuperando de uma relação.',
      nao_informado: 'Prefiro não responder.',
    },
  },
  filhos: {
    rotulo: 'Sobre você',
    pergunta: 'Você tem filhos?',
    opcoes: {
      nao: 'Não tenho filhos.',
      pequenos: 'Sim, pequenos (até 12 anos).',
      maiores: 'Sim, adolescentes ou adultos.',
      ambos: 'Sim, pequenos e maiores.',
      nao_informado: 'Prefiro não responder.',
    },
  },
  sentimento: {
    rotulo: 'Sobre você',
    pergunta: 'Como você se sente com a sua vida hoje?',
    opcoes: {
      muito_feliz: 'Muito feliz, e quero continuar crescendo.',
      feliz: 'Feliz, mas sinto que posso mais.',
      neutra: 'Nem feliz nem infeliz, meio no automático.',
      insatisfeita: 'Insatisfeita com várias coisas.',
      dificil: 'Passando por um momento difícil.',
    },
  },
  renda: {
    rotulo: 'Sobre você',
    pergunta: 'Qual é a sua renda mensal?',
    dica: 'Fica só entre nós: serve para a Lívia conhecer melhor quem acompanha o trabalho dela.',
    opcoes: {
      ate2: 'Até R$ 2.000',
      '2a5': 'De R$ 2.000 a R$ 5.000',
      '5a10': 'De R$ 5.000 a R$ 10.000',
      mais10: 'Acima de R$ 10.000',
      nao_informado: 'Prefiro não responder',
    },
  },
  area: {
    rotulo: 'Para fechar',
    pergunta: 'Qual área da sua vida mais precisa melhorar agora?',
    opcoes: {
      autoestima: 'Autoestima e amor-próprio.',
      relacionamento: 'Relacionamento amoroso.',
      familia: 'Família e filhos.',
      carreira: 'Carreira e dinheiro.',
      saude: 'Corpo e saúde.',
      emocional: 'Saúde mental (ansiedade, cansaço, preocupações).',
    },
  },
};

// Perguntas abertas (opcionais): vão só para a IA personalizar a devolutiva, não são gravadas no CRM.
export const PERGUNTAS_ABERTAS = {
  orgulho: {
    pergunta: 'Qual qualidade sua te dá orgulho?',
    dica: 'Pode ser uma palavra ou uma frase. É opcional.',
    exemplo: 'Ex.: sou leal, não desisto fácil, cuido bem de quem amo…',
  },
};
export const MAX_TEXTO_ABERTO = 400;

// Ordem do quiz de captação (12 perguntas): primeiro conhecer a mulher, depois uma frase por área
// da vida, e a área que ela sente que mais precisa melhorar por último. `etapa` alimenta o funil
// do CRM (segue a ordem de supabase/schema.sql: momento, A, B, C, D, E, F, qualificadoras).
export const ROTEIRO = [
  { tipo: 'qualificadora', chave: 'momento', etapa: 'momento' },
  { tipo: 'qualificadora', chave: 'filhos', etapa: 'momento' },
  { tipo: 'qualificadora', chave: 'sentimento', etapa: 'momento' },
  { tipo: 'escala', bloco: 'A', etapa: 'A' },
  { tipo: 'aberta', chave: 'orgulho', etapa: 'A' },
  { tipo: 'escala', bloco: 'B', etapa: 'B' },
  { tipo: 'escala', bloco: 'C', etapa: 'C' },
  { tipo: 'escala', bloco: 'D', etapa: 'D' },
  { tipo: 'escala', bloco: 'E', etapa: 'E' },
  { tipo: 'escala', bloco: 'F', etapa: 'F' },
  { tipo: 'qualificadora', chave: 'renda', etapa: 'qualificadoras' },
  { tipo: 'qualificadora', chave: 'area', etapa: 'qualificadoras' },
];
const BLOCOS_DO_QUIZ = ROTEIRO.filter((t) => t.tipo === 'escala').map((t) => t.bloco);

// Um resultado por área, cada um com a sua frase (pedido da Lívia: nada de frase igual para todas).
export const PERFIS = {
  A: {
    nome: 'A mulher que está voltando a se escolher',
    frase: 'Antes de qualquer pessoa, você merece a sua própria escolha.',
    trilha: 'Autoestima',
  },
  B: {
    nome: 'A mulher que quer amar sem se perder',
    frase: 'O amor que você procura começa na forma como você se trata.',
    trilha: 'Relacionamento',
  },
  C: {
    nome: 'A mulher que cuida de todos e quer cuidar de si',
    frase: 'Cuidar de quem você ama também inclui cuidar de você.',
    trilha: 'Família',
  },
  D: {
    nome: 'A mulher que quer crescer e prosperar',
    frase: 'Você não precisa pedir licença para crescer.',
    trilha: 'Carreira',
  },
  E: {
    nome: 'A mulher que quer voltar a cuidar do próprio corpo',
    frase: 'Seu corpo é a sua casa, e ele merece atenção e carinho.',
    trilha: 'Corpo e saúde',
  },
  F: {
    nome: 'A mulher que busca paz por dentro',
    frase: 'Paz não é a ausência de problemas, é voltar para você.',
    trilha: 'Saúde mental',
  },
};

// Ordem usada para desempate exato.
const PRIORIDADE = ['A', 'F', 'B', 'E', 'C', 'D'];
// A área que ela diz que mais precisa melhorar pesa a favor, e desempata entre áreas parecidas.
const AREA_PARA_BLOCO = { autoestima: 'A', relacionamento: 'B', familia: 'C', carreira: 'D', saude: 'E', emocional: 'F' };
const PESO_AREA = 25;

/** Áreas pontuadas no quiz, na ordem do roteiro. */
export function blocosDoQuiz() {
  return BLOCOS.filter((b) => BLOCOS_DO_QUIZ.includes(b.id));
}

/** O próximo passo sempre vira lista (a Lívia pediu: se fala em "7 coisas", tem que listar as 7). */
export function proximoPassoEmLista(p) {
  if (p && Array.isArray(p.passos) && p.passos.length) return { titulo: p.titulo || 'Nos próximos 7 dias', passos: p.passos };
  return { titulo: 'Nos próximos 7 dias', passos: [String(p || '')].filter(Boolean) };
}

/** Como a área aparece no mapa do resultado (com 3 níveis, palavras dizem mais que porcentagem). */
export function nivelDaForca(forca) {
  if (forca >= 100) return 'Fortalecida';
  if (forca >= 50) return 'Em construção';
  return 'Pede atenção';
}

/**
 * respostas: { A: [0..2], B: [...], ... } — uma resposta por área na versão de captação.
 * Retorna força (0–100, quanto maior melhor) por área, perfil principal e complementar.
 */
export function calcularResultado(respostas, area) {
  const blocos = blocosDoQuiz();
  const placar = blocos.map((b) => {
    const valores = respostas[b.id];
    if (!Array.isArray(valores) || valores.length !== 1) throw new Error(`Resposta faltando na área ${b.id}`);
    const v = Number(valores[0]);
    if (!Number.isInteger(v) || v < 0 || v > MAX_ESCALA) throw new Error(`Resposta inválida na área ${b.id}`);
    const forca = Math.round((v / MAX_ESCALA) * 100);
    const necessidade = 100 - forca + (AREA_PARA_BLOCO[area] === b.id ? PESO_AREA : 0);
    return { id: b.id, nome: b.rotuloForca, forca, nivel: nivelDaForca(forca), necessidade };
  });

  const ordenado = [...placar].sort(
    (x, y) => y.necessidade - x.necessidade || PRIORIDADE.indexOf(x.id) - PRIORIDADE.indexOf(y.id),
  );
  const [principal, segundo] = ordenado;
  const complementar = segundo && segundo.necessidade === principal.necessidade ? segundo.id : null;
  return { placar, perfil: principal.id, complementar };
}

// Palavras que, escritas na pergunta aberta, pedem que o resultado priorize segurança.
const SINAIS_DE_RISCO = /agred|agress|me bate|bateu|apanh|ameaç|violên|violenc|abus|estupr|me machuca|medo dele|me mat|suicid|me forç|me obrig/i;

/**
 * true quando o que ela escreveu sinaliza risco: a tela prioriza cuidado e não oferta.
 * (A pergunta explícita sobre violência saiu do quiz de captação a pedido da Lívia.)
 */
export function precisaCuidado(textos = {}) {
  return Object.values(textos || {}).some((t) => SINAIS_DE_RISCO.test(t || ''));
}
