# Referência de Templates de Prompt

Biblioteca completa de templates para o Prompt Master. Leia o template relevante quando o tipo de tarefa do usuário corresponder. Não carregue todos os templates de uma vez — apenas o que você precisar.

## Índice

| Template | Melhor Para |
|----------|------------|
| [A — RTF](#template-a--rtf) | Tarefas simples de uma única execução |
| [B — CO-STAR](#template-b--co-star) | Documentos profissionais, redação empresarial |
| [C — RISEN](#template-c--risen) | Projetos complexos em múltiplas etapas |
| [D — CRISPE](#template-d--crispe) | Trabalho criativo, voz de marca |
| [E — Chain of Thought](#template-e--chain-of-thought) | Lógica, matemática, análise, depuração |
| [F — Few-Shot](#template-f--few-shot) | Saída estruturada consistente, replicação de padrão |
| [G — Escopo de Arquivo](#template-g--escopo-de-arquivo) | Cursor, Windsurf, Copilot — IA de edição de código |
| [H — ReAct + Condições de Parada](#template-h--react--condições-de-parada) | Claude Code, Devin — agentes autônomos |
| [I — Descritor Visual](#template-i--descritor-visual) | Midjourney, DALL-E, Stable Diffusion, Sora |
| [J — Edição com Imagem de Referência](#template-j--edição-com-imagem-de-referência) | Editando uma imagem existente com referência |
| [K — ComfyUI](#template-k--comfyui) | Workflows de imagem baseados em nós no ComfyUI |
| [L — Decompositor de Prompt](#template-l--decompositor-de-prompt) | Decompor, adaptar ou dividir prompts existentes |

---

## Template A — RTF

*Papel, Tarefa, Formato. Use para tarefas rápidas de uma única execução onde o pedido é claro e simples.*

```
Papel: [Uma frase definindo quem é a IA]
Tarefa: [Verbo preciso + o que produzir]
Formato: [Formato de saída exato e extensão]
```

**Exemplo:**
```
Papel: Você é um redator técnico sênior.
Tarefa: Escreva um parágrafo explicando o que é uma API REST.
Formato: Prosa simples, máximo de 3 frases, sem jargão, adequado para um público não técnico.
```

---

## Template B — CO-STAR

*Contexto, Objetivo, Estilo, Tom, Público, Resposta. Use para documentos profissionais, redação empresarial, relatórios e conteúdo de marketing onde o controle total do contexto é importante.*

```
Contexto: [Histórico que a IA precisa para entender a situação]
Objetivo: [Meta exata — como é o sucesso]
Estilo: [Estilo de escrita: formal / conversacional / técnico / narrativo]
Tom: [Registro emocional: autoritário / empático / urgente / neutro]
Público: [Quem lê — nível de conhecimento e expectativas]
Resposta: [Formato, extensão e estrutura da saída]
```

**Exemplo:**
```
Contexto: Sou fundador de uma startup B2B de SaaS que automatiza relatórios de despesas para médias empresas.
Objetivo: Escrever um e-mail frio que consiga uma resposta de um CFO.
Estilo: Direto e conversacional, sem parecer vendedor.
Tom: Confiante, mas sem pressão.
Público: CFO de uma empresa com 200 funcionários, ocupado, cético com e-mails de fornecedores.
Resposta: Máximo de 5 frases. Assunto incluído. Sem marcadores.
```

---

## Template C — RISEN

*Papel, Instruções, Etapas, Objetivo Final, Delimitação. Use para projetos complexos, tarefas em múltiplas etapas e qualquer saída que exija uma sequência clara de ações.*

```
Papel: [Identidade de especialista que a IA deve adotar]
Instruções: [Tarefa geral em termos simples]
Etapas:
  1. [Primeira ação]
  2. [Segunda ação]
  3. [Continue conforme necessário]
Objetivo Final: [O que a saída final deve alcançar]
Delimitação: [Restrições, limites de escopo, o que excluir]
```

**Exemplo:**
```
Papel: Você é um gerente de produto com 10 anos de experiência em aplicativos mobile.
Instruções: Escreva um documento de requisitos de produto para uma funcionalidade de rastreamento de hábitos.
Etapas:
  1. Defina o problema em um parágrafo
  2. Liste histórias de usuário no formato "Como [usuário], quero [objetivo] para que [motivo]"
  3. Defina critérios de aceitação para cada história
  4. Liste itens fora do escopo explicitamente
Objetivo Final: Um PRD do qual um time de engenharia possa começar o planejamento de sprint imediatamente.
Delimitação: Sem detalhes de implementação técnica. Sem wireframes. Máximo de 600 palavras no total.
```

---

## Template D — CRISPE

*Capacidade, Papel, Insight, Declaração, Personalidade, Experimento. Use para trabalho criativo, redação com voz de marca e qualquer tarefa onde personalidade, tom e iteração sejam importantes.*

```
Capacidade: [Qual habilidade ou expertise a IA deve ter]
Papel: [Persona específica a adotar]
Insight: [Insight de contexto chave que molda a resposta]
Declaração: [A tarefa ou pergunta central]
Personalidade: [Tom e estilo — bem-humorado / autoritário / casual / afiado]
Experimento: [Solicite variantes ou alternativas para explorar]
```

**Exemplo:**
```
Capacidade: Redator especialista em lançamentos de produtos SaaS.
Papel: Voz de marca para uma ferramenta de produtividade voltada a desenvolvedores.
Insight: Desenvolvedores odeiam linguagem de marketing e respondem a honestidade e especificidade.
Declaração: Escreva o headline principal e o subtítulo da landing page.
Personalidade: Afiado, seco, confiante — sem adjetivos, sem pontos de exclamação.
Experimento: Dê 3 variantes que vão do minimalista ao ousado.
```

---

## Template E — Chain of Thought

*Use para tarefas que exigem muita lógica, matemática, depuração e análise multifatorial onde a IA precisa raciocinar cuidadosamente antes de comprometer uma resposta.*

**Importante:** Use CoT apenas para modelos de raciocínio padrão (Claude, GPT-4o, Gemini). NÃO adicione instruções de CoT a o1, o3 ou Claude extended thinking — eles raciocinam internamente e instruções de CoT degradam a saída.

```
[Declaração da tarefa]

Antes de responder, pense com cuidado:
<raciocinio>
1. Qual é o problema real sendo solicitado?
2. Quais restrições a solução deve respeitar?
3. Quais são as abordagens possíveis?
4. Qual abordagem é melhor e por quê?
</raciocinio>

Dê sua resposta final apenas nas tags <resposta>.
```

**Quando usar:**
- Depuração onde a causa não é óbvia
- Comparação de duas abordagens técnicas
- Qualquer matemática ou cálculo
- Análise onde uma primeira impressão errada é provável

**Quando NÃO usar:**
- o1 / o3 / modelos de raciocínio (eles pensam internamente — adicionar CoT prejudica)
- Tarefas simples onde a resposta é clara (overhead desnecessário)
- Tarefas criativas (CoT pode matar a voz natural)

---

## Template F — Few-Shot

*Use quando o formato de saída é mais fácil de mostrar do que descrever. Exemplos superam instruções escritas para tarefas sensíveis a formato em todas as situações.*

```
[Instrução da tarefa]

Aqui estão exemplos do formato exato necessário:

<exemplos>
  <exemplo>
    <entrada>[exemplo de entrada 1]</entrada>
    <saida>[exemplo de saída 1]</saida>
  </exemplo>
  <exemplo>
    <entrada>[exemplo de entrada 2]</entrada>
    <saida>[exemplo de saída 2]</saida>
  </exemplo>
</exemplos>

Agora aplique este padrão exato a: [entrada real]
```

**Regras:**
- 2 a 5 exemplos é o ponto ideal. Mais raramente ajuda e desperdiça tokens.
- Os exemplos devem incluir casos extremos, não apenas casos fáceis.
- Use tags XML para envolver os exemplos — Claude analisa XML de forma confiável.
- Se você já repromptou pela mesma correção de formatação duas vezes, mude para few-shot em vez de reescrever as instruções.

---

## Template G — Escopo de Arquivo

*Use para Cursor, Windsurf, GitHub Copilot e qualquer IA que edite código dentro de uma codebase. O modo de falha mais comum aqui é editar o arquivo errado ou quebrar a lógica existente — este template previne ambos.*

```
Arquivo: [caminho/exato/para/o/arquivo.ext]
Função/Componente: [nome exato]

Comportamento Atual:
[O que este código faz agora — seja específico]

Mudança Desejada:
[O que deve fazer após a edição — seja específico]

Escopo:
Modifique apenas [função / componente / seção].
NÃO toque em: [liste tudo que deve permanecer inalterado]

Restrições:
- Linguagem/framework: [especifique a versão]
- Não adicione dependências que não estejam em [package.json / requirements.txt]
- Preserve [assinaturas de tipo / contratos de API / nomes de variáveis] existentes

Concluído Quando:
[Condição exata que confirma que a mudança funcionou corretamente]
```

---

## Template H — ReAct + Condições de Parada

*Use para Claude Code, Devin, AutoGPT e qualquer IA que tome ações autônomas. Loops descontrolados e expansão de escopo são os maiores custos em workflows agênticos — condições de parada não são opcionais.*

```
Objetivo:
[Meta única e inequívoca em uma frase]

Estado Inicial:
[Estrutura de arquivos atual / estado da codebase / ambiente]

Estado-Alvo:
[O que deve existir quando o agente terminar]

Ações Permitidas:
- [Ação específica que o agente pode tomar]
- Instale apenas pacotes listados em [requirements.txt / package.json]

Ações Proibidas:
- NÃO modifique arquivos fora de [diretório/escopo]
- NÃO execute o servidor de desenvolvimento nem faça deploy
- NÃO faça push para o git
- NÃO delete arquivos sem mostrar um diff primeiro
- NÃO tome decisões de arquitetura sem aprovação humana

Condições de Parada:
Pause e peça revisão humana quando:
- Um arquivo seria permanentemente deletado
- Um novo serviço externo ou API precisar ser integrado
- Dois caminhos de implementação válidos existirem e a escolha afetar a arquitetura
- Um erro não puder ser resolvido em 2 tentativas
- A tarefa exigir mudanças fora do escopo declarado

Pontos de Verificação:
Após cada etapa principal, emita: ✅ [o que foi concluído]
No final, emita um resumo completo de cada arquivo alterado.
```

---

## Template I — Descritor Visual

*Use para Midjourney, DALL-E 3, Stable Diffusion, Sora, Runway e qualquer ferramenta de geração de imagem ou vídeo.*

```
Assunto: [Assunto principal — específico, não vago]
Ação/Pose: [O que o assunto está fazendo]
Cenário: [Onde a cena acontece]
Estilo: [fotorrealista / cinematográfico / anime / pintura a óleo / vetorial / etc.]
Humor: [dramático / sereno / sombrio / alegre / etc.]
Iluminação: [hora dourada / estúdio / neon / encoberto / luz de vela / etc.]
Paleta de Cores: [cores dominantes ou paleta nomeada]
Composição: [plano aberto / close-up / aéreo / ângulo holandês / etc.]
Proporção: [16:9 / 1:1 / 9:16 / 4:3]
Prompts Negativos: [desfocado, marca d'água, dedos extras, distorção, baixa qualidade]
Referência de Estilo: [artista / filme / referência estética, se aplicável]
```

**Sintaxe específica por ferramenta:**
- **Midjourney**: Descritores separados por vírgula, não prosa. Adicione `--ar`, `--style`, `--v 6` no final.
- **Stable Diffusion**: Use sintaxe de peso `(palavra:1.3)`. CFG scale de 7 a 12. Prompt negativo é obrigatório.
- **DALL-E 3**: Prosa funciona bem. Adicione "não inclua nenhum texto na imagem" a menos que texto seja necessário.
- **Sora / vídeo**: Adicione movimento de câmera (dolly lento, plano estático, grua subindo), duração em segundos e estilo de corte.

---

## Template J — Edição com Imagem de Referência

*Use quando o usuário tem uma imagem existente que quer modificar. Completamente diferente de geração — nunca descreva a cena inteira do zero, descreva apenas a mudança.*

**Antes de escrever o prompt, sempre diga ao usuário:**
"Anexe sua imagem de referência ao [nome da ferramenta] antes de enviar este prompt."

**Detecte a capacidade de edição da ferramenta:**
- Midjourney: use `--cref [URL da imagem]` para referência de personagem ou `--sref` para referência de estilo
- DALL-E 3: use o endpoint de Edição, não o de Geração. O usuário deve estar no ChatGPT com edição de imagem habilitada
- Stable Diffusion: use o modo img2img, não txt2img. Defina denoising strength de 0.3 a 0.6 para preservar o original

```
Imagem de referência: [anexada / URL]
O que manter exatamente igual: [liste tudo que não deve mudar]
O que mudar: [edição específica apenas — seja preciso]
Quanto mudar: [sutil / moderado / significativo]
Consistência de estilo: mantenha o estilo exato, iluminação e humor da referência
Prompt negativo: [o que evitar introduzir]
```

**Exemplo:**
```
Imagem de referência: [foto de retrato anexada]
O que manter exatamente igual: rosto, cabelo, roupa, fundo, iluminação
O que mudar: ângulo da cabeça — girar de olhar para a esquerda para olhar diretamente para frente
Quanto mudar: sutil, preserve todas as características faciais exatamente
Consistência de estilo: manter estilo fotorrealista, mesma direção de iluminação
Prompt negativo: sem novos elementos, sem mudanças de estilo, sem mudanças de fundo
```

---

## Template K — ComfyUI

*Use para workflows baseados em nós do ComfyUI. Sempre emita Prompts Positivos e Negativos como blocos separados. Pergunte sobre o modelo de checkpoint antes de escrever — sintaxe e limites de tokens diferem por modelo.*

**Pergunte primeiro se não foi declarado:**
"Qual modelo de checkpoint você está usando? (SD 1.5, SDXL, Flux ou outro)"

**Notas específicas por modelo:**
- SD 1.5: prompts mais curtos funcionam melhor, abaixo de 75 tokens por bloco, use sintaxe (palavra:peso)
- SDXL: suporta prompts mais longos, suporta linguagem mais natural junto com sintaxe ponderada
- Flux: linguagem natural funciona bem, menos dependência de sintaxe ponderada, muito responsivo a descrições de estilo

```
PROMPT POSITIVO:
[assunto], [estilo], [humor], [iluminação], [composição], [qualidade: altamente detalhado, foco nítido, 8k]

PROMPT NEGATIVO:
[o que excluir: desfocado, baixa qualidade, marca d'água, membros extras, anatomia ruim, distorcido, super-saturado]

CHECKPOINT: [nome do modelo]
SAMPLER: Euler a (ponto de partida recomendado)
CFG SCALE: 7 (aumente para maior aderência ao prompt)
STEPS: 20-30
RESOLUÇÃO: [largura x altura — deve ser divisível por 64]
```

---

## Template L — Decompositor de Prompt

*Use quando o usuário cola um prompt existente e quer decompô-lo, adaptá-lo para outra ferramenta, simplificá-lo ou entender sua estrutura. Isto é análise e adaptação, não construção do zero.*

**Detecte qual tarefa de Decomposição é necessária:**
- **Decompor** — explicar o que cada parte do prompt faz
- **Adaptar** — reescrever para outra ferramenta preservando a intenção
- **Simplificar** — remover redundâncias e compactar sem perder significado
- **Dividir** — dividir um prompt complexo de uma única execução em uma sequência mais limpa

**Para tarefas de Adaptação, sempre pergunte:**
"De qual ferramenta é o prompt original e para qual ferramenta você está adaptando?"

**Formato de saída para Decomposição:**
```
Prompt original: [colado]

Análise de estrutura:
- Papel/Identidade: [qual papel é atribuído e por quê]
- Tarefa: [qual ação está sendo solicitada]
- Restrições: [quais limites estão definidos]
- Formato: [qual forma de saída é esperada]
- Pontos Fracos: [o que está faltando ou pode causar saída errada]

Correção recomendada: [versão reescrita com lacunas preenchidas]
```

**Formato de saída para Adaptação:**
```
Original ([ferramenta de origem]): [prompt original]

Adaptado para [ferramenta-alvo]:
[prompt reescrito usando sintaxe e melhores práticas da ferramenta-alvo]

Principais mudanças feitas:
- [mudança 1 e por quê]
- [mudança 2 e por quê]
```

**Formato de saída para Divisão:**
```
Prompt original: [colado]

Este prompt está fazendo [N] coisas. Dividido em [N] prompts sequenciais:

Prompt 1 — [o que ele trata]:
[bloco de prompt]

Prompt 2 — [o que ele trata]:
[bloco de prompt]

Execute-os em ordem. Cada saída alimenta o próximo.
```
