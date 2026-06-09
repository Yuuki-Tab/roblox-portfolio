create table contacts (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  message    text        not null,
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;

-- Block direct access from anon/authenticated; edge function uses service_role which bypasses RLS
create policy "deny_direct_access" on public.contacts
  as restrictive for all
  to anon, authenticated
  using (false);

-- rls_auto_enable is an internal Supabase trigger function; not callable via API
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from authenticated;
revoke execute on function public.rls_auto_enable() from anon;
