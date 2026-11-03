-- Dispara o publicador a cada minuto.
-- Crie os dois segredos no Vault (SQL Editor do Supabase). O cron os lê a cada execução:
--   select vault.create_secret('https://SEU-PROJETO.supabase.co', 'project_url');
--   select vault.create_secret('MESMO_VALOR_DO_CRON_SECRET', 'cron_secret');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'agendador-publisher',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/agendador/publisher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);

-- Limpa estados OAuth abandonados uma vez por dia
select cron.schedule(
  'agendador-oauth-cleanup',
  '17 3 * * *',
  $$ delete from public.oauth_states where created_at < now() - interval '1 day'; $$
);
