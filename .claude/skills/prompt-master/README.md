![](https://s6.imgcdn.dev/YvLVug.png)

<br/>

# Prompt Mestre

Uma skill para Claude que escreve prompts precisos para qualquer ferramenta de IA. Sem desperdício de tokens ou créditos. Com contexto completo e preservação de memória. Sem ficar refazendo prompts até chegar na resposta que deveria ter vindo na primeira tentativa.

**Funciona com:** Claude, ChatGPT, Gemini, o1/o3, MiniMax, Cursor, Claude Code, GitHub Copilot, Windsurf, Bolt, v0, Lovable, Devin, Perplexity, Midjourney, DALL-E, Stable Diffusion, ComfyUI, Sora, Runway, ElevenLabs, Zapier, Make e qualquer outra ferramenta de IA que você quiser usar.

---

## 🚀 Instalação

### RECOMENDADO - Claude.ai pelo navegador

1. Baixe este repositório como ZIP.
2. Acesse **claude.ai → Sidebar → Customize → Skills → Upload a Skill**.

### OU clone diretamente na pasta de skills do Claude Code (não recomendado)

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/mackswendhell/prompt-mestre.git ~/.claude/skills/prompt-master
```

## 🔥 O Problema Que Isso Resolve

Todo usuário de IA acaba desperdiçando créditos do mesmo jeito:

> Escreve um prompt vago → recebe uma resposta errada → faz outro prompt → chega mais perto → faz outro prompt de novo → finalmente recebe o que queria na quarta tentativa

São 3 chamadas de API desperdiçadas. Multiplique isso por 50 prompts por dia. É tempo e dinheiro indo embora.

### A ideia central

> "O melhor prompt não é o mais longo. É aquele em que cada palavra tem função."

A maioria dos "geradores de prompt" só cria prompts maiores. Esta skill cria prompts mais precisos.

---

## 🎯 Uso

No Claude, você pode invocar a skill naturalmente:

```
Escreva um prompt para o Cursor refatorar meu módulo de autenticação
```

```
Preciso de um prompt para o Claude Code criar uma API REST. Pergunte o que você precisa saber
```

```
Aqui está um prompt ruim que escrevi para o GPT-4o. Corrija: [cole o prompt]
```

```
Gere um prompt para Midjourney de uma cidade cyberpunk à noite
```

```
Tenho uma imagem de referência. Me ajude a escrever um prompt para editar apenas o ângulo da cabeça
```

```
Quebre este prompt em partes e adapte para Stable Diffusion
```

Ou invoque explicitamente:

```
/prompt-master

Quero pedir ao Claude Code para criar um app de tarefas com React e Supabase
```

---

## Como Funciona

O Prompt Master executa um pipeline estruturado em cada solicitação:

1. **Detecta a ferramenta de destino** — identifica para qual sistema de IA o prompt será usado e escolhe silenciosamente a abordagem correta.
2. **Extrai 9 dimensões de intenção** — tarefa, entrada, saída, restrições, contexto, público, memória, critérios de sucesso e exemplos.
3. **Faz perguntas de esclarecimento específicas** — no máximo 3 perguntas quando faltam informações críticas, nunca mais que isso.
4. **Escolhe a estrutura correta** — seleciona e aplica automaticamente a arquitetura de prompt adequada, sem mostrar isso ao usuário.
5. **Aplica apenas técnicas seguras** — definição de papel, exemplos few-shot, estrutura XML, âncoras de fundamentação e bloco de memória quando necessário.
6. **Faz uma auditoria de eficiência de tokens** — remove qualquer palavra que não mude o resultado.
7. **Entrega o prompt** — um bloco limpo e fácil de copiar, com uma nota estratégica de uma linha.

---

## Exemplo Completo #1: Criando Prompts Para Imagens

### Entrada do Usuário

```
Escreva um prompt para Midjourney de um samurai realista em pé na chuva à noite
```

### Prompt Gerado

```
samurai solitário em pé sob chuva forte à noite, armadura tradicional,
reflexos de neon em rua de pedra molhada, iluminação cinematográfica,
sombras dramáticas, névoa, ultra detalhado, fotorrealista,
profundidade de campo rasa --ar 16:9 --v 6 --style raw

negative: borrado, baixa qualidade, marca d'água, cartoon, anime, membros extras
```

**🎯 Alvo:** Midjourney · **⚡ Estrutura:** Descritor Visual · **💰 Tokens:** Leve (~60) · **💡 Estratégia:** Descritores separados por vírgula em vez de texto longo, iluminação e clima definidos cedo, proporção e versão travadas, prompt negativo reduz desvios de estilo.

---

## Exemplo Completo #2: Criando Prompts Para Código

### Entrada do Usuário

```
Crie um prompt para Claude Code fazer uma landing page para um dashboard
empresarial que pareça exatamente com o Notion: animações suaves e UI limpa
```

### Prompt Gerado

```
Objetivo:
Criar uma landing page estática, completa e com qualidade de produção para um
produto de dashboard empresarial. O design deve seguir a estética exata do Notion:
limpo, minimalista, tipográfico e com animações suaves em toda a página.

Stack:
Um único arquivo HTML com CSS e JavaScript embutidos. Sem frameworks.
Sem dependências externas, exceto Google Fonts (Inter).

Especificação Visual — siga exatamente:
- Fundo: #ffffff
- Texto primário: #1a1a1a
- Texto secundário: #6b7280
- Cor da borda: #e5e7eb
- Destaque: #000000
- Fonte: Inter, pesos 400 / 500 / 600 / 700
- Unidade base de espaçamento: 8px
- Border radius: 6px em cards, 4px em botões
- Sombras: apenas 0 1px 3px rgba(0,0,0,0.08), sem sombras dramáticas
- Botões: preenchimento preto, texto branco, border radius nunca acima de 6px

Seções a criar, nesta ordem:
1. Navbar — logo à esquerda, links no centro, CTA "Comece grátis" à direita.
   Deve ficar fixa no scroll e adicionar uma borda inferior sutil via JS.
2. Hero — título grande alinhado à esquerda (máximo de 3 linhas), subtítulo,
   dois CTAs (primário preto + secundário contornado), placeholder de screenshot
   em card cinza arredondado com proporção 16:9.
3. Barra de logos — "Usado por equipes em..." com 5 nomes fictícios de empresas
   em cinza suave, centralizados.
4. Recursos — grid de 3 colunas. Cada card deve ter ícone (use emoji), título em
   negrito e descrição de 2 linhas. No hover: borda escurece para #d1d5db,
   translateY(-2px), transition 200ms ease.
5. Como funciona — layout alternando esquerda/direita, com 3 etapas. Badge de
   número, título, descrição e card de screenshot placeholder.
6. Preços — 2 planos lado a lado. Plano gratuito: card contornado. Plano Pro:
   fundo preto, texto branco, badge "Mais popular". Liste 4 recursos com checkmarks.
7. Banner de CTA — seção escura em largura total, título centralizado, subtítulo e
   um único botão de CTA.
8. Footer — links em 4 colunas, linha de copyright, visual minimalista.

Animações — implemente todas:
- Fade-in + translateY(20px) para translateY(0) no scroll em cada seção, usando
  IntersectionObserver. Threshold 0.15. Duração 500ms ease-out.
- Animação escalonada nos cards de recursos: 100ms de atraso entre cada card.
- Botão CTA da navbar: transição de fundo de preto para #333 no hover, 200ms ease.
- CTA primário do hero: mesma transição de hover. CTA secundário: fundo vai de
  transparente para #f3f4f6 no hover.
- Smooth scroll em todos os links âncora.
- Borda inferior da navbar aparece suavemente após 60px de scroll usando evento JS.

Restrições:
- Apenas um arquivo, com todo CSS e JS embutidos, sem arquivos externos
- Sem dependências, exceto Google Fonts via tag CDN
- Todos os placeholders de imagem devem ser substituídos por divs cinzas estilizadas
- Deve ficar pixel-perfect em 375px mobile e 1440px desktop
- Sem frameworks CSS e sem utility classes externas

Concluído quando:
- Todas as 8 seções renderizarem corretamente nos dois breakpoints
- Todas as animações dispararem no scroll sem layout shift
- A navbar ficar fixa e a borda aparecer no scroll
- Estados de hover funcionarem em todos os elementos interativos
- Abrir no navegador sem erros no console
```

**🎯 Alvo:** Claude Code · **💰 Tokens:** Médio (~380) · **💡 Estratégia:** Cada indicação vaga sobre a estética do Notion foi traduzida em valores exatos de cor, pixel e comportamento. As animações foram definidas com método, tempo e gatilho para reduzir margem de interpretação.

---

## 🤝 Funciona Com Qualquer Ferramenta de IA

O Prompt Master inclui perfis específicos para mais de 20 ferramentas. Para qualquer ferramenta que não esteja na lista, ele usa uma **Impressão Digital Universal**: 4 perguntas que permitem escrever um prompt de qualidade para um sistema de IA que ele nunca viu antes.

<details>
<summary><h3>Clique para ver todos os 30+ perfis de ferramentas</h3></summary>

| Ferramenta | Categoria | O que o Prompt Master corrige |
|------------|-----------|-------------------------------|
| **Claude** | LLM de raciocínio | Remove enchimento, adiciona estrutura XML e especifica extensão |
| **ChatGPT / GPT-5.x** | LLM de raciocínio | Contrato de saída, controle de verbosidade e critérios de conclusão |
| **Gemini 2.x** | LLM de raciocínio | Âncoras de fundamentação, regras de citação e travas de formato |
| **o3 / o4-mini** | LLM de raciocínio interno | Usa apenas instruções curtas e limpas; nunca adiciona CoT, pois esses modelos pensam internamente |
| **Ollama** | LLM local | Pergunta qual modelo está carregado e inclui system prompt para Modelfile |
| **Qwen 2.5 / Qwen3** | LLM de pesos abertos | Formato de chat template e detecção de modo com ou sem raciocínio |
| **Modelos locais (Llama, Mistral)** | LLM de pesos abertos | Prompts mais curtos, estrutura mais simples e sem aninhamento complexo |
| **DeepSeek-R1** | LLM de raciocínio | Instruções curtas e limpas, remoção de CoT e supressão de saída de pensamento quando necessário |
| **MiniMax (M2.7 / M2.5)** | LLM de raciocínio | Controle de temperatura, controle de tags de pensamento e otimização de saída estruturada |
| **Claude Code** | IA agentiva | Condições de parada, escopo de arquivos e saída por checkpoint |
| **Cursor / Windsurf** | IA para IDE | Caminho de arquivo, nome de função, lista de arquivos intocáveis e orientação sequencial |
| **Cline (antigo Claude Dev)** | IDE agentiva | Escopo de arquivos, pontos de aprovação, condições de parada e divisão de tarefas |
| **GitHub Copilot** | IA de autocomplete | Contrato exato da função como docstring |
| **Antigravity** | IDE agentiva | Prompt baseado em tarefa, verificação de artefato e nível de autonomia |
| **Bolt / v0 / Lovable** | Gerador full-stack | Stack, versão e o que não deve ser criado no scaffold |
| **Figma Make** | Gerador full-stack | Referências a nomes de componentes e escopo de frame para código |
| **Google Stitch** | Gerador full-stack | Objetivo da interface acima da implementação, com especificação Material Design 3 |
| **Devin / SWE-agent** | Agente autônomo | Estado inicial, estado alvo e condições de parada |
| **Manus** | Agente autônomo | Foco no resultado da tarefa, escopo de permissões e âncoras de memória |
| **OpenAI Computer Use** | Agente de uso de computador | Estado da tela, apps permitidos e parada antes de ações irreversíveis |
| **Perplexity Computer** | Agente de uso de computador | Prompt focado em artefato, permissões delimitadas e etapas de verificação |
| **OpenClaw** | Agente de uso de computador | Precisão conversacional, memória persistente e restrições de segurança |
| **Perplexity / SearchGPT** | IA de busca | Especificação de modo: buscar, analisar ou comparar |
| **Midjourney** | IA de imagem | Descritores separados por vírgula, parâmetros e prompts negativos |
| **DALL-E 3** | IA de imagem | Descrição em prosa, exclusão de texto e detecção de edição vs geração |
| **Stable Diffusion** | IA de imagem | Sintaxe de peso `(palavra:1.3)`, orientação de CFG e prompt negativo obrigatório |
| **SeeDream** | IA de imagem | Estilo artístico primeiro, descritores de clima/atmosfera e prompt negativo |
| **ComfyUI** | IA de imagem | Separação positivo/negativo por nós e sintaxe específica por checkpoint |
| **Meshy / Tripo / Rodin** | IA 3D | Estilo, formato de exportação, limite de polígonos e requisitos de rig |
| **BlenderGPT** | IA 3D | Saída em script Python, versão do Blender e contexto da cena |
| **Unity AI** | IA 3D / games | Gênero do jogo, plataforma alvo e descrição da mecânica acima do código |
| **Sora / Runway** | IA de vídeo | Movimento de câmera, duração e estilo de corte |
| **LTX / Dream Machine / Kling** | IA de vídeo | Linguagem cinematográfica, intensidade de movimento e referência de estilo |
| **ElevenLabs** | IA de voz | Emoção, ritmo, ênfase e velocidade de fala |
| **Zapier / Make / n8n** | Automação de workflows | App/evento de gatilho, app/ação e mapeamento de campos |

</details>

---

## 📐 12 Modelos de Prompt (Selecionados Automaticamente)

O Prompt Master escolhe automaticamente a arquitetura correta para cada tarefa e faz o roteamento silenciosamente. Você não vê o nome do framework, apenas o prompt final.

<details>
<summary><h3>Clique para ver todos os 12 modelos</h3></summary>

| Modelo | Melhor para |
|--------|-------------|
| **RTF** (Role, Task, Format) | Tarefas rápidas de uma tentativa |
| **CO-STAR** (Context, Objective, Style, Tone, Audience, Response) | Documentos profissionais, relatórios e escrita de negócios |
| **RISEN** (Role, Instructions, Steps, End Goal, Narrowing) | Projetos complexos de múltiplas etapas |
| **CRISPE** (Capacity, Role, Insight, Statement, Personality, Experiment) | Trabalho criativo, voz de marca e conteúdo iterativo |
| **Chain of Thought** | Matemática, lógica, debugging e análise em múltiplas etapas |
| **Few-Shot** | Saída estruturada consistente e replicação de padrões |
| **File-Scope Template** | Cursor, Windsurf, Copilot e qualquer IA que edita código |
| **ReAct + Stop Conditions** | Claude Code, Devin, AutoGPT e qualquer agente autônomo |
| **Visual Descriptor** | Midjourney, DALL-E, Stable Diffusion, Sora e ferramentas de geração |
| **Reference Image Editing** | Edição de imagem existente, com detecção automática de edição vs geração |
| **ComfyUI** | Fluxos de imagem baseados em nós, com divisão positivo/negativo por checkpoint |
| **Prompt Decompiler** | Quebrar, adaptar, simplificar ou dividir prompts existentes |

</details>

---

## 🛡️ 5 Técnicas Seguras, Aplicadas Quando Necessário

O Prompt Master usa apenas técnicas com efeitos confiáveis e delimitados. Métodos conhecidos por gerar alucinações ou resultados imprevisíveis (Tree of Thought, Graph of Thought, Universal Self-Consistency e prompt chaining) são explicitamente excluídos.

| Técnica | O que faz |
|---------|-----------|
| **Definição de Papel** | Atribui uma identidade especialista específica para calibrar profundidade e vocabulário |
| **Exemplos Few-Shot** | Adiciona 2 a 5 exemplos quando a consistência do formato importa mais que instruções |
| **Tags Estruturais XML** | Envolve seções em XML para ferramentas baseadas em Claude que leem essa estrutura bem |
| **Âncoras de Fundamentação** | Adiciona regras anti-alucinação para tarefas factuais e com citações |
| **Chain of Thought** | Força raciocínio passo a passo em tarefas lógicas; nunca é aplicado a o1/o3 |

---

## 🚫 35 Padrões Que Fazem Você Gastar Créditos (com Antes/Depois)

<details>
<summary><h3>Padrões de Tarefa (7)</h3></summary>

| # | Padrão | Antes | Depois |
|---|--------|-------|--------|
| 1 | **Verbo de tarefa vago** | "me ajuda com meu código" | "Refatore `getUserData()` para usar async/await e tratar retornos nulos" |
| 2 | **Duas tarefas em um prompt** | "explique E reescreva esta função" | Divida: primeiro explique, depois reescreva |
| 3 | **Sem critérios de sucesso** | "melhore isso" | "Concluído quando a função passar nos testes unitários existentes e tratar entrada nula" |
| 4 | **Agente permissivo demais** | "faça o que for preciso" | Lista explícita de ações permitidas e proibidas |
| 5 | **Descrição emocional do problema** | "está tudo quebrado, conserte tudo" | "Lança TypeError não tratado na linha 43 quando `user` é null" |
| 6 | **Pedir o sistema inteiro de uma vez** | "construa meu app inteiro" | Divida em Prompt 1 (scaffold), Prompt 2 (feature), Prompt 3 (polimento) |
| 7 | **Referência implícita** | "agora adicione aquela outra coisa que conversamos" | Sempre reescreva a tarefa completa, sem depender de "aquela coisa" |

</details>

<details>
<summary><h3>Padrões de Contexto (6)</h3></summary>

### Padrões de Contexto

| # | Padrão | Antes | Depois |
|---|--------|-------|--------|
| 8 | **Conhecimento prévio presumido** | "continue de onde paramos" | Inclua um Bloco de Memória com todas as decisões anteriores |
| 9 | **Sem contexto do projeto** | "escreva uma carta de apresentação" | "Vaga de PM em fintech B2B, 2 anos de experiência como SWE, liderei 3 features" |
| 10 | **Stack esquecida** | Novo prompt contradiz uma escolha técnica anterior | Sempre inclua um Bloco de Memória |
| 11 | **Convite à alucinação** | "o que especialistas dizem sobre X?" | "Cite apenas fontes das quais você tem certeza. Se não tiver certeza, diga isso." |
| 12 | **Público indefinido** | "escreva algo para usuários" | "Compradores B2B não técnicos, sem conhecimento de programação, nível decisor" |
| 13 | **Sem mencionar falhas anteriores** | (vazio) | "Já tentei X e falhou por Y. Não sugira X." |

</details>

<details>
<summary><h3>Padrões de Formato (6)</h3></summary>

| # | Padrão | Antes | Depois |
|---|--------|-------|--------|
| 14 | **Formato de saída ausente** | "explique este conceito" | "3 bullets, cada um com menos de 20 palavras, e um resumo de uma frase no topo" |
| 15 | **Tamanho implícito** | "faça um resumo" | "Escreva um resumo em exatamente 3 frases" |
| 16 | **Sem definição de papel** | (vazio) | "Você é um engenheiro backend sênior especializado em Node.js e PostgreSQL" |
| 17 | **Adjetivos estéticos vagos** | "deixe com aparência profissional" | "Paleta monocromática, fonte base 16px, line-height 24px, sem elementos decorativos" |
| 18 | **Sem prompt negativo para IA de imagem** | "um retrato de uma mulher" | Adicione: "sem marca d'água, sem blur, sem dedos extras, sem distorção, sem texto" |
| 19 | **Prompt em prosa para Midjourney** | Frase descritiva longa | "sujeito, estilo, clima, iluminação, --ar 16:9 --v 6" |

</details>

<details>
<summary><h3>Padrões de Escopo (6)</h3></summary>

| # | Padrão | Antes | Depois |
|---|--------|-------|--------|
| 20 | **Sem limite de escopo** | "corrija meu app" | "Corrija apenas a validação do formulário de login em `src/auth.js`. Não toque em mais nada." |
| 21 | **Sem restrições de stack** | "crie um componente React" | "React 18, TypeScript strict, sem bibliotecas externas, apenas Tailwind" |
| 22 | **Sem condição de parada para agentes** | "construa a feature inteira" | Condições de parada explícitas e checkpoint após cada etapa |
| 23 | **Sem caminho de arquivo para IA de IDE** | "atualize a função de login" | "Atualize apenas `handleLogin()` em `src/pages/Login.tsx`" |
| 24 | **Modelo errado para a ferramenta** | Prompt estilo GPT usado no Cursor | Adaptado para File-Scope Template com caminho e escopo |
| 25 | **Colar o codebase inteiro** | Contexto completo do repo em todo prompt | Escopo limitado à função e ao arquivo relevantes |

</details>

<details>
<summary><h3>Padrões de Raciocínio (5)</h3></summary>

| # | Padrão | Antes | Depois |
|---|--------|-------|--------|
| 26 | **Sem CoT para tarefa lógica** | "qual abordagem é melhor?" | "Analise as duas abordagens passo a passo antes de recomendar" |
| 27 | **Adicionar CoT em modelos de raciocínio** | "pense passo a passo" enviado para o1/o3 | Removido; modelos de raciocínio pensam internamente e instruções de CoT degradam a saída |
| 28 | **Sem autochecagem em saída complexa** | (nada) | "Antes de finalizar, verifique a saída contra as restrições acima" |
| 29 | **Esperar memória entre sessões** | "você já conhece meu projeto" | Sempre forneça novamente o Bloco de Memória |
| 30 | **Contradizer decisões anteriores** | Novo prompt ignora a arquitetura definida antes | Bloco de Memória com todos os fatos estabelecidos |

</details>

<details>
<summary><h3>Padrões Agentivos (5)</h3></summary>

| # | Padrão | Antes | Depois |
|---|--------|-------|--------|
| 31 | **Sem estado inicial** | "crie uma API REST para mim" | "Projeto Node.js vazio, Express instalado, `src/app.js` existe" |
| 32 | **Sem estado alvo** | "adicione autenticação" | "`/src/middleware/auth.js` com verificação JWT. `POST /login` e `POST /register` em `/src/routes/auth.js`" |
| 33 | **Agente silencioso** | Sem saída de progresso | "Após cada etapa, escreva: ✅ [o que foi concluído]" |
| 34 | **Sistema de arquivos sem limite** | Sem restrições de arquivos | "Edite apenas arquivos dentro de `src/`. Não toque em `package.json`, `.env` ou arquivos de config." |
| 35 | **Sem gatilho de revisão humana** | O agente decide tudo sozinho | "Pare e pergunte antes de deletar arquivos, adicionar dependências ou alterar o schema do banco." |

</details>

---

## 🧠 Sistema de Bloco de Memória

Quando sua conversa tem histórico, o Prompt Master extrai decisões anteriores e adiciona um Bloco de Memória no início para evitar que a IA contradiga o que já foi decidido:

```
## Memória (levar adiante do contexto anterior)
- Stack: React 18 + TypeScript + Supabase
- Auth usa JWT armazenado em cookies httpOnly, não localStorage
- Convenção de nomes de componentes: PascalCase, sem exports default
- Design system: apenas Tailwind, sem arquivos CSS personalizados
- Arquitetura: sem Redux, apenas Context API
```

Essa é a maior correção para sessões longas. A maior parte dos re-prompts desperdiçados acontece quando a IA esquece o que você já decidiu.

---

## ℹ️ Histórico de Versões

- **1.5.0** — Adicionou mais roteamento por ferramenta. Novo roteamento para IA agentiva e IA de modelos 3D. Corrigiu a descrição para 189 caracteres. Removeu a estimativa de tokens da saída. Adicionou camada de instruções e placeholders de copywriting.
- **1.4.0** — Adicionou detecção de edição de imagem de referência, suporte a ComfyUI e modo Prompt Decompiler. Corrigiu a descrição de acionamento para invocar corretamente no Claude Code. Adicionou 3 novos modelos à pasta de referências.
- **1.3.0** — Reconstruído em torno da estrutura posicional PAC2026 (30/55/15). O roteamento silencioso substituiu a seleção de framework visível ao usuário. Pasta de referências introduzida.
- **1.2.0** — Reestruturado para arquitetura de atenção. Removeu técnicas propensas a fabricação (ToT, GoT, USC e prompt chaining). Modelos e padrões foram movidos para a pasta de referências.
- **1.1.0** — Expandiu a cobertura de ferramentas, adicionou sistema de bloco de memória e 35 padrões que desperdiçam créditos.
- **1.0.0** — Lançamento inicial.

---

## 📄 Licença

MIT: veja [LICENSE](LICENSE) para detalhes.

---

## ⭐ Histórico de Estrelas

[![Star History Chart](https://api.star-history.com/svg?repos=nidhinjs/prompt-master&type=Date)](https://star-history.com/#nidhinjs/claude-skills&Date)

---
