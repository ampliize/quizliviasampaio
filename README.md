# Quiz A-Livia-ndo · Análise gratuita de perfil

Quiz de autoconhecimento da Lívia Sampaio (@lliviasampaio), primeira etapa do funil perpétuo:

```
Reel / Stories → comentário "ALIVIANDO" → ManyChat envia o link → QUIZ → resultado na tela + PDF
→ página da comunidade A-Livia-ndo → checkout Cakto (R$ 39,90/mês)
```

## Como funciona

- **Perguntas:** 1 de momento de vida, 25 de escala (blocos A–E), 4 qualificadoras e 4 de triagem de cuidado, todas tiradas do documento‑base do quiz. Quem está solteira pula o bloco E (qualidade da relação), que fica com 24 perguntas.
- **Perfil:** é calculado pela regra do documento (necessidade por bloco, com o bloco C lido de forma invertida). Quando dois blocos ficam a até 10 pontos um do outro, o segundo aparece como "trilha complementar". O cálculo roda também no servidor (`assets/quiz-data.js`), então o resultado não depende do navegador.
- **OpenAI:** `api/resultado.js` envia o perfil e as respostas qualificadoras e recebe a devolutiva em JSON estruturado (acolhimento, o que o padrão sinaliza, forças, exercício de 3 minutos, próximo passo, convite). O prompt impede linguagem de diagnóstico, promessas e urgência.
- **Plano B:** sem chave, com erro ou com demora acima de 20 s, entra a devolutiva pronta de `assets/fallback.js`. O quiz nunca trava.
- **Triagem de cuidado:** não soma pontos. Se houver sinal de risco, o resultado mostra primeiro o Ligue 180, **esconde a oferta** e envia `cuidado: true` no webhook (use isso para não disparar sequência de venda).
- **PDF:** gerado no navegador (jsPDF, servido localmente e baixado só no clique), com botão clicável para a comunidade.
- **Rastreio:** as UTMs, o `fbclid`, o `mc_id` e o `nome` da URL são guardados e repassados ao CTA da comunidade (`utm_content=perfil_X`) e ao webhook. Os eventos `quiz_inicio`, `quiz_concluido`, `quiz_pdf_baixado` e `quiz_clique_comunidade` vão para o `dataLayer` e o `fbq` (se o Pixel estiver instalado).

## Configuração

1. `assets/config.js`: URL da página da comunidade e UTMs padrão.
2. Variáveis de ambiente (veja `.env.example`):
   - `OPENAI_API_KEY`: obrigatória para a devolutiva com IA.
   - `OPENAI_MODEL`: padrão `gpt-4o-mini`.
   - `LEAD_WEBHOOK_URL` / `LEAD_WEBHOOK_SECRET`: opcionais, recebem cada quiz concluído (n8n, Make, ManyChat, Supabase…).

### Link para o ManyChat

```
https://SEU-DOMINIO/?utm_source=instagram&utm_medium=dm&utm_campaign=aliviando_perpetuo&utm_content=reel_comunidade&nome={{first_name}}&mc_id={{user_id}}
```

## Rodar localmente

```bash
cp .env.example .env   # preencha a chave
npm run dev            # http://localhost:3000
```

## Publicar na Vercel

Importe o repositório na Vercel (framework: "Other"), cadastre as variáveis de ambiente e publique. Os arquivos estáticos são servidos da raiz e `api/resultado.js` vira a função serverless.

## Estrutura

```
index.html              página do quiz
assets/quiz-data.js     perguntas, perfis e pontuação (navegador + servidor)
assets/app.js           telas e fluxo
assets/fallback.js      devolutivas prontas
assets/pdf.js           geração do PDF
assets/config.js        links e UTMs
assets/vendor/          jsPDF 2.5.1
api/resultado.js        função serverless: pontuação + OpenAI + webhook
dev-server.mjs          servidor local
```
