# Quiz A-Livia-ndo · Análise gratuita de perfil

Quiz de autoconhecimento da Lívia Sampaio (@lliviasampaio), primeira etapa do funil perpétuo:

```
Reel / Stories → comentário "ALIVIANDO" → ManyChat envia o link → QUIZ → resultado na tela + PDF
→ página da comunidade A-Livia-ndo → checkout Cakto (R$ 39,90/mês)
```

## Como funciona

- **Perguntas (versão de captação, até 9):** momento de vida, uma frase por área (A–E) com 3 opções (Nunca / Às vezes / Sempre), o que deseja desenvolver, uma pergunta aberta opcional e uma pergunta de cuidado. Quem está solteira pula a frase da relação (8 perguntas). As 25 frases do documento-base continuam em `assets/quiz-data.js` (`perguntas`), para uma versão completa futura dentro da comunidade; `curta` indica a frase usada na captação.
- **Perfil:** a área com maior necessidade (o bloco C é lido de forma invertida); o desejo declarado desempata entre áreas parecidas. Empate exato vira "trilha complementar". O cálculo roda também no servidor, então o resultado não depende do navegador.
- **Pergunta aberta:** vai só para a IA personalizar a devolutiva e não é gravada no CRM. Palavras de risco (ameaça, agressão etc.) também acionam a tela de cuidado.
- **OpenAI:** `api/resultado.js` envia o perfil e as respostas qualificadoras e recebe a devolutiva em JSON estruturado (acolhimento, o que o padrão sinaliza, forças, exercício de 3 minutos, próximo passo, convite). O prompt impede linguagem de diagnóstico, promessas e urgência.
- **Plano B:** sem chave, com erro ou com demora acima de 20 s, entra a devolutiva pronta de `assets/fallback.js`. O quiz nunca trava.
- **Triagem de cuidado:** não soma pontos. Se houver sinal de risco, o resultado mostra primeiro o Ligue 180, **esconde a oferta** e marca o lead no CRM como "sinalizou risco" (não enviar oferta). As respostas da triagem nunca são gravadas.
- **PDF:** gerado no navegador (jsPDF, servido localmente e baixado só no clique), com botão clicável para a comunidade.
- **Rastreio:** as UTMs, o `fbclid`, o `mc_id` e o `nome` da URL são guardados e repassados ao CTA da comunidade (`utm_content=perfil_X`) e ao mini CRM. Os eventos `quiz_inicio`, `quiz_concluido`, `quiz_pdf_baixado` e `quiz_clique_comunidade` vão para o `dataLayer` e o `fbq` (se o Pixel estiver instalado).

## Configuração

1. `assets/config.js`: URL da página da comunidade e UTMs padrão.
2. Variáveis de ambiente (veja `.env.example`):
   - `OPENAI_API_KEY`: obrigatória para a devolutiva com IA.
   - `OPENAI_MODEL`: padrão `gpt-4o-mini`.
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: banco do mini CRM.
   - `CRM_SENHA`: senha do painel `/crm`.

## Mini CRM (`/crm`)

Cada pessoa que abre o link vira uma sessão. O quiz avisa o servidor a cada etapa alcançada (abriu, momento de vida, partes A–E, perguntas finais, triagem, contato, resultado, PDF, clique na comunidade), com a pergunta exata em que ela estava. O painel mostra:

- totais do período (abriram, viram o resultado, deixaram contato, baixaram o PDF, clicaram na comunidade);
- funil com quantas pessoas se perderam entre uma etapa e outra;
- ranking de onde mais param e perfis de quem concluiu;
- lista de leads com situação ("Parou em Limites e comunicação, pergunta 18 de 29"), contato, perfil e origem, com busca, filtros e exportação para CSV.

Filtros por período (hoje, 7, 30, 90 dias, tudo) e por origem (`utm_source`).

**Configurar:**
1. Crie um projeto no Supabase só para a Lívia.
2. Abra o SQL Editor, cole o conteúdo de `supabase/schema.sql` e rode.
3. Na Vercel, cadastre `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API) e `CRM_SENHA`.
4. Acesse `https://SEU-DOMINIO/crm`.

As tabelas têm RLS ligado e nenhuma policy: o navegador não lê nem grava nada direto. Só as funções do servidor (`/api/evento`, `/api/resultado`, `/api/crm`) falam com o banco.

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
api/resultado.js        função serverless: pontuação + OpenAI + registro do lead
api/evento.js           recebe cada etapa alcançada no quiz
api/crm.js              dados do painel (protegido por senha)
api/_supabase.js        acesso ao Supabase (só no servidor)
crm.html, assets/crm.*  painel do mini CRM
supabase/schema.sql     tabelas e funções do mini CRM
dev-server.mjs          servidor local
```
