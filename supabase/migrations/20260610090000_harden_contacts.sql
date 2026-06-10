-- Defense in depth for the contacts table. The edge function already
-- validates input, but it writes as service_role (bypasses RLS), so the
-- same limits must be enforced at the database layer too.

-- 1. Input constraints mirroring the edge function limits
alter table public.contacts
  add constraint contacts_name_len    check (char_length(name) between 1 and 100),
  add constraint contacts_email_len   check (char_length(email) between 3 and 254),
  add constraint contacts_message_len check (char_length(message) between 1 and 2000),
  add constraint contacts_name_not_blank    check (btrim(name) <> ''),
  add constraint contacts_message_not_blank check (btrim(message) <> ''),
  add constraint contacts_email_format check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$');

-- 2. Privilege hardening: RLS already denies anon/authenticated, but
--    revoking the grants removes the table from their PostgREST surface
--    entirely (two independent layers).
revoke all on table public.contacts from anon, authenticated;

-- 3. Durable rate limiting. The edge function's in-memory limiter is
--    isolate-local (resets on cold start, not shared across regions).
--    This trigger is the persistent backstop: it bounds total email/DB
--    abuse even if the Origin header is spoofed by a script.
create index if not exists contacts_created_at_idx
  on public.contacts (created_at);

create index if not exists contacts_email_created_at_idx
  on public.contacts (email, created_at);

create or replace function public.contacts_rate_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- per sender: max 3 messages per hour
  if (select count(*) from contacts
      where email = new.email
        and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate_limit_email';
  end if;

  -- global ceiling: max 50 messages per day caps Resend/storage abuse
  -- regardless of how many IPs or emails an attacker rotates through
  if (select count(*) from contacts
      where created_at > now() - interval '1 day') >= 50 then
    raise exception 'rate_limit_global';
  end if;

  return new;
end;
$$;

revoke execute on function public.contacts_rate_guard() from public, anon, authenticated;

drop trigger if exists contacts_rate_guard on public.contacts;
create trigger contacts_rate_guard
  before insert on public.contacts
  for each row execute function public.contacts_rate_guard();
