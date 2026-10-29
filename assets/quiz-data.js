// Conteúdo e lógica de pontuação do quiz A-Livia-ndo.
// Compartilhado entre o navegador (assets/app.js) e o servidor (api/resultado.js),
// para que o perfil seja sempre calculado com a mesma regra dos dois lados.

export const ESCALA = [
  { valor: 0, rotulo: 'Nunca' },
  { valor: 1, rotulo: 'Raramente' },
  { valor: 2, rotulo: 'Às vezes' },
  { valor: 3, rotulo: 'Frequente' },
  { valor: 4, rotulo: 'Quase sempre' },
];

// invertido: pontuação alta indica MAIS necessidade (bloco C — carência).
export const BLOCOS = [
  {
    id: 'A',
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

// Perguntas qualificadoras: não entram na pontuação, personalizam a devolutiva e o CTA.
export const QUALIFICADORAS = {
  momento: {
    pergunta: 'Em qual momento você está hoje?',
    opcoes: {
      solteira: 'Estou solteira e quero me preparar para escolher melhor.',
      conhecendo: 'Estou conhecendo alguém e quero enxergar a situação com mais clareza.',
      fortalecer: 'Estou em um relacionamento e quero fortalecê-lo.',
      duvidas: 'Estou em um relacionamento e tenho dúvidas ou conflitos recorrentes.',
      recuperando: 'Estou encerrando ou me recuperando de uma relação.',
      nao_informado: 'Prefiro não responder.',
    },
  },
  desejo: {
    pergunta: 'O que você mais deseja desenvolver agora?',
    opcoes: {
      autoestima: 'Mais autoestima e segurança interna.',
      limites: 'Limites e capacidade de dizer não.',
      clareza: 'Clareza para escolher ou avaliar uma relação.',
      comunicacao: 'Comunicação e conversas difíceis.',
      independencia: 'Independência emocional e medo de ficar só.',
      reconstrucao: 'Reconstrução depois de uma relação difícil.',
    },
  },
  formato: {
    pergunta: 'Qual formato de apoio faria mais sentido para você?',
    opcoes: {
      conteudos: 'Conteúdos curtos e exercícios práticos.',
      aulas: 'Aulas ou encontros guiados.',
      comunidade: 'Uma comunidade para trocar experiências com outras mulheres.',
      plano: 'Um plano organizado para acompanhar meu progresso.',
      nao_sei: 'Ainda não sei; quero entender melhor.',
    },
  },
  tempo: {
    pergunta: 'Quanto tempo você consegue reservar por semana para essa jornada?',
    opcoes: {
      ate15: 'Até 15 minutos.',
      '15a30': 'De 15 a 30 minutos.',
      '30a60': 'De 30 a 60 minutos.',
      mais60: 'Mais de 1 hora.',
      nao_sei: 'Ainda não consigo estimar.',
    },
  },
  frase: {
    pergunta: 'Qual frase mais representa seu momento?',
    opcoes: {
      confiar: '“Eu quero voltar a confiar em mim.”',
      limites: '“Eu preciso aprender a colocar limites.”',
      migalhas: '“Eu quero parar de aceitar migalhas.”',
      saudavel: '“Eu quero construir uma relação mais saudável.”',
      reorganizar: '“Eu preciso me reorganizar depois de uma experiência difícil.”',
    },
  },
};

// Triagem de cuidado: nunca soma no perfil, só decide se a tela prioriza segurança.
export const TRIAGEM = {
  segura: {
    pergunta: 'Você se sente segura para responder a este quiz neste momento?',
    opcoes: { sim: 'Sim', nao: 'Não', prefiro_nao: 'Prefiro não responder' },
  },
  controle: {
    pergunta: 'Atualmente, alguém controla seu dinheiro, celular, deslocamentos, amizades ou contatos de forma que causa medo ou dependência?',
    opcoes: { nao: 'Não', as_vezes: 'Às vezes', sim: 'Sim', prefiro_nao: 'Prefiro não responder' },
  },
  violencia: {
    pergunta: 'Você já sofreu ameaça, agressão, humilhação grave ou coerção em uma relação atual ou recente?',
    opcoes: { nao: 'Não', nao_sei: 'Não tenho certeza', sim: 'Sim', prefiro_nao: 'Prefiro não responder' },
  },
  ajuda: {
    pergunta: 'Você sente que precisa de ajuda profissional ou apoio de alguém de confiança para lidar com sua situação atual?',
    opcoes: { nao: 'Não agora', talvez: 'Talvez', sim: 'Sim', prefiro_nao: 'Prefiro não responder' },
  },
};

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
// Diferença (em pontos de 0–100) abaixo da qual dois blocos viram "trilhas complementares".
const MARGEM_COMPLEMENTAR = 10;

/** O bloco E só faz sentido para quem vive ou viveu recentemente uma relação. */
export function blocosAplicaveis(momento) {
  return BLOCOS.filter((b) => !(b.id === 'E' && momento === 'solteira'));
}

/**
 * respostas: { A: [0..4 x5], B: [...], ... }
 * Retorna força (0–100, quanto maior melhor) e necessidade por bloco, perfil principal e complementar.
 */
export function calcularResultado(respostas, momento) {
  const blocos = blocosAplicaveis(momento);
  const placar = blocos.map((b) => {
    const valores = respostas[b.id];
    if (!Array.isArray(valores) || valores.length !== b.perguntas.length) {
      throw new Error(`Respostas incompletas no bloco ${b.id}`);
    }
    const soma = valores.reduce((acc, v) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 4) throw new Error(`Resposta inválida no bloco ${b.id}`);
      return acc + n;
    }, 0);
    const max = b.perguntas.length * 4;
    const forca = Math.round(((b.invertido ? max - soma : soma) / max) * 100);
    return { id: b.id, nome: b.rotuloForca, soma, forca, necessidade: 100 - forca };
  });

  const ordenado = [...placar].sort(
    (x, y) => y.necessidade - x.necessidade || PRIORIDADE.indexOf(x.id) - PRIORIDADE.indexOf(y.id),
  );
  const principal = ordenado[0];
  const segundo = ordenado[1];
  const complementar =
    segundo && principal.necessidade - segundo.necessidade <= MARGEM_COMPLEMENTAR ? segundo.id : null;

  return { placar, perfil: principal.id, complementar };
}

/** true quando a participante sinalizou risco: a tela prioriza cuidado e não oferta. */
export function precisaCuidado(triagem = {}) {
  return (
    triagem.segura === 'nao' ||
    triagem.controle === 'sim' ||
    triagem.controle === 'as_vezes' ||
    triagem.violencia === 'sim'
  );
}
