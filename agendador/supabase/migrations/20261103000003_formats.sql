-- Formato de publicação por alvo: Feed, Reels ou Stories.
-- O mesmo vídeo pode ir para mais de um formato na mesma conta (ex.: Reels + Stories no Instagram).
alter table public.post_targets
  add column format text not null default 'feed'
  check (format in ('feed', 'reels', 'stories'));
