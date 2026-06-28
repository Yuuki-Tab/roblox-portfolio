-- Aggiunge set search_path = public per risolvere i warning di sicurezza di Supabase

create or replace function public.record_failed_login(client_ip text)
returns int
language plpgsql security definer set search_path = public
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

create or replace function public.check_rate_limit(client_ip text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.failed_logins
    where ip = client_ip
      and attempts >= 3
      and now() - last_attempt < interval '2 minutes'
  );
$$;

-- Risolve l'info di Supabase (RLS senza policy) esplicitando il blocco totale
create policy "Deny all external access to failed logins" 
on public.failed_logins 
for all using (false);
