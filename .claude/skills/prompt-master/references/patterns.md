# Referência de Padrões que Desperdiçam Tokens

35 padrões que desperdiçam tokens e causam reprompts. Leia este arquivo quando o usuário colar um prompt ruim e pedir para corrigir, ou quando diagnosticar por que um prompt está com desempenho abaixo do esperado.

---

## Padrões de Tarefa

| # | Padrão | Exemplo Ruim | Corrigido |
|---|--------|-------------|-----------|
| 1 | **Verbo de tarefa vago** | "me ajuda com meu código" | "Refatore `buscarUsuario()` para usar async/await e tratar retornos nulos" |
| 2 | **Duas tarefas em um prompt** | "explica E reescreve essa função" | Divida em dois prompts: explique primeiro, reescreva depois |
| 3 | **Sem critérios de sucesso** | "melhora isso" | "Concluído quando a função passar nos testes unitários existentes e tratar entrada nula sem lançar exceção" |
| 4 | **Agente com permissões demais** | "faz o que for necessário" | Lista explícita de ações permitidas + lista explícita de ações proibidas |
| 5 | **Descrição emocional da tarefa** | "tá tudo quebrado, conserta tudo" | "Lança TypeError não tratado na linha 43 quando `usuario` é nulo" |
| 6 | **Construa a coisa toda** | "cria meu app inteiro" | Divida em Prompt 1 (estrutura), Prompt 2 (funcionalidade principal), Prompt 3 (refinamento) |
| 7 | **Referência implícita** | "agora adiciona a outra coisa que a gente falou" | Sempre reafirme a tarefa completa — nunca referencie "a coisa que a gente falou" |

---

## Padrões de Contexto

| # | Padrão | Exemplo Ruim | Corrigido |
|---|--------|-------------|-----------|
| 8 | **Conhecimento prévio assumido** | "continua de onde parou" | Inclua Bloco de Memória com todas as decisões anteriores |
| 9 | **Sem contexto do projeto** | "escreve uma carta de apresentação" | "Vaga de gerente de produto em fintech B2B, 2 anos como dev migrando para produto, entregou 3 features como tech lead" |
| 10 | **Stack esquecida** | Novo prompt contradiz escolha técnica anterior | Sempre inclua Bloco de Memória com a stack estabelecida |
| 11 | **Convite à alucinação** | "o que os especialistas dizem sobre X?" | "Cite apenas fontes das quais você tem certeza. Se incerto, diga explicitamente em vez de adivinhar." |
| 12 | **Público indefinido** | "escreve algo para os usuários" | "Compradores B2B sem conhecimento técnico, sem experiência com código, nível de tomador de decisão" |
| 13 | **Sem menção de falhas anteriores** | (em branco) | "Já tentei X e não funcionou porque Y. Não sugira X." |

---

## Padrões de Formato

| # | Padrão | Exemplo Ruim | Corrigido |
|---|--------|-------------|-----------|
| 14 | **Formato de saída ausente** | "explica esse conceito" | "3 tópicos, cada um com menos de 20 palavras, com um resumo de uma frase no topo" |
| 15 | **Extensão implícita** | "escreve um resumo" | "Escreva um resumo em exatamente 3 frases" |
| 16 | **Sem atribuição de papel** | (em branco) | "Você é um engenheiro de back-end sênior especializado em Node.js e PostgreSQL" |
| 17 | **Adjetivos estéticos vagos** | "deixa mais profissional" | "Paleta monocromática, fonte base 16px, altura de linha 24px, sem elementos decorativos" |
| 18 | **Sem prompts negativos para IA de imagem** | "um retrato de uma mulher" | Adicione: "sem marca d'água, sem desfoque, sem dedos extras, sem distorção, sem sobreposição de texto" |
| 19 | **Prompt em prosa para Midjourney** | Frase descritiva completa | "assunto, estilo, humor, iluminação, composição, --ar 16:9 --v 6" |

---

## Padrões de Escopo

| # | Padrão | Exemplo Ruim | Corrigido |
|---|--------|-------------|-----------|
| 20 | **Sem limite de escopo** | "conserta meu app" | "Corrija apenas a validação do formulário de login em `src/auth.js`. Não toque em mais nada." |
| 21 | **Sem restrições de stack** | "cria um componente React" | "React 18, TypeScript strict, sem bibliotecas externas, apenas Tailwind" |
| 22 | **Sem condição de parada para agentes** | "implementa a feature toda" | Condições de parada explícitas + saída de ponto de verificação ✅ após cada etapa |
| 23 | **Sem caminho de arquivo para IA de IDE** | "atualiza a função de login" | "Atualize `handleLogin()` em `src/pages/Login.tsx` apenas" |
| 24 | **Template errado para a ferramenta** | Prompt em prosa estilo GPT usado no Cursor | Adapte para o Template de Escopo de Arquivo (Template G) |
| 25 | **Colando a codebase inteira** | Contexto completo do repositório em todo prompt | Limite ao arquivo e função relevantes apenas |

---

## Padrões de Raciocínio

| # | Padrão | Exemplo Ruim | Corrigido |
|---|--------|-------------|-----------|
| 26 | **Sem CoT para tarefa de lógica** | "qual abordagem é melhor?" | "Pense nas duas abordagens passo a passo antes de recomendar" |
| 27 | **Adicionando CoT a modelos de raciocínio** | "pense passo a passo" enviado ao o1/o3 | Remova — modelos de raciocínio pensam internamente, instruções de CoT degradam a saída |
| 28 | **Esperando memória entre sessões** | "você já conhece meu projeto" | Sempre reforneça o Bloco de Memória em toda nova sessão |
| 29 | **Contradizendo trabalho anterior** | Novo prompt ignora arquitetura anterior | Inclua Bloco de Memória com todas as decisões estabelecidas |
| 30 | **Sem regra de ancoragem para tarefas factuais** | "resume o que os especialistas dizem sobre X" | "Use apenas informações das quais você tem alto grau de certeza. Diga [incerto] se não tiver." |

---

## Padrões Agênticos

| # | Padrão | Exemplo Ruim | Corrigido |
|---|--------|-------------|-----------|
| 31 | **Sem estado inicial** | "cria uma API REST pra mim" | "Projeto Node.js vazio, Express instalado, `src/app.js` existe" |
| 32 | **Sem estado-alvo** | "adiciona autenticação" | "`/src/middleware/auth.js` com verificação JWT. `POST /login` e `POST /register` em `/src/routes/auth.js`" |
| 33 | **Agente silencioso** | Sem saída de progresso | "Após cada etapa emita: ✅ [o que foi concluído]" |
| 34 | **Sistema de arquivos desbloqueado** | Sem restrições de arquivo | "Edite apenas arquivos dentro de `src/`. Não toque em `package.json`, `.env` ou qualquer arquivo de configuração." |
| 35 | **Sem gatilho de revisão humana** | Agente decide tudo autonomamente | "Pare e pergunte antes de: deletar qualquer arquivo, adicionar qualquer dependência ou alterar o schema do banco de dados" |
