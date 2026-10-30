// Devolutivas prontas, usadas quando a OpenAI não responde a tempo (ou sem chave configurada).
// Mesmo formato que a IA devolve, para o restante do fluxo não precisar saber a diferença.
import { PERFIS } from './quiz-data.js';

const TEXTOS = {
  B: {
    acolhimento:
      'Que bom que você parou alguns minutos para olhar para si. Isso, por si só, já é um gesto de amor-próprio.',
    sinaliza: [
      'Talvez você esteja percebendo que, em alguns momentos, a relação ocupa tanto espaço que seus sonhos, amizades ou preferências ficam para depois.',
      'Isso não diz que há algo errado com você. Diz que a sua própria presença precisa voltar a ter lugar na sua rotina e nas suas decisões.',
    ],
    forcas: ['Você já reconhece que merece mais espaço', 'Existe vontade real de se reencontrar', 'Você está disposta a se olhar com honestidade'],
    exercicio: {
      titulo: 'Devolva um espaço para você',
      passos: [
        'Escreva três coisas que eram suas antes de qualquer relação: um sonho, um hobby, uma amizade.',
        'Escolha uma delas e marque na agenda 20 minutos para ela nesta semana.',
        'Ao final, anote em uma frase como você se sentiu.',
      ],
    },
    proximoPasso: 'Durante 7 dias, termine o dia respondendo: “o que eu fiz hoje que foi só por mim?”',
  },
  D: {
    acolhimento: 'Você chegou até aqui, e isso mostra que a sua voz quer aparecer. Vamos cuidar dela com calma.',
    sinaliza: [
      'Você pode saber o que não aceita, mas ainda estar treinando como comunicar e sustentar isso.',
      'Limite não é ameaça nem castigo: é clareza sobre o que você fará para se proteger.',
    ],
    forcas: ['Você já percebe o que te incomoda', 'Existe desejo de se posicionar', 'Você valoriza a sua paz'],
    exercicio: {
      titulo: 'Um limite, uma frase',
      passos: [
        'Pense em uma situação pequena que se repete e te incomoda.',
        'Transforme em uma frase objetiva: “Quando acontece X, eu me sinto Y. A partir de agora, eu vou Z.”',
        'Leia a frase em voz alta três vezes, até ela soar natural para você.',
      ],
    },
    proximoPasso: 'Nesta semana, pratique dizer um “não” pequeno e gentil, sem justificar demais.',
  },
  C: {
    acolhimento:
      'Obrigada pela sua honestidade. Reconhecer a carência não é fraqueza — é o primeiro passo para escolher com mais calma.',
    sinaliza: [
      'Quando a atenção recebida parece rara, qualquer sinal pode ganhar um peso enorme.',
      'Seu próximo passo é desacelerar e observar consistência: atitudes que se repetem dizem mais do que mensagens soltas.',
    ],
    forcas: ['Você é capaz de se entregar e sentir profundamente', 'Você já percebe o padrão', 'Existe coragem para olhar para o medo de ficar só'],
    exercicio: {
      titulo: 'Fato ou expectativa?',
      passos: [
        'Pense em alguém (ou em uma situação) que ocupa muito espaço na sua cabeça.',
        'Divida uma folha em duas colunas: “o que ele realmente fez” e “o que eu imaginei”.',
        'Releia as colunas e pergunte: quais atitudes reais sustentam essa expectativa?',
      ],
    },
    proximoPasso: 'Antes de responder uma mensagem que te deixa ansiosa, espere 10 minutos e respire fundo três vezes.',
  },
  A: {
    acolhimento: 'Você está sendo convidada a olhar para a vida com mais clareza — e isso é sinal de maturidade.',
    sinaliza: [
      'Química e intensidade podem existir, mas construção depende de valores, responsabilidade, respeito e compatibilidade.',
      'O convite agora é olhar para a pessoa e para a relação como elas são hoje, e não apenas para o potencial.',
    ],
    forcas: ['Você sabe sentir e se encantar', 'Existe abertura para aprender a escolher melhor', 'Você quer decisões mais conscientes'],
    exercicio: {
      titulo: 'Meus inegociáveis',
      passos: [
        'Liste cinco valores que você não abre mão em uma relação.',
        'Ao lado de cada um, escreva uma atitude concreta que mostra esse valor na prática.',
        'Guarde essa lista e consulte antes de tomar decisões afetivas importantes.',
      ],
    },
    proximoPasso: 'Na próxima vez que se encantar por alguém, observe como essa pessoa trata quem não pode oferecer nada a ela.',
  },
  E: {
    acolhimento: 'Olhar com honestidade para a própria relação exige coragem. Você está fazendo isso agora.',
    sinaliza: [
      'Uma relação saudável não precisa ser perfeita, mas não deve manter você em dúvida e medo permanentes.',
      'Observe se existe abertura para conversar, assumir responsabilidades e mudar atitudes de forma consistente.',
    ],
    forcas: ['Você valoriza parceria e reciprocidade', 'Existe disposição para conversar', 'Você não quer se acostumar com o que te machuca'],
    exercicio: {
      titulo: 'O termômetro da semana',
      passos: [
        'Durante uma semana, anote todo dia: “hoje eu me senti mais segura ou mais em dúvida?”',
        'Ao lado, escreva o que aconteceu para você se sentir assim.',
        'No fim da semana, observe o padrão — atitudes falam mais do que promessas.',
      ],
    },
    proximoPasso: 'Escolha um tema que precisa ser conversado e escreva, antes, o que você sente e o que você precisa.',
  },
};

export function devolutivaPadrao({ perfil, complementar, nome, orgulho }) {
  const base = TEXTOS[perfil];
  const p = PERFIS[perfil];
  const primeiroNome = (nome || '').trim().split(/\s+/)[0];
  const sinaliza = [...base.sinaliza];
  if (complementar) {
    sinaliza.push(
      `Seu momento também conversa com a trilha de ${PERFIS[complementar].trilha.toLowerCase()}. ` +
        'Elas caminham juntas, e você pode começar pela que fizer mais sentido hoje.',
    );
  }
  return {
    saudacao: primeiroNome ? `${primeiroNome}, este é o seu mapa de hoje.` : 'Este é o seu mapa de hoje.',
    acolhimento: base.acolhimento,
    oQueSinaliza: sinaliza,
    // a qualidade que ela mesma escreveu vem primeiro
    forcas: orgulho ? [orgulho.slice(0, 80), ...base.forcas.slice(0, 2)] : base.forcas,
    exercicio: base.exercicio,
    proximoPasso: base.proximoPasso,
    convite:
      `No A-Livia-ndo, a trilha de ${p.trilha.toLowerCase()} transforma essa reflexão em prática: ` +
      'e-books exclusivos, lives quinzenais com a Lívia e especialistas, e uma comunidade de mulheres que também estão aprendendo a se escolher.',
    fraseFinal: 'A mulher que aprende a escolher não perde tempo. Ela ganha vida.',
    origem: 'padrao',
  };
}
