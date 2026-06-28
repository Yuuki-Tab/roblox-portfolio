-- Tabella leggerissima per tracciare i tentativi falliti
create table public.failed_logins (
  ip text primary key,
  attempts int not null default 1,
  last_attempt timestamptz not null default now()
);

-- Nessuno dal client può leggerla
alter table public.failed_logins enable row level security;

-- Funzione per registrare un fallimento
create or replace function public.record_failed_login(client_ip text)
returns int
language plpgsql security definer
as $$
declare
  current_attempts int;
begin
  insert into public.failed_logins (ip, attempts, last_attempt)
  values (client_ip, 1, now())
  on conflict (ip) do update
  set 
    attempts = case 
      when now() - failed_logins.last_attempt < interval '2 minutes' then failed_logins.attempts + 1
      else 1
    end,
    last_attempt = now()
  returning attempts into current_attempts;
  
  return current_attempts;
end;
$$;

-- Funzione per controllare se un IP è bloccato
create or replace function public.check_rate_limit(client_ip text)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.failed_logins
    where ip = client_ip
      and attempts >= 3
      and now() - last_attempt < interval '2 minutes'
  );
$$;

-- Revoca l'accesso pubblico alle funzioni per sicurezza
revoke execute on function public.record_failed_login(text) from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text) from public, anon, authenticated;
