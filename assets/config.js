// Ajustes de lançamento — edite aqui sem mexer no restante do código.
export const CONFIG = {
  // Página de vendas do e-book (o botão do resultado e do PDF aponta para cá, com UTMs).
  ofertaUrl: 'https://aliviando.com.br/',
  // O que o resultado oferece no fim, depois das dicas.
  ebook: {
    titulo: 'A mulher que aprende a escolher, não perde tempo',
    inclui: [
      '13 capítulos com perguntas para você parar e pensar',
      '7 testes de autoconhecimento com gabarito',
      'Bônus práticos, como o guia para conversas difíceis',
      'Seu Plano de Escolhas, com manifesto e carta final',
    ],
    botao: 'Quero o meu e-book',
  },
  // Parâmetros enviados para a página do e-book quando a origem não trouxer os seus.
  utmPadrao: {
    utm_source: 'quiz',
    utm_medium: 'resultado',
    utm_campaign: 'aliviando_perpetuo',
  },
  instagram: '@lliviasampaio',
  // Ligue 180: Central de Atendimento à Mulher (gratuito, 24h).
  contatoCuidado: 'Ligue 180',
};
