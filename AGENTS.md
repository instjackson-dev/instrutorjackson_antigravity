# Memória Compartilhada - Instrutor Jackson LP

## Stack Técnica
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Hospedagem/Deploy**: Vercel
- **Integrações**: WhatsApp (Links de CTA), Redes Sociais (Instagram, Facebook, YouTube), YouTube Embed (Depoimentos)

## Padrões de Projeto
- Design responsivo com foco em conversão (Landing Page de Segurança).
- Scripts em `script.js` (incluindo lógica de carrossel).
- Estilização centralizada em `style.css`.

## Agentes Sincronizados
- **Gemini**: Ativo na sessão atual.
- **Claude**
- **Codex**

## Estado Atual
- Customizados os cards da seção de Grandes Empresas Atendidas com efeito de borda e sombra neon dourada responsiva (que se expande sob hover) e alteração das cores das letras internas para branco puro (com text-shadow sob hover) (Gemini - 2026-05-27).
- Implementados os efeitos de rolagem premium inspirados na Bautz (revelação direcional lateral em imagens/textos, zoom no bloco de preços/vídeos centrais e efeito dominó/staggered em cascata nos grids) e o Customizador de Cores Táticas flutuante (Dourado, Vermelho, Azul, Verde) persistido no `localStorage` com script anti-flicker (Gemini - 2026-05-27).
- Substituído o vídeo da seção Hero pela imagem de alta qualidade do Instrutor Jackson (`hero-instructor.jpg`), ajustando as classes HTML/CSS para `.hero-image-*` e preservando a responsividade, efeito hover 3D e glow dourado tático (Gemini - 2026-05-27).
- Integrado o formulário de 5 campos de captura do E-book com o webhook do n8n (`https://n8n.vps7900.panel.icontainer.run/webhook/ebook-lead`), com detecção dinâmica de ambiente local (`/webhook-test`) e produção, tratamento de máscara/número de WhatsApp e botões pós-envio à prova de pop-up blocker (Gemini - 2026-05-23).
- Substituída a imagem da seção "Eleve o nível da sua Operação" pela nova versão WebP enviada pelo usuário via Google Drive (Gemini - 2026-05-23).
- Implementadas melhorias profundas de conversão com base na auditoria do site (Gemini - 2026-05-23):
  - Adicionado alerta de escassez/urgência ("APENAS 7 VAGAS RESTANTES") no cartão de preços sincronizado dinamicamente com o lote atual (Gemini - 2026-05-23).
  - Adicionados Badges de Autoridade ("23 anos · Polícia Civil PR", "PF", "RPA", "Tecnólogo de Seg. do Trabalho", "Técnico Seg. do Trabalho") empilhados verticalmente acima do vídeo no Hero e alinhados à altura da primeira linha do título principal (Gemini - 2026-05-23).
  - Implementada a Headline customizada pelo usuário: "Policial. Vigilante. Escolta VIP. Todos na mesma rua — todos merecem o mesmo treinamento de quem veio dela."
  - Adicionado contador regressivo autônomo (evergreen) para o dia 14 de cada mês (avançando automaticamente) e Trust Lines no Hero (Gemini - 2026-05-23).
  - Implementado tratamento à prova de falhas no envio do formulário, exibindo tela de sucesso com botões diretos de download e WhatsApp para evitar bloqueios de pop-up do navegador (Gemini - 2026-05-23).
  - Criado o Lead Magnet (Barra superior fixa + Modal de Captura) para distribuir o E-book "Como usar Inteligência Artificial no Livro de Ocorrências", coletando Nome, E-mail e WhatsApp, com redirecionamento de download e abertura do chat de lead no WhatsApp.
  - Criada a seção de Ancoragem de Valor comparando o "Preço do Improviso" versus o "Valor da Preparação" logo antes do cartão de preços.
- Atualizado o link do Instagram no rodapé das páginas `index.html` e `instrutor.html` de `@ctaansv` para `@inteligenciaoperacional2.0` (Gemini - 2026-05-22).
- Corrigido o problema do vídeo da Hero Section não aparecer: ajustado aspect-ratio de 16:9 para 3:4, otimizado arquivo para 916KB, poster funcional (test_frame.png) e fallback de play via JS (Gemini - 2026-05-22).
- Reformulada a Hero Section em layout de duas colunas (Grid) no desktop, exibindo o vídeo de treinamento completo à direita com glow tático (Gemini - 2026-05-22).
- Implementada a seção de Depoimentos em formato de carrossel dinâmico (com 6 vídeos do YouTube).
- Implementada a seção de Prova Social (*Avatar Stack* com 5 fotos reais de alunos) na Hero Section do topo.

