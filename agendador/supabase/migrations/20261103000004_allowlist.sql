-- Só e-mails desta lista conseguem criar login (Google ou link por e-mail).
-- Qualquer outro cadastro é recusado pelo próprio banco.
-- Para liberar um e-mail (SQL Editor):
--   insert into public.allowed_emails (email) values ('seu-email@gmail.com');

create table public.allowed_emails (
  email text primary key check (email = lower(email))
);

-- RLS ligado e sem policies: ninguém lê ou altera pelo navegador
alter table public.allowed_emails enable row level security;

create or replace function public.enforce_allowed_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or not exists (select 1 from public.allowed_emails where email = lower(new.email)) then
    raise exception 'E-mail sem acesso ao Agendador';
  end if;
  return new;
end;
$$;

create trigger enforce_allowed_email
  before insert on auth.users
  for each row execute function public.enforce_allowed_email();
