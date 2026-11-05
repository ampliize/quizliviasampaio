// Devolutivas prontas, usadas quando a OpenAI não responde a tempo (ou sem chave configurada).
// Mesmo formato que a IA devolve, para o restante do fluxo não precisar saber a diferença.
import { PERFIS } from './quiz-data.js';

const TEXTOS = {
  A: {
    acolhimento:
      'Que bom que você parou alguns minutos para olhar para si. Isso, por si só, já é um gesto de amor-próprio.',
    sinaliza: [
      'Talvez você esteja dando conta de tudo e de todos, e deixando a sua própria imagem e o seu próprio valor para depois.',
      'Isso não diz que há algo errado com você. Diz que está na hora de você voltar a ser prioridade na sua própria vida.',
    ],
    forcas: ['Você já percebeu que merece mais', 'Existe vontade real de se reencontrar', 'Você tem coragem de se olhar com honestidade'],
    exercicio: {
      titulo: 'O espelho gentil',
      passos: [
        'Pare na frente do espelho e respire fundo três vezes.',
        'Diga em voz alta três coisas que você admira em você, não só na aparência.',
        'Escreva a que mais te tocou e deixe em um lugar onde você vai ver amanhã.',
      ],
    },
    proximoPasso: {
      titulo: 'Seus próximos 7 dias',
      passos: [
        'Dia 1: escreva três coisas que você admira em si mesma.',
        'Dia 2: reserve 20 minutos para algo que é só seu.',
        'Dia 3: diga um elogio a você mesma em voz alta, na frente do espelho.',
        'Dia 4: retome contato com uma amiga que te faz bem.',
        'Dia 5: escolha uma roupa ou um cuidado que te faça se sentir bonita.',
        'Dia 6: anote uma decisão que você tomou pensando em você.',
        'Dia 7: releia tudo e escreva como você se sentiu nesta semana.',
      ],
    },
  },
  B: {
    acolhimento:
      'Olhar para a vida amorosa com honestidade é um ato de coragem, e você está fazendo isso agora.',
    sinaliza: [
      'Talvez a sua vida amorosa esteja ocupando muito espaço nos seus pensamentos, seja pela falta de alguém, seja por uma relação que pede mais cuidado.',
      'O amor que você procura começa pela forma como você se trata. Quando você se coloca em primeiro lugar, escolhe e é escolhida com mais clareza.',
    ],
    forcas: ['Você sabe amar e se entregar', 'Você quer relações com mais verdade', 'Existe abertura para crescer a dois ou sozinha'],
    exercicio: {
      titulo: 'Meus inegociáveis',
      passos: [
        'Liste cinco coisas que você não abre mão em uma relação.',
        'Ao lado de cada uma, escreva uma atitude que mostra isso na prática.',
        'Circule a que você mais tem deixado de lado e decida voltar a cuidar dela.',
      ],
    },
    proximoPasso: {
      titulo: 'Seus próximos 7 dias',
      passos: [
        'Dia 1: escreva como você gostaria de se sentir em uma relação.',
        'Dia 2: liste três atitudes que mostram, de verdade, que alguém se importa com você.',
        'Dia 3: faça algo gostoso sozinha, sem esperar companhia.',
        'Dia 4: escreva o que você precisa e ainda não pediu (ou ainda não se deu).',
        'Dia 5: converse com calma sobre um tema importante, começando com "eu sinto".',
        'Dia 6: observe atitudes, não só palavras, de quem está ao seu lado.',
        'Dia 7: escreva o que você aprendeu sobre você nesta semana.',
      ],
    },
  },
  C: {
    acolhimento:
      'Dá para sentir o tamanho do seu cuidado com quem você ama. Agora é hora de esse cuidado chegar até você também.',
    sinaliza: [
      'Talvez você seja a pessoa que segura tudo em casa e, no meio de tantas demandas, o seu tempo e o seu descanso acabem ficando por último.',
      'Cuidar de quem você ama também inclui cuidar de você. Uma mulher que se cuida tem mais paciência, presença e alegria para dividir.',
    ],
    forcas: ['Você cuida com muito amor', 'Sua família pode contar com você', 'Você quer uma casa com mais leveza'],
    exercicio: {
      titulo: 'Um momento só seu',
      passos: [
        'Olhe a sua semana e encontre 20 minutos que podem ser só seus.',
        'Marque esse horário como um compromisso, como faria para um filho.',
        'Combine com a família que esse tempo é seu, sem culpa.',
      ],
    },
    proximoPasso: {
      titulo: 'Seus próximos 7 dias',
      passos: [
        'Dia 1: anote tudo o que você faz por todos em um dia comum.',
        'Dia 2: escolha uma tarefa para pedir ajuda ou dividir.',
        'Dia 3: tenha 15 minutos de conversa sem celular com alguém da família.',
        'Dia 4: faça uma refeição com calma, sentada e sem pressa.',
        'Dia 5: diga "não" a um pedido que você faria só por obrigação.',
        'Dia 6: faça algo que te dá prazer, só para você.',
        'Dia 7: escreva como foi colocar você também na lista de cuidados.',
      ],
    },
  },
  D: {
    acolhimento:
      'Querer crescer é lindo. Você está olhando para o seu trabalho e o seu dinheiro com vontade de mais, e isso é força.',
    sinaliza: [
      'Talvez você sinta que pode mais do que está vivendo hoje, ou que o dinheiro e o trabalho estão trazendo mais preocupação do que realização.',
      'Você não precisa pedir licença para crescer. Autoestima também aparece na forma como você valoriza o seu tempo, o seu talento e o seu dinheiro.',
    ],
    forcas: ['Você tem vontade de crescer', 'Você sabe trabalhar duro', 'Você quer mais segurança e independência'],
    exercicio: {
      titulo: 'O meu valor',
      passos: [
        'Escreva três coisas que você faz muito bem no trabalho ou na vida.',
        'Ao lado de cada uma, escreva quem já se beneficiou disso.',
        'Escolha uma e pense em como ela pode te trazer mais reconhecimento ou renda.',
      ],
    },
    proximoPasso: {
      titulo: 'Seus próximos 7 dias',
      passos: [
        'Dia 1: escreva onde você quer estar profissionalmente daqui a um ano.',
        'Dia 2: anote para onde foi o seu dinheiro nos últimos 7 dias.',
        'Dia 3: separe um valor, mesmo pequeno, só para você ou para uma reserva.',
        'Dia 4: aprenda algo novo por 20 minutos sobre a sua área.',
        'Dia 5: converse com alguém que já está onde você quer chegar.',
        'Dia 6: dê um passo concreto: um contato, um curso, uma proposta.',
        'Dia 7: escreva o que você descobriu sobre o seu valor nesta semana.',
      ],
    },
  },
  E: {
    acolhimento:
      'Que bom que você olhou para o seu corpo com honestidade. Ele te acompanha em tudo e merece esse carinho.',
    sinaliza: [
      'Talvez, com tantas responsabilidades, o cuidado com o corpo, o sono, a alimentação e o movimento tenham ficado para quando sobrar tempo.',
      'Seu corpo é a sua casa. Cuidar dele não é vaidade nem obrigação: é uma forma de dizer para você mesma que você importa.',
    ],
    forcas: ['Você quer se sentir bem na própria pele', 'Você reconhece o que precisa mudar', 'Você está disposta a recomeçar'],
    exercicio: {
      titulo: 'Escuta do corpo',
      passos: [
        'Feche os olhos e perceba onde o seu corpo está cansado ou tenso.',
        'Escolha um cuidado simples para hoje: água, alongamento, uma caminhada ou dormir mais cedo.',
        'Faça agora a primeira parte desse cuidado, mesmo que pequena.',
      ],
    },
    proximoPasso: {
      titulo: 'Seus próximos 7 dias',
      passos: [
        'Dia 1: beba água ao acordar e repare em como você se sente.',
        'Dia 2: caminhe ou se movimente por 15 minutos.',
        'Dia 3: durma 30 minutos mais cedo do que o habitual.',
        'Dia 4: prepare uma refeição colorida, com calma.',
        'Dia 5: faça um alongamento de 5 minutos antes de dormir.',
        'Dia 6: marque aquele exame ou consulta que está adiando.',
        'Dia 7: escreva como o seu corpo respondeu a esses cuidados.',
      ],
    },
  },
  F: {
    acolhimento:
      'Reconhecer que a cabeça anda cheia é um passo importante. Você não precisa dar conta de tudo sozinha.',
    sinaliza: [
      'Talvez a ansiedade, o cansaço ou as preocupações estejam ocupando tanto espaço que fica difícil descansar e aproveitar o que é bom.',
      'Paz não é a ausência de problemas, é voltar para você. Pequenas pausas e limites claros já fazem diferença no dia a dia.',
    ],
    forcas: ['Você sente tudo com intensidade', 'Você está buscando equilíbrio', 'Você tem coragem de pedir mais leveza'],
    exercicio: {
      titulo: 'Respiração da pausa',
      passos: [
        'Inspire contando até quatro, segure por quatro e solte contando até seis.',
        'Repita cinco vezes, com a mão no peito.',
        'Escreva em uma frase o que está pesando agora e o que está ao seu alcance fazer hoje.',
      ],
    },
    proximoPasso: {
      titulo: 'Seus próximos 7 dias',
      passos: [
        'Dia 1: faça a respiração da pausa ao acordar.',
        'Dia 2: escreva tudo o que está na sua cabeça, sem filtro, por 10 minutos.',
        'Dia 3: fique uma hora longe do celular.',
        'Dia 4: escolha uma preocupação e defina um primeiro passo pequeno para ela.',
        'Dia 5: converse com alguém de confiança sobre como você está.',
        'Dia 6: faça algo que te acalma: música, oração, banho demorado.',
        'Dia 7: escreva o que trouxe mais paz para você nesta semana.',
      ],
    },
  },
};

export function devolutivaPadrao({ perfil, complementar, nome, orgulho }) {
  const base = TEXTOS[perfil];
    const primeiroNome = (nome || '').trim().split(/\s+/)[0];
  const sinaliza = [...base.sinaliza];
  if (complementar) {
    sinaliza.push(
      `A área de ${PERFIS[complementar].trilha.toLowerCase()} também pede um olhar carinhoso. ` +
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
      'O e-book da Lívia é o próximo passo para você voltar a se colocar em primeiro lugar: ' +
      'um guia para parar de repetir padrões e aprender a se escolher, com testes e exercícios para fazer no seu ritmo.',
    fraseFinal: 'Seja o grande amor da sua vida.',
    origem: 'padrao',
  };
}
