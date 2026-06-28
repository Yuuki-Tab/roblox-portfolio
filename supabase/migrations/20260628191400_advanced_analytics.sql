-- Add OS tracking to page_views
alter table public.page_views add column os text;

-- Create events table
create table public.events (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  event_type text not null,
  event_data jsonb,
  page_path text not null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "deny_direct_access_events" on public.events
  as restrictive for all
  to anon, authenticated
  using (false);

revoke all on table public.events from anon, authenticated;

-- Indexes for events
create index ev_created_at_idx on public.events (created_at);
create index ev_visitor_id_idx on public.events (visitor_id);
create index ev_type_idx on public.events (event_type);

-- OS RPC
create or replace function public.analytics_os(since timestamptz, lim int default 10)
returns table(os text, views bigint)
language sql stable security definer set search_path = public
as $$
  select coalesce(os, 'Unknown'), count(*)::bigint
  from page_views where created_at >= since
  group by 1 order by 2 desc limit lim;
$$;
revoke execute on function public.analytics_os(timestamptz, int) from public, anon, authenticated;

-- Events RPCs
create or replace function public.analytics_outbound_clicks(since timestamptz, lim int default 10)
returns table(url text, clicks bigint)
language sql stable security definer set search_path = public
as $$
  select event_data->>'url', count(*)::bigint
  from events 
  where created_at >= since and event_type = 'click'
  group by 1 order by 2 desc limit lim;
$$;
revoke execute on function public.analytics_outbound_clicks(timestamptz, int) from public, anon, authenticated;

create or replace function public.analytics_avg_time_on_page(since timestamptz)
returns table(page_path text, avg_seconds bigint)
language sql stable security definer set search_path = public
as $$
  select page_path, avg((event_data->>'duration')::numeric)::bigint
  from events 
  where created_at >= since and event_type = 'leave'
  group by 1 order by 2 desc;
$$;
revoke execute on function public.analytics_avg_time_on_page(timestamptz) from public, anon, authenticated;
