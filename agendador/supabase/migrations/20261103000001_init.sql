-- Agendador de vídeos — estrutura do banco
-- Contas conectadas, tokens (só o servidor lê), posts e alvos de publicação por rede.

create type public.platform as enum ('youtube', 'tiktok', 'instagram', 'facebook', 'linkedin');

-- Contas conectadas (visíveis para o dono)
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  platform public.platform not null,
  external_id text not null,
  name text,
  avatar_url text,
  status text not null default 'ok' check (status in ('ok', 'reconnect')),
  reconnect_by timestamptz,          -- quando a conexão vence sem renovação automática
  created_at timestamptz not null default now(),
  unique (user_id, platform, external_id)
);

-- Tokens: RLS ligado e nenhuma policy => só a service role (funções do servidor) acessa
create table public.account_tokens (
  account_id uuid primary key references public.accounts on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Estados temporários do login OAuth
create table public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users on delete cascade,
  provider text not null,
  created_at timestamptz not null default now()
);

-- Um vídeo agendado
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text,
  caption text,
  video_path text not null,
  video_size bigint not null,
  video_type text not null default 'video/mp4',
  scheduled_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'publishing', 'published', 'partial', 'failed', 'canceled')),
  created_at timestamptz not null default now()
);

-- Uma publicação desse vídeo em uma conta específica
create table public.post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  account_id uuid not null references public.accounts on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  caption text,                       -- legenda específica desta rede (opcional)
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'published', 'failed', 'canceled')),
  remote_state jsonb,                 -- etapa em andamento na rede (ex.: container do Instagram)
  external_id text,
  published_url text,
  error text,
  attempts int not null default 0,
  next_attempt_at timestamptz,
  processing_since timestamptz,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index post_targets_due_idx on public.post_targets (status, next_attempt_at);
create index posts_user_sched_idx on public.posts (user_id, scheduled_at desc);

-- RLS
alter table public.accounts enable row level security;
alter table public.account_tokens enable row level security;
alter table public.oauth_states enable row level security;
alter table public.posts enable row level security;
alter table public.post_targets enable row level security;

create policy accounts_own on public.accounts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy posts_own on public.posts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy targets_own on public.post_targets
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
    and exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );

-- Pega os próximos alvos vencidos sem disputa entre execuções simultâneas
create or replace function public.claim_due_targets(p_limit int default 1)
returns setof public.post_targets
language sql
security definer
set search_path = public
as $$
  update public.post_targets t
     set locked_until = now() + interval '10 minutes'
   where t.id in (
     select t2.id
       from public.post_targets t2
       join public.posts p on p.id = t2.post_id
      where t2.status in ('pending', 'processing')
        and p.scheduled_at <= now()
        and coalesce(t2.next_attempt_at, '-infinity'::timestamptz) <= now()
        and coalesce(t2.locked_until, '-infinity'::timestamptz) < now()
      order by p.scheduled_at
      limit p_limit
      for update of t2 skip locked
   )
  returning t.*;
$$;

revoke execute on function public.claim_due_targets(int) from public, anon, authenticated;

-- Armazenamento dos vídeos (privado, uma pasta por usuário)
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

create policy videos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy videos_select_own on storage.objects for select to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy videos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
