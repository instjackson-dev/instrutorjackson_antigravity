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
- Corrigido o problema do vídeo da Hero Section não aparecer: ajustado aspect-ratio de 16:9 para 3:4 (formato original vertical do vídeo hero-bg.mp4), otimizado o tamanho do arquivo de 6.2MB para 916KB com FFmpeg para carregamento instantâneo, definido poster funcional extraído do vídeo (test_frame.png) e adicionado fallback de play programático via JavaScript para contornar bloqueios de autoplay do navegador (Gemini - 2026-05-22).
- Reformulada a Hero Section em layout de duas colunas (Grid) no desktop, exibindo o vídeo de treinamento completo à direita com glow tático (Gemini - 2026-05-22).
- Implementada a seção de Depoimentos em formato de carrossel dinâmico (com 6 vídeos do YouTube).
- Implementada a seção de Prova Social (*Avatar Stack* com 5 fotos reais de alunos) na Hero Section do topo.

