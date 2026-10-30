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

// invertido: pontuação alta indica MAIS necessidade (bloco C — carência).
// `perguntas` guarda as 25 frases do documento-base (versão completa, para quem já está na comunidade);
// `curta` é a frase usada no quiz de captação, uma por área.
export const BLOCOS = [
  {
    id: 'A',
    curta: 1,
    nome: 'Escolha consciente',
    rotuloForca: 'Escolha consciente',
    intro: 'Vamos começar olhando para a forma como você escolhe.',
    invertido: false,
    perguntas: [
      'Quando conheço alguém, observo como essa pessoa trata outras pessoas, não apenas como me trata.',
      'Antes de me envolver, penso se gosto de quem eu me torno quando estou com essa pessoa.',
      'Consigo avaliar se nossos valores, objetivos e visão de futuro combinam.',
      'Percebo quando estou me relacionando com o potencial de alguém, e não com quem essa pessoa é hoje.',
      'Levo a sério sinais de desrespeito, mentira, controle, manipulação ou irresponsabilidade.',
    ],
  },
  {
    id: 'B',
    curta: 1,
    nome: 'Amor-próprio e identidade',
    rotuloForca: 'Amor-próprio e identidade',
    intro: 'Agora, sobre o espaço que você ocupa na sua própria vida.',
    invertido: false,
    perguntas: [
      'Continuo cuidando dos meus sonhos, interesses, amizades e trabalho quando estou em uma relação.',
      'Consigo reconhecer meu valor mesmo quando não estou recebendo atenção ou aprovação.',
      'Tenho clareza sobre o que eu ofereço e sobre o que procuro em uma relação.',
      'Prefiro ficar só por um período a aceitar uma relação que destrói minha paz.',
      'Consigo tomar decisões importantes sem abandonar quem eu sou para ser escolhida.',
    ],
  },
  {
    id: 'C',
    curta: 1,
    nome: 'Carência e validação',
    rotuloForca: 'Segurança emocional',
    intro: 'Algumas frases agora falam de carência e validação. Responda com carinho e honestidade.',
    invertido: true,
    perguntas: [
      'Confundo atenção, elogios ou mensagens esporádicas com prova de conexão profunda.',
      'Tenho medo de perder alguém mesmo quando a relação não me faz bem.',
      'Aceito menos do que gostaria porque temo não encontrar outra pessoa.',
      'Fico ansiosa quando alguém demora a responder ou muda o ritmo de contato.',
      'Já construí expectativas sobre uma pessoa com base em poucos sinais de afeto.',
    ],
  },
  {
    id: 'D',
    curta: 0,
    nome: 'Limites e comunicação',
    rotuloForca: 'Limites e comunicação',
    intro: 'Agora vamos falar de limites e da sua voz nas conversas.',
    invertido: false,
    perguntas: [
      'Sei dizer claramente o que aceito e o que não aceito em uma relação.',
      'Consigo fazer um pedido direto quando algo me machuca ou incomoda.',
      'Mantenho a consequência que comuniquei quando um limite é ultrapassado.',
      'Consigo conversar sobre assuntos difíceis sem me silenciar para evitar conflito.',
      'Depois de uma conversa, observo mudanças consistentes em atitudes, não apenas promessas.',
    ],
  },
  {
    id: 'E',
    curta: 4,
    nome: 'Disponibilidade e qualidade da relação',
    rotuloForca: 'Qualidade da relação',
    intro: 'Por último, sobre a relação que você vive (ou viveu mais recentemente).',
    invertido: false,
    perguntas: [
      'Sinto que existe reciprocidade entre o que ofereço e o que recebo.',
      'A pessoa com quem me relaciono consegue conversar sobre sentimentos, futuro e responsabilidades.',
      'Eu sei com clareza o que somos e quais são os acordos da relação.',
      'Posso discordar sem ser humilhada, ameaçada, punida com silêncio ou desrespeitada.',
      'A relação me traz mais segurança e parceria do que dúvida constante e ansiedade.',
    ],
  },
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
  prioridade: {
    rotulo: 'Sobre você',
    pergunta: 'Qual é a sua maior prioridade hoje?',
    opcoes: {
      eu: 'Cuidar de mim e da minha autoestima.',
      familia: 'Minha família e meus filhos.',
      relacionamento: 'Meu relacionamento amoroso.',
      carreira: 'Minha carreira e meu dinheiro.',
      saude: 'Minha saúde e meu corpo.',
      espiritualidade: 'Minha fé e meu autoconhecimento.',
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
      emocional: 'Equilíbrio emocional (ansiedade, carência).',
      limites: 'Limites e saber dizer não.',
      relacionamento: 'Relacionamento amoroso.',
      familia: 'Família e filhos.',
      carreira: 'Carreira e dinheiro.',
      saude: 'Saúde e autocuidado.',
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
  mudanca: {
    pergunta: 'Se a sua vida pudesse mudar em uma coisa nos próximos meses, o que seria?',
    dica: 'É opcional. O que você escrever serve só para personalizar o seu resultado.',
    exemplo: 'Escreva aqui, do seu jeito…',
  },
};
export const MAX_TEXTO_ABERTO = 400;

// Ordem do quiz de captação (12 perguntas), pedida pela Lívia: primeiro conhecer a mulher,
// depois autoestima, e a área a melhorar por último. `etapa` alimenta o funil do CRM
// (precisa seguir a ordem de supabase/schema.sql: momento, A, B, C, D, qualificadoras).
export const ROTEIRO = [
  { tipo: 'qualificadora', chave: 'momento', etapa: 'momento' },
  { tipo: 'qualificadora', chave: 'filhos', etapa: 'momento' },
  { tipo: 'qualificadora', chave: 'sentimento', etapa: 'momento' },
  { tipo: 'qualificadora', chave: 'prioridade', etapa: 'momento' },
  { tipo: 'escala', bloco: 'A', etapa: 'A' },
  { tipo: 'escala', bloco: 'B', etapa: 'B' },
  { tipo: 'aberta', chave: 'orgulho', etapa: 'B' },
  { tipo: 'escala', bloco: 'C', etapa: 'C' },
  { tipo: 'escala', bloco: 'D', etapa: 'D' },
  { tipo: 'qualificadora', chave: 'renda', etapa: 'qualificadoras' },
  { tipo: 'aberta', chave: 'mudanca', etapa: 'qualificadoras' },
  { tipo: 'qualificadora', chave: 'area', etapa: 'qualificadoras' },
];
const BLOCOS_DO_QUIZ = ROTEIRO.filter((t) => t.tipo === 'escala').map((t) => t.bloco);

export const PERFIS = {
  B: {
    nome: 'A mulher que está se reencontrando',
    frase: 'Antes de escolher alguém, você está aprendendo a escolher você.',
    trilha: 'Reencontro',
  },
  D: {
    nome: 'A mulher que quer colocar limites',
    frase: 'Sua voz precisa aparecer nas escolhas e nas conversas.',
    trilha: 'Limites',
  },
  C: {
    nome: 'A mulher que quer sair do ciclo da carência',
    frase: 'Atenção não precisa ser confundida com conexão; você pode escolher com mais calma.',
    trilha: 'Segurança emocional',
  },
  A: {
    nome: 'A mulher que quer enxergar com clareza',
    frase: 'A maturidade olha para o futuro e observa a realidade, não apenas a intensidade.',
    trilha: 'Clareza',
  },
  E: {
    nome: 'A mulher que está avaliando sua relação',
    frase: 'Consistência, respeito e reciprocidade merecem ser observados nas atitudes.',
    trilha: 'Relação',
  },
};

// Ordem usada para desempate exato.
const PRIORIDADE = ['B', 'D', 'C', 'A', 'E'];
// Com uma frase por área, a área que ela quer melhorar desempata entre áreas parecidas.
const AREA_PARA_BLOCO = { autoestima: 'B', emocional: 'C', limites: 'D', relacionamento: 'A' };
const PESO_AREA = 25;

/** Áreas pontuadas no quiz de captação (a qualidade da relação fica para a versão completa). */
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
    const forca = Math.round(((b.invertido ? MAX_ESCALA - v : v) / MAX_ESCALA) * 100);
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
