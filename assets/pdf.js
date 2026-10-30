// Gera o "Mapa de autoconhecimento" em PDF no próprio navegador (jsPDF via CDN).
import { PERFIS, proximoPassoEmLista } from './quiz-data.js';
import { CONFIG } from './config.js';

// Mesma paleta da página: bordô e dourado + uma cor por área do mapa.
const COR = {
  vinho: [74, 15, 31],
  rosa: [94, 26, 44],
  fundo: [246, 241, 236],
  fundoAlt: [239, 230, 225],
  texto: [46, 10, 20],
  textoSuave: [110, 74, 82],
  dourado: [154, 118, 72],
};
const COR_AREA = {
  A: [230, 213, 186],
  B: [235, 196, 198],
  C: [221, 189, 170],
  D: [215, 189, 202],
  E: [203, 207, 192],
};

// As fontes padrão do PDF só cobrem Latin-1: troca o que fica fora disso por equivalentes simples.
const limpar = (t) =>
  String(t ?? '')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');

// A biblioteca (~360 KB) só é baixada quando a pessoa pede o PDF, para o quiz abrir rápido.
function carregarJsPdf() {
  if (window.jspdf) return Promise.resolve();
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = '/assets/vendor/jspdf.umd.min.js';
    s.onload = ok;
    s.onerror = () => falha(new Error('jsPDF não carregou'));
    document.head.appendChild(s);
  });
}

export async function gerarPdf({ dados, nome, link }) {
  await carregarJsPdf();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = 210;
  const A = 297;
  const M = 18;
  const LARG = L - M * 2;
  let y = 0;

  const perfil = PERFIS[dados.perfil];
  const comp = dados.complementar ? PERFIS[dados.complementar] : null;
  const d = dados.devolutiva;

  const fundoPagina = () => {
    doc.setFillColor(...COR.fundo);
    doc.rect(0, 0, L, A, 'F');
  };
  const rodape = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COR.textoSuave);
    const aviso = doc.splitTextToSize(
      limpar('Resultado educativo de autoconhecimento. Não é diagnóstico e não substitui acompanhamento psicológico, médico ou jurídico. Em situação de violência, ligue 180 (Central de Atendimento à Mulher) ou 190.'),
      LARG,
    );
    doc.text(aviso, L / 2, A - 12, { align: 'center' });
  };
  const novaPagina = () => {
    rodape();
    doc.addPage();
    fundoPagina();
    y = M;
  };
  const garantir = (altura) => {
    if (y + altura > A - 22) novaPagina();
  };

  const paragrafo = (texto, { tam = 10.5, cor = COR.texto, estilo = 'normal', fonte = 'helvetica', esp = 3, x = M, larg = LARG, alinhar } = {}) => {
    doc.setFont(fonte, estilo);
    doc.setFontSize(tam);
    doc.setTextColor(...cor);
    const linhas = doc.splitTextToSize(limpar(texto), larg);
    const alt = linhas.length * tam * 0.42;
    garantir(alt);
    doc.text(linhas, alinhar === 'center' ? L / 2 : x, y + tam * 0.35, alinhar ? { align: alinhar } : undefined);
    y += alt + esp;
  };
  const titulo = (texto) => {
    garantir(16);
    y += 3;
    paragrafo(texto, { tam: 14, cor: COR.vinho, estilo: 'bold', fonte: 'times', esp: 2.5 });
  };
  const rotuloPequeno = (texto) => paragrafo(texto.toUpperCase(), { tam: 8, cor: COR.dourado, estilo: 'bold', esp: 1.5 });

  // ---------- capa ----------
  fundoPagina();
  doc.setFillColor(...COR.vinho);
  doc.rect(0, 0, L, 46, 'F');
  doc.setTextColor(253, 241, 238);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('A-Livia-ndo', L / 2, 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(220, 194, 154);
  doc.text(limpar('Mapa de autoconhecimento da Lívia Sampaio'), L / 2, 32, { align: 'center' });
  y = 60;

  paragrafo(d.saudacao, { tam: 12, cor: COR.textoSuave, estilo: 'italic', fonte: 'times', alinhar: 'center', esp: 5 });
  paragrafo('Seu perfil educativo de hoje', { tam: 9.5, cor: COR.dourado, estilo: 'bold', alinhar: 'center', esp: 3 });
  paragrafo(perfil.nome, { tam: 22, cor: COR.vinho, estilo: 'bold', fonte: 'times', alinhar: 'center', esp: 4 });
  paragrafo(`"${perfil.frase}"`, { tam: 12, cor: COR.rosa, estilo: 'italic', fonte: 'times', alinhar: 'center', esp: 3 });
  if (comp) paragrafo(`Trilha complementar: ${comp.trilha}`, { tam: 9.5, cor: COR.textoSuave, alinhar: 'center', esp: 3 });
  y += 4;

  if (dados.cuidado) {
    const texto = limpar(
      'Algumas das suas respostas mostram que você pode estar vivendo uma situação difícil. Sua segurança vem primeiro. No Brasil, o Ligue 180 acolhe e orienta mulheres em situação de violência: é gratuito, sigiloso e funciona 24 horas. Em perigo imediato, ligue 190.',
    );
    doc.setFontSize(10.5);
    const linhas = doc.splitTextToSize(texto, LARG - 12);
    const alt = linhas.length * 4.5 + 16;
    garantir(alt);
    doc.setDrawColor(...COR.rosa);
    doc.setLineWidth(0.6);
    doc.roundedRect(M, y, LARG, alt, 4, 4, 'S');
    y += 8;
    paragrafo('Antes de tudo: você importa', { tam: 12, cor: COR.rosa, estilo: 'bold', fonte: 'times', x: M + 6, larg: LARG - 12, esp: 2 });
    paragrafo(texto, { x: M + 6, larg: LARG - 12 });
    y += 6;
  }

  paragrafo(d.acolhimento, { tam: 11, esp: 4 });

  titulo('O que esse padrão pode estar dizendo');
  d.oQueSinaliza.forEach((t) => paragrafo(t));

  // ---------- mapa ----------
  titulo('Seu mapa de hoje');
  dados.placar.forEach((b) => {
    garantir(12);
    const destaque = b.id === dados.perfil || b.id === dados.complementar;
    doc.setFont('helvetica', destaque ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COR.texto);
    doc.text(limpar(b.nome), M, y + 3);
    doc.text(limpar(b.nivel), M + LARG, y + 3, { align: 'right' });
    doc.setFillColor(...COR.fundoAlt);
    doc.roundedRect(M, y + 5, LARG, 3, 1.5, 1.5, 'F');
    doc.setFillColor(...COR_AREA[b.id]);
    doc.setDrawColor(...COR.texto);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y + 5, Math.max((LARG * b.forca) / 100, 3), 3, 1.5, 1.5, destaque ? 'FD' : 'F');
    y += 12;
  });
  paragrafo('Quanto mais cheia a barra, mais fortalecida está a área. As contornadas são o seu ponto de partida.', { tam: 8.5, cor: COR.textoSuave });

  titulo('O que já é força em você');
  d.forcas.forEach((f) => paragrafo(`-  ${f}`, { esp: 1.5 }));

  titulo(`Para fazer agora, em 3 minutos: ${d.exercicio.titulo}`);
  d.exercicio.passos.forEach((p, i) => paragrafo(`${i + 1}.  ${p}`, { esp: 2 }));

  const proximo = proximoPassoEmLista(d.proximoPasso);
  titulo(proximo.titulo);
  proximo.passos.forEach((p) => paragrafo(p, { esp: 2 }));

  // ---------- convite ----------
  if (!dados.cuidado) {
    doc.setFontSize(10.5);
    const linhas = doc.splitTextToSize(limpar(d.convite), LARG - 16);
    const alt = linhas.length * 4.5 + 38;
    garantir(alt + 4);
    y += 4;
    const topoCaixa = y;
    doc.setFillColor(...COR.vinho);
    doc.roundedRect(M, topoCaixa, LARG, alt, 5, 5, 'F');
    y += 9;
    paragrafo(`Sua trilha: ${perfil.trilha.toLowerCase()}`, { tam: 9.5, cor: [220, 194, 154], estilo: 'bold', alinhar: 'center', esp: 2 });
    paragrafo('Continue essa jornada no A-Livia-ndo', { tam: 14, cor: [253, 241, 238], estilo: 'bold', fonte: 'times', alinhar: 'center', esp: 2 });
    paragrafo(d.convite, { cor: [233, 214, 208], x: M + 8, larg: LARG - 16, esp: 3 });
    const bw = 104;
    const bx = (L - bw) / 2;
    doc.setFillColor(253, 241, 238);
    doc.roundedRect(bx, y, bw, 11, 5.5, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COR.vinho);
    doc.text('Conhecer o A-Livia-ndo', L / 2, y + 7, { align: 'center' });
    doc.link(bx, y, bw, 11, { url: link });
    y = topoCaixa + alt + 6;
  }

  paragrafo(d.fraseFinal, { tam: 12.5, cor: COR.vinho, estilo: 'italic', fonte: 'times', alinhar: 'center', esp: 3 });
  paragrafo(CONFIG.instagram, { tam: 9, cor: COR.dourado, alinhar: 'center' });
  rodape();

  const arquivo = `mapa-aliviando-${(nome || 'resultado').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}.pdf`;
  // Navegador do Instagram nem sempre aceita download direto: abre o PDF numa aba como alternativa.
  try {
    doc.save(arquivo);
  } catch {
    window.open(doc.output('bloburl'), '_blank');
  }
  return arquivo;
}
